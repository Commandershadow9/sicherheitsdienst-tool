import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';

const CLEANUP_ORDER: Array<keyof PrismaClient> = [
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
  'user',
];

export async function resetSeedData(prisma: PrismaClient) {
  for (const model of CLEANUP_ORDER) {
    // @ts-expect-error dynamic model access
    await prisma[model].deleteMany();
  }
}

type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'password' | 'pushOptIn' | 'emailOptIn'> & {
  password?: string;
  pushOptIn?: boolean;
  emailOptIn?: boolean;
};

export async function createUserWithPassword(
  prisma: PrismaClient,
  input: CreateUserInput,
  saltRounds = 12,
) {
  const passwordHash = await bcrypt.hash(input.password ?? 'password123', saltRounds);
  return prisma.user.create({
    data: {
      ...input,
      password: passwordHash,
      pushOptIn: input.pushOptIn ?? true,
      emailOptIn: input.emailOptIn ?? true,
    },
  });
}
