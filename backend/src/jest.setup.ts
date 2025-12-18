import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const rootDir = path.resolve(__dirname);
const envCandidates = ['.env.test', '.env.test.example'];

for (const candidate of envCandidates) {
  const envPath = path.join(rootDir, candidate);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/sicherheitsdienst_test?schema=public';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-minimum-32-chars-long-aaaa';
process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || 'test-refresh-secret-minimum-32-chars-bbbb';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => ({
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    })),
    Prisma: {
      DbNull: null,
    },
  };
});
