import {
  AbsenceStatus,
  AbsenceType,
  AssignmentStatus,
  BuildingType,
  CalculationStatus,
  Prisma,
  PrismaClient,
  ShiftStatus,
  SiteStatus,
  SiteDocumentCategory,
  SiteRole,
} from '@prisma/client';
import path from 'path';
import { promises as fs } from 'fs';
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

type CustomerBlueprint = {
  key: string;
  data: {
    companyName: string;
    industry?: string;
    taxId?: string;
    primaryContact: Prisma.InputJsonObject;
    contacts?: Prisma.InputJsonObject[];
    address: string;
    city: string;
    postalCode: string;
    billingAddress?: Prisma.InputJsonObject;
    paymentTerms?: string;
    discount?: string | null;
    notes?: string | null;
  };
};

type TemplateBlueprint = {
  key: string;
  data: {
    name: string;
    description?: string;
    buildingType: BuildingType;
    hoursPerWeek: number;
    shiftModel: string;
    requiredStaff: number;
    requiredQualifications: string[];
    tasks: string[];
    basePrice: number;
    isActive?: boolean;
  };
};

type PriceModelBlueprint = {
  key: string;
  data: {
    name: string;
    description?: string;
    hourlyRateEmployee: number;
    hourlyRateShiftLeader: number;
    hourlyRateSiteManager: number;
    nightSurcharge: number;
    saturdaySurcharge: number;
    sundaySurcharge: number;
    holidaySurcharge: number;
    nslCertificateSurcharge: number;
    dogHandlerSurcharge: number;
    weaponLicenseSurcharge: number;
    overheadPercentage: number;
    profitMarginPercentage: number;
  };
};

type SiteSecurityConceptPlan = {
  templateKey?: string;
  templateName?: string;
  shiftModel: string;
  hoursPerWeek: number;
  requiredStaff: number;
  requiredQualifications: string[];
  tasks: string[];
};

type SiteBlueprint = {
  key: string;
  data: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    customerKey?: string;
    buildingType?: BuildingType;
    floorCount?: number;
    squareMeters?: number;
    description?: string;
    notes?: string;
    status?: string;
    emergencyContacts?: Array<Record<string, string>>;
    requiredStaff?: number;
    requiredQualifications?: string[];
    securityConcept?: SiteSecurityConceptPlan;
    wizardCompleted?: boolean;
    wizardStep?: number;
  };
};

type SiteAssignmentBlueprint = {
  siteKey: string;
  userKey: string;
  role: SiteRole;
};

type SiteDocumentFileBlueprint = {
  filename: string;
  content: string;
};

type SiteDocumentBlueprint = {
  siteKey: string;
  title: string;
  description?: string;
  category: SiteDocumentCategory;
  filename: string;
  mimeType: string;
  uploadedBy: string;
};

type SiteCalculationBlueprint = {
  siteKey: string;
  priceModelKey: string;
  calculatedBy: string;
  status: CalculationStatus;
  requiredStaff: number;
  hoursPerWeek: number;
  contractDurationMonths: number;
  hoursDay: number;
  hoursNight: number;
  hoursSaturday: number;
  hoursSunday: number;
  hoursHoliday: number;
  employeeCount: number;
  shiftLeaderCount: number;
  siteManagerCount: number;
  customHourlyRateEmployee?: number;
  customHourlyRateShiftLeader?: number;
  customHourlyRateSiteManager?: number;
  customNightSurcharge?: number;
  customSaturdaySurcharge?: number;
  customSundaySurcharge?: number;
  customHolidaySurcharge?: number;
  riskSurchargePercentage: number;
  distanceSurcharge: number;
  customOverheadPercentage?: number;
  customProfitMarginPercentage?: number;
  totalPersonnelCostMonthly: number;
  totalOverheadMonthly: number;
  totalProfitMonthly: number;
  totalPriceMonthly: number;
  setupCostUniform: number;
  setupCostEquipment: number;
  setupCostOther: number;
  notes?: string;
  sentAtOffsetDays?: number;
  acceptedAtOffsetDays?: number;
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
    profile: {
      employmentType: 'FULL_TIME',
      hourlyRate: '15.50',
      annualLeaveDays: 30,
    },
    preference: {
      prefersDayShifts: true,
      prefersNightShifts: false,
      targetMonthlyHours: 160,
      minMonthlyHours: 120,
      maxMonthlyHours: 200,
      preferredSiteKeys: ['office'],
      avoidedSiteKeys: ['hospital'],
      notes: '50% Auslastung - GRÜN für Zuweisung (Test: Farb-Logik)',
    },
    workload: {
      totalHours: 80, // 50% von 160h = GRÜN
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
    profile: {
      employmentType: 'FULL_TIME',
      hourlyRate: '16.00',
      annualLeaveDays: 30,
    },
    preference: {
      prefersDayShifts: true,
      prefersWeekends: false,
      targetMonthlyHours: 160,
      minMonthlyHours: 120,
      maxMonthlyHours: 200,
      preferredSiteKeys: ['office', 'mall'],
      notes: '95% Auslastung - ROT = fast am Limit (Test: Farb-Logik)',
    },
    workload: {
      totalHours: 152, // 95% von 160h = ROT
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
    profile: {
      employmentType: 'FULL_TIME',
      hourlyRate: '17.00',
      annualLeaveDays: 30,
    },
    preference: {
      prefersNightShifts: true,
      prefersDayShifts: false,
      targetMonthlyHours: 160,
      minMonthlyHours: 120,
      maxMonthlyHours: 200,
      preferredSiteKeys: ['industry'],
      notes: 'TIE-BREAKER Test: 70% Auslastung + 36h Ruhe = Score 85.5 (bevorzugt!)',
    },
    workload: {
      totalHours: 112, // 70% von 160h
      nightShiftCount: 7,
      weekendShiftCount: 3,
      maxWeeklyHours: 44,
      minRestHoursBetweenShifts: 36, // 36h Ruhezeit → Tie-Breaker +0.5
      consecutiveDaysWorked: 3,
      restDaysCount: 5, // Mehr Ruhetage
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
    profile: {
      employmentType: 'FULL_TIME',
      hourlyRate: '16.50',
      annualLeaveDays: 30,
    },
    preference: {
      prefersNightShifts: true,   // NUR Nachtschichten
      prefersDayShifts: false,
      prefersWeekends: false,
      targetMonthlyHours: 160,
      minMonthlyHours: 120,
      maxMonthlyHours: 200,
      preferredSiteKeys: ['office'],
      avoidedSiteKeys: ['industry'],
      notes: 'PRÄFERENZ-Test: Bevorzugt NUR Nachtschichten (Score-Boost)',
    },
    workload: {
      totalHours: 102,
      nightShiftCount: 8, // Viele Nachtschichten
      weekendShiftCount: 1,
      maxWeeklyHours: 36,
      minRestHoursBetweenShifts: 13,
      consecutiveDaysWorked: 4,
      restDaysCount: 4,
      fairnessScore: 88,
    },
  },
  {
    key: 'lisa',
    data: {
      email: 'lisa.meyer@sicherheitsdienst.de',
      firstName: 'Lisa',
      lastName: 'Meyer',
      phone: '+49 123 100005',
      role: 'EMPLOYEE',
      employeeId: 'EMP105',
      hireDate: new Date('2023-05-01'),
      qualifications: ['Erste Hilfe', 'Objektschutz'],
      isActive: true,
    },
    profile: {
      employmentType: 'FULL_TIME',
      hourlyRate: '15.00',
      annualLeaveDays: 30,
    },
    preference: {
      prefersDayShifts: true,
      prefersNightShifts: false,
      targetMonthlyHours: 160,
      minMonthlyHours: 120,
      maxMonthlyHours: 200,
      notes: '5% Auslastung - GRÜN = ideal für Zuweisung (Test: Farb-Logik)',
    },
    workload: {
      totalHours: 8, // 5% von 160h = SEHR GRÜN
      nightShiftCount: 0,
      weekendShiftCount: 0,
      maxWeeklyHours: 8,
      minRestHoursBetweenShifts: 24,
      consecutiveDaysWorked: 1,
      restDaysCount: 6,
      fairnessScore: 95,
    },
  },
  {
    key: 'stefan',
    data: {
      email: 'stefan.fischer@sicherheitsdienst.de',
      firstName: 'Stefan',
      lastName: 'Fischer',
      phone: '+49 123 100006',
      role: 'EMPLOYEE',
      employeeId: 'EMP106',
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
      employeeId: 'EMP107',
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
      employeeId: 'EMP108',
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
      employeeId: 'EMP109',
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
      employeeId: 'EMP110',
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
      employeeId: 'EMP111',
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

const templateBlueprints: TemplateBlueprint[] = [
  {
    key: 'template-247',
    data: {
      name: '24/7 Objektschutz Standard',
      description: 'Rund-um-die-Uhr Bewachung für hochwertige Objekte. 3-Schicht-Betrieb mit qualifiziertem Personal.',
      buildingType: BuildingType.OFFICE,
      hoursPerWeek: 168,
      shiftModel: '3-SHIFT',
      requiredStaff: 6,
      requiredQualifications: ['§34a GewO', 'Erste Hilfe'],
      tasks: ['ACCESS_CONTROL', 'PATROLS', 'ALARM_RESPONSE', 'KEY_MANAGEMENT'],
      basePrice: 4500,
      isActive: true,
    },
  },
  {
    key: 'template-day',
    data: {
      name: 'Tagschicht Bürogebäude',
      description: 'Bewachung während der Geschäftszeiten (Mo-Fr, 7-19 Uhr). Empfang und Zutrittskontrolle.',
      buildingType: BuildingType.OFFICE,
      hoursPerWeek: 60,
      shiftModel: 'SINGLE_SHIFT',
      requiredStaff: 2,
      requiredQualifications: ['§34a GewO'],
      tasks: ['RECEPTION', 'ACCESS_CONTROL', 'VISITOR_MANAGEMENT'],
      basePrice: 1800,
      isActive: true,
    },
  },
  {
    key: 'template-night',
    data: {
      name: 'Nachtschicht Industrie',
      description: 'Nachtwache für Industriegelände (Mo-So, 22-6 Uhr). Rundgänge und Alarmreaktion.',
      buildingType: BuildingType.INDUSTRIAL,
      hoursPerWeek: 56,
      shiftModel: 'NIGHT_SHIFT',
      requiredStaff: 3,
      requiredQualifications: ['§34a GewO', 'Erste Hilfe'],
      tasks: ['PATROLS', 'ALARM_RESPONSE', 'INCIDENT_REPORTING'],
      basePrice: 2400,
      isActive: true,
    },
  },
  {
    key: 'template-event',
    data: {
      name: 'Event-Sicherheit Standard',
      description: 'Flexibler Bewachungsdienst für Veranstaltungen. Personal nach Bedarf, Eventschutz-erfahren.',
      buildingType: BuildingType.EVENT,
      hoursPerWeek: 40,
      shiftModel: 'FLEXIBLE',
      requiredStaff: 4,
      requiredQualifications: ['§34a GewO', 'Eventschutz'],
      tasks: ['CROWD_CONTROL', 'ACCESS_CONTROL', 'CONFLICT_RESOLUTION'],
      basePrice: 2800,
      isActive: true,
    },
  },
  {
    key: 'template-retail',
    data: {
      name: 'Einzelhandel Ladendetektiv',
      description: 'Diebstahlprävention im Einzelhandel. Unauffällige Überwachung während der Öffnungszeiten.',
      buildingType: BuildingType.RETAIL,
      hoursPerWeek: 48,
      shiftModel: 'RETAIL_HOURS',
      requiredStaff: 3,
      requiredQualifications: ['§34a GewO', 'Ladendetektiv'],
      tasks: ['SURVEILLANCE', 'THEFT_PREVENTION', 'INCIDENT_REPORTING'],
      basePrice: 2200,
      isActive: true,
    },
  },
  {
    key: 'template-construction',
    data: {
      name: 'Baustellen-Bewachung',
      description: 'Überwachung von Baustellen gegen Diebstahl und Vandalismus. Nachtschicht + Wochenende.',
      buildingType: BuildingType.CONSTRUCTION,
      hoursPerWeek: 84,
      shiftModel: 'CONSTRUCTION_WATCH',
      requiredStaff: 2,
      requiredQualifications: ['§34a GewO'],
      tasks: ['PATROLS', 'ALARM_RESPONSE', 'ASSET_PROTECTION'],
      basePrice: 2800,
      isActive: true,
    },
  },
];

const priceModelBlueprints: PriceModelBlueprint[] = [
  {
    key: 'standard',
    data: {
      name: 'Standard Objektschutz 2025',
      description: 'Basismodell für stationäre Bewachung inkl. Zuschläge.',
      hourlyRateEmployee: 16.5,
      hourlyRateShiftLeader: 19.5,
      hourlyRateSiteManager: 22.5,
      nightSurcharge: 25,
      saturdaySurcharge: 25,
      sundaySurcharge: 50,
      holidaySurcharge: 100,
      nslCertificateSurcharge: 1.5,
      dogHandlerSurcharge: 2.5,
      weaponLicenseSurcharge: 2,
      overheadPercentage: 12,
      profitMarginPercentage: 15,
    },
  },
  {
    key: 'event',
    data: {
      name: 'Event-Sicherheit 2025',
      description: 'Preisstruktur für mobile Eventteams mit erhöhter Flexibilität.',
      hourlyRateEmployee: 18.5,
      hourlyRateShiftLeader: 22,
      hourlyRateSiteManager: 25,
      nightSurcharge: 35,
      saturdaySurcharge: 35,
      sundaySurcharge: 60,
      holidaySurcharge: 110,
      nslCertificateSurcharge: 1.5,
      dogHandlerSurcharge: 3,
      weaponLicenseSurcharge: 2.5,
      overheadPercentage: 14,
      profitMarginPercentage: 18,
    },
  },
];

const customerBlueprints: CustomerBlueprint[] = [
  {
    key: 'globex',
    data: {
      companyName: 'Globex Property Management GmbH',
      industry: 'Immobilienverwaltung',
      taxId: 'DE123456789',
      primaryContact: {
        name: 'Sabine Kraus',
        email: 'sabine.kraus@globex.de',
        phone: '+49 30 1000-100',
        position: 'Facility Managerin',
      },
      contacts: [
        {
          name: 'Martin Vogt',
          email: 'martin.vogt@globex.de',
          phone: '+49 30 1000-200',
          position: 'Objektleiter',
        },
      ],
      address: 'Friedrichstraße 75',
      city: 'Berlin',
      postalCode: '10117',
      billingAddress: {
        address: 'Friedrichstraße 75',
        city: 'Berlin',
        postalCode: '10117',
        country: 'Deutschland',
      },
      paymentTerms: '30 Tage netto',
      discount: '5.00',
      notes: 'Betreut HQ und zwei Nebenobjekte in Berlin.',
    },
  },
  {
    key: 'nordmall',
    data: {
      companyName: 'Nordlicht Einkaufszentrum KG',
      industry: 'Einzelhandel',
      taxId: 'DE987654321',
      primaryContact: {
        name: 'Petra Jansen',
        email: 'petra.jansen@nordlicht.de',
        phone: '+49 40 4500-110',
        position: 'Center Managerin',
      },
      contacts: [
        {
          name: 'Stefan Holt',
          email: 'stefan.holt@nordlicht.de',
          phone: '+49 40 4500-115',
          position: 'Technischer Leiter',
        },
      ],
      address: 'Nordallee 50',
      city: 'Hamburg',
      postalCode: '20095',
      billingAddress: {
        address: 'Nordallee 50',
        city: 'Hamburg',
        postalCode: '20095',
        country: 'Deutschland',
      },
      paymentTerms: '21 Tage netto',
      discount: '3.50',
      notes: 'Benötigt verstärkte Wochenendpräsenz während Sales-Events.',
    },
  },
  {
    key: 'industria',
    data: {
      companyName: 'Industria Werke AG',
      industry: 'Industrie & Fertigung',
      taxId: 'DE112233445',
      primaryContact: {
        name: 'Ralf Mertens',
        email: 'ralf.mertens@industria.de',
        phone: '+49 201 6000-10',
        position: 'Werkschutzleiter',
      },
      contacts: [
        {
          name: 'Claudia Reimann',
          email: 'claudia.reimann@industria.de',
          phone: '+49 201 6000-25',
          position: 'Sicherheitsbeauftragte',
        },
      ],
      address: 'Industriestraße 25',
      city: 'Essen',
      postalCode: '45127',
      billingAddress: {
        address: 'Industriestraße 25',
        city: 'Essen',
        postalCode: '45127',
        country: 'Deutschland',
      },
      paymentTerms: '30 Tage netto',
      discount: null,
      notes: 'Vorgaben zu erweiterten Brandschutz-Patrouillen.',
    },
  },
  {
    key: 'medicore',
    data: {
      companyName: 'Medicore Kliniken GmbH',
      industry: 'Gesundheitswesen',
      taxId: 'DE556677889',
      primaryContact: {
        name: 'Dr. Anne Walter',
        email: 'anne.walter@medicore.de',
        phone: '+49 89 8800-300',
        position: 'Geschäftsführung',
      },
      contacts: [
        {
          name: 'Tobias Engel',
          email: 'tobias.engel@medicore.de',
          phone: '+49 89 8800-330',
          position: 'Sicherheitsbeauftragter',
        },
      ],
      address: 'Münchner Straße 10',
      city: 'München',
      postalCode: '80331',
      billingAddress: {
        address: 'Finanzbuchhaltung Medicore, Postfach 1234',
        city: 'München',
        postalCode: '80001',
        country: 'Deutschland',
      },
      paymentTerms: '14 Tage netto',
      discount: '2.00',
      notes: 'Schwerpunkt auf Patientenschutz und sensible Bereiche.',
    },
  },
  {
    key: 'stadtmitte',
    data: {
      companyName: 'Stadt Mitte Verwaltung',
      industry: 'Öffentliche Verwaltung',
      primaryContact: {
        name: 'Michael Berger',
        email: 'michael.berger@stadtmitte.de',
        phone: '+49 30 2000-10',
        position: 'Leiter Ordnungsamt',
      },
      contacts: [
        {
          name: 'Laura König',
          email: 'laura.koenig@stadtmitte.de',
          phone: '+49 30 2000-12',
          position: 'Veranstaltungskoordination',
        },
      ],
      address: 'Rathausplatz 1',
      city: 'Berlin',
      postalCode: '10178',
      paymentTerms: '30 Tage netto (öffentliche Hand)',
      discount: null,
      notes: 'Regelmäßige Sonderveranstaltungen mit kurzfristigen Anforderungen.',
    },
  },
];

const siteBlueprintDefinitions: SiteBlueprint[] = [
  {
    key: 'office',
    data: {
      name: 'Bürogebäude Zentrum',
      address: 'Hauptstraße 1',
      city: 'Berlin',
      postalCode: '10115',
      customerKey: 'globex',
      buildingType: BuildingType.OFFICE,
      floorCount: 12,
      squareMeters: 18000,
      description: 'Hauptverwaltung Globex - 24/7 Empfang, Tiefgarage, Rechenzentrum im 3. UG.',
      notes: 'VIP-Etagen 10-12 mit gesondertem Zutritt, nächtliche Aufzüge gesperrt.',
      status: 'ACTIVE',
      emergencyContacts: [
        { name: 'Sabine Kraus', phone: '+49 30 1000-100', role: 'Facility Managerin' },
        { name: 'Security Leitstelle', phone: '+49 30 1000-222', role: '24/7 Leitstelle' },
      ],
      requiredStaff: 6,
      requiredQualifications: ['§34a GewO', 'Erste Hilfe'],
      securityConcept: {
        templateKey: 'template-247',
        shiftModel: '3-Schicht (24/7)',
        hoursPerWeek: 168,
        requiredStaff: 6,
        requiredQualifications: ['§34a GewO', 'Erste Hilfe'],
        tasks: ['ACCESS_CONTROL', 'PATROLS', 'ALARM_RESPONSE', 'KEY_MANAGEMENT'],
      },
      wizardCompleted: true,
      wizardStep: 8,
    },
  },
  {
    key: 'mall',
    data: {
      name: 'Einkaufszentrum Nord',
      address: 'Nordstraße 50',
      city: 'Berlin',
      postalCode: '10115',
      customerKey: 'nordmall',
      buildingType: BuildingType.RETAIL,
      floorCount: 6,
      squareMeters: 32000,
      description: 'Regional bedeutendes Einkaufszentrum mit Nachtlogistik und Eventfläche.',
      notes: 'Erhöhtes Besucheraufkommen an Wochenenden. Lieferzone rückseitig.',
      status: 'ACTIVE',
      emergencyContacts: [
        { name: 'Petra Jansen', phone: '+49 40 4500-110', role: 'Center Managerin' },
        { name: 'Technische Leitstelle', phone: '+49 40 4500-999', role: 'Technikdienst' },
      ],
      requiredStaff: 5,
      requiredQualifications: ['§34a GewO', 'Ladendetektiv'],
      securityConcept: {
        templateKey: 'template-retail',
        shiftModel: 'Tags / Spät (6-23 Uhr)',
        hoursPerWeek: 84,
        requiredStaff: 5,
        requiredQualifications: ['§34a GewO', 'Ladendetektiv'],
        tasks: ['SURVEILLANCE', 'THEFT_PREVENTION', 'INCIDENT_REPORTING', 'ACCESS_CONTROL'],
      },
      wizardCompleted: true,
      wizardStep: 8,
    },
  },
  {
    key: 'industry',
    data: {
      name: 'Industriepark Süd',
      address: 'Industrieweg 25',
      city: 'Berlin',
      postalCode: '10119',
      customerKey: 'industria',
      buildingType: BuildingType.INDUSTRIAL,
      floorCount: 4,
      squareMeters: 54000,
      description: 'Produktionsstandort mit Gefahrstofflager, Werkszufahrten und Bahnanschluss.',
      notes: 'Nachtstreifen alle 30 Minuten, Brandschutzbeauftragter onsite.',
      status: 'ACTIVE',
      emergencyContacts: [
        { name: 'Ralf Mertens', phone: '+49 201 6000-10', role: 'Werkschutzleiter' },
        { name: 'Leitwarte Produktion', phone: '+49 201 6000-55', role: '24/7 Leitwarte' },
      ],
      requiredStaff: 7,
      requiredQualifications: ['§34a GewO', 'Erste Hilfe', 'Brandschutz'],
      securityConcept: {
        templateKey: 'template-night',
        shiftModel: '2-Schicht (Abend/Nacht)',
        hoursPerWeek: 112,
        requiredStaff: 7,
        requiredQualifications: ['§34a GewO', 'Erste Hilfe', 'Brandschutz'],
        tasks: ['PATROLS', 'ALARM_RESPONSE', 'INCIDENT_REPORTING', 'ACCESS_CONTROL'],
      },
      wizardCompleted: true,
      wizardStep: 8,
    },
  },
  {
    key: 'hospital',
    data: {
      name: 'Krankenhaus Mitte',
      address: 'Krankenhausstraße 10',
      city: 'Berlin',
      postalCode: '10178',
      customerKey: 'medicore',
      buildingType: BuildingType.OTHER,
      floorCount: 9,
      squareMeters: 27000,
      description: 'Akutklinik mit Notaufnahme, Intensivstation, Psychiatrie und Helipad.',
      notes: 'Besondere Schutzbereiche: Intensivstationen, Kinderstation, Psychiatrie.',
      status: 'IN_REVIEW',
      emergencyContacts: [
        { name: 'Dr. Anne Walter', phone: '+49 89 8800-300', role: 'Geschäftsführung' },
        { name: 'Leitstelle Klinik', phone: '+49 89 8800-112', role: '24/7 Einsatzleitung' },
      ],
      requiredStaff: 8,
      requiredQualifications: ['§34a GewO', 'Erste Hilfe', 'Deeskalation'],
      securityConcept: {
        templateKey: 'template-day',
        shiftModel: 'Tag/Spät/Nacht (medizinischer Schwerpunkt)',
        hoursPerWeek: 140,
        requiredStaff: 8,
        requiredQualifications: ['§34a GewO', 'Erste Hilfe', 'Deeskalation'],
        tasks: ['ACCESS_CONTROL', 'PATROLS', 'INCIDENT_REPORTING', 'PATIENT_SUPPORT'],
      },
      wizardCompleted: true,
      wizardStep: 7,
    },
  },
  {
    key: 'townhall',
    data: {
      name: 'Rathaus Stadtmitte',
      address: 'Rathausplatz 1',
      city: 'Berlin',
      postalCode: '10115',
      customerKey: 'stadtmitte',
      buildingType: BuildingType.EVENT,
      floorCount: 5,
      squareMeters: 11000,
      description: 'Historisches Rathaus mit Bürgerservice, Trausaal und Veranstaltungssaal.',
      notes: 'Regelmäßige Veranstaltungen, Besucherandrang werktags 8-16 Uhr.',
      status: 'CALCULATING',
      emergencyContacts: [
        { name: 'Michael Berger', phone: '+49 30 2000-10', role: 'Leiter Ordnungsamt' },
        { name: 'Hausmeisterdienst', phone: '+49 30 2000-50', role: 'Facility Support' },
      ],
      requiredStaff: 4,
      requiredQualifications: ['§34a GewO', 'Eventschutz'],
      securityConcept: {
        templateKey: 'template-event',
        shiftModel: 'Flex-Schicht (Eventabhängig)',
        hoursPerWeek: 50,
        requiredStaff: 4,
        requiredQualifications: ['§34a GewO', 'Eventschutz'],
        tasks: ['CROWD_CONTROL', 'ACCESS_CONTROL', 'CONFLICT_RESOLUTION', 'VIP_SUPPORT'],
      },
      wizardCompleted: true,
      wizardStep: 6,
    },
  },
  {
    key: 'replacement',
    data: {
      name: 'Test-Objekt Replacement',
      address: 'Teststraße 1',
      city: 'Berlin',
      postalCode: '12345',
      buildingType: BuildingType.OFFICE,
      requiredStaff: 3,
      requiredQualifications: ['§34a GewO'],
      description: 'Referenzobjekt für Intelligent Replacement Testszenarien.',
      notes: 'Nutzen wir für Score-Demonstrationen und Lasttests.',
      status: 'ACTIVE',
      emergencyContacts: [
        { name: 'Lisa Manager', phone: '+49 123 000002', role: 'Objektleiterin' },
      ],
      securityConcept: {
        templateKey: 'template-day',
        shiftModel: 'Tagschicht (9-18 Uhr)',
        hoursPerWeek: 45,
        requiredStaff: 3,
        requiredQualifications: ['§34a GewO'],
        tasks: ['ACCESS_CONTROL', 'PATROLS', 'INCIDENT_REPORTING'],
      },
      wizardCompleted: true,
      wizardStep: 8,
    },
  },
];

const siteAssignmentBlueprints: SiteAssignmentBlueprint[] = [
  { siteKey: 'office', userKey: 'manager', role: SiteRole.OBJEKTLEITER },
  { siteKey: 'office', userKey: 'julia', role: SiteRole.SCHICHTLEITER },
  { siteKey: 'office', userKey: 'thomas', role: SiteRole.MITARBEITER },
  { siteKey: 'mall', userKey: 'manager', role: SiteRole.OBJEKTLEITER },
  { siteKey: 'mall', userKey: 'petra', role: SiteRole.SCHICHTLEITER },
  { siteKey: 'mall', userKey: 'markus', role: SiteRole.MITARBEITER },
  { siteKey: 'industry', userKey: 'manager', role: SiteRole.OBJEKTLEITER },
  { siteKey: 'industry', userKey: 'stefan', role: SiteRole.SCHICHTLEITER },
  { siteKey: 'industry', userKey: 'michael', role: SiteRole.MITARBEITER },
  { siteKey: 'hospital', userKey: 'manager', role: SiteRole.OBJEKTLEITER },
  { siteKey: 'hospital', userKey: 'sabine', role: SiteRole.SCHICHTLEITER },
  { siteKey: 'hospital', userKey: 'anna', role: SiteRole.MITARBEITER },
  { siteKey: 'townhall', userKey: 'dispatcher', role: SiteRole.OBJEKTLEITER },
  { siteKey: 'townhall', userKey: 'daniel', role: SiteRole.SCHICHTLEITER },
  { siteKey: 'townhall', userKey: 'claudia', role: SiteRole.MITARBEITER },
  { siteKey: 'replacement', userKey: 'manager', role: SiteRole.OBJEKTLEITER },
  { siteKey: 'replacement', userKey: 'optimal', role: SiteRole.MITARBEITER },
  { siteKey: 'replacement', userKey: 'good', role: SiteRole.MITARBEITER },
];

const siteDocumentFiles: SiteDocumentFileBlueprint[] = [
  {
    filename: 'dienstanweisung-buero.txt',
    content: `Dienstanweisung - Empfang & Lobby
================================================

1. Zutrittskontrolle für Besuchende ab 07:00 Uhr
2. Schlüssel- und Ausweisschrank prüfen (Sollbestand)
3. Lieferanten im Logbuch erfassen, Ausweise aushändigen und zurücknehmen
4. Alle 60 Minuten Rundgang Lobby/Tiefgarage, Kamera-Monitoring dokumentieren
5. Nachtschicht: Türen ab 22:00 Uhr schließen, Alarmanlage aktivieren`,
  },
  {
    filename: 'notfallplan-buero.txt',
    content: `Notfallplan - Evakuierung Bürogebäude Zentrum
=====================================================

1. Alarmierung über Brandmeldeanlage, Empfang informiert Leitstelle
2. Evakuierungshelfer informieren Etagen, Sammelplätze A-C ansteuern
3. Dokumentation: Anzahl Personen pro Sammelplatz, Sondermeldungen an Feuerwehr
4. Zutritt für Rettungskräfte freihalten, Aufzüge gesperrt lassen
5. Nach dem Einsatz: Bericht im Wachbuch dokumentieren`,
  },
  {
    filename: 'brandschutzordnung-industrie.txt',
    content: `Brandschutzordnung - Industriepark Süd
===========================================

1. Patrouillen alle 30 Minuten entlang Produktionshallen 1-6
2. Gefahrstofflager: Temperaturkontrolle und Lüftung überwachen
3. Löschmittel prüfen (Plomben, Druckanzeigen)
4. Meldepflicht bei Unregelmäßigkeiten direkt an Werkschutzleiter
5. Wöchentliche Übung: Shutdown-Prozedur überprüfen`,
  },
];

const siteDocumentBlueprints: SiteDocumentBlueprint[] = [
  {
    siteKey: 'office',
    title: 'Dienstanweisung Empfang & Lobby',
    description: 'Tages- und Nachtabläufe inkl. Schlüsselmanagement.',
    category: SiteDocumentCategory.DIENSTANWEISUNG,
    filename: 'dienstanweisung-buero.txt',
    mimeType: 'text/plain',
    uploadedBy: 'manager',
  },
  {
    siteKey: 'office',
    title: 'Notfallplan Evakuierung',
    description: 'Aktualisiert 2025 - Sammelplätze und Verantwortliche.',
    category: SiteDocumentCategory.NOTFALLPLAN,
    filename: 'notfallplan-buero.txt',
    mimeType: 'text/plain',
    uploadedBy: 'admin',
  },
  {
    siteKey: 'industry',
    title: 'Brandschutzordnung Industriepark Süd',
    description: 'Patrouillen, Löschmittel-Checks und Alarmierungskette.',
    category: SiteDocumentCategory.BRANDSCHUTZORDNUNG,
    filename: 'brandschutzordnung-industrie.txt',
    mimeType: 'text/plain',
    uploadedBy: 'manager',
  },
];

const siteCalculationBlueprints: SiteCalculationBlueprint[] = [
  {
    siteKey: 'office',
    priceModelKey: 'standard',
    calculatedBy: 'manager',
    status: CalculationStatus.ACCEPTED,
    requiredStaff: 6,
    hoursPerWeek: 168,
    contractDurationMonths: 24,
    hoursDay: 84,
    hoursNight: 84,
    hoursSaturday: 12,
    hoursSunday: 12,
    hoursHoliday: 4,
    employeeCount: 12,
    shiftLeaderCount: 2,
    siteManagerCount: 1,
    customHourlyRateEmployee: 17.5,
    customHourlyRateShiftLeader: 21,
    customHourlyRateSiteManager: 24.5,
    customNightSurcharge: 30,
    customSundaySurcharge: 60,
    riskSurchargePercentage: 5,
    distanceSurcharge: 1.5,
    customOverheadPercentage: 13,
    customProfitMarginPercentage: 17,
    totalPersonnelCostMonthly: 48500,
    totalOverheadMonthly: 6300,
    totalProfitMonthly: 9800,
    totalPriceMonthly: 64600,
    setupCostUniform: 1800,
    setupCostEquipment: 2400,
    setupCostOther: 750,
    notes: 'Basierend auf Template "24/7 Objektschutz Standard". Angebot versendet.',
    sentAtOffsetDays: 4,
    acceptedAtOffsetDays: 1,
  },
  {
    siteKey: 'mall',
    priceModelKey: 'standard',
    calculatedBy: 'manager',
    status: CalculationStatus.DRAFT,
    requiredStaff: 5,
    hoursPerWeek: 84,
    contractDurationMonths: 12,
    hoursDay: 60,
    hoursNight: 12,
    hoursSaturday: 6,
    hoursSunday: 6,
    hoursHoliday: 0,
    employeeCount: 8,
    shiftLeaderCount: 1,
    siteManagerCount: 1,
    riskSurchargePercentage: 3,
    distanceSurcharge: 0,
    totalPersonnelCostMonthly: 26800,
    totalOverheadMonthly: 3200,
    totalProfitMonthly: 5200,
    totalPriceMonthly: 35200,
    setupCostUniform: 900,
    setupCostEquipment: 1200,
    setupCostOther: 300,
    notes: 'Noch im Entwurf - Fokus auf Verstärkung an Wochenenden.',
  },
  {
    siteKey: 'industry',
    priceModelKey: 'standard',
    calculatedBy: 'manager',
    status: CalculationStatus.ACCEPTED,
    requiredStaff: 7,
    hoursPerWeek: 112,
    contractDurationMonths: 36,
    hoursDay: 32,
    hoursNight: 80,
    hoursSaturday: 10,
    hoursSunday: 10,
    hoursHoliday: 6,
    employeeCount: 14,
    shiftLeaderCount: 2,
    siteManagerCount: 1,
    customHourlyRateEmployee: 18,
    customHourlyRateShiftLeader: 21.5,
    customNightSurcharge: 35,
    customSaturdaySurcharge: 30,
    customSundaySurcharge: 60,
    customHolidaySurcharge: 110,
    riskSurchargePercentage: 8,
    distanceSurcharge: 2,
    totalPersonnelCostMonthly: 51200,
    totalOverheadMonthly: 6400,
    totalProfitMonthly: 10800,
    totalPriceMonthly: 68400,
    setupCostUniform: 2100,
    setupCostEquipment: 2800,
    setupCostOther: 900,
    notes: 'Langfristiger Vertrag, bereits angenommen durch den Kunden.',
    sentAtOffsetDays: 10,
    acceptedAtOffsetDays: 7,
  },
  {
    siteKey: 'hospital',
    priceModelKey: 'standard',
    calculatedBy: 'manager',
    status: CalculationStatus.SENT,
    requiredStaff: 8,
    hoursPerWeek: 140,
    contractDurationMonths: 18,
    hoursDay: 80,
    hoursNight: 60,
    hoursSaturday: 12,
    hoursSunday: 12,
    hoursHoliday: 4,
    employeeCount: 16,
    shiftLeaderCount: 2,
    siteManagerCount: 1,
    customHourlyRateEmployee: 19,
    customHourlyRateShiftLeader: 23,
    customHourlyRateSiteManager: 26,
    customNightSurcharge: 32,
    customSundaySurcharge: 55,
    riskSurchargePercentage: 6,
    distanceSurcharge: 1,
    totalPersonnelCostMonthly: 55800,
    totalOverheadMonthly: 6700,
    totalProfitMonthly: 11500,
    totalPriceMonthly: 74000,
    setupCostUniform: 1500,
    setupCostEquipment: 2600,
    setupCostOther: 600,
    notes: 'Kalkulation wird mit medizinischem Krisenteam verprobt.',
    sentAtOffsetDays: 2,
  },
];

const DOCUMENTS_DIR = path.resolve(__dirname, '../../uploads/documents');

async function main() {
  console.log('🌱 Erstelle umfassende Test-Daten für das Sicherheitsdienst-Tool...');

  try {
    await resetSeedData(prisma);
    console.log('🗑️  Datenbank geleert');

    await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
    for (const file of siteDocumentFiles) {
      const filePath = path.join(DOCUMENTS_DIR, file.filename);
      await fs.writeFile(filePath, file.content, 'utf8');
    }
    console.log('📁 Beispiel-Dokumente aktualisiert');

    // 🔐 MULTI-TENANCY: Customers ZUERST erstellen (User brauchen customerId!)
    const customers = new Map<string, Awaited<ReturnType<typeof prisma.customer.create>>>();
    for (const blueprint of customerBlueprints) {
      const { discount, ...customerData } = blueprint.data;
      const created = await prisma.customer.create({
        data: {
          ...customerData,
          discount:
            discount === null
              ? null
              : discount !== undefined
                ? new Prisma.Decimal(discount)
                : undefined,
        },
      });
      customers.set(blueprint.key, created);
    }
    console.log('👔 Kunden angelegt (ZUERST für Multi-Tenancy)');

    // Default-Customer für alle User (erster Customer in Map)
    const defaultCustomer = customers.values().next().value;
    if (!defaultCustomer) {
      throw new Error('❌ Kein Customer vorhanden! Customers müssen vor Users erstellt werden.');
    }
    const defaultCustomerId = defaultCustomer.id;
    console.log(`🔐 Default-Customer für Seed-User: ${defaultCustomer.companyName} (${defaultCustomerId})`);

    // Kernrollen (🔐 customerId hinzugefügt)
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
      customerId: defaultCustomerId, // 🔐 Multi-Tenancy
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
      customerId: defaultCustomerId, // 🔐 Multi-Tenancy
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
      customerId: defaultCustomerId, // 🔐 Multi-Tenancy
    });

    // Mitarbeiter*innen erstellen (🔐 customerId hinzugefügt)
    const employeeSeeds: CreatedUser[] = [];
    for (const blueprint of employeeBlueprints) {
      const user = await createUserWithPassword(prisma, {
        ...blueprint.data,
        customerId: defaultCustomerId, // 🔐 Multi-Tenancy
      });
      employeeSeeds.push({ user, blueprint });
    }
    const employees = employeeSeeds.map((entry) => entry.user);
    const [thomas, anna, michael, julia, stefan, petra, markus, sabine, daniel, claudia] = employees;

    // Replacement-Kandidaten (🔐 customerId hinzugefügt)
    const replacementSeeds: CreatedUser[] = [];
    for (const blueprint of replacementBlueprints) {
      const user = await createUserWithPassword(prisma, {
        ...blueprint.data,
        password: 'password123',
        customerId: defaultCustomerId, // 🔐 Multi-Tenancy
      });
      replacementSeeds.push({ user, blueprint });
    }
    const replacementMap = Object.fromEntries(replacementSeeds.map((entry) => [entry.blueprint.key, entry.user]));
    const optimal = replacementMap.optimal;
    const good = replacementMap.good;
    const acceptable = replacementMap.acceptable;
    const overworked = replacementMap.overworked;
    const absent = replacementMap.absent;

    const userByKey = new Map<string, { id: string }>();
    userByKey.set('admin', admin);
    userByKey.set('manager', manager);
    userByKey.set('dispatcher', dispatcher);
    for (const { user, blueprint } of employeeSeeds) {
      userByKey.set(blueprint.key, user);
    }
    for (const { user, blueprint } of replacementSeeds) {
      userByKey.set(blueprint.key, user);
    }

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

    const priceModels = new Map<string, Awaited<ReturnType<typeof prisma.priceModel.create>>>();
    for (const blueprint of priceModelBlueprints) {
      const created = await prisma.priceModel.create({
        data: blueprint.data,
      });
      priceModels.set(blueprint.key, created);
    }
    console.log('💰 Preis-Modelle erstellt');

    const siteTemplates = new Map<string, Awaited<ReturnType<typeof prisma.siteTemplate.create>>>();
    for (const blueprint of templateBlueprints) {
      const created = await prisma.siteTemplate.create({
        data: blueprint.data,
      });
      siteTemplates.set(blueprint.key, created);
    }
    console.log('🧩 Sicherheitskonzept-Templates erstellt');

    // 🔐 MULTI-TENANCY: Customers wurden bereits weiter oben erstellt (Zeile 1512)
    // (nichts zu tun hier, customers-Map ist bereits gefüllt)

    // Sites
    const sites = new Map<string, Awaited<ReturnType<typeof prisma.site.create>>>();
    for (const siteBlueprint of siteBlueprintDefinitions) {
      const { key, data } = siteBlueprint;
      const customer = data.customerKey ? customers.get(data.customerKey) : undefined;
      const template =
        data.securityConcept?.templateKey ? siteTemplates.get(data.securityConcept.templateKey) : undefined;
      const securityConcept = data.securityConcept
        ? {
            templateId: template?.id ?? null,
            templateName: template?.name ?? data.securityConcept.templateName ?? null,
            shiftModel: data.securityConcept.shiftModel,
            hoursPerWeek: data.securityConcept.hoursPerWeek,
            requiredStaff: data.securityConcept.requiredStaff,
            requiredQualifications: data.securityConcept.requiredQualifications,
            tasks: data.securityConcept.tasks,
          }
        : undefined;
      const primaryContact = customer?.primaryContact as Record<string, string> | undefined;
      const created = await prisma.site.create({
        data: {
          name: data.name,
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
          customerId: customer?.id ?? null,
          customerName: customer?.companyName ?? null,
          customerCompany: customer?.companyName ?? null,
          customerEmail: primaryContact?.email ?? null,
          customerPhone: primaryContact?.phone ?? null,
          buildingType: data.buildingType,
          floorCount: data.floorCount,
          squareMeters: data.squareMeters,
          description: data.description,
          notes: data.notes,
          status: (data.status as SiteStatus) ?? SiteStatus.ACTIVE,
          emergencyContacts: data.emergencyContacts ?? [],
          requiredStaff: data.requiredStaff ?? data.securityConcept?.requiredStaff ?? 1,
          requiredQualifications: data.requiredQualifications ?? data.securityConcept?.requiredQualifications ?? [],
          securityConcept,
          wizardCompleted: data.wizardCompleted ?? false,
          wizardStep: data.wizardStep ?? 0,
        },
      });
      sites.set(key, created);
    }
    console.log('🏢 Einsatzorte erstellt');

    for (const assignment of siteAssignmentBlueprints) {
      const site = sites.get(assignment.siteKey);
      const user = userByKey.get(assignment.userKey);
      if (!site || !user) {
        continue;
      }
      await prisma.siteAssignment.create({
        data: {
          siteId: site.id,
          userId: user.id,
          role: assignment.role,
          assignedBy: admin.id,
        },
      });
    }
    console.log('👤 Site-Zuweisungen erstellt');

    for (const docBlueprint of siteDocumentBlueprints) {
      const site = sites.get(docBlueprint.siteKey);
      const uploader = userByKey.get(docBlueprint.uploadedBy);
      if (!site || !uploader) {
        continue;
      }
      const absolutePath = path.join(DOCUMENTS_DIR, docBlueprint.filename);
      const stats = await fs.stat(absolutePath);
      await prisma.siteDocument.create({
        data: {
          siteId: site.id,
          title: docBlueprint.title,
          description: docBlueprint.description,
          category: docBlueprint.category,
          filename: docBlueprint.filename,
          filePath: path.posix.join('uploads', 'documents', docBlueprint.filename),
          fileSize: stats.size,
          mimeType: docBlueprint.mimeType,
          uploadedBy: uploader.id,
        },
      });
    }
    console.log('📄 Objekt-Dokumente hinterlegt');

    for (const calcBlueprint of siteCalculationBlueprints) {
      const site = sites.get(calcBlueprint.siteKey);
      const priceModel = priceModels.get(calcBlueprint.priceModelKey);
      const calculator = userByKey.get(calcBlueprint.calculatedBy);
      if (!site || !priceModel || !calculator) {
        continue;
      }
      const baseDate = new Date();
      const sentAt =
        calcBlueprint.sentAtOffsetDays !== undefined
          ? new Date(baseDate.getTime() - calcBlueprint.sentAtOffsetDays * 24 * 60 * 60 * 1000)
          : undefined;
      const acceptedAt =
        calcBlueprint.acceptedAtOffsetDays !== undefined
          ? new Date(baseDate.getTime() - calcBlueprint.acceptedAtOffsetDays * 24 * 60 * 60 * 1000)
          : undefined;
      await prisma.siteCalculation.create({
        data: {
          siteId: site.id,
          priceModelId: priceModel.id,
          status: calcBlueprint.status,
          requiredStaff: calcBlueprint.requiredStaff,
          hoursPerWeek: calcBlueprint.hoursPerWeek,
          contractDurationMonths: calcBlueprint.contractDurationMonths,
          hoursDay: calcBlueprint.hoursDay,
          hoursNight: calcBlueprint.hoursNight,
          hoursSaturday: calcBlueprint.hoursSaturday,
          hoursSunday: calcBlueprint.hoursSunday,
          hoursHoliday: calcBlueprint.hoursHoliday,
          employeeCount: calcBlueprint.employeeCount,
          shiftLeaderCount: calcBlueprint.shiftLeaderCount,
          siteManagerCount: calcBlueprint.siteManagerCount,
          customHourlyRateEmployee: calcBlueprint.customHourlyRateEmployee,
          customHourlyRateShiftLeader: calcBlueprint.customHourlyRateShiftLeader,
          customHourlyRateSiteManager: calcBlueprint.customHourlyRateSiteManager,
          customNightSurcharge: calcBlueprint.customNightSurcharge,
          customSaturdaySurcharge: calcBlueprint.customSaturdaySurcharge,
          customSundaySurcharge: calcBlueprint.customSundaySurcharge,
          customHolidaySurcharge: calcBlueprint.customHolidaySurcharge,
          riskSurchargePercentage: calcBlueprint.riskSurchargePercentage,
          distanceSurcharge: calcBlueprint.distanceSurcharge,
          customOverheadPercentage: calcBlueprint.customOverheadPercentage,
          customProfitMarginPercentage: calcBlueprint.customProfitMarginPercentage,
          totalPersonnelCostMonthly: calcBlueprint.totalPersonnelCostMonthly,
          totalOverheadMonthly: calcBlueprint.totalOverheadMonthly,
          totalProfitMonthly: calcBlueprint.totalProfitMonthly,
          totalPriceMonthly: calcBlueprint.totalPriceMonthly,
          setupCostUniform: calcBlueprint.setupCostUniform,
          setupCostEquipment: calcBlueprint.setupCostEquipment,
          setupCostOther: calcBlueprint.setupCostOther,
          notes: calcBlueprint.notes,
          calculatedBy: calculator.id,
          sentAt,
          acceptedAt,
        },
      });
    }
    console.log('📈 Objekt-Kalkulationen erstellt');

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

    // Zusätzliche Test-Abwesenheiten für ICS-Export (v1.10.0)
    // Sonderurlaub (SPECIAL_LEAVE)
    const specialLeaveStart = new Date(today);
    specialLeaveStart.setDate(specialLeaveStart.getDate() + 14);
    const specialLeaveEnd = new Date(specialLeaveStart);
    specialLeaveEnd.setDate(specialLeaveEnd.getDate() + 1);
    await prisma.absence.create({
      data: {
        userId: markus.id,
        type: AbsenceType.SPECIAL_LEAVE,
        status: AbsenceStatus.APPROVED,
        startsAt: specialLeaveStart,
        endsAt: specialLeaveEnd,
        reason: 'Hochzeit',
        createdById: markus.id,
        decidedById: manager.id,
        decisionNote: 'Herzlichen Glückwunsch!',
      },
    });

    // Unbezahlter Urlaub (UNPAID)
    const unpaidStart = new Date(today);
    unpaidStart.setDate(unpaidStart.getDate() + 21);
    const unpaidEnd = new Date(unpaidStart);
    unpaidEnd.setDate(unpaidEnd.getDate() + 6);
    await prisma.absence.create({
      data: {
        userId: sabine.id,
        type: AbsenceType.UNPAID,
        status: AbsenceStatus.REQUESTED,
        startsAt: unpaidStart,
        endsAt: unpaidEnd,
        reason: 'Weltreise - unbezahlter Zusatzurlaub',
        createdById: sabine.id,
      },
    });

    // Abgelehnte Abwesenheit (REJECTED)
    const rejectedStart = new Date(today);
    rejectedStart.setDate(rejectedStart.getDate() + 1);
    const rejectedEnd = new Date(rejectedStart);
    rejectedEnd.setDate(rejectedEnd.getDate() + 1);
    await prisma.absence.create({
      data: {
        userId: daniel.id,
        type: AbsenceType.VACATION,
        status: AbsenceStatus.REJECTED,
        startsAt: rejectedStart,
        endsAt: rejectedEnd,
        reason: 'Kurzfristiger Urlaubswunsch',
        createdById: daniel.id,
        decidedById: manager.id,
        decisionNote: 'Zu kurzfristig, Personal-Engpass',
      },
    });

    // Stornierte Abwesenheit (CANCELLED)
    const cancelledStart = new Date(today);
    cancelledStart.setDate(cancelledStart.getDate() + 30);
    const cancelledEnd = new Date(cancelledStart);
    cancelledEnd.setDate(cancelledEnd.getDate() + 4);
    await prisma.absence.create({
      data: {
        userId: claudia.id,
        type: AbsenceType.VACATION,
        status: AbsenceStatus.CANCELLED,
        startsAt: cancelledStart,
        endsAt: cancelledEnd,
        reason: 'Urlaub storniert wegen Projekt',
        createdById: claudia.id,
        decidedById: manager.id,
        decisionNote: 'Selbst storniert',
      },
    });

    console.log('🏖️  Abwesenheiten angelegt (9 total: 4 APPROVED, 3 REQUESTED, 1 REJECTED, 1 CANCELLED)');

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
