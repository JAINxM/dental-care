import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const CONFIG_FILE = path.join(DATA_DIR, 'whatsapp_config.json');
const LOGS_FILE = path.join(DATA_DIR, 'whatsapp_logs.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const readJSON = (filePath, fallback = []) => {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
};

const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
};

const DEFAULT_WHATSAPP_CONFIG = {
  enabled: true,
  provider: 'n8n',
  n8nWebhookUrl: 'https://ravaljainam.app.n8n.cloud/webhook-test/dermacare/booking-created',
  n8nCancelWebhookUrl: 'https://ravaljainam.app.n8n.cloud/webhook-test/dermacare/booking-cancelled',
  twilio: { accountSid: '', authToken: '', senderNumber: 'whatsapp:+14155238886' },
  meta: { accessToken: '', phoneNumberId: '', templateName: 'appointment_confirmation', languageCode: 'en_US' },
  custom: { endpoint: '' },
  clinicDetails: {
    name: 'DermaCare Luxe Clinic',
    doctorName: 'Dr. Priya Sharma',
    phone: '+91 9157931095'
  }
};

const SERVICES_DATA = [
  { id: 'acne', name: 'Acne & Scar Treatment', icon: 'droplets', desc: 'Shatter active acne and stimulate dermis repair using therapeutic gold-standard peels and non-ablative RF microneedling.', duration: '45 - 60 min', sessions: '3 - 5 Sessions', recovery: '1 - 2 Days', idealFor: 'Pitted scars, hyperpigmentation, active congestion.', category: 'Acne & Scars', efficacy: '97%', fullDetails: 'Combining medical chemical peeling with high-frequency RF needling targets root causes.' },
  { id: 'hair-loss', name: 'Hair Loss Therapy (PRP)', icon: 'wind', desc: 'Clinical autologous growth factors injected into the scalp to restore thinning crown density and reactivate dormant follicles.', duration: '60 min', sessions: '4 - 6 Sessions', recovery: 'Immediate', idealFor: 'Weak roots, crown thinning, stress-induced shedding.', category: 'Hair Care', efficacy: '94%', fullDetails: 'PRP concentrates healing growth factors from your own blood and targets sparse scalp areas.' },
  { id: 'eczema', name: 'Skin Allergy & Eczema', icon: 'shield', desc: 'Advanced patch testing, barrier-repair formulas, and tailored protocols to manage chronic dermatitis.', duration: '30 min', sessions: 'Ongoing', recovery: 'None', idealFor: 'Extreme flaking, dynamic rashes, histamine triggers.', category: 'Allergy', efficacy: '98%', fullDetails: 'We isolate allergens through clinical patch diagnostics and reconstruct damaged moisture barriers.' },
  { id: 'laser-resurfacing', name: 'Laser Resurfacing', icon: 'zap', desc: 'Fractional CO2 laser grids to clear deep expression lines and shrink enlarged pores.', duration: '45 min', sessions: '2 - 4 Sessions', recovery: '3 - 5 Days', idealFor: 'Static wrinkles, sun damage, deep textural pits.', category: 'Laser', efficacy: '96%', fullDetails: 'Fractional laser energy remodels damaged skin and stimulates dermal repair.' },
  { id: 'botox', name: 'Anti-Aging & Botox', icon: 'sparkles', desc: 'Erase expression furrows and restore volume using premium neuromodulators and fillers.', duration: '30 min', sessions: '4 - 6 Months', recovery: 'Minimal', idealFor: 'Crow\'s feet, forehead lines, sunken cheeks.', category: 'Anti-Aging', efficacy: '99%', fullDetails: 'Strategic injectables restore a rested appearance while preserving natural expressions.' },
  { id: 'pigmentation', name: 'Pigmentation Correction', icon: 'sun', desc: 'Q-Switched Nd:YAG lasers and tailored botanical lighteners to address melasma and sun freckles.', duration: '45 min', sessions: '4 - 6 Sessions', recovery: 'Minimal', idealFor: 'Patchy cheek melasma, dark sun spots, uneven tone.', category: 'Pigmentation', efficacy: '95%', fullDetails: 'Laser and brightening protocols target concentrated melanin while protecting the skin surface.' },
  { id: 'cosmetic', name: 'Cosmetic Dermatology', icon: 'star', desc: 'Medical-grade Hydrafacials and skin boosters for an ultra-dewy glow.', duration: '75 min', sessions: 'Monthly', recovery: '12 Hours', idealFor: 'Bridal prep, dry dull complexion, glow maintenance.', category: 'Cosmetic', efficacy: '98%', fullDetails: 'A multi-step medical facial cleanses, hydrates and replenishes the skin.' }
];

const QUIZ_QUESTIONS = [
  { concern: 'Acne & Deep Scars', treatment: 'Acne & Scar Treatment', duration: '45-60 min', code: 'acne', resultText: 'Dr. Priya\'s signature microneedling RF and blue-light protocol is clinically tailored for this.' },
  { concern: 'Hair Shedding / Baldness', treatment: 'Hair Loss Therapy (PRP)', duration: '60 min', code: 'hair-loss', resultText: 'Our high-density autologous growth factor PRP injections help reactivate follicles.' },
  { concern: 'Dark Spots & Melasma', treatment: 'Pigmentation Correction', duration: '45 min', code: 'pigmentation', resultText: 'Q-Switched lasers coupled with medical brightening peels will restore an even complexion.' },
  { concern: 'Wrinkles & Loss of Volume', treatment: 'Anti-Aging & Botox', duration: '30 min', code: 'botox', resultText: 'FDA-approved neuromodulators and fillers restore volume while preserving expressions.' }
];

const getConfig = () => {
  const stored = readJSON(CONFIG_FILE, {});
  return {
    ...DEFAULT_WHATSAPP_CONFIG,
    ...stored,
    n8nWebhookUrl: process.env.N8N_BOOKING_WEBHOOK_URL || stored.n8nWebhookUrl || DEFAULT_WHATSAPP_CONFIG.n8nWebhookUrl,
    n8nCancelWebhookUrl: process.env.N8N_CANCEL_WEBHOOK_URL || stored.n8nCancelWebhookUrl || DEFAULT_WHATSAPP_CONFIG.n8nCancelWebhookUrl
  };
};

const getN8nToken = () => process.env.N8N_BACKEND_TOKEN || '';

const requireN8nAuth = (req, res, next) => {
  const expected = getN8nToken();
  const header = req.get('authorization') || '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!expected) {
    return res.status(500).json({ success: false, error: 'N8N_BACKEND_TOKEN is not configured on the backend.' });
  }
  if (!supplied || supplied !== expected) {
    return res.status(401).json({ success: false, error: 'Unauthorized n8n request.' });
  }
  next();
};

const parseTimeSlot = (date, time) => {
  const match = String(time || '').match(/^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i);
  if (!match) return { startISO: `${date}T10:00:00+05:30`, endISO: `${date}T11:00:00+05:30` };

  const to24 = (hour, meridiem) => {
    let h = Number(hour);
    if (meridiem.toUpperCase() === 'AM') return h === 12 ? 0 : h;
    return h === 12 ? 12 : h + 12;
  };

  const startHour = to24(match[1], match[3]);
  const endHour = to24(match[4], match[6]);
  return {
    startISO: `${date}T${String(startHour).padStart(2, '0')}:${match[2]}:00+05:30`,
    endISO: `${date}T${String(endHour).padStart(2, '0')}:${match[5]}:00+05:30`
  };
};

const postToN8n = async (url, payload) => {
  if (!url || !url.startsWith('http')) return { sent: false, reason: 'Webhook URL is not configured.' };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`n8n webhook returned ${response.status}: ${text.slice(0, 300)}`);
  return { sent: true, status: response.status, response: text.slice(0, 300) };
};

const sendAutomationPayload = async (appointment) => {
  const config = getConfig();
  const logs = readJSON(LOGS_FILE, []);
  const { startISO, endISO } = parseTimeSlot(appointment.date, appointment.time);
  const formattedDate = appointment.date ? new Date(`${appointment.date}T00:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  const payload = {
    event: 'appointment.created',
    appointmentId: appointment.id,
    patientName: appointment.name,
    patientPhone: appointment.phone,
    patientEmail: appointment.email || '',
    service: appointment.service,
    rawDate: appointment.date,
    time: appointment.time,
    calendarEventId: appointment.calendarEventId || '',
    googleCalendar: {
      summary: `DermaCare Luxe Clinic: ${appointment.service} - ${appointment.name}`,
      description: `Patient: ${appointment.name}\nPhone: ${appointment.phone}\nEmail: ${appointment.email || 'N/A'}\nService: ${appointment.service}\nNotes: ${appointment.notes || 'None'}`,
      startISO,
      endISO,
      timeZone: 'Asia/Kolkata'
    },
    whatsappMessageBody: `Hello ${appointment.name},\n\nYour appointment at ${config.clinicDetails?.name || 'DermaCare Luxe Clinic'} is confirmed!\n\nBooking ID: ${appointment.id}\nDoctor: ${config.clinicDetails?.doctorName || 'Dr. Priya Sharma'}\nService: ${appointment.service}\nDate: ${formattedDate}\nTime: ${appointment.time}\n\nA calendar invite has been added for your visit. Thank you!`
  };

  try {
    const result = config.enabled && (config.provider === 'n8n' || config.n8nWebhookUrl)
      ? await postToN8n(config.n8nWebhookUrl, payload)
      : { sent: false, reason: 'Automation disabled.' };
    logs.unshift({ id: `log_${Date.now()}`, timestamp: new Date().toISOString(), patientName: appointment.name, patientPhone: appointment.phone, appointmentId: appointment.id, status: result.sent ? 'success' : 'skipped', provider: 'n8n', message: payload.whatsappMessageBody, error: null });
    writeJSON(LOGS_FILE, logs.slice(0, 100));
    return { success: true, provider: 'n8n', payload, n8n: result };
  } catch (err) {
    logs.unshift({ id: `log_${Date.now()}`, timestamp: new Date().toISOString(), patientName: appointment.name, patientPhone: appointment.phone, appointmentId: appointment.id, status: 'failed', provider: 'n8n', message: payload.whatsappMessageBody, error: err.message });
    writeJSON(LOGS_FILE, logs.slice(0, 100));
    return { success: false, error: err.message, payload };
  }
};

const sendCancellationPayload = async (appointment, cancelledBy = 'customer') => {
  const config = getConfig();
  const payload = {
    event: 'appointment.cancelled',
    appointmentId: appointment.id,
    patientName: appointment.name,
    patientPhone: appointment.phone,
    patientEmail: appointment.email || '',
    service: appointment.service,
    rawDate: appointment.date,
    time: appointment.time,
    status: 'Cancelled',
    cancelledBy,
    calendarEventId: appointment.calendarEventId || '',
    googleCalendar: { eventId: appointment.calendarEventId || '' },
    whatsappMessageBody: `Hello ${appointment.name},\n\nYour appointment ${appointment.id} at ${config.clinicDetails?.name || 'DermaCare Luxe Clinic'} has been cancelled.\n\nService: ${appointment.service}\nDate: ${appointment.date}\nTime: ${appointment.time}\n\nPlease contact us if you would like to reschedule.`
  };

  if (!config.enabled || !config.n8nCancelWebhookUrl) return { success: true, skipped: true, payload };
  try {
    const n8n = await postToN8n(config.n8nCancelWebhookUrl, payload);
    return { success: true, payload, n8n };
  } catch (err) {
    return { success: false, error: err.message, payload };
  }
};

app.get('/api/services', (req, res) => res.json({ success: true, data: SERVICES_DATA }));
app.get('/api/quiz', (req, res) => res.json({ success: true, data: QUIZ_QUESTIONS }));

app.get('/api/appointments', (req, res) => {
  const appointments = readJSON(APPOINTMENTS_FILE, []);
  res.json({ success: true, count: appointments.length, data: appointments });
});

app.post('/api/appointments', async (req, res) => {
  const { name, phone, email, service, date, time, notes } = req.body || {};
  if (!name || !phone || !service || !date || !time) return res.status(400).json({ success: false, error: 'Missing required fields: name, phone, service, date, time' });

  const appointments = readJSON(APPOINTMENTS_FILE, []);
  const newAppointment = {
    id: `DML-${Math.floor(100000 + Math.random() * 900000)}`,
    name: String(name).trim(), phone: String(phone).trim(), email: email ? String(email).trim() : '', service, date, time, notes: notes || '', status: 'Confirmed', createdAt: new Date().toISOString(), calendarEventId: ''
  };

  appointments.unshift(newAppointment);
  if (!writeJSON(APPOINTMENTS_FILE, appointments)) return res.status(500).json({ success: false, error: 'Unable to persist appointment.' });

  const automation = await sendAutomationPayload(newAppointment);
  res.status(201).json({ success: true, message: 'Appointment booked successfully!', appointment: newAppointment, automation });
});

app.patch('/api/appointments/:id/calendar-event', requireN8nAuth, (req, res) => {
  const { id } = req.params;
  const calendarEventId = typeof req.body?.calendarEventId === 'string' ? req.body.calendarEventId.trim() : '';
  if (!calendarEventId) return res.status(400).json({ success: false, error: 'calendarEventId is required.' });

  const appointments = readJSON(APPOINTMENTS_FILE, []);
  const index = appointments.findIndex((appointment) => appointment.id === id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Appointment not found.' });

  appointments[index].calendarEventId = calendarEventId;
  if (!writeJSON(APPOINTMENTS_FILE, appointments)) return res.status(500).json({ success: false, error: 'Unable to persist calendarEventId.' });

  res.status(200).json({ success: true, appointmentId: id, calendarEventId });
});

app.patch('/api/appointments/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const cancelledBy = req.body?.cancelledBy || 'customer';
  const appointments = readJSON(APPOINTMENTS_FILE, []);
  const index = appointments.findIndex((appointment) => appointment.id === id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Appointment not found.' });

  const appointment = { ...appointments[index], status: 'Cancelled' };
  appointments[index] = appointment;
  if (!writeJSON(APPOINTMENTS_FILE, appointments)) return res.status(500).json({ success: false, error: 'Unable to persist cancellation.' });

  const automation = await sendCancellationPayload(appointment, cancelledBy);
  res.json({ success: true, appointment, automation });
});

app.delete('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const cancelledBy = req.query.cancelledBy || 'admin';
  const appointments = readJSON(APPOINTMENTS_FILE, []);
  const appointment = appointments.find((item) => item.id === id);
  if (!appointment) return res.status(404).json({ success: false, error: 'Appointment not found' });

  const cancellation = await sendCancellationPayload({ ...appointment, status: 'Cancelled' }, cancelledBy);
  const remaining = appointments.filter((item) => item.id !== id);
  if (!writeJSON(APPOINTMENTS_FILE, remaining)) return res.status(500).json({ success: false, error: 'Unable to delete appointment.' });

  res.json({ success: true, message: 'Appointment cancelled and deleted successfully', cancellation });
});

app.get('/api/whatsapp/config', (req, res) => res.json({ success: true, data: getConfig() }));
app.post('/api/whatsapp/config', (req, res) => {
  const current = getConfig();
  const next = { ...current, ...req.body, n8nWebhookUrl: req.body?.n8nWebhookUrl || current.n8nWebhookUrl, n8nCancelWebhookUrl: req.body?.n8nCancelWebhookUrl || current.n8nCancelWebhookUrl };
  if (!writeJSON(CONFIG_FILE, next)) return res.status(500).json({ success: false, error: 'Unable to save configuration.' });
  res.json({ success: true, message: 'Configuration saved', data: next });
});

app.get('/api/whatsapp/logs', (req, res) => res.json({ success: true, data: readJSON(LOGS_FILE, []) }));

app.post('/api/n8n/test', async (req, res) => {
  const dummyAppointment = {
    id: 'TEST-DML-999', name: 'Ananya Mehta (Test)', phone: '+919876543210', email: 'test@example.com', service: 'Acne & Scar Treatment', date: new Date().toISOString().split('T')[0], time: '11:30 AM - 12:30 PM', notes: 'Test booking from admin UI', status: 'Confirmed', createdAt: new Date().toISOString(), calendarEventId: ''
  };
  res.json(await sendAutomationPayload(dummyAppointment));
});

app.get('/api/health', (req, res) => res.json({ success: true, service: 'DermaCare Luxe API' }));

// Local development only. Vercel imports the app as a serverless function.
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`DermaCare Luxe Node.js Backend listening on http://localhost:${PORT}`));
}

export default app;
