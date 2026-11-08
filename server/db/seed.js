import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

try {
  const email = process.env.DOCTOR_EMAIL?.trim().toLowerCase();
  const password = process.env.DOCTOR_PASSWORD;
  const name = process.env.DOCTOR_NAME || 'Clinic Doctor';
  if (!email || !password) throw new Error('Set DOCTOR_EMAIL and DOCTOR_PASSWORD to provision the single doctor account.');
  if (password.length < 12) throw new Error('DOCTOR_PASSWORD must be at least 12 characters.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT id, role FROM users WHERE email=$1 FOR UPDATE', [email]);
    let userId;
    if (rows.length) {
      if (rows[0].role !== 'doctor') throw new Error('That email is already assigned to another role.');
      userId = rows[0].id;
      await client.query('UPDATE users SET password_hash=$2,is_active=true,updated_at=now() WHERE id=$1', [userId, await bcrypt.hash(password, 12)]);
      await client.query('DELETE FROM sessions WHERE sess::text LIKE $1', [`%${userId}%`]);
    } else {
      const inserted = await client.query("INSERT INTO users(email,password_hash,role) VALUES($1,$2,'doctor') RETURNING id", [email, await bcrypt.hash(password, 12)]);
      userId = inserted.rows[0].id;
    }
    await client.query('INSERT INTO doctor_profiles(user_id,display_name) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET display_name=EXCLUDED.display_name', [userId, name]);
    await client.query('COMMIT');
    console.log('Doctor account provisioned.');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
} finally { await pool.end(); }
