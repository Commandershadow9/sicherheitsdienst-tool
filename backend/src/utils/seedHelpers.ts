import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';

const CLEANUP_ORDER: Array<keyof PrismaClient> = [
  'controlScan',
  'controlRound',
  'controlPoint',
  'siteDocument',
  'siteImage',
  'siteAssignment',
  'siteCalculation',
  'incidentHistory',
  'siteIncident',
  'shiftAssignment',
  'timeEntry',
  'incident',
  'absence',
  'employeeDocument',
  'employeeQualification',
  'employeeProfile',
  'complianceViolation',
  'employeeWorkload',
  'employeePreferences',
  'objectClearance',
  'auditLog',
  'deviceToken',
  'shift',
  'event',
  'site',
  'siteTemplate',
  'priceModel',
  'customer',
  'user',
];

export async function resetSeedData(prisma: PrismaClient) {
  for (const model of CLEANUP_ORDER) {
    // @ts-expect-error dynamic model access
    await prisma[model].deleteMany();
  }
}

type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'password' | 'pushOptIn' | 'emailOptIn' | 'wageGroup' | 'baseWageOverride' | 'activityWages'> & {
  password?: string;
  pushOptIn?: boolean;
  emailOptIn?: boolean;
  wageGroup?: string | null;
  baseWageOverride?: number | null;
  activityWages?: any | null;
};

export async function createUserWithPassword(
  prisma: PrismaClient,
  input: CreateUserInput,
  saltRounds = 12,
) {
  const passwordHash = await bcrypt.hash(input.password ?? 'password123', saltRounds);
  const { wageGroup, baseWageOverride, activityWages, ...restInput } = input;
  return prisma.user.create({
    data: {
      ...restInput,
      password: passwordHash,
      pushOptIn: input.pushOptIn ?? true,
      emailOptIn: input.emailOptIn ?? true,
      ...(wageGroup !== undefined && { wageGroup }),
      ...(baseWageOverride !== undefined && { baseWageOverride }),
      ...(activityWages !== undefined && { activityWages }),
    },
  });
}
