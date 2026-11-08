import pg from 'pg';
import fs from 'node:fs';

try {
  if (fs.existsSync('.env') && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {}

const { Pool } = pg;
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be configured in production');
}

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/dermacare';
const isRemoteOrSupabase =
  connectionString.includes('supabase.co') ||
  connectionString.includes('pooler.supabase.com') ||
  connectionString.includes('sslmode=require') ||
  process.env.PG_SSL === 'true' ||
  (process.env.NODE_ENV === 'production' && process.env.PG_SSL !== 'false');

export const pool = new Pool({
  connectionString,
  ssl: isRemoteOrSupabase ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000
});

export const query = (text, params) => pool.query(text, params);
