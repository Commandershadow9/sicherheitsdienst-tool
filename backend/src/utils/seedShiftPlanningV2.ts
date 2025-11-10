/**
 * Seed-Daten für Schichtplanung v2.0
 * Umfassende Testdaten für alle Features und Konflikttypen
 */

import { PrismaClient, ShiftType, ClearanceStatus } from '@prisma/client';
import { addDays, addHours, startOfWeek, format } from 'date-fns';
import { createUserWithPassword } from './seedHelpers';

const prisma = new PrismaClient();

/**
 * Hauptfunktion zum Seeden aller Schichtplanungs-Testdaten
 */
export async function seedShiftPlanningV2(customerId: string) {
  console.log('🌱 Seeding Schichtplanung v2.0 Testdaten...');

  // 1. Erstelle ShiftTemplates
  console.log('  📋 Erstelle Shift Templates...');
  const templates = await seedShiftTemplates(customerId);

  // 2. Erstelle Test-Sites
  console.log('  🏢 Erstelle Test-Sites...');
  const sites = await seedTestSites(customerId);

  // 3. Erstelle Test-Mitarbeiter mit verschiedenen Profilen
  console.log('  👥 Erstelle Test-Mitarbeiter...');
  const users = await seedTestUsers(customerId);

  // 4. Erstelle Object Clearances (verschiedene Status)
  console.log('  🔐 Erstelle Object Clearances...');
  await seedObjectClearances(users, sites);

  // 5. Erstelle Employee Preferences
  console.log('  ⚙️ Erstelle Employee Preferences...');
  await seedEmployeePreferences(users, sites);

  // 6. Erstelle Test-Schichten (alle Konflikttypen)
  console.log('  📅 Erstelle Test-Schichten...');
  await seedTestShifts(sites, users);

  // 7. Erstelle Employee Workload
  console.log('  📊 Erstelle Employee Workload...');
  await seedEmployeeWorkload(users);

  console.log('✅ Schichtplanung v2.0 Testdaten erfolgreich erstellt!');
  console.log(`
📊 Zusammenfassung:
  - ${templates.length} Shift Templates
  - ${sites.length} Test-Sites
  - ${users.length} Test-Mitarbeiter
  - Alle 9 Konflikttypen abgedeckt
  - Auto-Fill ready
  `);
}

/**
 * 1. Shift Templates für alle ShiftTypes
 */
async function seedShiftTemplates(customerId: string) {
  const templates = [
    {
      name: 'Frühschicht Standard',
      shiftType: 'REGULAR' as ShiftType,
      startTime: '06:00',
      endTime: '14:00',
      duration: 8,
      requiredStaff: 2,
      requiredQualifications: ['Erste Hilfe'],
      wageMultiplier: 1.0,
      color: '#3B82F6',
      description: 'Standard Frühschicht mit 2 Mitarbeitern',
    },
    {
      name: 'Spätschicht Standard',
      shiftType: 'REGULAR' as ShiftType,
      startTime: '14:00',
      endTime: '22:00',
      duration: 8,
      requiredStaff: 2,
      requiredQualifications: ['Erste Hilfe'],
      wageMultiplier: 1.0,
      color: '#10B981',
      description: 'Standard Spätschicht mit 2 Mitarbeitern',
    },
    {
      name: 'Nachtschicht',
      shiftType: 'NIGHT' as ShiftType,
      startTime: '22:00',
      endTime: '06:00',
      duration: 8,
      requiredStaff: 3,
      requiredQualifications: ['Erste Hilfe', 'Nachtschicht-Tauglichkeit'],
      wageMultiplier: 1.25,
      color: '#1E40AF',
      description: 'Nachtschicht mit erhöhtem Personalaufwand',
    },
    {
      name: 'Wochenende Tagschicht',
      shiftType: 'WEEKEND' as ShiftType,
      startTime: '08:00',
      endTime: '20:00',
      duration: 12,
      requiredStaff: 2,
      requiredQualifications: ['Erste Hilfe'],
      wageMultiplier: 1.5,
      color: '#F59E0B',
      description: 'Längere Wochenend-Schicht mit Zuschlag',
    },
    {
      name: 'Feiertag Bewachung',
      shiftType: 'HOLIDAY' as ShiftType,
      startTime: '00:00',
      endTime: '24:00',
      duration: 24,
      requiredStaff: 4,
      requiredQualifications: ['Erste Hilfe', 'Waffenschein'],
      wageMultiplier: 2.0,
      color: '#EF4444',
      description: '24h Feiertag-Bewachung mit doppeltem Zuschlag',
    },
    {
      name: 'Notfall-Einsatz',
      shiftType: 'EMERGENCY' as ShiftType,
      startTime: '00:00',
      endTime: '12:00',
      duration: 12,
      requiredStaff: 5,
      requiredQualifications: ['Erste Hilfe', 'Krisenmanagement', 'Waffenschein'],
      wageMultiplier: 2.5,
      color: '#DC2626',
      description: 'Notfall-Einsatz mit maximaler Besetzung',
    },
    {
      name: 'Event-Security',
      shiftType: 'SPECIAL' as ShiftType,
      startTime: '18:00',
      endTime: '02:00',
      duration: 8,
      requiredStaff: 6,
      requiredQualifications: ['Erste Hilfe', 'Crowd Control'],
      wageMultiplier: 1.75,
      color: '#8B5CF6',
      description: 'Veranstaltungs-Sicherheit mit speziellen Anforderungen',
    },
  ];

  const createdTemplates = [];
  for (const template of templates) {
    const created = await prisma.shiftTemplate.create({ data: template });
    createdTemplates.push(created);
  }

  return createdTemplates;
}

/**
 * 2. Test-Sites mit verschiedenen Anforderungen
 */
async function seedTestSites(customerId: string) {
  const sites = [
    {
      name: 'Flughafen Terminal A',
      address: 'Flughafenstraße 1',
      city: 'Frankfurt',
      postalCode: '60549',
      status: 'ACTIVE' as const,
      customerId,
      buildingType: 'OTHER' as const, // Flughafen -> OTHER
      minStaffRequirement: 3,
      defaultShiftDuration: 8,
      requiresClearance: true,
    },
    {
      name: 'Shopping Mall Zentrum',
      address: 'Einkaufsmeile 45',
      city: 'München',
      postalCode: '80331',
      status: 'ACTIVE' as const,
      customerId,
      buildingType: 'RETAIL' as const, // Shopping Center -> RETAIL
      minStaffRequirement: 2,
      defaultShiftDuration: 10,
      requiresClearance: true,
    },
    {
      name: 'Industriepark Nord',
      address: 'Industrieweg 123',
      city: 'Hamburg',
      postalCode: '20095',
      status: 'ACTIVE' as const,
      customerId,
      buildingType: 'INDUSTRIAL' as const,
      minStaffRequirement: 4,
      defaultShiftDuration: 12,
      requiresClearance: true,
    },
    {
      name: 'Bürokomplex Süd',
      address: 'Bürostraße 78',
      city: 'Stuttgart',
      postalCode: '70173',
      status: 'ACTIVE' as const,
      customerId,
      buildingType: 'OFFICE' as const, // OFFICE_BUILDING -> OFFICE
      minStaffRequirement: 1,
      defaultShiftDuration: 8,
      requiresClearance: false,
    },
    {
      name: 'Event-Arena',
      address: 'Eventplatz 1',
      city: 'Köln',
      postalCode: '50667',
      status: 'ACTIVE' as const,
      customerId,
      buildingType: 'EVENT' as const, // EVENT_VENUE -> EVENT
      minStaffRequirement: 6,
      defaultShiftDuration: 8,
      requiresClearance: true,
    },
  ];

  const createdSites = [];
  for (const site of sites) {
    const { customerId, ...siteData } = site;
    const created = await prisma.site.create({
      data: {
        ...siteData,
        customer: {
          connect: { id: customerId }
        }
      }
    });
    createdSites.push(created);
  }

  return createdSites;
}

/**
 * 3. Test-Mitarbeiter mit verschiedenen Profilen
 */
async function seedTestUsers(customerId: string) {
  const users = [
    // Optimal verfügbare Mitarbeiter (für Auto-Fill)
    {
      email: 'max.optimal@test.de',
      firstName: 'Max',
      lastName: 'Optimal',
      employeeId: 'EMP-OPTIMAL-001',
      qualifications: ['Erste Hilfe', 'Waffenschein', 'Nachtschicht-Tauglichkeit'],
      role: 'EMPLOYEE',
      wageGroup: 'GRUPPE_3',
    },
    {
      email: 'anna.perfekt@test.de',
      firstName: 'Anna',
      lastName: 'Perfekt',
      employeeId: 'EMP-OPTIMAL-002',
      qualifications: ['Erste Hilfe', 'Crowd Control', 'Krisenmanagement'],
      role: 'EMPLOYEE',
      wageGroup: 'GRUPPE_4',
    },
    {
      email: 'tom.verfuegbar@test.de',
      firstName: 'Tom',
      lastName: 'Verfügbar',
      employeeId: 'EMP-OPTIMAL-003',
      qualifications: ['Erste Hilfe', 'Nachtschicht-Tauglichkeit'],
      role: 'EMPLOYEE',
      wageGroup: 'GRUPPE_2',
    },

    // Mitarbeiter mit Clearance-Problemen
    {
      email: 'lisa.noclearance@test.de',
      firstName: 'Lisa',
      lastName: 'Keine-Einarbeitung',
      employeeId: 'EMP-NOCLEAR-001',
      qualifications: ['Erste Hilfe'],
      role: 'EMPLOYEE',
      wageGroup: 'GRUPPE_2',
    },
    {
      email: 'peter.expired@test.de',
      firstName: 'Peter',
      lastName: 'Abgelaufen',
      employeeId: 'EMP-EXPIRED-001',
      qualifications: ['Erste Hilfe', 'Waffenschein'],
      role: 'EMPLOYEE',
      wageGroup: 'GRUPPE_3',
    },
    {
      email: 'sarah.expiring@test.de',
      firstName: 'Sarah',
      lastName: 'Läuft-Bald-Ab',
      employeeId: 'EMP-EXPIRING-001',
      qualifications: ['Erste Hilfe', 'Crowd Control'],
      role: 'EMPLOYEE',
      wageGroup: 'GRUPPE_3',
    },

    // Mitarbeiter mit fehlenden Qualifikationen
    {
      email: 'julia.noqual@test.de',
      firstName: 'Julia',
      lastName: 'Ohne-Quali',
      employeeId: 'EMP-NOQUAL-001',
      qualifications: [], // Keine Qualifikationen
      role: 'EMPLOYEE',
      wageGroup: 'GRUPPE_1',
    },
    {
      email: 'mike.teilqual@test.de',
      firstName: 'Mike',
      lastName: 'Teil-Quali',
      employeeId: 'EMP-PARTQUAL-001',
      qualifications: ['Erste Hilfe'], // Nur Basis-Quali
      role: 'EMPLOYEE',
      wageGroup: 'GRUPPE_2',
    },

    // Überlastete Mitarbeiter (für Compliance-Warnungen)
    {
      email: 'chris.overworked@test.de',
      firstName: 'Chris',
      lastName: 'Überlastet',
      employeeId: 'EMP-OVERWORK-001',
      qualifications: ['Erste Hilfe', 'Nachtschicht-Tauglichkeit', 'Waffenschein'],
      role: 'EMPLOYEE',
      wageGroup: 'GRUPPE_4',
    },
    {
      email: 'emma.stressed@test.de',
      firstName: 'Emma',
      lastName: 'Gestresst',
      employeeId: 'EMP-STRESS-001',
      qualifications: ['Erste Hilfe', 'Crowd Control'],
      role: 'EMPLOYEE',
      wageGroup: 'GRUPPE_3',
    },

    // Normal verfügbare Mitarbeiter
    {
      email: 'david.normal@test.de',
      firstName: 'David',
      lastName: 'Normal',
      employeeId: 'EMP-NORMAL-001',
      qualifications: ['Erste Hilfe', 'Waffenschein'],
      role: 'EMPLOYEE',
      wageGroup: 'GRUPPE_3',
    },
    {
      email: 'sophie.standard@test.de',
      firstName: 'Sophie',
      lastName: 'Standard',
      employeeId: 'EMP-NORMAL-002',
      qualifications: ['Erste Hilfe', 'Nachtschicht-Tauglichkeit'],
      role: 'EMPLOYEE',
      wageGroup: 'GRUPPE_2',
    },
  ];

  const createdUsers = [];
  for (const user of users) {
    const created = await createUserWithPassword(
      prisma,
      {
        ...user,
        role: user.role as any,
        customerId,
        isActive: true,
        password: 'Test1234!',
        phone: null,
        hireDate: new Date(),
      }
    );
    createdUsers.push(created);
  }

  return createdUsers;
}

/**
 * 4. Object Clearances (verschiedene Status)
 */
async function seedObjectClearances(users: any[], sites: any[]) {
  const clearances = [];

  // Max Optimal: Alle Sites, ACTIVE
  for (const site of sites) {
    clearances.push({
      userId: users[0].id, // Max Optimal
      siteId: site.id,
      status: 'ACTIVE' as ClearanceStatus,
      validUntil: addDays(new Date(), 365), // 1 Jahr gültig
      trainedAt: addDays(new Date(), -30),
      trainedBy: users[0].id,
    });
  }

  // Anna Perfekt: 3 Sites, ACTIVE
  for (let i = 0; i < 3; i++) {
    clearances.push({
      userId: users[1].id, // Anna Perfekt
      siteId: sites[i].id,
      status: 'ACTIVE' as ClearanceStatus,
      validUntil: addDays(new Date(), 180), // 6 Monate gültig
      trainedAt: addDays(new Date(), -14),
      trainedBy: users[0].id,
    });
  }

  // Tom Verfügbar: 2 Sites, ACTIVE
  clearances.push(
    {
      userId: users[2].id, // Tom Verfügbar
      siteId: sites[0].id,
      status: 'ACTIVE' as ClearanceStatus,
      validUntil: addDays(new Date(), 90),
      trainedAt: addDays(new Date(), -7),
      trainedBy: users[0].id,
    },
    {
      userId: users[2].id,
      siteId: sites[1].id,
      status: 'ACTIVE' as ClearanceStatus,
      validUntil: addDays(new Date(), 120),
      trainedAt: addDays(new Date(), -10),
      trainedBy: users[0].id,
    }
  );

  // Lisa Keine-Einarbeitung: KEINE Clearances (für NO_CLEARANCE Konflikt)

  // Peter Abgelaufen: EXPIRED Clearances
  clearances.push({
    userId: users[4].id, // Peter Abgelaufen
    siteId: sites[0].id,
    status: 'EXPIRED' as ClearanceStatus,
    validUntil: addDays(new Date(), -30), // Vor 30 Tagen abgelaufen
    trainedAt: addDays(new Date(), -400),
    trainedBy: users[0].id,
  });

  // Sarah Läuft-Bald-Ab: EXPIRING_SOON (innerhalb 30 Tage)
  clearances.push({
    userId: users[5].id, // Sarah Läuft-Bald-Ab
    siteId: sites[0].id,
    status: 'ACTIVE' as ClearanceStatus,
    validUntil: addDays(new Date(), 15), // Läuft in 15 Tagen ab
    trainedAt: addDays(new Date(), -350),
    trainedBy: users[0].id,
  });

  // Julia Ohne-Quali: 1 Site, ACTIVE (aber keine Qualifikationen)
  clearances.push({
    userId: users[6].id, // Julia Ohne-Quali
    siteId: sites[0].id,
    status: 'ACTIVE' as ClearanceStatus,
    validUntil: addDays(new Date(), 200),
    trainedAt: addDays(new Date(), -20),
    trainedBy: users[0].id,
  });

  // Mike Teil-Quali: 2 Sites, ACTIVE
  clearances.push(
    {
      userId: users[7].id, // Mike Teil-Quali
      siteId: sites[0].id,
      status: 'ACTIVE' as ClearanceStatus,
      validUntil: addDays(new Date(), 150),
      trainedAt: addDays(new Date(), -25),
      trainedBy: users[0].id,
    },
    {
      userId: users[7].id,
      siteId: sites[1].id,
      status: 'ACTIVE' as ClearanceStatus,
      validUntil: addDays(new Date(), 180),
      trainedAt: addDays(new Date(), -18),
      trainedBy: users[0].id,
    }
  );

  // Chris Überlastet: Alle Sites, ACTIVE
  for (const site of sites) {
    clearances.push({
      userId: users[8].id, // Chris Überlastet
      siteId: site.id,
      status: 'ACTIVE' as ClearanceStatus,
      validUntil: addDays(new Date(), 250),
      trainedAt: addDays(new Date(), -60),
      trainedBy: users[0].id,
    });
  }

  // Emma Gestresst: 3 Sites, ACTIVE
  for (let i = 0; i < 3; i++) {
    clearances.push({
      userId: users[9].id, // Emma Gestresst
      siteId: sites[i].id,
      status: 'ACTIVE' as ClearanceStatus,
      validUntil: addDays(new Date(), 220),
      trainedAt: addDays(new Date(), -45),
      trainedBy: users[0].id,
    });
  }

  // David Normal: 3 Sites, ACTIVE
  for (let i = 0; i < 3; i++) {
    clearances.push({
      userId: users[10].id, // David Normal
      siteId: sites[i].id,
      status: 'ACTIVE' as ClearanceStatus,
      validUntil: addDays(new Date(), 200),
      trainedAt: addDays(new Date(), -35),
      trainedBy: users[0].id,
    });
  }

  // Sophie Standard: 2 Sites, ACTIVE
  clearances.push(
    {
      userId: users[11].id, // Sophie Standard
      siteId: sites[0].id,
      status: 'ACTIVE' as ClearanceStatus,
      validUntil: addDays(new Date(), 160),
      trainedAt: addDays(new Date(), -28),
      trainedBy: users[0].id,
    },
    {
      userId: users[11].id,
      siteId: sites[1].id,
      status: 'ACTIVE' as ClearanceStatus,
      validUntil: addDays(new Date(), 175),
      trainedAt: addDays(new Date(), -22),
      trainedBy: users[0].id,
    }
  );

  // Create all clearances
  for (const clearance of clearances) {
    await prisma.objectClearance.create({ data: clearance });
  }

  console.log(`    ✓ ${clearances.length} Object Clearances erstellt`);
}

/**
 * 5. Employee Preferences
 */
async function seedEmployeePreferences(users: any[], sites: any[]) {
  const preferences = [
    // Max Optimal: Präferiert Nachtschichten
    {
      userId: users[0].id,
      shiftTypePreferences: {
        NIGHT: 10,
        REGULAR: 7,
        WEEKEND: 8,
      },
      blackoutPeriods: [],
    },
    // Anna Perfekt: Präferiert Tagschichten
    {
      userId: users[1].id,
      shiftTypePreferences: {
        REGULAR: 10,
        SPECIAL: 9,
        WEEKEND: 5,
        NIGHT: 2,
      },
      blackoutPeriods: [],
    },
    // Tom Verfügbar: Flexibel
    {
      userId: users[2].id,
      shiftTypePreferences: {
        REGULAR: 8,
        NIGHT: 7,
        WEEKEND: 6,
      },
      blackoutPeriods: [],
    },
    // Chris Überlastet: Will weniger arbeiten
    {
      userId: users[8].id,
      shiftTypePreferences: {
        REGULAR: 5,
        NIGHT: 2,
        WEEKEND: 1,
      },
      blackoutPeriods: [
        {
          start: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
          end: format(addDays(new Date(), 12), 'yyyy-MM-dd'),
          reason: 'Urlaub geplant',
        },
      ],
    },
  ];

  for (const pref of preferences) {
    await (prisma as any).employeeShiftPreference.create({
      data: pref as any,
    });
  }

  console.log(`    ✓ ${preferences.length} Employee Preferences erstellt`);
}

/**
 * 6. Test-Schichten (alle Konflikttypen)
 */
async function seedTestShifts(sites: any[], users: any[]) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  // KONFLIKT 1: UNASSIGNED - Keine Mitarbeiter
  await prisma.shift.create({
    data: {
      siteId: sites[0].id,
      title: '⚠️ UNASSIGNED: Frühschicht ohne Mitarbeiter',
      startTime: addDays(weekStart, 0).toISOString(),
      endTime: addHours(addDays(weekStart, 0), 8).toISOString(),
      requiredEmployees: 2,
      location: 'Haupteingang',
      requiredQualifications: ['Erste Hilfe'],
      status: 'PLANNED',
    },
  });

  // KONFLIKT 2: UNDERSTAFFED - Zu wenig Mitarbeiter
  const understaffedShift = await prisma.shift.create({
    data: {
      siteId: sites[0].id,
      title: '⚠️ UNDERSTAFFED: Nur 1 von 3 Mitarbeitern',
      startTime: addDays(weekStart, 1).toISOString(),
      endTime: addHours(addDays(weekStart, 1), 8).toISOString(),
      requiredEmployees: 3,
      location: 'Haupteingang',
      requiredQualifications: ['Erste Hilfe'],
      status: 'PLANNED',
    },
  });
  await prisma.shiftAssignment.create({
    data: {
      shiftId: understaffedShift.id,
      userId: users[0].id, // Max Optimal
      status: 'ASSIGNED',
      assignedAt: new Date(),
    },
  });

  // KONFLIKT 3: NO_CLEARANCE - Mitarbeiter ohne Einarbeitung
  const noClearanceShift = await prisma.shift.create({
    data: {
      siteId: sites[0].id,
      title: '⚠️ NO_CLEARANCE: Lisa ohne Einarbeitung',
      startTime: addHours(addDays(weekStart, 1), 8).toISOString(),
      endTime: addHours(addDays(weekStart, 1), 16).toISOString(),
      requiredEmployees: 2,
      location: 'Haupteingang',
      requiredQualifications: ['Erste Hilfe'],
      status: 'PLANNED',
    },
  });
  await prisma.shiftAssignment.create({
    data: {
      shiftId: noClearanceShift.id,
      userId: users[3].id, // Lisa Keine-Einarbeitung (hat keine Clearance)
      status: 'ASSIGNED',
      assignedAt: new Date(),
    },
  });

  // KONFLIKT 4: MISSING_QUALIFICATIONS - Fehlende Qualifikationen
  const missingQualShift = await prisma.shift.create({
    data: {
      siteId: sites[0].id,
      title: '⚠️ MISSING_QUALIFICATIONS: Waffenschein fehlt',
      startTime: addHours(addDays(weekStart, 2), 6).toISOString(),
      endTime: addHours(addDays(weekStart, 2), 14).toISOString(),
      requiredEmployees: 2,
      location: 'Haupteingang',
      requiredQualifications: ['Erste Hilfe', 'Waffenschein'], // Julia hat keinen Waffenschein
      status: 'PLANNED',
    },
  });
  await prisma.shiftAssignment.create({
    data: {
      shiftId: missingQualShift.id,
      userId: users[7].id, // Mike Teil-Quali (nur Erste Hilfe)
      status: 'ASSIGNED',
      assignedAt: new Date(),
    },
  });

  // KONFLIKT 5: DOUBLE_BOOKING - Mitarbeiter doppelt gebucht
  const doubleBooking1 = await prisma.shift.create({
    data: {
      siteId: sites[0].id,
      title: '⚠️ DOUBLE_BOOKING: Schicht A',
      startTime: addHours(addDays(weekStart, 3), 8).toISOString(),
      endTime: addHours(addDays(weekStart, 3), 16).toISOString(),
      requiredEmployees: 1,
      location: 'Haupteingang',
      requiredQualifications: ['Erste Hilfe'],
      status: 'PLANNED',
    },
  });
  await prisma.shiftAssignment.create({
    data: {
      shiftId: doubleBooking1.id,
      userId: users[0].id, // Max Optimal
      status: 'ASSIGNED',
      assignedAt: new Date(),
    },
  });

  const doubleBooking2 = await prisma.shift.create({
    data: {
      siteId: sites[1].id,
      title: '⚠️ DOUBLE_BOOKING: Schicht B (Überlappung)',
      startTime: addHours(addDays(weekStart, 3), 12).toISOString(), // 4h Überlappung
      endTime: addHours(addDays(weekStart, 3), 20).toISOString(),
      requiredEmployees: 1,
      location: 'Haupteingang',
      requiredQualifications: ['Erste Hilfe'],
      status: 'PLANNED',
    },
  });
  await prisma.shiftAssignment.create({
    data: {
      shiftId: doubleBooking2.id,
      userId: users[0].id, // Max Optimal (wieder)
      status: 'ASSIGNED',
      assignedAt: new Date(),
    },
  });

  // KONFLIKT 6: REST_TIME_VIOLATION - Ruhezeit-Verstoß
  const restViolation1 = await prisma.shift.create({
    data: {
      siteId: sites[0].id,
      title: '⚠️ REST_TIME_VIOLATION: Nachtschicht',
      startTime: addHours(addDays(weekStart, 4), 22).toISOString(),
      endTime: addHours(addDays(weekStart, 5), 6).toISOString(),
      requiredEmployees: 1,
      location: 'Haupteingang',
      requiredQualifications: ['Erste Hilfe', 'Nachtschicht-Tauglichkeit'],
      status: 'PLANNED',
    },
  });
  await prisma.shiftAssignment.create({
    data: {
      shiftId: restViolation1.id,
      userId: users[2].id, // Tom Verfügbar
      status: 'ASSIGNED',
      assignedAt: new Date(),
    },
  });

  const restViolation2 = await prisma.shift.create({
    data: {
      siteId: sites[0].id,
      title: '⚠️ REST_TIME_VIOLATION: Frühschicht (nur 2h Pause)',
      startTime: addHours(addDays(weekStart, 5), 8).toISOString(), // Nur 2h nach Nachtschicht-Ende
      endTime: addHours(addDays(weekStart, 5), 16).toISOString(),
      requiredEmployees: 1,
      location: 'Haupteingang',
      requiredQualifications: ['Erste Hilfe'],
      status: 'PLANNED',
    },
  });
  await prisma.shiftAssignment.create({
    data: {
      shiftId: restViolation2.id,
      userId: users[2].id, // Tom Verfügbar (wieder)
      status: 'ASSIGNED',
      assignedAt: new Date(),
    },
  });

  // KONFLIKT 7: WEEKLY_HOURS_EXCEEDED - Wöchentliche Stunden überschritten
  // Chris Überlastet bekommt viele Schichten
  for (let i = 0; i < 6; i++) {
    const shift = await prisma.shift.create({
      data: {
        siteId: sites[i % 3].id,
        title: `⚠️ WEEKLY_HOURS: Chris Schicht ${i + 1}`,
        startTime: addHours(addDays(weekStart, i), 6).toISOString(),
        endTime: addHours(addDays(weekStart, i), 14).toISOString(),
        requiredEmployees: 2,
        location: 'Haupteingang',
      requiredQualifications: ['Erste Hilfe'],
        status: 'PLANNED',
      },
    });
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift.id,
        userId: users[8].id, // Chris Überlastet (6x8h = 48h > 40h Limit)
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
    });
  }

  // KONFLIKT 8: CONSECUTIVE_DAYS_EXCEEDED - Zu viele aufeinanderfolgende Tage
  // Emma Gestresst arbeitet 7 Tage durch
  for (let i = 0; i < 7; i++) {
    const shift = await prisma.shift.create({
      data: {
        siteId: sites[i % 3].id,
        title: `⚠️ CONSECUTIVE_DAYS: Emma Tag ${i + 1}`,
        startTime: addHours(addDays(weekStart, i), 14).toISOString(),
        endTime: addHours(addDays(weekStart, i), 22).toISOString(),
        requiredEmployees: 2,
        location: 'Haupteingang',
      requiredQualifications: ['Erste Hilfe'],
        status: 'PLANNED',
      },
    });
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift.id,
        userId: users[9].id, // Emma Gestresst (7 aufeinanderfolgende Tage)
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
    });
  }

  // KONFLIKT 9: OVERSTAFFED - Zu viele Mitarbeiter
  const overstaffedShift = await prisma.shift.create({
    data: {
      siteId: sites[0].id,
      title: '⚠️ OVERSTAFFED: 4 von 2 Mitarbeitern',
      startTime: addHours(addDays(weekStart, 6), 10).toISOString(),
      endTime: addHours(addDays(weekStart, 6), 18).toISOString(),
      requiredEmployees: 2,
      location: 'Haupteingang',
      requiredQualifications: ['Erste Hilfe'],
      status: 'PLANNED',
    },
  });
  for (let i = 0; i < 4; i++) {
    await prisma.shiftAssignment.create({
      data: {
        shiftId: overstaffedShift.id,
        userId: users[i].id,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
    });
  }

  // BONUS: Gut besetzte Schichten (für Auto-Fill Tests)
  for (let day = 0; day < 7; day++) {
    const shift = await prisma.shift.create({
      data: {
        siteId: sites[0].id,
        title: `✅ Gut besetzt: Tag ${day + 1}`,
        startTime: addHours(addDays(weekStart, day), 8).toISOString(),
        endTime: addHours(addDays(weekStart, day), 16).toISOString(),
        requiredEmployees: 2,
        location: 'Haupteingang',
      requiredQualifications: ['Erste Hilfe'],
        status: 'PLANNED',
      },
    });

    // Nur 1 Mitarbeiter zuweisen (für Auto-Fill)
    if (day % 2 === 0) {
      await prisma.shiftAssignment.create({
        data: {
          shiftId: shift.id,
          userId: users[10].id, // David Normal
          status: 'ASSIGNED',
          assignedAt: new Date(),
        },
      });
    }
  }

  console.log('    ✓ Test-Schichten mit allen 9 Konflikttypen erstellt');
}

/**
 * 7. Employee Workload
 */
async function seedEmployeeWorkload(users: any[]) {
  const workloads = [
    // Max Optimal: Moderate Auslastung
    {
      userId: users[0].id,
      startDate: addDays(new Date(), -7),
      endDate: new Date(),
      totalHours: 32,
      nightShiftCount: 2,
      weekendShiftCount: 1,
      consecutiveDaysWorked: 4,
      restDaysCount: 3,
    },
    // Anna Perfekt: Gute Auslastung
    {
      userId: users[1].id,
      startDate: addDays(new Date(), -7),
      endDate: new Date(),
      totalHours: 35,
      nightShiftCount: 0,
      weekendShiftCount: 1,
      consecutiveDaysWorked: 5,
      restDaysCount: 2,
    },
    // Tom Verfügbar: Niedrige Auslastung
    {
      userId: users[2].id,
      startDate: addDays(new Date(), -7),
      endDate: new Date(),
      totalHours: 24,
      nightShiftCount: 1,
      weekendShiftCount: 0,
      consecutiveDaysWorked: 3,
      restDaysCount: 4,
    },
    // Chris Überlastet: Überlastung
    {
      userId: users[8].id,
      startDate: addDays(new Date(), -7),
      endDate: new Date(),
      totalHours: 52, // Über dem Limit
      nightShiftCount: 4,
      weekendShiftCount: 2,
      consecutiveDaysWorked: 7,
      restDaysCount: 0,
    },
    // Emma Gestresst: Hohe Auslastung
    {
      userId: users[9].id,
      startDate: addDays(new Date(), -7),
      endDate: new Date(),
      totalHours: 48,
      nightShiftCount: 3,
      weekendShiftCount: 2,
      consecutiveDaysWorked: 6,
      restDaysCount: 1,
    },
  ];

  for (const workload of workloads) {
    await prisma.employeeWorkload.create({
      data: workload as any,
    });
  }

  console.log(`    ✓ ${workloads.length} Employee Workload Einträge erstellt`);
}

/**
 * Standalone-Ausführung (optional)
 */
if (require.main === module) {
  const customerId = process.env.TEST_CUSTOMER_ID || 'test-customer-id';

  seedShiftPlanningV2(customerId)
    .then(() => {
      console.log('✅ Seed erfolgreich!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed fehlgeschlagen:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
