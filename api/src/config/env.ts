import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  API_URL: z.string().default('http://localhost:3001'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // SIWE (optional for Phase 5+)
  SIWE_DOMAIN: z.string().default('localhost'),

  // Blockchain (optional until Phase 5)
  RPC_URL: z.string().default('https://sepolia.base.org'),
  CHAIN_ID: z.string().default('84532'), // Base Sepolia
  ESCROW_CONTRACT_ADDRESS: z.string().optional(),
  RELAYER_PRIVATE_KEY: z.string().optional(),

  // File storage (optional until Phase 3)
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().default('payfear-uploads'),
  S3_PUBLIC_URL: z.string().optional(),

  // Email (optional until Phase 6)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@payfear.io'),

  // Redis (optional — falls back to in-memory)
  REDIS_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
