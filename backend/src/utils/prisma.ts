import { PrismaClient } from '@prisma/client';

// Ensure a single PrismaClient instance across the app (and hot-reload in dev/tests)
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

