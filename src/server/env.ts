// Centralized server-side environment validation.
// This file is imported only in server contexts (API routes, background jobs).

export interface ServerEnv {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SUPABASE_SERVICE_KEY?: string; // optional if not needed yet
  SUPABASE_URL?: string; // optional for service actions
}

function requireEnv(name: keyof ServerEnv): string {
  const value = process.env[name as string];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function loadServerEnv(): ServerEnv {
  return {
    STRIPE_SECRET_KEY: requireEnv('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: requireEnv('STRIPE_WEBHOOK_SECRET'),
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
  };
}
