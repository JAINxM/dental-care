import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const readJSON = (filePath, fallback = []) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
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

// Default WhatsApp & Automation Configuration
const DEFAULT_WHATSAPP_CONFIG = {
  enabled: false,
  provider: 'n8n', // Default to n8n for full WhatsApp + Google Calendar automation
  n8nWebhookUrl: '',
  n8nCancelWebhookUrl: '',
  twilio: {
    accountSid: '',
    authToken: '',
    senderNumber: 'whatsapp:+14155238886'
  },
  meta: {
    accessToken: '',
    phoneNumberId: '',
    templateName: 'appointment_confirmation',
    languageCode: 'en_US'
  },
  custom: {
    endpoint: ''
  },
  clinicDetails: {
    name: 'DermaCare Luxe Clinic',
    doctorName: 'Dr. Priya Sharma',
    phone: '+91 9157931095'
  }
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

const updateAppointmentById = (appointmentId, updates) => {
  const appointments = readJSON(APPOINTMENTS_FILE, []);
  let updatedAppointment = null;
  const nextAppointments = appointments.map(appointment => {
    if (appointment.id !== appointmentId) return appointment;
    updatedAppointment = { ...appointment, ...updates };
    return updatedAppointment;
  });

  if (!updatedAppointment) return null;

  writeJSON(APPOINTMENTS_FILE, nextAppointments);
  return updatedAppointment;
};

const getBearerToken = (authorizationHeader = '') => {
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
};

const secureCompare = (a, b) => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  return aBuffer.length === bBuffer.length && crypto.timingSafeEqual(aBuffer, bBuffer);
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
  const config = readJSON(CONFIG_FILE, DEFAULT_WHATSAPP_CONFIG);
  const logs = readJSON(LOGS_FILE, []);
  const isCancellation = eventName === 'appointment.cancelled';

  const logEntry = {
    id: 'log_' + Date.now(),
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
    logs.unshift(logEntry);
    writeJSON(LOGS_FILE, logs.slice(0, 100));
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
  } catch (e) {}

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
        headers: { 'Content-Type': 'application/json' },
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
      logs.unshift(logEntry);
      writeJSON(LOGS_FILE, logs.slice(0, 100));
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
      logs.unshift(logEntry);
      writeJSON(LOGS_FILE, logs.slice(0, 100));
      return { success: true, message: 'Notification logged' };
    }
  } catch (err) {
    logEntry.status = 'failed';
    logEntry.error = err.message || String(err);
    logs.unshift(logEntry);
    writeJSON(LOGS_FILE, logs.slice(0, 100));
    return { success: false, error: err.message };
  }
}

// --- API ENDPOINTS ---

app.get('/api/services', (req, res) => {
  res.json({ success: true, data: SERVICES_DATA });
});

app.get('/api/quiz', (req, res) => {
  res.json({ success: true, data: QUIZ_QUESTIONS });
});

app.get('/api/appointments', (req, res) => {
  const appointments = readJSON(APPOINTMENTS_FILE, []);
  res.json({ success: true, count: appointments.length, data: appointments });
});

app.post('/api/appointments', async (req, res) => {
  const { name, phone, email, service, date, time, notes } = req.body;

  if (!name || !phone || !service || !date || !time) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, phone, service, date, time'
    });
  }

  const appointments = readJSON(APPOINTMENTS_FILE, []);
  const newAppointment = {
    id: 'DML-' + Math.floor(100000 + Math.random() * 900000),
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : '',
    service,
    date,
    time,
    notes: notes || '',
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  appointments.unshift(newAppointment);
  writeJSON(APPOINTMENTS_FILE, appointments);

  // Trigger automated n8n Webhook / WhatsApp + Google Calendar
  const automationResult = await sendAutomationPayload(newAppointment);
  if (automationResult.calendarEventId) {
    newAppointment.calendarEventId = automationResult.calendarEventId;
    updateAppointmentById(newAppointment.id, {
      calendarEventId: automationResult.calendarEventId
    });
  }

  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully!',
    appointment: newAppointment,
    automation: automationResult
  });
});

app.patch('/api/appointments/:id/calendar-event', requireN8nBackendToken, (req, res) => {
  const { id } = req.params;
  const { calendarEventId } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'appointment id is required' });
  }

  if (typeof calendarEventId !== 'string' || !calendarEventId.trim()) {
    return res.status(400).json({ success: false, error: 'calendarEventId is required' });
  }

  const updatedAppointment = updateAppointmentById(id, { calendarEventId: calendarEventId.trim() });
  if (!updatedAppointment) {
    return res.status(404).json({ success: false, error: 'Appointment not found' });
  }

  res.json({
    success: true,
    appointmentId: updatedAppointment.id,
    calendarEventId: updatedAppointment.calendarEventId
  });
});

app.patch('/api/appointments/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const { cancelledBy = 'customer' } = req.body || {};
  const appointments = readJSON(APPOINTMENTS_FILE, []);
  const appointment = appointments.find(app => app.id === id);

  if (!appointment) {
    return res.status(404).json({ success: false, error: 'Appointment not found' });
  }

  const cancelledAppointment = updateAppointmentById(id, {
    status: 'Cancelled',
    cancelledBy,
    cancelledAt: new Date().toISOString()
  });
  const automationResult = await sendAutomationPayload(cancelledAppointment, 'appointment.cancelled', cancelledBy);

  res.json({
    success: true,
    message: 'Appointment cancelled successfully',
    appointment: cancelledAppointment,
    automation: automationResult
  });
});

app.delete('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  let appointments = readJSON(APPOINTMENTS_FILE, []);
  const appointment = appointments.find(app => app.id === id);

  if (!appointment) {
    return res.status(404).json({ success: false, error: 'Appointment not found' });
  }

  const cancelledBy = req.query.cancelledBy || 'admin';
  const automationResult = await sendAutomationPayload(
    { ...appointment, status: 'Cancelled', cancelledAt: new Date().toISOString() },
    'appointment.cancelled',
    cancelledBy
  );
  appointments = appointments.filter(app => app.id !== id);
  writeJSON(APPOINTMENTS_FILE, appointments);
  res.json({
    success: true,
    message: 'Appointment deleted and cancellation sent',
    automation: automationResult
  });
});

app.get('/api/whatsapp/config', (req, res) => {
  const config = readJSON(CONFIG_FILE, DEFAULT_WHATSAPP_CONFIG);
  res.json({ success: true, data: config });
});

app.post('/api/whatsapp/config', (req, res) => {
  const newConfig = { ...DEFAULT_WHATSAPP_CONFIG, ...req.body };
  writeJSON(CONFIG_FILE, newConfig);
  res.json({ success: true, message: 'Configuration saved', data: newConfig });
});

app.get('/api/whatsapp/logs', (req, res) => {
  const logs = readJSON(LOGS_FILE, []);
  res.json({ success: true, data: logs });
});

// Test n8n Webhook Endpoint
app.post('/api/n8n/test', async (req, res) => {
  const dummyAppointment = {
    id: 'TEST-DML-999',
    name: 'Ananya Mehta (Test)',
    phone: '+919876543210',
    email: 'test@example.com',
    service: 'Acne & Scar Treatment',
    date: new Date().toISOString().split('T')[0],
    time: '11:30 AM - 12:30 PM',
    notes: 'Test booking from admin UI',
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  const result = await sendAutomationPayload(dummyAppointment);
  res.json({ success: true, result });
});

app.listen(PORT, () => {
  console.log(`DermaCare Luxe Node.js Backend listening on http://localhost:${PORT}`);
});
