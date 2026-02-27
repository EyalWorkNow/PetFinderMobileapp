import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  API_ORIGIN: z.string().default("*"),
  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_JWT_AUDIENCE: z.string().default("authenticated"),
  OPENAI_API_KEY: z.string().optional(),
  EMBEDDING_PROVIDER: z.enum(["auto", "openai", "mock"]).default("auto"),
  EMBEDDING_DIM: z.coerce.number().int().positive().default(1536),
  PUSH_MAX_PER_DAY: z.coerce.number().int().positive().default(3),
  EXPO_PUSH_ENABLED: z.coerce.boolean().default(true),
  DEV_AUTH_BYPASS: z.coerce.boolean().default(true),
  AUTO_SEED_DEMO: z.coerce.boolean().default(true),
  MAX_POSTS_PER_HOUR: z.coerce.number().int().positive().default(10),
  MAX_CONTACTS_PER_HOUR: z.coerce.number().int().positive().default(20)
});

export type AppConfig = z.infer<typeof envSchema>;

export const appConfig: AppConfig = envSchema.parse(process.env);
