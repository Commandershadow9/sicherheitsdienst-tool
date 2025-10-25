import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// Types
// ============================================================================

export interface ControlPointSuggestion {
  id: string;
  name: string;
  location: string;
  order: number;
  hasNfcTag: boolean;
  hasQrCode: boolean;
  latitude?: number | null;
  longitude?: number | null;
  estimatedDuration: number; // Sekunden
  instructions?: string | null;
}

export interface RouteSegment {
  from: string; // Control Point ID
  to: string; // Control Point ID
  distance: number; // Meter (estimated)
  duration: number; // Sekunden (estimated)
}

export interface ControlRoundSuggestion {
  templateName: string;
  description: string;
  frequency: string; // z.B. "Alle 2 Stunden", "Täglich"
  estimatedDuration: number; // Gesamtdauer in Minuten
  controlPoints: ControlPointSuggestion[];
  optimizedRoute: string[]; // Array von Control Point IDs in optimaler Reihenfolge
  routeSegments: RouteSegment[];
  requiredTags: {
    totalPoints: number;
    withNfc: number;
    withQr: number;
    needsTag: number;
  };
}

export interface ControlRoundSuggestionsResult {
  siteId: string;
  siteName: string;
  securityLevel: string; // HIGH, MEDIUM, LOW
  suggestions: ControlRoundSuggestion[];
  stats: {
    totalControlPoints: number;
    activeControlPoints: number;
    taggedPoints: number;
    untaggedPoints: number;
    averagePointsPerRound: number;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Berechnet die Distanz zwischen zwei Kontrollpunkten (Haversine-Formel)
 * Falls keine GPS-Koordinaten vorhanden, wird eine Standard-Distanz zurückgegeben
 */
function calculateDistance(
  point1: { latitude?: number | null; longitude?: number | null },
  point2: { latitude?: number | null; longitude?: number | null }
): number {
  if (!point1.latitude || !point1.longitude || !point2.latitude || !point2.longitude) {
    // Fallback: Annahme 50m durchschnittliche Distanz zwischen Punkten
    return 50;
  }

  const R = 6371e3; // Earth radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Nearest-Neighbor-Algorithmus für Route-Optimierung
 * (Einfacher Greedy-Algorithmus für Traveling Salesman Problem)
 */
function optimizeRoute(points: ControlPointSuggestion[]): string[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [points[0].id];

  const visited = new Set<string>();
  const route: string[] = [];

  // Start mit dem ersten Punkt (order = 0 oder niedrigste order)
  let current = points.reduce((prev, curr) => (curr.order < prev.order ? curr : prev));
  route.push(current.id);
  visited.add(current.id);

  // Greedy: Nächster nächstgelegener Punkt
  while (visited.size < points.length) {
    let nearest: ControlPointSuggestion | null = null;
    let minDistance = Infinity;

    for (const point of points) {
      if (visited.has(point.id)) continue;

      const distance = calculateDistance(current, point);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    }

    if (nearest) {
      route.push(nearest.id);
      visited.add(nearest.id);
      current = nearest;
    } else {
      break;
    }
  }

  return route;
}

/**
 * Berechnet Route-Segmente basierend auf optimierter Route
 */
function calculateRouteSegments(
  route: string[],
  pointsMap: Map<string, ControlPointSuggestion>
): RouteSegment[] {
  const segments: RouteSegment[] = [];

  for (let i = 0; i < route.length - 1; i++) {
    const from = pointsMap.get(route[i]);
    const to = pointsMap.get(route[i + 1]);

    if (!from || !to) continue;

    const distance = calculateDistance(from, to);
    const duration = Math.ceil(distance / 1.4); // Annahme: 1.4 m/s Gehgeschwindigkeit

    segments.push({
      from: from.id,
      to: to.id,
      distance: Math.round(distance),
      duration,
    });
  }

  return segments;
}

/**
 * Bestimmt Security Level basierend auf Security Concept
 */
function determineSecurityLevel(site: any): 'HIGH' | 'MEDIUM' | 'LOW' {
  const concept = site.securityConcept;

  if (!concept) return 'MEDIUM';

  // HIGH: 24/7 Betrieb mit 3-Schicht-System
  if (concept.shiftModel?.includes('24/7') || concept.shiftModel?.includes('3-SHIFT')) {
    return 'HIGH';
  }

  // LOW: Einzelschicht
  if (concept.shiftModel?.includes('Einzelschicht') || concept.shiftModel?.includes('SINGLE')) {
    return 'LOW';
  }

  // DEFAULT: MEDIUM
  return 'MEDIUM';
}

// ============================================================================
// Main Service Function
// ============================================================================

export async function generateControlRoundSuggestions(siteId: string): Promise<ControlRoundSuggestionsResult> {
  // 1. Site & Control Points laden
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      name: true,
      securityConcept: true,
      controlPoints: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!site) {
    throw new Error('Site nicht gefunden');
  }

  const securityLevel = determineSecurityLevel(site);

  // 2. Control Points transformieren
  const controlPoints: ControlPointSuggestion[] = site.controlPoints.map((cp) => ({
    id: cp.id,
    name: cp.name,
    location: cp.location,
    order: cp.order,
    hasNfcTag: !!cp.nfcTagId,
    hasQrCode: !!cp.qrCode,
    latitude: cp.latitude,
    longitude: cp.longitude,
    estimatedDuration: 30, // 30 Sekunden pro Kontrollpunkt (Scan + Sichtprüfung)
    instructions: cp.instructions,
  }));

  // 3. Stats berechnen
  const totalControlPoints = site.controlPoints.length;
  const activeControlPoints = controlPoints.length;
  const taggedPoints = controlPoints.filter((cp) => cp.hasNfcTag || cp.hasQrCode).length;
  const untaggedPoints = activeControlPoints - taggedPoints;

  // 4. Vorschläge generieren basierend auf Security Level
  const suggestions: ControlRoundSuggestion[] = [];

  if (securityLevel === 'HIGH') {
    // HIGH: Alle 2 Stunden + Vollständige Runde
    suggestions.push(
      createRoundSuggestion(
        '2-Stunden-Rundgang',
        'Vollständiger Kontrollgang alle 2 Stunden für maximale Sicherheit',
        'Alle 2 Stunden',
        controlPoints
      )
    );
  }

  if (securityLevel === 'HIGH' || securityLevel === 'MEDIUM') {
    // MEDIUM/HIGH: Alle 4 Stunden
    suggestions.push(
      createRoundSuggestion(
        '4-Stunden-Rundgang',
        'Regelmäßiger Kontrollgang alle 4 Stunden',
        'Alle 4 Stunden',
        controlPoints
      )
    );
  }

  // ALL: Täglicher Rundgang
  suggestions.push(
    createRoundSuggestion(
      'Täglicher Rundgang',
      'Einmal täglich alle Kontrollpunkte überprüfen',
      'Täglich',
      controlPoints
    )
  );

  // Kritische Punkte (z.B. Haupteingänge, Brandschutztüren)
  const criticalPoints = controlPoints.filter(
    (cp) => cp.name.toLowerCase().includes('eingang') || cp.name.toLowerCase().includes('brand')
  );

  if (criticalPoints.length > 0) {
    suggestions.push(
      createRoundSuggestion(
        'Kritische Punkte',
        'Schnellrundgang nur kritische Bereiche (Eingänge, Brandschutz)',
        securityLevel === 'HIGH' ? 'Stündlich' : 'Alle 2 Stunden',
        criticalPoints
      )
    );
  }

  return {
    siteId: site.id,
    siteName: site.name,
    securityLevel,
    suggestions,
    stats: {
      totalControlPoints,
      activeControlPoints,
      taggedPoints,
      untaggedPoints,
      averagePointsPerRound:
        suggestions.length > 0
          ? Math.round(suggestions.reduce((sum, s) => sum + s.controlPoints.length, 0) / suggestions.length)
          : 0,
    },
  };
}

/**
 * Helper: Erstellt einen einzelnen Rundgang-Vorschlag
 */
function createRoundSuggestion(
  templateName: string,
  description: string,
  frequency: string,
  points: ControlPointSuggestion[]
): ControlRoundSuggestion {
  // Route optimieren
  const optimizedRoute = optimizeRoute(points);

  // Points Map für schnellen Zugriff
  const pointsMap = new Map(points.map((p) => [p.id, p]));

  // Route-Segmente berechnen
  const routeSegments = calculateRouteSegments(optimizedRoute, pointsMap);

  // Gesamtdauer berechnen
  const pointsDuration = points.reduce((sum, p) => sum + p.estimatedDuration, 0); // Sekunden
  const travelDuration = routeSegments.reduce((sum, s) => sum + s.duration, 0); // Sekunden
  const estimatedDuration = Math.ceil((pointsDuration + travelDuration) / 60); // Minuten

  // Tag-Statistiken
  const withNfc = points.filter((p) => p.hasNfcTag).length;
  const withQr = points.filter((p) => p.hasQrCode).length;
  const needsTag = points.filter((p) => !p.hasNfcTag && !p.hasQrCode).length;

  return {
    templateName,
    description,
    frequency,
    estimatedDuration,
    controlPoints: points,
    optimizedRoute,
    routeSegments,
    requiredTags: {
      totalPoints: points.length,
      withNfc,
      withQr,
      needsTag,
    },
  };
}
