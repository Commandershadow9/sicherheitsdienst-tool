import { z } from 'zod';
import dotenv from 'dotenv';
import logger from '../utils/logger';

// Load .env file (if exists)
dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('simple'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Auth & Secrets
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRET must be at least 32 characters long')
    .refine((val) => !['change-me', 'changeme', 'secret', 'default'].includes(val), {
      message: 'JWT_SECRET must not be a default insecure value',
    }),
  REFRESH_SECRET: z.string()
    .min(32, 'REFRESH_SECRET must be at least 32 characters long')
    .refine((val) => !['change-me-refresh', 'changeme', 'secret'].includes(val), {
      message: 'REFRESH_SECRET must not be a default insecure value',
    }),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_EXPIRES_IN: z.string().default('30d'),

  // CORS
  CORS_ORIGIN: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
});

// Parse and validate environment variables
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
    // In production, we crash immediately if secrets are unsafe
    if (process.env.NODE_ENV === 'production') {
       console.error('🚨 Critical configuration error. Exiting...');
       process.exit(1);
    }
    // In dev, we might just warn, but the issue says "App startet nicht ohne gesetzte Secrets"
    // So we should strictly enforce it everywhere.
    throw new Error('Invalid environment variables');
  }

  return result.data;
};

// Export the validated config
export const config = parseEnv();
