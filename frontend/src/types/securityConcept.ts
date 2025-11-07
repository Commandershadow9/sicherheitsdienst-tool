// ===== SICHERHEITSKONZEPT TYPE DEFINITIONS =====
// Vollständige TypeScript-Typen für alle SecurityConcept-Features (Phase 1-3)

// ==================== PHASE 1 & 2 (Bereits implementiert) ====================

// Schichtmodell (Phase 1)
export interface ShiftDefinition {
  name: string; // z.B. "Frühschicht"
  from: string; // "06:00"
  to: string; // "14:00"
  duration: number; // 8 (Stunden)
  requiredStaff: number; // 2
  weekdays: string[]; // ["Mo", "Di", "Mi", "Do", "Fr"]
}

export interface ShiftModel {
  type: '2-SHIFT' | '3-SHIFT' | '24/7' | 'CUSTOM';
  shifts: ShiftDefinition[];
  totalHoursPerWeek: number; // Berechnet
  requiredFulltimeStaff: number; // Berechnet: z.B. 7-9 MA
  notes?: string;
}

// Risiko-Bewertung (Phase 2)
export interface RiskScenario {
  id: string;
  name: string; // z.B. "Brand", "Einbruch"
  probability: number; // 1-5 (Eintrittswahrscheinlichkeit)
  impact: number; // 1-5 (Schadensausmaß)
  riskScore: number; // probability × impact (1-25)
  measures: string[]; // Maßnahmen zur Risikominimierung
  residualRisk: number; // Restrisiko nach Maßnahmen (1-25)
  notes?: string;
}

export interface RiskAssessment {
  scenarios: RiskScenario[];
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // Berechnet
  lastReviewedAt?: Date;
  reviewedBy?: string;
}

// ==================== PHASE 3 (Neu zu implementieren) ====================

// 1. Objekt-/Lagebild (SiteSurveyEditor)
export interface SiteSituationBuilding {
  buildingType: string; // "Bürogebäude", "Industrieanlage"
  size: number; // Quadratmeter
  floors: number; // Anzahl Stockwerke
  usage: string; // z.B. "Büronutzung, Einzelhandel EG"
  occupancy: number; // Geschätzte Personenanzahl
  openingHours: string; // "Mo-Fr 8-18 Uhr"
}

export interface SiteSituationAccess {
  entrances: string[]; // ["Haupteingang Süd", "Tiefgarage"]
  exits: string[]; // ["Notausgang Nord", "Notausgang Ost"]
  emergencyExits: string[]; // Notausgänge (separat!)
  bottlenecks: string[]; // ["Treppenhaus A (max 2 Personen)"]
  criticalAreas: string[]; // ["Serverraum 3. OG", "Tresorraum UG"]
}

export interface SiteSituationEnvironment {
  surroundings: string; // "Wohngebiet, ÖPNV: U-Bahn 200m"
  lighting: string; // "Außenbereich: LED-Strahler, Innen: Dauerbeleuchtung"
  accessibility: string; // "Rollstuhlgerecht, Aufzug vorhanden"
  parking: string; // "50 Stellplätze, davon 10 Besucher"
  weatherExposure?: string; // "Wettergeschützte Eingänge"
}

export interface SiteSituationDocument {
  id: string;
  type: 'FLOOR_PLAN' | 'SITE_PLAN' | 'EVACUATION_PLAN' | 'OTHER';
  filename: string;
  fileUrl: string;
  uploadedAt: Date;
  description?: string;
}

export interface SiteSituation {
  building: SiteSituationBuilding;
  access: SiteSituationAccess;
  environment: SiteSituationEnvironment;
  documents: SiteSituationDocument[]; // Hochgeladene Pläne/Dokumente
  additionalNotes?: string;
}

// 2. Aufgaben-/Postenprofile (PositionProfilesEditor)
export interface TaskItem {
  id: string;
  description: string; // "Besucherempfang und Registrierung"
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  frequency?: string; // "Täglich", "Stündlich"
}

export interface PositionProfile {
  id: string;
  name: string; // "Pforte/Empfang"
  shift: string; // "Frühschicht" (Referenz zu ShiftModel)
  requiredCount: number; // 1
  tasks: TaskItem[];
  location: string; // "Haupteingang"
  equipment: string[]; // ["Funkgerät", "Besucherbuch", "Telefon"]
  qualifications: string[]; // ["§34a Sachkundeprüfung"]
  responsibilities: string[]; // ["Besucherempfang", "Paketannahme"]
  checklists?: string[]; // Referenzen zu Checklisten (optional)
}

export interface PatrolRoute {
  id: string;
  name: string; // "Hauptrundgang Nacht"
  interval: string; // "Alle 2 Stunden"
  estimatedDuration: number; // 45 (Minuten)
  checkpoints: string[]; // Referenzen zu ControlPoints
  description: string;
  instructions?: string;
}

export interface TaskProfiles {
  positions: PositionProfile[];
  patrolRoutes: PatrolRoute[];
  notes?: string;
}

// 3. Kommunikation & Eskalation (CommunicationEditor)
export interface RadioChannel {
  channel: number; // 1
  name: string; // "Hauptkanal Objektschutz"
  users: string; // "Alle MA"
  purpose: string; // "Tägliche Kommunikation"
}

export interface RadioSystem {
  channels: RadioChannel[];
  fallbackMethod: string; // "Mobiltelefon (Nummern siehe Kontaktliste)"
  testInterval: string; // "Täglich vor Schichtbeginn"
}

export interface EscalationLevel {
  level: number; // 1, 2, 3
  title: string; // "Stufe 1: Kleinere Vorfälle"
  contactPerson: string; // "Schichtleiter"
  contactMethod: string; // "Funk Kanal 2 oder Tel. +49..."
  responseTime: string; // "Sofort"
  triggerConditions: string[]; // ["Kleinere Vorfälle", "Technische Störungen"]
}

export interface ExternalAuthority {
  name: string; // "Polizei"
  phone: string; // "110"
  when: string; // "Straftaten, Gefahr"
  additionalInfo?: string;
}

export interface IncidentLogging {
  method: 'DIGITAL' | 'PAPER' | 'BOTH'; // "DIGITAL" (System: Incidents)
  retentionPeriod: string; // "24 Monate (gesetzliche Pflicht)"
  requiredFields: string[];
  accessRoles: string[]; // ["ADMIN", "MANAGER", "DISPATCHER"]
}

export interface CommunicationPlan {
  radioSystem: RadioSystem;
  escalationLevels: EscalationLevel[];
  externalAuthorities: ExternalAuthority[];
  logging: IncidentLogging;
  notes?: string;
}

// 4. KPIs & Qualität (KPIEditor)
export interface KPIDefinition {
  id: string;
  name: string; // "Reaktionszeit Alarm"
  target: string; // "< 2 Minuten"
  measurement: string; // "Automatisch via Alarmsystem"
  frequency: string; // "Monatlich"
  unit?: string; // "Minuten", "Prozent", "Anzahl"
  thresholds?: {
    green: string; // "< 2min"
    yellow: string; // "2-5min"
    red: string; // "> 5min"
  };
}

export interface QualityAudit {
  type: string; // "Interne Prüfung", "Kundenaudit"
  frequency: string; // "Quartalsweise"
  responsible: string; // "Objektleiter + Kunde"
  documentation: boolean;
}

export interface QualityMetrics {
  kpis: KPIDefinition[];
  audits: QualityAudit[];
  feedbackChannels: {
    employee: string; // "Monatliches Teamgespräch"
    customer: string; // "Quartalsweise Review-Meeting"
  };
  improvementProcess: string; // "Lessons Learned nach jedem Vorfall"
  notes?: string;
}

// 5. Übergaben/Schichtwechsel (HandoverEditor)
export interface HandoverChecklistItem {
  id: string;
  description: string; // "Übergabe-Protokoll ausgefüllt"
  required: boolean; // true
  category: 'DOCUMENTATION' | 'EQUIPMENT' | 'STATUS' | 'BRIEFING' | 'OTHER';
}

export interface HandoverProtocolField {
  field: string; // "Datum/Uhrzeit Übergabe"
  type: 'TEXT' | 'DATETIME' | 'SIGNATURE' | 'BOOLEAN';
  required: boolean;
}

export interface HandoverProcedures {
  checklist: HandoverChecklistItem[];
  protocolFields: HandoverProtocolField[];
  digitalProtocol: boolean; // true (über Wachbuch/Incidents)
  retentionPeriod: string; // "24 Monate"
  accessRoles: string[]; // ["SCHICHTLEITER", "OBJEKTLEITER", "ADMIN"]
  minimumHandoverDuration: number; // 15 (Minuten)
  notes?: string;
}

// 6. Anhänge-Management (AttachmentManager)
export interface AttachmentItem {
  id: string;
  name: string; // "Lageplan Objekt"
  type: 'FLOOR_PLAN' | 'EVACUATION_PLAN' | 'FIRE_SAFETY' | 'CONTACT_LIST' | 'CHECKLIST' | 'OTHER';
  required: boolean; // true für Pflichtdokumente
  filename?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: Date;
  uploadedBy?: string;
  expiresAt?: Date; // Für zeitlich begrenzte Dokumente
  status: 'MISSING' | 'UPLOADED' | 'EXPIRED';
  notes?: string;
}

export interface Attachments {
  required: AttachmentItem[]; // Pflichtanhänge
  optional: AttachmentItem[]; // Optionale Anhänge
  completionPercentage: number; // Berechnet: Anzahl hochgeladen / Anzahl erforderlich
}

// ==================== COMPLETE SECURITY CONCEPT TYPE ====================

export type SecurityConceptStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'ARCHIVED';

export interface RevisionHistoryEntry {
  version: string;
  date: Date;
  changes: string; // "Schichtmodell angepasst (Nachtschicht: 2 → 1 MA)"
  reason: string; // "Auslastung optimiert"
  changedBy: string; // User-ID oder Name
}

export interface SecurityConcept {
  id: string;
  siteId: string;
  version: string; // "1.0"
  status: SecurityConceptStatus;
  validFrom?: Date;
  validUntil?: Date;

  // Phase 1 & 2 (bereits implementiert)
  shiftModel?: ShiftModel;
  riskAssessment?: RiskAssessment;

  // Phase 3 (neu zu implementieren)
  siteSituation?: SiteSituation;
  taskProfiles?: TaskProfiles;
  communicationPlan?: CommunicationPlan;
  qualityMetrics?: QualityMetrics;
  handoverProcedures?: HandoverProcedures;
  attachments?: Attachments;

  // Weitere Komponenten (Phasen 4-5, später)
  contractScope?: any;
  legalBasis?: any;
  protectionMeasures?: any;
  emergencyPlan?: any;
  dataProtection?: any;
  occupationalSafety?: any;
  trafficConcept?: any;
  weaponConcept?: any;
  weatherProtocols?: any;

  // Freigabe & Versionierung
  approvedBy?: string;
  approvedAt?: Date;
  revisionHistory: RevisionHistoryEntry[];

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper Types für Validierung
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
}

export interface SecurityConceptCompletion {
  phase1: number; // 0-100%
  phase2: number; // 0-100%
  phase3: number; // 0-100%
  overall: number; // 0-100%
  missingComponents: string[];
}

// API Response Types
export interface SecurityConceptResponse {
  success: boolean;
  data?: SecurityConcept;
  error?: string;
  validation?: ValidationResult;
}

export interface SecurityConceptListResponse {
  success: boolean;
  data?: SecurityConcept[];
  total?: number;
  error?: string;
}
