import pg from 'pg';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

try {
  if (fs.existsSync('.env') && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {}

const { Pool } = pg;

// Look for any standard PostgreSQL connection environment variable provided by Vercel or Supabase
const rawDbUrl = (
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  ''
).trim();

export const hasDatabaseUrl = Boolean(
  rawDbUrl &&
  !rawDbUrl.includes('localhost') &&
  !rawDbUrl.includes('127.0.0.1')
);

function sanitizeConnectionString(uri) {
  if (!uri || typeof uri !== 'string') return '';
  const trimmed = uri.trim();
  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    // Attempt to handle passwords containing unencoded special characters like @, #, etc.
    const match = trimmed.match(/^(postgres(?:ql)?:\/\/)([^:]+):(.+)@([^@]+)$/);
    if (match) {
      const [, proto, user, pass, hostPart] = match;
      return `${proto}${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${hostPart}`;
    }
    return trimmed;
  }
}

// Only use localhost fallback in local development, NEVER on Vercel or in production!
const connectionString = hasDatabaseUrl
  ? sanitizeConnectionString(rawDbUrl)
  : (!process.env.VERCEL && process.env.NODE_ENV !== 'production'
      ? 'postgres://postgres:postgres@localhost:5432/dermacare'
      : '');

const isRemoteOrSupabase =
  Boolean(connectionString) &&
  (connectionString.includes('supabase.co') ||
   connectionString.includes('pooler.supabase.com') ||
   connectionString.includes('sslmode=require') ||
   process.env.PG_SSL === 'true' ||
   (process.env.NODE_ENV === 'production' && process.env.PG_SSL !== 'false'));

const actualPool = connectionString
  ? new Pool({
      connectionString,
      ssl: isRemoteOrSupabase ? { rejectUnauthorized: false } : undefined,
      max: process.env.VERCEL ? 2 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    })
  : null;

// ==============================================================
// Automatic Schema Initialization & Seed for Supabase
// Ensures tables and default accounts exist on first database use
// ==============================================================
const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('patient', 'receptionist', 'doctor')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email)
);
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL, phone text NOT NULL DEFAULT '', date_of_birth date, address text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL, timezone text NOT NULL DEFAULT 'Asia/Kolkata', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, description text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0), active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), patient_id uuid NOT NULL REFERENCES patients(id), service_id uuid NOT NULL REFERENCES services(id),
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled','completed')),
  patient_message text NOT NULL DEFAULT '', rejection_reason text, calendar_event_id text,
  created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS appointments_patient_start_idx ON appointments(patient_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS appointments_status_start_idx ON appointments(status, starts_at);
CREATE TABLE IF NOT EXISTS doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  starts_at time NOT NULL, ends_at time NOT NULL, active boolean NOT NULL DEFAULT true, CHECK (ends_at > starts_at), UNIQUE(weekday,starts_at,ends_at)
);
CREATE TABLE IF NOT EXISTS treatment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), patient_id uuid NOT NULL REFERENCES patients(id), appointment_id uuid REFERENCES appointments(id),
  doctor_id uuid NOT NULL REFERENCES users(id), notes text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS treatment_records_patient_idx ON treatment_records(patient_id, created_at DESC);
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id), kind text NOT NULL, message text NOT NULL, read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (sid varchar PRIMARY KEY, sess json NOT NULL, expire timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions(expire);
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES users(id), action text NOT NULL,
  entity_type text NOT NULL, entity_id text, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS automation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), appointment_id uuid REFERENCES appointments(id), event_type text NOT NULL,
  payload jsonb NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','delivered','failed')),
  attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(), last_error text,
  created_at timestamptz NOT NULL DEFAULT now(), delivered_at timestamptz
);
CREATE INDEX IF NOT EXISTS automation_events_pending_idx ON automation_events(status,next_attempt_at) WHERE status IN ('pending','failed');
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS otp_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  destination text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('registration','login','password_reset','phone_change')),
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 10),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_verification_lookup_idx ON otp_verification_tokens(destination,purpose,expires_at DESC) WHERE verified_at IS NULL;
CREATE TABLE IF NOT EXISTS app_settings (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
INSERT INTO app_settings(key,value) VALUES ('automation_config','{}'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO services(name,description,duration_minutes) VALUES
 ('General Checkup','',30),('Teeth Cleaning','',45),('Teeth Whitening','',60),('Root Canal Treatment','',60),('Braces Consultation','',45),('Emergency Visit','',30),
 ('Acne & Scar Treatment','',60),('Hair Loss Therapy (PRP)','',60),('Skin Allergy & Eczema','',30),('Laser Resurfacing','',45),('Anti-Aging & Botox','',30),('Pigmentation Correction','',45),('Cosmetic Dermatology','',75)
ON CONFLICT (name) DO NOTHING;
`;

let isInitialized = false;
let initPromise = null;

export const autoEnsureDatabase = async () => {
  if (isInitialized || !actualPool) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const client = await actualPool.connect();
        try {
          await client.query(SCHEMA_SQL);
          // Check if at least one doctor account exists; if not, create default
          const { rows } = await client.query("SELECT id FROM users WHERE role='doctor' LIMIT 1");
          if (!rows.length) {
            const email = (process.env.DOCTOR_EMAIL || 'doctor@dermacare.com').trim().toLowerCase();
            const password = process.env.DOCTOR_PASSWORD || 'DoctorPassword123!';
            const name = process.env.DOCTOR_NAME || 'Dr. Priya Sharma';
            const hash = await bcrypt.hash(password, 12);
            const user = await client.query("INSERT INTO users(email,password_hash,role) VALUES($1,$2,'doctor') ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash RETURNING id", [email, hash]);
            await client.query("INSERT INTO doctor_profiles(user_id,display_name) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET display_name=EXCLUDED.display_name", [user.rows[0].id, name]);
            console.log('[DB INIT]: Default doctor provisioned successfully.');
          }
          isInitialized = true;
          console.log('[DB INIT]: Database schema verified & ready.');
        } finally {
          client.release();
        }
      } catch (err) {
        console.error('[DB INIT ERROR]:', err.message);
      }
    })();
  }
  return initPromise;
};

export const pool = {
  connect: async () => {
    if (!actualPool) {
      throw Object.assign(
        new Error('DATABASE_URL is not configured in Vercel. Please add your Supabase connection string as DATABASE_URL in Vercel Project Settings -> Environment Variables, then Redeploy.'),
        { status: 503 }
      );
    }
    await autoEnsureDatabase();
    return actualPool.connect();
  },
  query: async (text, params) => {
    if (!actualPool) {
      throw Object.assign(
        new Error('DATABASE_URL is not configured in Vercel. Please add your Supabase connection string as DATABASE_URL in Vercel Project Settings -> Environment Variables, then Redeploy.'),
        { status: 503 }
      );
    }
    await autoEnsureDatabase();
    return actualPool.query(text, params);
  },
  on: (...args) => actualPool?.on?.(...args)
};

export const query = (text, params) => pool.query(text, params);
export { actualPool };
