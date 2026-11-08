import pg from 'pg';
import fs from 'node:fs';

try {
  if (fs.existsSync('.env') && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {}

const { Pool } = pg;

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
if (!hasDatabaseUrl && process.env.NODE_ENV === 'production') {
  console.warn('[DB WARNING]: DATABASE_URL is not set in Vercel Environment Variables. Database features will be unavailable until DATABASE_URL is configured.');
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
  max: process.env.VERCEL ? 2 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

export const query = (text, params) => {
  if (!hasDatabaseUrl && process.env.NODE_ENV === 'production') {
    return Promise.reject(Object.assign(new Error('DATABASE_URL is not configured in Vercel Environment Variables. Please add your Supabase connection string to Vercel Project Settings -> Environment Variables.'), { status: 503 }));
  }
  return pool.query(text, params);
};
