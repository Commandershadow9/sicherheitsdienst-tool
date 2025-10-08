import {
  AbsenceStatus,
  AbsenceType,
  AssignmentStatus,
  PrismaClient,
  ShiftStatus,
} from '@prisma/client';
import { resetSeedData, createUserWithPassword } from './seedHelpers';

const prisma = new PrismaClient();

type PreferencePlan = {
  prefersNightShifts?: boolean;
  prefersDayShifts?: boolean;
  prefersWeekends?: boolean;
  targetMonthlyHours?: number;
  minMonthlyHours?: number;
  maxMonthlyHours?: number;
  flexibleHours?: boolean;
  prefersLongShifts?: boolean;
  prefersShortShifts?: boolean;
  prefersConsecutiveDays?: number | null;
  minRestDaysPerWeek?: number;
  preferredSiteKeys?: string[];
  avoidedSiteKeys?: string[];
  notes?: string | null;
};

type WorkloadPlan = {
  totalHours: number;
  scheduledHours?: number;
  nightShiftCount: number;
  weekendShiftCount?: number;
  maxWeeklyHours?: number;
  minRestHoursBetweenShifts?: number | null;
  consecutiveDaysWorked?: number;
  restDaysCount?: number;
  fairnessScore?: number | null;
};

type ProfilePlan = {
  annualLeaveDays?: number;
  hourlyRate?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'MINI_JOB' | 'TEMPORARY' | 'CONTRACTOR';
};

type UserBlueprint = {
  key: string;
  data: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: 'ADMIN' | 'MANAGER' | 'DISPATCHER' | 'EMPLOYEE';
    employeeId: string;
    hireDate: Date;
    qualifications: string[];
    isActive: boolean;
  };
  profile?: ProfilePlan;
  preference?: PreferencePlan;
  workload?: WorkloadPlan;
};

type CreatedUser = {
  user: Awaited<ReturnType<typeof createUserWithPassword>>;
  blueprint: UserBlueprint;
};

const employeeBlueprints: UserBlueprint[] = [
  {
    key: 'thomas',
    data: {
      email: 'thomas.mueller@sicherheitsdienst.de',
      firstName: 'Thomas',
      lastName: 'Müller',
      phone: '+49 123 100001',
      role: 'EMPLOYEE',
      employeeId: 'EMP101',
      hireDate: new Date('2023-01-01'),
      qualifications: ['Erste Hilfe', 'Objektschutz', 'Brandschutz'],
      isActive: true,
    },
    preference: {
      prefersDayShifts: true,
      prefersNightShifts: false,
      preferredSiteKeys: ['office'],
      avoidedSiteKeys: ['hospital'],
      notes: 'Mag Tagschichten im Büro',
    },
    workload: {
      totalHours: 82,
      nightShiftCount: 2,
      weekendShiftCount: 1,
      maxWeeklyHours: 38,
      minRestHoursBetweenShifts: 12,
      consecutiveDaysWorked: 4,
      restDaysCount: 3,
      fairnessScore: 80,
    },
  },
  {
    key: 'anna',
    data: {
      email: 'anna.schmidt@sicherheitsdienst.de',
      firstName: 'Anna',
      lastName: 'Schmidt',
      phone: '+49 123 100002',
      role: 'EMPLOYEE',
      employeeId: 'EMP102',
      hireDate: new Date('2023-02-01'),
      qualifications: ['Erste Hilfe', 'Veranstaltungsschutz'],
      isActive: true,
    },
    preference: {
      prefersDayShifts: true,
      prefersWeekends: false,
      preferredSiteKeys: ['office', 'mall'],
      notes: 'Perfekt für Empfang & Tagesservice',
    },
    workload: {
      totalHours: 168,
      nightShiftCount: 6,
      weekendShiftCount: 4,
      maxWeeklyHours: 46,
      minRestHoursBetweenShifts: 10,
      consecutiveDaysWorked: 6,
      restDaysCount: 2,
      fairnessScore: 65,
    },
  },
  {
    key: 'michael',
    data: {
      email: 'michael.wagner@sicherheitsdienst.de',
      firstName: 'Michael',
      lastName: 'Wagner',
      phone: '+49 123 100003',
      role: 'EMPLOYEE',
      employeeId: 'EMP103',
      hireDate: new Date('2023-03-01'),
      qualifications: ['Erste Hilfe', 'Brandschutz'],
      isActive: true,
    },
    preference: {
      prefersNightShifts: true,
      prefersDayShifts: false,
      preferredSiteKeys: ['industry'],
      notes: 'Übernimmt gern Nachtschichten im Industriepark',
    },
    workload: {
      totalHours: 128,
      nightShiftCount: 7,
      weekendShiftCount: 3,
      maxWeeklyHours: 44,
      minRestHoursBetweenShifts: 11,
      consecutiveDaysWorked: 5,
      restDaysCount: 2,
      fairnessScore: 72,
    },
  },
  {
    key: 'julia',
    data: {
      email: 'julia.becker@sicherheitsdienst.de',
      firstName: 'Julia',
      lastName: 'Becker',
      phone: '+49 123 100004',
      role: 'EMPLOYEE',
      employeeId: 'EMP104',
      hireDate: new Date('2023-04-01'),
      qualifications: ['Erste Hilfe', 'Personenschutz'],
      isActive: true,
    },
    preference: {
      prefersDayShifts: true,
      prefersWeekends: false,
      preferredSiteKeys: ['office'],
      avoidedSiteKeys: ['industry'],
      notes: 'Benötigt planbare Arbeitszeiten wegen Familie',
    },
    workload: {
      totalHours: 102,
      nightShiftCount: 1,
      weekendShiftCount: 1,
      maxWeeklyHours: 36,
      minRestHoursBetweenShifts: 13,
      consecutiveDaysWorked: 4,
      restDaysCount: 4,
      fairnessScore: 88,
    },
  },
  {
    key: 'stefan',
    data: {
      email: 'stefan.fischer@sicherheitsdienst.de',
      firstName: 'Stefan',
      lastName: 'Fischer',
      phone: '+49 123 100005',
      role: 'EMPLOYEE',
      employeeId: 'EMP105',
      hireDate: new Date('2023-05-01'),
      qualifications: ['Erste Hilfe', 'Objektschutz'],
      isActive: true,
    },
    preference: {
      prefersDayShifts: false,
      prefersNightShifts: true,
      preferredSiteKeys: ['industry'],
      notes: 'Nachtschicht-Spezialist, wenig flexibel bei Urlaub',
    },
    workload: {
      totalHours: 148,
      nightShiftCount: 9,
      weekendShiftCount: 5,
      maxWeeklyHours: 48,
      minRestHoursBetweenShifts: 10,
      consecutiveDaysWorked: 7,
      restDaysCount: 1,
      fairnessScore: 55,
    },
  },
  {
    key: 'petra',
    data: {
      email: 'petra.hoffmann@sicherheitsdienst.de',
      firstName: 'Petra',
      lastName: 'Hoffmann',
      phone: '+49 123 100006',
      role: 'EMPLOYEE',
      employeeId: 'EMP106',
      hireDate: new Date('2023-06-01'),
      qualifications: ['Erste Hilfe', 'Objektschutz'],
      isActive: true,
    },
    preference: {
      prefersDayShifts: true,
      prefersWeekends: false,
      preferredSiteKeys: ['mall'],
      notes: 'Flexibel einsetzbar, bevorzugt Einkaufszentrum',
    },
    workload: {
      totalHours: 92,
      nightShiftCount: 2,
      weekendShiftCount: 2,
      maxWeeklyHours: 38,
      minRestHoursBetweenShifts: 12,
      consecutiveDaysWorked: 4,
      restDaysCount: 3,
      fairnessScore: 83,
    },
  },
  {
    key: 'markus',
    data: {
      email: 'markus.klein@sicherheitsdienst.de',
      firstName: 'Markus',
      lastName: 'Klein',
      phone: '+49 123 100007',
      role: 'EMPLOYEE',
      employeeId: 'EMP107',
      hireDate: new Date('2023-07-01'),
      qualifications: ['Erste Hilfe', 'Brandschutz'],
      isActive: true,
    },
    preference: {
      prefersDayShifts: false,
      prefersNightShifts: true,
      preferredSiteKeys: ['industry', 'hospital'],
      notes: 'Übernimmt gern Spät- und Nachtschichten',
    },
    workload: {
      totalHours: 118,
      nightShiftCount: 6,
      weekendShiftCount: 4,
      maxWeeklyHours: 42,
      minRestHoursBetweenShifts: 11,
      consecutiveDaysWorked: 5,
      restDaysCount: 2,
      fairnessScore: 68,
    },
  },
  {
    key: 'sabine',
    data: {
      email: 'sabine.wolf@sicherheitsdienst.de',
      firstName: 'Sabine',
      lastName: 'Wolf',
      phone: '+49 123 100008',
      role: 'EMPLOYEE',
      employeeId: 'EMP108',
      hireDate: new Date('2023-08-01'),
      qualifications: ['Erste Hilfe', 'Veranstaltungsschutz'],
      isActive: true,
    },
    preference: {
      prefersDayShifts: true,
      prefersWeekends: true,
      preferredSiteKeys: ['hospital', 'townhall'],
      notes: 'Erfahrung im Veranstaltungsschutz',
    },
    workload: {
      totalHours: 136,
      nightShiftCount: 4,
      weekendShiftCount: 5,
      maxWeeklyHours: 45,
      minRestHoursBetweenShifts: 12,
      consecutiveDaysWorked: 6,
      restDaysCount: 2,
      fairnessScore: 70,
    },
  },
  {
    key: 'daniel',
    data: {
      email: 'daniel.richter@sicherheitsdienst.de',
      firstName: 'Daniel',
      lastName: 'Richter',
      phone: '+49 123 100009',
      role: 'EMPLOYEE',
      employeeId: 'EMP109',
      hireDate: new Date('2023-09-01'),
      qualifications: ['Erste Hilfe', 'Objektschutz'],
      isActive: true,
    },
    preference: {
      prefersDayShifts: true,
      prefersNightShifts: false,
      preferredSiteKeys: ['office', 'townhall'],
      notes: 'Azubi – bevorzugt Tagesdienst mit Mentor',
    },
    workload: {
      totalHours: 78,
      nightShiftCount: 1,
      weekendShiftCount: 1,
      maxWeeklyHours: 34,
      minRestHoursBetweenShifts: 13,
      consecutiveDaysWorked: 3,
      restDaysCount: 4,
      fairnessScore: 92,
    },
  },
  {
    key: 'claudia',
    data: {
      email: 'claudia.zimmermann@sicherheitsdienst.de',
      firstName: 'Claudia',
      lastName: 'Zimmermann',
      phone: '+49 123 100010',
      role: 'EMPLOYEE',
      employeeId: 'EMP110',
      hireDate: new Date('2023-10-01'),
      qualifications: ['Erste Hilfe', 'Personenschutz'],
      isActive: true,
    },
    preference: {
      prefersDayShifts: true,
      prefersWeekends: false,
      preferredSiteKeys: ['mall', 'townhall'],
      avoidedSiteKeys: ['industry'],
      notes: 'Setzt auf planbaren Tagesdienst',
    },
    workload: {
      totalHours: 96,
      nightShiftCount: 2,
      weekendShiftCount: 2,
      maxWeeklyHours: 37,
      minRestHoursBetweenShifts: 12,
      consecutiveDaysWorked: 4,
      restDaysCount: 3,
      fairnessScore: 82,
    },
  },
];

const replacementBlueprints: UserBlueprint[] = [
  {
    key: 'optimal',
    data: {
      email: 'optimal.candidate@sicherheitsdienst.de',
      firstName: 'Max',
      lastName: 'Optimal',
      phone: '+49 123 200001',
      role: 'EMPLOYEE',
      employeeId: 'OPT201',
      hireDate: new Date('2023-11-01'),
      qualifications: ['Erste Hilfe', 'Objektschutz'],
      isActive: true,
    },
    preference: {
      prefersNightShifts: false,
      prefersDayShifts: true,
      targetMonthlyHours: 160,
      minMonthlyHours: 140,
      maxMonthlyHours: 180,
      flexibleHours: true,
      prefersShortShifts: false,
      preferredSiteKeys: ['replacement'],
      notes: 'Bevorzugt Tagschichten am Test-Objekt',
    },
    workload: {
      totalHours: 120,
      scheduledHours: 120,
      nightShiftCount: 4,
      weekendShiftCount: 2,
      maxWeeklyHours: 40,
      minRestHoursBetweenShifts: 12,
      consecutiveDaysWorked: 5,
      restDaysCount: 2,
      fairnessScore: 85,
    },
  },
  {
    key: 'good',
    data: {
      email: 'good.candidate@sicherheitsdienst.de',
      firstName: 'Gesa',
      lastName: 'Kandidat',
      phone: '+49 123 200002',
      role: 'EMPLOYEE',
      employeeId: 'OPT202',
      hireDate: new Date('2023-11-15'),
      qualifications: ['Erste Hilfe', 'Veranstaltungsschutz'],
      isActive: true,
    },
    preference: {
      prefersNightShifts: true,
      prefersDayShifts: false,
      prefersWeekends: true,
      targetMonthlyHours: 160,
      minMonthlyHours: 120,
      maxMonthlyHours: 200,
      flexibleHours: true,
      prefersLongShifts: true,
      preferredSiteKeys: ['replacement'],
      notes: 'Flexibel, mag Nachtschichten',
    },
    workload: {
      totalHours: 96,
      scheduledHours: 96,
      nightShiftCount: 8,
      weekendShiftCount: 4,
      maxWeeklyHours: 42,
      minRestHoursBetweenShifts: 11,
      consecutiveDaysWorked: 6,
      restDaysCount: 1,
      fairnessScore: 70,
    },
  },
  {
    key: 'acceptable',
    data: {
      email: 'acceptable.candidate@sicherheitsdienst.de',
      firstName: 'Alex',
      lastName: 'Akzeptabel',
      phone: '+49 123 200003',
      role: 'EMPLOYEE',
      employeeId: 'OPT203',
      hireDate: new Date('2023-12-01'),
      qualifications: ['Erste Hilfe', 'Objektschutz'],
      isActive: true,
    },
    preference: {
      prefersNightShifts: false,
      prefersDayShifts: false,
      targetMonthlyHours: 160,
      minMonthlyHours: 150,
      maxMonthlyHours: 170,
      flexibleHours: false,
      prefersShortShifts: false,
      prefersLongShifts: false,
      preferredSiteKeys: [],
      avoidedSiteKeys: ['replacement'],
      notes: 'Vermeidet das Test-Objekt, bereits gut ausgelastet',
    },
    workload: {
      totalHours: 152,
      scheduledHours: 152,
      nightShiftCount: 6,
      weekendShiftCount: 3,
      maxWeeklyHours: 46,
      minRestHoursBetweenShifts: 10.5,
      consecutiveDaysWorked: 7,
      restDaysCount: 0,
      fairnessScore: 55,
    },
  },
  {
    key: 'overworked',
    data: {
      email: 'overworked.candidate@sicherheitsdienst.de',
      firstName: 'Omar',
      lastName: 'Überlastet',
      phone: '+49 123 200004',
      role: 'EMPLOYEE',
      employeeId: 'OPT204',
      hireDate: new Date('2024-01-01'),
      qualifications: ['Erste Hilfe', 'Brandschutz'],
      isActive: true,
    },
    preference: {
      prefersDayShifts: true,
      prefersNightShifts: false,
      targetMonthlyHours: 160,
      minMonthlyHours: 140,
      maxMonthlyHours: 170,
      flexibleHours: false,
      prefersShortShifts: true,
      preferredSiteKeys: [],
      avoidedSiteKeys: [],
      notes: 'Schon überlastet, Ruhezeiten knapp',
    },
    workload: {
      totalHours: 184,
      scheduledHours: 184,
      nightShiftCount: 12,
      weekendShiftCount: 6,
      maxWeeklyHours: 52,
      minRestHoursBetweenShifts: 8.5,
      consecutiveDaysWorked: 9,
      restDaysCount: 0,
      fairnessScore: 25,
    },
  },
  {
    key: 'absent',
    data: {
      email: 'absent.employee@sicherheitsdienst.de',
      firstName: 'Alina',
      lastName: 'Abwesend',
      phone: '+49 123 200005',
      role: 'EMPLOYEE',
      employeeId: 'OPT205',
      hireDate: new Date('2024-02-01'),
      qualifications: ['Erste Hilfe'],
      isActive: true,
    },
    preference: {
      prefersDayShifts: true,
      prefersNightShifts: false,
      preferredSiteKeys: ['replacement'],
      notes: 'Ist aktuell krankgemeldet',
    },
    workload: {
      totalHours: 90,
      scheduledHours: 90,
      nightShiftCount: 2,
      weekendShiftCount: 2,
      maxWeeklyHours: 35,
      minRestHoursBetweenShifts: 12,
      consecutiveDaysWorked: 3,
      restDaysCount: 4,
      fairnessScore: 78,
    },
  },
];

async function main() {
  console.log('🌱 Erstelle umfassende Test-Daten für das Sicherheitsdienst-Tool...');

  try {
    await resetSeedData(prisma);
    console.log('🗑️  Datenbank geleert');

    // Kernrollen
    const admin = await createUserWithPassword(prisma, {
      email: 'admin@sicherheitsdienst.de',
      firstName: 'Max',
      lastName: 'Administrator',
      phone: '+49 123 000001',
      role: 'ADMIN',
      employeeId: 'ADM001',
      hireDate: new Date('2020-01-01'),
      qualifications: ['Erste Hilfe', 'Brandschutz', 'Management'],
      isActive: true,
    });

    const manager = await createUserWithPassword(prisma, {
      email: 'manager@sicherheitsdienst.de',
      firstName: 'Lisa',
      lastName: 'Manager',
      phone: '+49 123 000002',
      role: 'MANAGER',
      employeeId: 'MGR001',
      hireDate: new Date('2020-06-01'),
      qualifications: ['Erste Hilfe', 'Einsatzplanung'],
      isActive: true,
    });

    const dispatcher = await createUserWithPassword(prisma, {
      email: 'dispatcher@sicherheitsdienst.de',
      firstName: 'Sarah',
      lastName: 'Dispatcher',
      phone: '+49 123 000003',
      role: 'DISPATCHER',
      employeeId: 'DIS001',
      hireDate: new Date('2021-02-15'),
      qualifications: ['Erste Hilfe', 'Kommunikation', 'Einsatzplanung'],
      isActive: true,
    });

    // Mitarbeiter*innen erstellen
    const employeeSeeds: CreatedUser[] = [];
    for (const blueprint of employeeBlueprints) {
      const user = await createUserWithPassword(prisma, blueprint.data);
      employeeSeeds.push({ user, blueprint });
    }
    const employees = employeeSeeds.map((entry) => entry.user);
    const [thomas, anna, michael, julia, stefan, petra, markus, sabine, daniel, claudia] = employees;

    // Replacement-Kandidaten
    const replacementSeeds: CreatedUser[] = [];
    for (const blueprint of replacementBlueprints) {
      const user = await createUserWithPassword(prisma, {
        ...blueprint.data,
        password: 'password123',
      });
      replacementSeeds.push({ user, blueprint });
    }
    const replacementMap = Object.fromEntries(replacementSeeds.map((entry) => [entry.blueprint.key, entry.user]));
    const optimal = replacementMap.optimal;
    const good = replacementMap.good;
    const acceptable = replacementMap.acceptable;
    const overworked = replacementMap.overworked;
    const absent = replacementMap.absent;

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Mitarbeiterprofile
    const profileTargets = [
      { user: manager, annualLeaveDays: 30 },
      { user: dispatcher, annualLeaveDays: 28 },
      ...employeeSeeds.map(({ user, blueprint }) => ({
        user,
        annualLeaveDays: blueprint.profile?.annualLeaveDays ?? 30,
      })),
      ...replacementSeeds.map(({ user, blueprint }) => ({
        user,
        annualLeaveDays: blueprint.profile?.annualLeaveDays ?? 30,
      })),
    ];

    for (const target of profileTargets) {
      await prisma.employeeProfile.create({
        data: {
          userId: target.user.id,
          employmentType: target.user.role === 'EMPLOYEE' ? 'FULL_TIME' : 'FULL_TIME',
          employmentStart: target.user.hireDate ?? new Date('2023-01-01'),
          annualLeaveDays: target.annualLeaveDays,
          weeklyTargetHours: 40,
          monthlyTargetHours: 160,
          hourlyRate: '18.50',
          notes: 'Erstellt durch Gesamt-Seed',
        },
      });
    }

    console.log('👥 Benutzer & Profile erstellt');

    // Sites
    const siteBlueprints = [
      { key: 'office', name: 'Bürogebäude Zentrum', address: 'Hauptstraße 1', city: 'Berlin', postalCode: '10115' },
      { key: 'mall', name: 'Einkaufszentrum Nord', address: 'Nordstraße 50', city: 'Berlin', postalCode: '10115' },
      { key: 'industry', name: 'Industriepark Süd', address: 'Industrieweg 25', city: 'Berlin', postalCode: '10119' },
      { key: 'hospital', name: 'Krankenhaus Mitte', address: 'Krankenhausstraße 10', city: 'Berlin', postalCode: '10178' },
      { key: 'townhall', name: 'Rathaus Stadtmitte', address: 'Rathausplatz 1', city: 'Berlin', postalCode: '10115' },
      { key: 'replacement', name: 'Test-Objekt Replacement', address: 'Teststraße 1', city: 'Berlin', postalCode: '12345' },
    ];

    const sites = new Map<string, Awaited<ReturnType<typeof prisma.site.create>>>();
    for (const site of siteBlueprints) {
    const { key, ...siteData } = site;
    const created = await prisma.site.create({ data: siteData });
    sites.set(key, created);
    }
    console.log('🏢 Einsatzorte erstellt');

    const trainingReference = new Date();
    trainingReference.setMonth(trainingReference.getMonth() - 1);
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 6);

    // Object Clearances
    await Promise.all(
      employees.map((emp) =>
        prisma.objectClearance.create({
          data: {
            userId: emp.id,
            siteId: sites.get('office')!.id,
            status: 'ACTIVE',
            trainedAt: trainingReference,
            validUntil,
          },
        }),
      ),
    );

    for (const emp of employees.slice(0, 5)) {
      await prisma.objectClearance.create({
        data: {
          userId: emp.id,
          siteId: sites.get('mall')!.id,
          status: 'ACTIVE',
          trainedAt: trainingReference,
          validUntil,
        },
      });
    }

    await prisma.objectClearance.create({
      data: {
        userId: markus.id,
        siteId: sites.get('hospital')!.id,
        status: 'ACTIVE',
        trainedAt: trainingReference,
        validUntil,
      },
    });

    await prisma.objectClearance.create({
      data: {
        userId: sabine.id,
        siteId: sites.get('hospital')!.id,
        status: 'ACTIVE',
        trainedAt: trainingReference,
        validUntil,
      },
    });

    await prisma.objectClearance.create({
      data: {
        userId: petra.id,
        siteId: sites.get('industry')!.id,
        status: 'ACTIVE',
        trainedAt: trainingReference,
        validUntil,
      },
    });

    for (const entry of replacementSeeds) {
      await prisma.objectClearance.create({
        data: {
          userId: entry.user.id,
          siteId: sites.get('replacement')!.id,
          status: 'ACTIVE',
          trainedAt: trainingReference,
          validUntil,
        },
      });
    }

    console.log('🔐 Objektberechtigungen erstellt');

    // Employee Preferences
    const siteIdByKey = Object.fromEntries(Array.from(sites.entries()).map(([key, value]) => [key, value.id]));

    const preferenceTargets = [
      ...employeeSeeds,
      ...replacementSeeds,
    ];

    for (const { user, blueprint } of preferenceTargets) {
      const pref = blueprint.preference ?? {};
      await prisma.employeePreferences.create({
        data: {
          userId: user.id,
          prefersNightShifts: pref.prefersNightShifts ?? false,
          prefersDayShifts: pref.prefersDayShifts ?? !pref.prefersNightShifts,
          prefersWeekends: pref.prefersWeekends ?? false,
          targetMonthlyHours: pref.targetMonthlyHours ?? 160,
          minMonthlyHours: pref.minMonthlyHours ?? 120,
          maxMonthlyHours: pref.maxMonthlyHours ?? 200,
          flexibleHours: pref.flexibleHours ?? true,
          prefersLongShifts: pref.prefersLongShifts ?? false,
          prefersShortShifts: pref.prefersShortShifts ?? false,
          prefersConsecutiveDays: pref.prefersConsecutiveDays ?? 5,
          minRestDaysPerWeek: pref.minRestDaysPerWeek ?? 2,
          preferredSiteIds: (pref.preferredSiteKeys ?? []).map((key) => siteIdByKey[key]).filter(Boolean),
          avoidedSiteIds: (pref.avoidedSiteKeys ?? []).map((key) => siteIdByKey[key]).filter(Boolean),
          notes: pref.notes ?? null,
        },
      });
    }

    console.log('🎯 Mitarbeiter-Präferenzen gespeichert');

    // Employee Workload
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    for (const { user, blueprint } of preferenceTargets) {
      const workload = blueprint.workload;
      if (!workload) continue;
      await prisma.employeeWorkload.create({
        data: {
          userId: user.id,
          month: currentMonth,
          year: currentYear,
          totalHours: workload.totalHours,
          scheduledHours: workload.scheduledHours ?? workload.totalHours,
          nightShiftCount: workload.nightShiftCount,
          weekendShiftCount: workload.weekendShiftCount ?? 0,
          maxWeeklyHours: workload.maxWeeklyHours ?? 40,
          minRestHoursBetweenShifts: workload.minRestHoursBetweenShifts ?? 11,
          consecutiveDaysWorked: workload.consecutiveDaysWorked ?? 5,
          restDaysCount: workload.restDaysCount ?? 2,
          fairnessScore: workload.fairnessScore ?? 75,
        },
      });
    }

    console.log('📊 Workload-Metriken hinterlegt');

    // Schichten & Zuweisungen
    const shiftCriticalStart = new Date(today);
    shiftCriticalStart.setHours(8, 0, 0, 0);
    const shiftCriticalEnd = new Date(today);
    shiftCriticalEnd.setHours(16, 0, 0, 0);

    const shiftCritical = await prisma.shift.create({
      data: {
        siteId: sites.get('office')!.id,
        title: 'Tagschicht Bürogebäude',
        description: 'Empfang, Zugangskontrolle, Patrouille',
        location: 'Bürogebäude Zentrum',
        startTime: shiftCriticalStart,
        endTime: shiftCriticalEnd,
        requiredEmployees: 3,
        requiredQualifications: ['Objektschutz'],
        status: ShiftStatus.PLANNED,
      },
    });

    const criticalAssignments = [
      thomas.id,
      anna.id,
      michael.id,
      julia.id,
    ];

    for (const userId of criticalAssignments) {
      await prisma.shiftAssignment.create({
        data: {
          shiftId: shiftCritical.id,
          userId,
          status: AssignmentStatus.ASSIGNED,
        },
      });
    }

    // Weitere Schichten
    const shiftEvening = await prisma.shift.create({
      data: {
        siteId: sites.get('mall')!.id,
        title: 'Abenddienst Einkaufszentrum',
        description: 'Schließrunde, Videoüberwachung',
        location: 'Einkaufszentrum Nord',
        startTime: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 26 * 60 * 60 * 1000),
        requiredEmployees: 2,
        status: ShiftStatus.PLANNED,
      },
    });
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shiftEvening.id,
        userId: stefan.id,
        status: AssignmentStatus.CONFIRMED,
      },
    });
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shiftEvening.id,
        userId: markus.id,
        status: AssignmentStatus.CONFIRMED,
      },
    });

    const shiftTomorrow = await prisma.shift.create({
      data: {
        siteId: sites.get('industry')!.id,
        title: 'Nachtschicht Industriepark',
        description: 'Torbewachung, Patrouillen',
        location: 'Industriepark Süd',
        startTime: new Date(tomorrow.getTime() + 22 * 60 * 60 * 1000),
        endTime: new Date(tomorrow.getTime() + 30 * 60 * 60 * 1000),
        requiredEmployees: 2,
        status: ShiftStatus.PLANNED,
      },
    });
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shiftTomorrow.id,
        userId: stefan.id,
        status: AssignmentStatus.ASSIGNED,
      },
    });
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shiftTomorrow.id,
        userId: markus.id,
        status: AssignmentStatus.ASSIGNED,
      },
    });

    const shiftTownhall = await prisma.shift.create({
      data: {
        siteId: sites.get('townhall')!.id,
        title: 'Veranstaltungsschutz Rathaus',
        description: 'Konferenzsicherung, Eingangskontrolle',
        location: 'Rathaus Stadtmitte',
        startTime: new Date(tomorrow.getTime() + 9 * 60 * 60 * 1000),
        endTime: new Date(tomorrow.getTime() + 17 * 60 * 60 * 1000),
        requiredEmployees: 2,
        status: ShiftStatus.PLANNED,
      },
    });
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shiftTownhall.id,
        userId: sabine.id,
        status: AssignmentStatus.ASSIGNED,
      },
    });
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shiftTownhall.id,
        userId: daniel.id,
        status: AssignmentStatus.ASSIGNED,
      },
    });

    console.log('📅 Schichten & Zuweisungen erstellt');

    // Abwesenheiten
    await prisma.absence.create({
      data: {
        userId: michael.id,
        type: AbsenceType.SICKNESS,
        status: AbsenceStatus.APPROVED,
        startsAt: shiftCriticalStart,
        endsAt: new Date(shiftCriticalEnd.getTime() + 24 * 60 * 60 * 1000),
        reason: 'Grippe – ärztliche Bescheinigung liegt vor',
        createdById: michael.id,
        decidedById: manager.id,
        decisionNote: 'Gute Besserung!',
      },
    });

    await prisma.absence.create({
      data: {
        userId: julia.id,
        type: AbsenceType.VACATION,
        status: AbsenceStatus.APPROVED,
        startsAt: shiftCriticalStart,
        endsAt: new Date(shiftCriticalEnd.getTime() + 2 * 24 * 60 * 60 * 1000),
        reason: 'Kurzurlaub',
        createdById: julia.id,
        decidedById: manager.id,
      },
    });

    const vacationStart = new Date(today);
    vacationStart.setDate(vacationStart.getDate() + 5);
    const vacationEnd = new Date(vacationStart);
    vacationEnd.setDate(vacationEnd.getDate() + 9);
    await prisma.absence.create({
      data: {
        userId: stefan.id,
        type: AbsenceType.VACATION,
        status: AbsenceStatus.REQUESTED,
        startsAt: vacationStart,
        endsAt: vacationEnd,
        reason: 'Sommerurlaub – verlängert',
        createdById: stefan.id,
      },
    });

    const petraAbsenceStart = new Date(today);
    petraAbsenceStart.setDate(petraAbsenceStart.getDate() + 3);
    const petraAbsenceEnd = new Date(petraAbsenceStart);
    petraAbsenceEnd.setDate(petraAbsenceEnd.getDate() + 2);
    await prisma.absence.create({
      data: {
        userId: petra.id,
        type: AbsenceType.VACATION,
        status: AbsenceStatus.REQUESTED,
        startsAt: petraAbsenceStart,
        endsAt: petraAbsenceEnd,
        reason: 'Familienbesuch',
        createdById: petra.id,
      },
    });

    const annaPastStart = new Date(today);
    annaPastStart.setDate(annaPastStart.getDate() - 10);
    const annaPastEnd = new Date(annaPastStart);
    annaPastEnd.setDate(annaPastEnd.getDate() + 3);
    await prisma.absence.create({
      data: {
        userId: anna.id,
        type: AbsenceType.VACATION,
        status: AbsenceStatus.APPROVED,
        startsAt: annaPastStart,
        endsAt: annaPastEnd,
        reason: 'Kurzurlaub',
        createdById: anna.id,
        decidedById: manager.id,
      },
    });

    console.log('🏖️  Abwesenheiten angelegt');

    // Replacement-Demo
    const replacementShiftStart = new Date(tomorrow);
    replacementShiftStart.setHours(8, 0, 0, 0);
    const replacementShiftEnd = new Date(tomorrow);
    replacementShiftEnd.setHours(18, 0, 0, 0);

    const replacementShift = await prisma.shift.create({
      data: {
        siteId: sites.get('replacement')!.id,
        title: 'Test-Tagschicht (Intelligent Replacement Demo)',
        description: 'Diese Schicht nutzt das Intelligent Replacement Scoring',
        location: sites.get('replacement')!.address,
        startTime: replacementShiftStart,
        endTime: replacementShiftEnd,
        requiredEmployees: 2,
        requiredQualifications: ['§34a GewO'],
        status: ShiftStatus.PLANNED,
      },
    });

    for (const candidate of [optimal, good, acceptable, overworked, absent]) {
      await prisma.shiftAssignment.create({
        data: {
          shiftId: replacementShift.id,
          userId: candidate.id,
          status: AssignmentStatus.ASSIGNED,
        },
      });
    }

    await prisma.absence.create({
      data: {
        userId: absent.id,
        type: AbsenceType.SICKNESS,
        status: AbsenceStatus.APPROVED,
        startsAt: replacementShiftStart,
        endsAt: new Date(replacementShiftEnd.getTime() + 2 * 24 * 60 * 60 * 1000),
        reason: 'Krankheitsfall – Ersatz organisieren',
        createdById: manager.id,
        decidedById: manager.id,
        decisionNote: 'Schicht neu besetzen',
      },
    });

    console.log('🤖 Intelligent-Replacement-Daten vorbereitet');

    // Zeitbuchung & Vorfall
    await prisma.timeEntry.create({
      data: {
        userId: thomas.id,
        shiftId: shiftCritical.id,
        startTime: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
        breakTime: 30,
        startLocation: 'Bürogebäude Zentrum – Eingang',
        endLocation: 'Bürogebäude Zentrum – Ausgang',
        notes: 'Routinedienst, keine Besonderheiten',
      },
    });

    await prisma.incident.create({
      data: {
        title: 'Unberechtigter Zutrittsversuch',
        description: 'Person ohne Berechtigung verweist. Vorfall im Wachbuch dokumentiert.',
        severity: 'LOW',
        status: 'RESOLVED',
        location: 'Bürogebäude Haupteingang',
        occurredAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
        reportedBy: thomas.id,
      },
    });

    console.log('🗒️  Beispiel-Zeiterfassung & Vorfall hinzugefügt');

    // Events
    await prisma.event.create({
      data: {
        title: 'Konferenzsicherung Rathaus',
        description: 'Eingangskontrolle, VIP-Betreuung, Taschenkontrollen',
        siteId: sites.get('townhall')!.id,
        startTime: new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
        endTime: new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
        serviceInstructions: 'Diskret auftreten, VIP-Liste beachten.',
        assignedEmployeeIds: [sabine.id, daniel.id],
        status: 'PLANNED',
      },
    });

    await prisma.event.create({
      data: {
        title: 'Spieltag – Stadion Nord',
        description: 'Crowd Management, Einlass, VIP-Bereich',
        siteId: sites.get('mall')!.id,
        startTime: new Date(tomorrow.getTime() + 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
        endTime: new Date(tomorrow.getTime() + 5 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000),
        serviceInstructions: 'Eingänge A–C besetzen, Funkgerät Pflicht.',
        assignedEmployeeIds: [markus.id, petra.id],
        status: 'PLANNED',
      },
    });

    console.log('🎪 Events (Einsätze) erstellt');

    console.log('\n🎉 Gesamtdatensatz erfolgreich erstellt!\n');
    console.log('👤 Wichtige Accounts:');
    console.log('   • Admin:       admin@sicherheitsdienst.de / password123');
    console.log('   • Manager:     manager@sicherheitsdienst.de / password123');
    console.log('   • Dispatcher:  dispatcher@sicherheitsdienst.de / password123');
    console.log('   • Beispiel-MA: thomas.mueller@sicherheitsdienst.de / password123');
    console.log('   • Replacement: optimal.candidate@sicherheitsdienst.de / password123');

    console.log('\n🧪 Relevante Test-Szenarien:');
    console.log('   1) Dashboard > Kritische Schichten → "Tagschicht Bürogebäude" zeigt 2 Abwesende (Fehlen: 1)');
    console.log('   2) Dashboard > Anträge → Urlaub (Stefan, Petra) & Genehmigungen (Anna, Julia)');
    console.log('   3) Ersatz finden → Test-Objekt Replacement (Scoring OPTIMAL/GOOD/…)');
    console.log('   4) Ereignisse & Zeiterfassung → Beispielvorfall + Buchung für Thomas');
    console.log('   5) Events → Rathaus & Stadion planen Einsätze mit zugewiesenen Teams');

    console.log('\nLos geht’s! Viel Erfolg beim Testen. 🚀');
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Test-Daten:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
