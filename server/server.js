import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';
import { pool, query, hasDatabaseUrl, actualPool } from './db/pool.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const PgSession = connectPgSimple(session);
const production = process.env.NODE_ENV === 'production';
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'https://dental-care-mauve.vercel.app',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : []),
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL.trim()] : [])
].filter(Boolean);

const isOriginAllowed = (origin, req) => {
  if (!origin) return true;
  if (!production) return true;

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host;
    const originHostname = originUrl.hostname;

    // 1. All Vercel deployments (*.vercel.app)
    if (originHostname.endsWith('.vercel.app') || originHostname === 'vercel.app') {
      return true;
    }

    // 2. Local development
    if (['localhost', '127.0.0.1', '::1'].includes(originHostname)) {
      return true;
    }

    // 3. Same-origin or forwarded host
    if (req) {
      const host = req.get('host');
      const forwardedHost = req.get('x-forwarded-host');
      if (originHost === host) return true;
      if (forwardedHost) {
        const forwardedHosts = forwardedHost.split(',').map(h => h.trim());
        if (forwardedHosts.includes(originHost)) return true;
      }
    }

    // 4. Configured allowed origins
    if (allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return originUrl.origin === allowedUrl.origin;
      } catch {
        return originHost === allowed || originHostname === allowed;
      }
    })) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

app.use((req, res, next) => {
  const origin = req.get('origin');
  if (isOriginAllowed(origin, req)) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
  }
  next();
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(express.json({ limit: '32kb' }));

// Ensure paths match /api routes when hosted on serverless platforms (Vercel)
app.use((req, res, next) => {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});
const sessionStore = hasDatabaseUrl && actualPool
  ? new PgSession({ pool: actualPool, tableName: 'sessions', createTableIfMissing: true })
  : new session.MemoryStore();

app.use(session({
  store: sessionStore,
  name: 'clinic.sid',
  secret: process.env.SESSION_SECRET || 'clinic-production-fallback-secret-key-32chars-min',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: production, sameSite: process.env.COOKIE_SAME_SITE || 'lax', maxAge: 1000 * 60 * 60 * 12 }
}));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

const PUBLIC_AUTH_ROUTES = [
  '/api/auth/login',
  '/api/auth/staff-login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password'
];

const csrfProtect = (req, res, next) => {
  // Safe HTTP methods do not mutate state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  // Public authentication routes are establishing credentials; don't block with stale session checks
  if (PUBLIC_AUTH_ROUTES.includes(req.path)) return next();

  // If no user session is present, no authenticated session can be hijacked
  if (!req.session?.user) return next();

  const origin = req.get('origin') || req.get('referer');
  if (!origin) return next();

  if (isOriginAllowed(origin, req)) {
    return next();
  }

  return res.status(403).json({ success: false, error: 'Origin check failed.' });
};
app.use(csrfProtect);

// Default WhatsApp & Automation Configuration
const DEFAULT_WHATSAPP_CONFIG = {
  enabled: Boolean(process.env.N8N_BOOKING_WEBHOOK), provider: 'n8n',
  n8nWebhookUrl: process.env.N8N_BOOKING_WEBHOOK || '',
  n8nCancelWebhookUrl: process.env.N8N_CANCEL_WEBHOOK || '',
  clinicDetails: { name: 'DermaCare Luxe Clinic', doctorName: 'Dr. Priya Sharma', phone: '+91 9157931095' }
};
const getAutomationConfig = async () => {
  const result = await query("SELECT value FROM app_settings WHERE key = 'automation_config'");
  return { ...DEFAULT_WHATSAPP_CONFIG, ...(result.rows[0]?.value || {}) };
};

const SERVICES_DATA = [
  {
    id: 'acne',
    name: 'Acne & Scar Treatment',
    icon: 'droplets',
    desc: 'Shatter active acne and stimulate dermis repair using therapeutic gold-standard peels and non-ablative RF microneedling.',
    duration: '45 - 60 min',
    sessions: '3 - 5 Sessions',
    recovery: '1 - 2 Days',
    idealFor: 'Pitted scars, hyperpigmentation, active congestion.',
    category: 'Acne & Scars',
    efficacy: '97%',
    fullDetails: 'Combining medical chemical peeling with high-frequency RF needling targets root causes. Peels clear keratin plugs, while sterile needles stimulate deep fibroblast cells to reconstruct scarred skin, leaving skin smooth and uniform.'
  },
  {
    id: 'hair-loss',
    name: 'Hair Loss Therapy (PRP)',
    icon: 'wind',
    desc: 'Clinical autologous growth factors injected into the scalp to restore thinning crown density and reactivate dormant follicles.',
    duration: '60 min',
    sessions: '4 - 6 Sessions',
    recovery: 'Immediate',
    idealFor: 'Weak roots, crown thinning, stress-induced shedding.',
    category: 'Hair Care',
    efficacy: '94%',
    fullDetails: 'PRP concentrates high levels of healing growth factors from your own blood. Under local anesthetic, this gold serum is injected into sparse scalp areas to expand follicle bulbs and extend the active growing phase.'
  },
  {
    id: 'eczema',
    name: 'Skin Allergy & Eczema',
    icon: 'shield',
    desc: 'Advanced patch testing, barrier-repair formulas, and tailored immunotherapy protocols to manage chronic dermatitis.',
    duration: '30 min',
    sessions: 'Ongoing',
    recovery: 'None',
    idealFor: 'Extreme flaking, dynamic rashes, histamine triggers.',
    category: 'Allergy',
    efficacy: '98%',
    fullDetails: 'We isolate allergens through clinical patch diagnostics. Our protocols reconstruct damaged moisture barriers using custom emollients, medical light therapy, and advanced biologic creams for severe flares.'
  },
  {
    id: 'laser-resurfacing',
    name: 'Laser Resurfacing',
    icon: 'zap',
    desc: 'Fractional CO2 laser grids to vaporize aging skin layers, clear deep expression lines, and shrink enlarged pores.',
    duration: '45 min',
    sessions: '2 - 4 Sessions',
    recovery: '3 - 5 Days',
    idealFor: 'Static wrinkles, sun damage, deep textural pits.',
    category: 'Laser',
    efficacy: '96%',
    fullDetails: 'Our laser sends micro-beams of thermal energy down into the dermis. This vaporizes sun-damaged cells, triggers instant contraction of loose elastin fibers, and remodels complete facial texture.'
  },
  {
    id: 'botox',
    name: 'Anti-Aging & Botox',
    icon: 'sparkles',
    desc: 'Gracefully erase expression furrows and plump hollow structural regions using premium FDA neuromodulators.',
    duration: '30 min',
    sessions: '4 - 6 Months',
    recovery: 'Minimal',
    idealFor: 'Crow\'s feet, forehead lines, sunken cheeks.',
    category: 'Anti-Aging',
    efficacy: '99%',
    fullDetails: 'Achieve a well-rested appearance that preserves natural dynamic expressions. We strategically inject premium FDA-approved relaxers and hyaluronic fillers to elevate dynamic muscle planes.'
  },
  {
    id: 'pigmentation',
    name: 'Pigmentation Correction',
    icon: 'sun',
    desc: 'Q-Switched Nd:YAG lasers and tailored botanical lighteners to dismantle melasma and sun freckles.',
    duration: '45 min',
    sessions: '4 - 6 Sessions',
    recovery: 'Minimal',
    idealFor: 'Patchy cheek melasma, dark sun spots, uneven tone.',
    category: 'Pigmentation',
    efficacy: '95%',
    fullDetails: 'Our lasers shatter deep hyper-concentrated melanin deposits without overheating the surface skin. We couple this with custom brightening micro-infusions to maintain long-term clarity.'
  },
  {
    id: 'cosmetic',
    name: 'Cosmetic Dermatology',
    icon: 'star',
    desc: 'Medical-grade Hydrafacials and direct skin-booster micro-droplets to deliver an ultra-dewy glass skin glow.',
    duration: '75 min',
    sessions: 'Monthly',
    recovery: '12 Hours',
    idealFor: 'Bridal prep, dry dull complexion, glow maintenance.',
    category: 'Cosmetic',
    efficacy: '98%',
    fullDetails: 'This multi-step medical facial uses vortex suction to sweep away impurities, drenching the skin in rich hyaluronic acid, anti-aging peptides, and brightening antioxidants for instant glass-skin radiance.'
  }
];

const QUIZ_QUESTIONS = [
  { concern: 'Acne & Deep Scars', treatment: 'Acne & Scar Treatment', duration: '45-60 min', code: 'acne', resultText: 'Dr. Priya\'s signature microneedling RF and blue-light protocol is clinically tailored for this.' },
  { concern: 'Hair Shedding / Baldness', treatment: 'Hair Loss Therapy (PRP)', duration: '60 min', code: 'hair-loss', resultText: 'Our high-density autologous growth factor PRP injections help reactivate follicles.' },
  { concern: 'Dark Spots & Melasma', treatment: 'Pigmentation Correction', duration: '45 min', code: 'pigmentation', resultText: 'Q-Switched lasers coupled with medical brightening peels will restore an even complexion.' },
  { concern: 'Wrinkles & Loss of Volume', treatment: 'Anti-Aging & Botox', duration: '30 min', code: 'botox', resultText: 'FDA-approved neuromodulators and fillers restore volume while preserving expressions.' }
];

const parseAppointmentSlot = (date, time) => {
  const fallbackStart = `${date}T10:00:00+05:30`;
  const fallbackEnd = `${date}T11:00:00+05:30`;

  if (!date || !time) {
    return { startISO: fallbackStart, endISO: fallbackEnd };
  }

  const to24Hour = (value) => {
    const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2] || '0');
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  };

  const [startText, endText] = time.split('-').map(part => part.trim());
  const startTime = to24Hour(startText || '');
  const endTime = to24Hour(endText || '');

  return {
    startISO: startTime ? `${date}T${startTime}+05:30` : fallbackStart,
    endISO: endTime ? `${date}T${endTime}+05:30` : fallbackEnd
  };
};

const extractCalendarEventId = (data) => {
  if (!data || typeof data !== 'object') return '';

  return data.calendarEventId
    || data.googleCalendarEventId
    || data.eventId
    || data.id
    || data.googleCalendar?.eventId
    || data.googleCalendar?.id
    || data.calendar?.eventId
    || data.calendar?.id
    || '';
};

const getBearerToken = (authorizationHeader = '') => {
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
};

const requireN8nBackendToken = (req, res, next) => {
  const expectedToken = process.env.N8N_BACKEND_TOKEN;

  if (!expectedToken) {
    return res.status(503).json({
      success: false,
      error: 'N8N_BACKEND_TOKEN is not configured on the backend'
    });
  }

  const token = getBearerToken(req.get('authorization'));

  if (!token || !secureCompare(token, expectedToken)) {
    return res.status(401).json({ success: false, error: 'Invalid n8n backend token' });
  }

  next();
};

// --- HELPER TO TRIGGER n8n AUTOMATION & WHATSAPP NOTIFICATIONS ---
async function sendAutomationPayload(appointment, eventName = 'appointment.created', cancelledBy = '') {
  const config = await getAutomationConfig();
  const isCancellation = eventName === 'appointment.cancelled';

  const logEntry = {
    id: appointment.eventId,
    timestamp: new Date().toISOString(),
    patientName: appointment.name,
    patientPhone: appointment.phone,
    appointmentId: appointment.id,
    status: 'pending',
    provider: config.provider || 'n8n',
    event: eventName,
    message: '',
    error: null
  };

  if (!config.enabled) {
    logEntry.status = 'skipped_disabled';
    logEntry.message = 'Automation & WhatsApp notifications disabled in admin settings.';
      if (appointment.eventId) await query('UPDATE automation_events SET status=$2, last_error=$3 WHERE id=$1', [appointment.eventId, 'failed', 'Automation disabled']);
    return { success: false, reason: 'Notifications disabled' };
  }

  let formattedDate = appointment.date || 'N/A';
  try {
    if (appointment.date) {
      formattedDate = new Date(appointment.date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (e) { }

  const { startISO, endISO } = parseAppointmentSlot(appointment.date, appointment.time);
  const clinicName = config.clinicDetails?.name || 'DermaCare Luxe Clinic';
  const doctorName = config.clinicDetails?.doctorName || 'Dr. Priya Sharma';
  const clinicPhone = config.clinicDetails?.phone || '+91 9157931095';

  const n8nPayload = {
    event: eventName,
    appointmentId: appointment.id,
    patientName: appointment.name,
    patientPhone: appointment.phone,
    patientEmail: appointment.email || '',
    service: appointment.service,
    date: formattedDate,
    rawDate: appointment.date,
    time: appointment.time,
    notes: appointment.notes || '',
    status: isCancellation ? 'Cancelled' : (appointment.status || 'Confirmed'),
    cancelledBy,
    createdAt: appointment.createdAt,
    cancelledAt: isCancellation ? new Date().toISOString() : appointment.cancelledAt,
    calendarEventId: appointment.calendarEventId || '',
    clinic: {
      name: clinicName,
      doctorName,
      phone: clinicPhone
    },
    googleCalendar: {
      eventId: appointment.calendarEventId || '',
      summary: `${clinicName}: ${appointment.service} - ${appointment.name}`,
      description: `Patient: ${appointment.name}\nPhone: ${appointment.phone}\nEmail: ${appointment.email || 'N/A'}\nService: ${appointment.service}\nNotes: ${appointment.notes || 'None'}`,
      startISO,
      endISO,
      timeZone: 'Asia/Kolkata'
    },
    whatsappMessageBody: isCancellation
      ? `Hello ${appointment.name},\n\nYour appointment at ${clinicName} has been cancelled.\n\nBooking ID: ${appointment.id}\nDoctor: ${doctorName}\nService: ${appointment.service}\nDate: ${formattedDate}\nTime: ${appointment.time}\n\nThe calendar reminder has been removed. For help, call ${clinicPhone}.`
      : `Hello ${appointment.name},\n\nYour appointment at ${clinicName} is confirmed!\n\nBooking ID: ${appointment.id}\nDoctor: ${doctorName}\nService: ${appointment.service}\nDate: ${formattedDate}\nTime: ${appointment.time}\n\nA calendar invite has been added for your visit. Thank you!`
  };

  logEntry.message = n8nPayload.whatsappMessageBody;
  const webhookUrl = isCancellation && config.n8nCancelWebhookUrl
    ? config.n8nCancelWebhookUrl
    : config.n8nWebhookUrl;

  try {
    if (config.provider === 'n8n' || webhookUrl) {
      console.log(`[n8n Webhook Trigger]: Sending ${eventName} payload to ${webhookUrl}`);

      // Attempt n8n Webhook HTTP Call if valid URL provided
      if (!webhookUrl || !webhookUrl.startsWith('http')) {
        throw new Error('Valid n8n webhook URL is not configured');
      }

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(process.env.N8N_WEBHOOK_SECRET ? { 'X-Clinic-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET } : {}), 'Idempotency-Key': appointment.eventId || appointment.id },
        body: JSON.stringify(n8nPayload)
      });
      const responseText = await res.text();
      let responseData = null;

      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch (parseErr) {
        responseData = { raw: responseText };
      }

      if (!res.ok) {
        throw new Error(`n8n webhook failed with status ${res.status}`);
      }

      const calendarEventId = extractCalendarEventId(responseData);
      logEntry.status = 'success';
      logEntry.calendarEventId = calendarEventId || appointment.calendarEventId || '';
      if (appointment.eventId) await query('UPDATE automation_events SET status=$2, attempts=attempts+1, delivered_at=now(), last_error=NULL WHERE id=$1', [appointment.eventId, 'delivered']);
      return {
        success: true,
        provider: 'n8n',
        message: isCancellation
          ? 'Cancellation delivered to n8n webhook'
          : 'Payload delivered to n8n webhook (WhatsApp + Google Calendar triggered)',
        payload: n8nPayload,
        response: responseData,
        calendarEventId
      };
    } else {
      logEntry.status = 'success';
      if (appointment.eventId) await query('UPDATE automation_events SET status=$2, attempts=attempts+1, delivered_at=now() WHERE id=$1', [appointment.eventId, 'delivered']);
      return { success: true, message: 'Notification logged' };
    }
  } catch (err) {
    logEntry.status = 'failed';
    logEntry.error = err.message || String(err);
    if (appointment.eventId) await query('UPDATE automation_events SET status=$2, attempts=attempts+1, next_attempt_at=now()+interval \'5 minutes\', last_error=$3 WHERE id=$1', [appointment.eventId, 'failed', logEntry.error]);
    return { success: false, error: err.message };
  }
}

const requireAuth = (req, res, next) => req.session.user ? next() : res.status(401).json({ success: false, error: 'Authentication required' });
const requireRole = (...roles) => (req, res, next) => {
  if (!req.session.user || !roles.includes(req.session.user.role)) return res.status(403).json({ success: false, error: 'Forbidden' });
  next();
};
const cleanUser = ({ id, email, role, full_name: name }) => ({ id, email, role, name: name || '' });
const createOutboxEvent = async (client, appointmentId, eventType, payload) => {
  const { rows } = await client.query('INSERT INTO automation_events(appointment_id,event_type,payload) VALUES($1,$2,$3) RETURNING id', [appointmentId, eventType, JSON.stringify(payload)]);
  return rows[0].id;
};
const recordAudit = (client, actorId, action, entityType, entityId, metadata = {}) => client.query(
  'INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5)',
  [actorId, action, entityType, entityId, JSON.stringify(metadata)]
);

// --- API ENDPOINTS ---

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    databaseConfigured: hasDatabaseUrl,
    environment: process.env.NODE_ENV || 'development',
    isVercel: Boolean(process.env.VERCEL)
  });
});

app.get('/api/services', (req, res) => {
  res.json({ success: true, data: SERVICES_DATA });
});

app.get('/api/quiz', (req, res) => {
  res.json({ success: true, data: QUIZ_QUESTIONS });
});

app.post('/api/auth/register', authLimiter, async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').trim();
  const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10 || password.length > 200) return res.status(400).json({ success: false, error: 'Provide a valid name, email, and password of at least 10 characters.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await client.query("INSERT INTO users(email,password_hash,role) VALUES($1,$2,'patient') RETURNING id,email,role", [email, await bcrypt.hash(password, 12)]);
    await client.query('INSERT INTO patients(user_id,full_name,phone) VALUES($1,$2,$3)', [user.rows[0].id, name, phone]);
    await client.query('COMMIT');
    req.session.user = { ...user.rows[0], name };
    await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
    res.status(201).json({ success: true, user: cleanUser(req.session.user) });
  } catch (e) { await client.query('ROLLBACK'); if (e.code === '23505') return res.status(409).json({ success: false, error: 'An account with that email already exists.' }); next(e); }
  finally { client.release(); }
});
app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { rows } = await query('SELECT u.id,u.email,u.role,u.password_hash,p.full_name FROM users u LEFT JOIN patients p ON p.user_id=u.id WHERE u.email=$1 AND u.is_active=true', [email]);
    if (!rows[0] || !(await bcrypt.compare(String(req.body.password || ''), rows[0].password_hash))) return res.status(401).json({ success: false, error: 'Email or password is incorrect.' });
    const { password_hash, full_name, ...user } = rows[0];
    await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    req.session.user = { ...user, name: full_name || '' };
    await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
    res.json({ success: true, user: cleanUser(req.session.user) });
  } catch (e) { next(e); }
});
app.post('/api/auth/logout', requireAuth, (req, res, next) => req.session.destroy(error => error ? next(error) : (res.clearCookie('clinic.sid'), res.json({ success: true }))));
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ success: true, user: cleanUser(req.session.user) }));
app.post('/api/auth/staff-login', authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { rows } = await query("SELECT id,email,role,password_hash FROM users WHERE email=$1 AND is_active=true AND role IN ('doctor','receptionist')", [email]);
    if (!rows[0] || !(await bcrypt.compare(String(req.body.password || ''), rows[0].password_hash))) return res.status(401).json({ success: false, error: 'Email or password is incorrect.' });
    const { password_hash, ...user } = rows[0];
    await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    req.session.user = user;
    await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
    res.json({ success: true, user });
  } catch (e) { next(e); }
});
app.post('/api/auth/forgot-password',authLimiter,async(req,res,next)=>{try{const email=String(req.body.email||'').trim().toLowerCase();const {rows}=await query('SELECT id FROM users WHERE email=$1 AND is_active=true',[email]);if(rows[0]){const token=randomBytes(32).toString('hex');await query("INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '30 minutes')",[rows[0].id,createHash('sha256').update(token).digest('hex')]);if(process.env.PASSWORD_RESET_WEBHOOK){await fetch(process.env.PASSWORD_RESET_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,token,expiresInMinutes:30})}).catch(e=>console.error('Password reset delivery failed:',e.message));}else console.warn('Password reset requested but PASSWORD_RESET_WEBHOOK is not configured.');}res.json({success:true,message:'If an account matches that email, reset instructions will be sent.'});}catch(e){next(e);}});
app.post('/api/auth/reset-password',authLimiter,async(req,res,next)=>{try{const token=String(req.body.token||'');const password=String(req.body.password||'');if(token.length<32||password.length<10)return res.status(400).json({success:false,error:'Invalid reset request.'});const hash=createHash('sha256').update(token).digest('hex');const client=await pool.connect();try{await client.query('BEGIN');const {rows}=await client.query('SELECT id,user_id FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() FOR UPDATE',[hash]);if(!rows[0]){await client.query('ROLLBACK');return res.status(400).json({success:false,error:'Reset link is invalid or expired.'});}await client.query('UPDATE users SET password_hash=$2,updated_at=now() WHERE id=$1',[rows[0].user_id,await bcrypt.hash(password,12)]);await client.query('UPDATE password_reset_tokens SET used_at=now() WHERE id=$1',[rows[0].id]);await client.query('DELETE FROM sessions WHERE sess::text LIKE $1',[`%${rows[0].user_id}%`]);await client.query('COMMIT');res.json({success:true});}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}catch(e){next(e);}});

app.get('/api/services/catalog', async (_req, res, next) => { try { const { rows } = await query('SELECT id,name,duration_minutes FROM services WHERE active=true ORDER BY name'); res.json({ success: true, data: rows }); } catch (e) { next(e); } });
app.get('/api/appointments', requireRole('doctor','receptionist'), async (_req, res, next) => {
  try { const { rows } = await query(`SELECT a.id,a.starts_at,a.ends_at,a.status,a.patient_message,a.rejection_reason,a.created_at,s.name service,p.full_name name,p.phone,u.email FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN users u ON u.id=p.user_id JOIN services s ON s.id=a.service_id ORDER BY a.starts_at DESC`); res.json({ success: true, count: rows.length, data: rows }); } catch (e) { next(e); }
});
app.get('/api/appointments/mine', requireRole('patient'), async (req, res, next) => {
  try { const { rows } = await query('SELECT a.id,a.starts_at,a.ends_at,a.status,a.rejection_reason,s.name service FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN services s ON s.id=a.service_id WHERE p.user_id=$1 ORDER BY a.starts_at DESC', [req.session.user.id]); res.json({ success: true, data: rows }); } catch (e) { next(e); }
});
app.post('/api/appointments', async (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ success:false,error:'Sign in or register as a patient before booking.' });
  if (!['patient','doctor','receptionist'].includes(req.session.user.role)) return res.status(403).json({ success:false,error:'Forbidden' });
  let name = String(req.body.name || '').trim(); let email = String(req.body.email || '').trim().toLowerCase(); let phone = String(req.body.phone || '').trim();
  const service = String(req.body.service || '').trim(); const date = String(req.body.date || ''); const time = String(req.body.time || '');
  if (name.length < 2 || name.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || !/^[\d\s+()-]{7,20}$/.test(phone) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time)) return res.status(400).json({ success:false,error:'Please provide valid contact details and an appointment time.' });
  if(req.session.user && !['patient','doctor','receptionist'].includes(req.session.user.role)) return res.status(403).json({success:false,error:'Forbidden'});
  if(req.session.user?.role==='patient' && req.session.user.email!==email) return res.status(403).json({success:false,error:'Use the email address on your patient account.'});
  if(!req.session.user && req.body.role) return res.status(400).json({success:false,error:'Role is not accepted for public booking.'});
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let patientId; let patientUserId;
    if (req.session.user?.role === 'patient') {
      patientUserId = req.session.user.id;
      const p = await client.query('SELECT p.id,p.full_name,p.phone,u.email FROM patients p JOIN users u ON u.id=p.user_id WHERE p.user_id=$1', [patientUserId]);
      patientId = p.rows[0]?.id;
      if (p.rows[0]) { name = p.rows[0].full_name; phone = p.rows[0].phone; email = p.rows[0].email; }
    } else {
      const existing = await client.query("SELECT u.id,p.id patient_id,u.role FROM users u LEFT JOIN patients p ON p.user_id=u.id WHERE u.email=$1", [email]);
      if(existing.rows[0] && existing.rows[0].role!=='patient') throw Object.assign(new Error('That email belongs to a staff account.'),{status:409});
      if (existing.rows[0]?.id && existing.rows[0].patient_id) { patientUserId=existing.rows[0].id; patientId=existing.rows[0].patient_id; await client.query('UPDATE patients SET full_name=$2,phone=$3 WHERE id=$1',[patientId,name,phone]); }
      else {
        const u = await client.query("INSERT INTO users(email,password_hash,role) VALUES($1,$2,'patient') ON CONFLICT(email) DO NOTHING RETURNING id", [email, await bcrypt.hash(cryptoRandomPassword(), 12)]);
        if (!u.rows[0]) throw Object.assign(new Error('This email is already registered. Please log in to book.'), { status: 409 });
        patientUserId=u.rows[0].id; const p=await client.query('INSERT INTO patients(user_id,full_name,phone) VALUES($1,$2,$3) RETURNING id',[patientUserId,name,phone]); patientId=p.rows[0].id;
      }
    }
    if (!patientId) throw Object.assign(new Error('Patient profile was not found.'), { status: 400 });
    const svc = await client.query('SELECT id,duration_minutes FROM services WHERE name=$1 AND active=true', [service]);
    if (!svc.rows[0]) throw Object.assign(new Error('Please select an available service.'), { status: 400 });
    const start = `${date}T${time}:00+05:30`; const startDate=new Date(start); if(Number.isNaN(startDate.getTime())||startDate<=new Date()||startDate>new Date(Date.now()+30*86400000))throw Object.assign(new Error('Choose an appointment within the next 30 days.'),{status:400}); const end = new Date(startDate.getTime()+svc.rows[0].duration_minutes*60000).toISOString();
    const appt = await client.query("INSERT INTO appointments(patient_id,service_id,starts_at,ends_at,patient_message,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,starts_at,ends_at,status,created_at", [patientId,svc.rows[0].id,start,end,String(req.body.notes||'').slice(0,2000),req.session.user?.id||null]);
    const full = { ...appt.rows[0], name, phone, email, service, date, time, notes: String(req.body.notes||''), createdAt: appt.rows[0].created_at, status:'Pending' };
    const { rows: doctors } = await client.query("SELECT id FROM users WHERE role='doctor' AND is_active=true");
    for (const doctor of doctors) await client.query('INSERT INTO notifications(user_id,appointment_id,kind,message) VALUES($1,$2,$3,$4)', [doctor.id, full.id, 'appointment.pending', `New appointment request from ${name}`]);
    const eventId = await createOutboxEvent(client,full.id,'appointment.pending', { event:'appointment.pending', appointmentId:full.id, patientName:name,patientPhone:phone,patientEmail:email,service,date,time,status:'Pending' }); full.eventId=eventId;
    await client.query('COMMIT');
    processAutomationEvent(eventId, full).catch(error => console.error('Automation delivery failed:',error.message));
    res.status(201).json({ success:true,message:'Appointment request received. The clinic will confirm after review.',appointment:{...full,pending:true} });
  } catch (e) { await client.query('ROLLBACK'); if (e.code==='23P01') return res.status(409).json({success:false,error:'That time is already requested. Please choose another slot.'}); next(e); }
  finally { client.release(); }
});

function cryptoRandomPassword() { return `${Math.random().toString(36)}-${Date.now()}-${Math.random().toString(36)}`; }

async function processAutomationEvent(eventId, appointment) {
  const { rows } = await query('SELECT event_type,payload FROM automation_events WHERE id=$1', [eventId]);
  if (!rows[0]) return;
  const item = { ...appointment, eventId, ...rows[0].payload };
  await sendAutomationPayload(item, rows[0].event_type);
}

app.patch('/api/appointments/:id/decision', requireRole('doctor'), async (req,res,next) => {
  const status = req.body.status === 'approved' ? 'approved' : req.body.status === 'rejected' ? 'rejected' : '';
  if (!status) return res.status(400).json({success:false,error:'Decision must be approved or rejected.'});
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT a.id,a.starts_at,a.ends_at,a.patient_message,a.status,s.name service,p.full_name name,p.phone,u.email FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN users u ON u.id=p.user_id JOIN services s ON s.id=a.service_id WHERE a.id=$1 FOR UPDATE',[req.params.id]);
    if(!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({success:false,error:'Appointment not found.'}); }
    if(rows[0].status!=='pending') { await client.query('ROLLBACK'); return res.status(409).json({success:false,error:'Only pending requests can be decided.'}); }
    const reason = status==='rejected' ? String(req.body.reason||'').trim().slice(0,1000) : null;
    const updated=await client.query('UPDATE appointments SET status=$2,rejection_reason=$3,updated_at=now() WHERE id=$1 RETURNING id,starts_at,ends_at,status',[req.params.id,status,reason]);
    const appointment={...rows[0],...updated.rows[0], date:new Date(rows[0].starts_at).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}),time:new Date(rows[0].starts_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'}),rejectionReason:reason};
    await client.query('INSERT INTO notifications(user_id,appointment_id,kind,message) SELECT user_id,$2,$3,$4 FROM patients WHERE id=(SELECT patient_id FROM appointments WHERE id=$2)',[req.params.id,status=== 'approved'?'appointment.approved':'appointment.rejected',status==='approved'?'Your appointment has been approved.':`Your appointment request was declined.${reason?` Reason: ${reason}`:''}`]);
    await recordAudit(client,req.session.user.id,`appointment.${status}`,'appointment',req.params.id,{reason});
    const eventId=await createOutboxEvent(client,req.params.id,`appointment.${status}`,{event:`appointment.${status}`,appointmentId:req.params.id,patientName:appointment.name,patientPhone:appointment.phone,patientEmail:appointment.email,service:appointment.service,date:appointment.date,time:appointment.time,status:status==='approved'?'Confirmed':'Rejected',rejectionReason:reason}); appointment.eventId=eventId;
    await client.query('COMMIT');
    processAutomationEvent(eventId,appointment).catch(error=>console.error('Automation delivery failed:',error.message));
    res.json({success:true,appointment});
  } catch(e){await client.query('ROLLBACK');if(e.code==='23P01')return res.status(409).json({success:false,error:'This appointment conflicts with another active booking.'});next(e);} finally{client.release();}
});
app.patch('/api/appointments/:id/cancel', requireAuth, async (req,res,next)=>{
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const values=[req.params.id];
    const own=req.session.user.role==='patient';
    let sql=`SELECT a.id,a.starts_at,a.ends_at,a.status,s.name service,p.full_name name,p.phone,u.email FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN users u ON u.id=p.user_id JOIN services s ON s.id=a.service_id WHERE a.id=$1`;
    if(own){values.push(req.session.user.id);sql+=' AND p.user_id=$2';}
    const {rows}=await client.query(sql+' FOR UPDATE',values);
    if(!rows[0]){await client.query('ROLLBACK');return res.status(404).json({success:false,error:'Appointment not found.'});}
    if(own && (rows[0].status!=='pending'||new Date(rows[0].starts_at)<=new Date())){await client.query('ROLLBACK');return res.status(403).json({success:false,error:'This appointment is no longer eligible for cancellation.'});}
    const updated=await client.query("UPDATE appointments SET status='cancelled',updated_at=now() WHERE id=$1 RETURNING id,starts_at,ends_at,status",[req.params.id]);
    const appointment={...rows[0],...updated.rows[0],date:new Date(rows[0].starts_at).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}),time:new Date(rows[0].starts_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'})};
    await recordAudit(client,req.session.user.id,'appointment.cancelled','appointment',req.params.id);
    const eventId=await createOutboxEvent(client,req.params.id,'appointment.cancelled',{event:'appointment.cancelled',appointmentId:req.params.id,patientName:appointment.name,patientPhone:appointment.phone,patientEmail:appointment.email,service:appointment.service,date:appointment.date,time:appointment.time,status:'Cancelled',cancelledBy:req.session.user.role});appointment.eventId=eventId;
    await client.query('COMMIT'); processAutomationEvent(eventId,appointment).catch(error=>console.error('Automation delivery failed:',error.message));
    res.json({success:true,appointment});
  }catch(e){await client.query('ROLLBACK');next(e);}finally{client.release();}
});
app.get('/api/patients', requireRole('doctor','receptionist'), async(req,res,next)=>{try{const q=`%${String(req.query.q||'').slice(0,100)}%`;const {rows}=await query(`SELECT p.id,p.full_name name,p.phone,u.email,p.created_at FROM patients p JOIN users u ON u.id=p.user_id WHERE p.full_name ILIKE $1 OR p.phone ILIKE $1 OR u.email ILIKE $1 ORDER BY p.full_name LIMIT 100`,[q]);res.json({success:true,data:rows});}catch(e){next(e);}});
app.get('/api/doctor/summary',requireRole('doctor'),async(_req,res,next)=>{try{const {rows}=await query(`SELECT (SELECT count(*)::int FROM patients) total_patients,(SELECT count(*)::int FROM appointments WHERE starts_at::date=(now() AT TIME ZONE 'Asia/Kolkata')::date) today_appointments,(SELECT count(*)::int FROM appointments WHERE status='pending') pending,(SELECT count(*)::int FROM appointments WHERE status='completed') completed`);res.json({success:true,data:rows[0]});}catch(e){next(e);}});
app.get('/api/reception/summary',requireRole('receptionist'),async(_req,res,next)=>{try{const {rows}=await query(`SELECT count(*) FILTER(WHERE starts_at::date=(now() AT TIME ZONE 'Asia/Kolkata')::date)::int today,count(*) FILTER(WHERE status='pending')::int pending,count(*) FILTER(WHERE status='approved')::int approved,(SELECT count(*)::int FROM patients) total_patients FROM appointments`);res.json({success:true,data:rows[0]});}catch(e){next(e);}});
app.get('/api/patients/:id/treatments',requireRole('doctor'),async(req,res,next)=>{try{const {rows}=await query('SELECT * FROM treatment_records WHERE patient_id=$1 ORDER BY created_at DESC',[req.params.id]);res.json({success:true,data:rows});}catch(e){next(e);}});
app.post('/api/patients/:id/treatments',requireRole('doctor'),async(req,res,next)=>{try{const notes=String(req.body.notes||'').trim();if(!notes||notes.length>10000)return res.status(400).json({success:false,error:'Treatment notes are required (up to 10,000 characters).'});const {rows}=await query('INSERT INTO treatment_records(patient_id,appointment_id,doctor_id,notes) VALUES($1,$2,$3,$4) RETURNING *',[req.params.id,req.body.appointmentId||null,req.session.user.id,notes]);await query('INSERT INTO audit_logs(actor_id,action,entity_type,entity_id) VALUES($1,$2,$3,$4)',[req.session.user.id,'treatment.created','treatment_record',rows[0].id]);res.status(201).json({success:true,data:rows[0]});}catch(e){next(e);}});
app.get('/api/doctor/availability',requireRole('doctor'),async(_req,res,next)=>{try{const {rows}=await query('SELECT * FROM doctor_availability ORDER BY weekday,starts_at');res.json({success:true,data:rows});}catch(e){next(e);}});
app.put('/api/doctor/availability',requireRole('doctor'),async(req,res,next)=>{const intervals=Array.isArray(req.body.intervals)?req.body.intervals:[];if(intervals.length>70||intervals.some(x=>!Number.isInteger(x.weekday)||x.weekday<0||x.weekday>6||!/^\d{2}:\d{2}$/.test(x.starts_at)||!/^\d{2}:\d{2}$/.test(x.ends_at)||x.starts_at>=x.ends_at))return res.status(400).json({success:false,error:'Availability intervals must have valid days and times.'});const client=await pool.connect();try{await client.query('BEGIN');await client.query('DELETE FROM doctor_availability');for(const slot of intervals)await client.query('INSERT INTO doctor_availability(weekday,starts_at,ends_at,active) VALUES($1,$2,$3,$4)',[slot.weekday,slot.starts_at,slot.ends_at,slot.active!==false]);await recordAudit(client,req.session.user.id,'availability.updated','doctor_availability',null,{count:intervals.length});await client.query('COMMIT');res.json({success:true,data:intervals});}catch(e){await client.query('ROLLBACK');next(e);}finally{client.release();}});
app.get('/api/notifications',requireRole('doctor','receptionist'),async(req,res,next)=>{try{const {rows}=await query('SELECT id,kind,message,read_at,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[req.session.user.id]);res.json({success:true,data:rows});}catch(e){next(e);}});
app.get('/api/patient/profile',requireRole('patient'),async(req,res,next)=>{try{const {rows}=await query('SELECT p.id,p.full_name name,p.phone,u.email,p.date_of_birth,p.address FROM patients p JOIN users u ON u.id=p.user_id WHERE p.user_id=$1',[req.session.user.id]);res.json({success:true,data:rows[0]});}catch(e){next(e);}});
app.patch('/api/patient/profile',requireRole('patient'),async(req,res,next)=>{try{const name=String(req.body.name||'').trim();const phone=String(req.body.phone||'').trim();if(name.length<2||name.length>120||! /^[\d\s+()-]{7,20}$/.test(phone))return res.status(400).json({success:false,error:'Provide a valid name and phone number.'});const {rows}=await query('UPDATE patients SET full_name=$2,phone=$3,updated_at=now() WHERE user_id=$1 RETURNING id,full_name name,phone',[req.session.user.id,name,phone]);req.session.user.name=name;res.json({success:true,data:rows[0]});}catch(e){next(e);}});
app.get('/api/staff/appointments/:id',requireRole('doctor','receptionist'),async(req,res,next)=>{try{const {rows}=await query('SELECT a.*,p.full_name name,p.phone,u.email,s.name service FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN users u ON u.id=p.user_id JOIN services s ON s.id=a.service_id WHERE a.id=$1',[req.params.id]);if(!rows[0])return res.status(404).json({success:false,error:'Appointment not found'});res.json({success:true,data:rows[0]});}catch(e){next(e);}});
app.get('/api/staff/patients/:id',requireRole('doctor','receptionist'),async(req,res,next)=>{try{const {rows}=await query('SELECT p.id,p.full_name name,p.phone,u.email,p.created_at FROM patients p JOIN users u ON u.id=p.user_id WHERE p.id=$1',[req.params.id]);if(!rows[0])return res.status(404).json({success:false,error:'Patient not found'});res.json({success:true,data:rows[0]});}catch(e){next(e);}});
app.get('/api/whatsapp/config',requireRole('doctor'),async(_req,res,next)=>{try{const config=await getAutomationConfig();res.json({success:true,data:{...config,n8nWebhookUrl:undefined,n8nCancelWebhookUrl:undefined}});}catch(e){next(e);}});
app.post('/api/whatsapp/config',requireRole('doctor'),async(req,res,next)=>{try{const value={...await getAutomationConfig(),enabled:Boolean(req.body.enabled)};await query("INSERT INTO app_settings(key,value) VALUES('automation_config',$1) ON CONFLICT(key) DO UPDATE SET value=app_settings.value || EXCLUDED.value,updated_at=now()",[JSON.stringify(value)]);await query("INSERT INTO audit_logs(actor_id,action,entity_type) VALUES($1,'automation.config.updated','settings')",[req.session.user.id]);res.json({success:true,message:'Automation settings saved',data:{enabled:value.enabled}});}catch(e){next(e);}});
app.get('/api/whatsapp/logs',requireRole('doctor'),async(_req,res,next)=>{try{const {rows}=await query('SELECT id,event_type event,status,attempts,last_error error,created_at timestamp FROM automation_events ORDER BY created_at DESC LIMIT 100');res.json({success:true,data:rows});}catch(e){next(e);}});
app.post('/api/n8n/test',requireRole('doctor'),async(req,res,next)=>{try{const client=await pool.connect();try{await client.query('BEGIN');const id=await createOutboxEvent(client,null,'automation.test',{event:'automation.test'});await client.query('COMMIT');res.json({success:true,result:{success:true,eventId:id,message:'Test outbox event queued.'}});}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}catch(e){next(e);}});
app.patch('/api/appointments/:id/calendar-event', requireN8nBackendToken, async (req, res, next) => {
  try {const id=String(req.body.calendarEventId||'').trim();if(!id)return res.status(400).json({success:false,error:'calendarEventId is required'});const {rows}=await query('UPDATE appointments SET calendar_event_id=$2,updated_at=now() WHERE id=$1 RETURNING id,calendar_event_id',[req.params.id,id]);if(!rows[0])return res.status(404).json({success:false,error:'Appointment not found'});res.json({success:true,appointmentId:rows[0].id,calendarEventId:rows[0].calendar_event_id});}catch(e){next(e);}
});

app.use((error, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, error);
  const status = error.status || (error.code === '23505' ? 409 : 500);
  res.status(status).json({ success: false, error: error.message || 'An unexpected server error occurred.' });
});

// Retry due outbox events after process restarts. Delivery is idempotent at the n8n boundary.
const dispatchOutbox = async () => {
  try {
    const { rows } = await query("UPDATE automation_events SET status='processing',attempts=attempts+1 WHERE id IN (SELECT id FROM automation_events WHERE status IN ('pending','failed') AND next_attempt_at<=now() ORDER BY created_at LIMIT 10 FOR UPDATE SKIP LOCKED) RETURNING id,event_type,payload,appointment_id");
    for (const event of rows) {
      try {
        let appointment={...event.payload,eventId:event.id,id:event.appointment_id};
        if(event.appointment_id){const result=await query('SELECT a.id,a.starts_at,a.ends_at,a.status,a.calendar_event_id,p.full_name name,p.phone,u.email,s.name service,a.patient_message notes FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN users u ON u.id=p.user_id JOIN services s ON s.id=a.service_id WHERE a.id=$1',[event.appointment_id]);if(result.rows[0]){const a=result.rows[0];appointment={...appointment,...a,date:new Date(a.starts_at).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}),time:new Date(a.starts_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'})};}}
        await sendAutomationPayload(appointment,event.event_type);
      } catch(error) { console.error('Outbox retry failed',event.id,error.message); await query("UPDATE automation_events SET status='failed',next_attempt_at=now()+LEAST(interval '1 hour', interval '1 minute' * power(2,LEAST(attempts,6))),last_error=$2 WHERE id=$1",[event.id,error.message]); }
    }
  } catch(error) { if(error.code!=='42P01')console.error('Outbox poll failed:',error.message); }
};

if (!process.env.VERCEL) {
  setInterval(dispatchOutbox, 30000).unref();
  dispatchOutbox();

  app.listen(PORT, () => {
    console.log(`DermaCare Luxe Node.js Backend listening on http://localhost:${PORT}`);
  });
}

export default app;
