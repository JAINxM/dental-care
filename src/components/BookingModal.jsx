import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, Phone, Mail, FileText, CheckCircle, AlertTriangle, AlertCircle, Sparkles, RefreshCw, XCircle } from 'lucide-react';

/* ============================================================
   CONFIG — edit this block for your own clinic / business
   ============================================================ */
export const CONFIG = {
  // Paste your n8n PRODUCTION webhook URL here after you activate
  // the workflow. It will look like:
  // https://your-instance.app.n8n.cloud/webhook/booking request
  webhookUrl: "https://diri6045.app.n8n.cloud/webhook/booking request",
  cancelWebhookUrl: "https://diri6045.app.n8n.cloud/webhook/cancel-booking",

  business: {
    icon: "🦷",
    name: "BrightSmile Dental Clinic",
    tagline: "Professional dental care, made simple.",
    location: "Surat, Gujarat"
  },

  services: [
    "General Checkup",
    "Teeth Cleaning",
    "Teeth Whitening",
    "Root Canal Treatment",
    "Braces Consultation",
    "Emergency Visit"
  ],

  // ⚠️ These MUST match the "⚙️ Business Settings" node in the
  // n8n workflow, otherwise the form will offer slots that the
  // backend then rejects as unavailable/out of hours.
  hours: {
    opening: "08:00",
    closing: "18:00",
    slotDurationMin: 30,
    bufferMin: 15,
    lunchEnabled: true,
    lunchStart: "13:00",
    lunchEnd: "14:00",
    workingDays: [1, 2, 3, 4, 5, 6], // 0=Sun ... 6=Sat (Sunday closed)
    minNoticeHours: 1,
    maxBookingDays: 30
  },

  // How long to wait for the automation to respond before showing
  // a "we received it, check your email" fallback instead of
  // spinning forever. Relevant when approval_required is ON in
  // n8n, because the webhook then waits for admin approval.
  requestTimeoutMs: 15000
};

/* ============================================================
   TIME-SLOT GENERATION
   Mirrors the "🔍 Check Slot Conflict" logic in n8n so the form
   never offers a slot the backend would reject.
   ============================================================ */
function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function toISODate(d) {
  return d.toISOString().split("T")[0];
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function generateSlotsForDate(dateStr) {
  if (!dateStr) return [];
  const { opening, closing, slotDurationMin, bufferMin,
    lunchEnabled, lunchStart, lunchEnd,
    workingDays, minNoticeHours } = CONFIG.hours;

  const [y, mo, d] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(y, mo - 1, d).getDay();
  if (!workingDays.includes(dayOfWeek)) return [];

  const openMin = timeToMinutes(opening);
  const closeMin = timeToMinutes(closing);
  const lunchStartMin = lunchEnabled ? timeToMinutes(lunchStart) : null;
  const lunchEndMin = lunchEnabled ? timeToMinutes(lunchEnd) : null;
  const spacing = slotDurationMin + bufferMin;

  const now = new Date();
  const isToday = toISODate(now) === dateStr;
  const earliestMin = isToday
    ? (now.getHours() * 60 + now.getMinutes()) + minNoticeHours * 60
    : -Infinity;

  const slots = [];
  for (let start = openMin; start + slotDurationMin <= closeMin; start += spacing) {
    const end = start + slotDurationMin;
    if (lunchEnabled && start < lunchEndMin && end > lunchStartMin) continue;
    if (start < earliestMin) continue;
    slots.push(minutesToTime(start));
  }
  return slots;
}

export default function BookingModal({ isOpen, onClose, initialService = '' }) {
  const today = useMemo(() => new Date(), []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + CONFIG.hours.maxBookingDays);
    return d;
  }, []);

  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    service_type: CONFIG.services[0],
    preferred_date: toISODate(today),
    preferred_time: '',
    message: ''
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [viewState, setViewState] = useState('form'); // 'form' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [conflictData, setConflictData] = useState(null); // { message, suggestedSlots }
  const [successData, setSuccessData] = useState(null); // { result, data }
  const [cancelStatus, setCancelStatus] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Sync initial service
  useEffect(() => {
    if (initialService) {
      const matched = CONFIG.services.find(
        s => s.toLowerCase() === initialService.toLowerCase()
      );
      setFormData(prev => ({ ...prev, service_type: matched || initialService || CONFIG.services[0] }));
    }
  }, [initialService]);

  // Recalculate slots whenever preferred_date changes
  useEffect(() => {
    if (!formData.preferred_date) {
      setAvailableSlots([]);
      setFormData(prev => ({ ...prev, preferred_time: '' }));
      return;
    }

    const slots = generateSlotsForDate(formData.preferred_date);
    setAvailableSlots(slots);

    // Keep current slot if still valid, otherwise pick first available slot
    setFormData(prev => {
      if (slots.includes(prev.preferred_time)) {
        return prev;
      }
      return { ...prev, preferred_time: slots[0] || '' };
    });
  }, [formData.preferred_date]);

  if (!isOpen) return null;

  /* ============================================================
     VALIDATION
     ============================================================ */
  const validateForm = (data) => {
    const errors = {};

    if (!data.service_type) errors.service_type = 'Please select a service';
    if (!data.client_name.trim()) errors.client_name = 'Full name is required';
    if (!/^\S+@\S+\.\S+$/.test(data.client_email)) errors.client_email = 'Valid email is required';
    if (!/^[\d\s+()-]{7,15}$/.test(data.client_phone)) errors.client_phone = 'Valid phone number is required (7-15 digits)';
    if (!data.preferred_date) errors.preferred_date = 'Date is required';
    if (!data.preferred_time) errors.preferred_time = 'Time slot is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ============================================================
     SUBMIT → n8n WEBHOOK
     ============================================================ */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm(formData)) return;

    setLoading(true);
    setErrorMessage('');
    setConflictData(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);

    try {
      const res = await fetch(CONFIG.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: controller.signal
      });
      clearTimeout(timer);

      const payload = await res.json().catch(() => null);
      const result = Array.isArray(payload) ? payload[0] : payload;

      if (!res.ok || !result) {
        setErrorMessage(
          result?.message || result?.validation_error ||
          "The clinic couldn't process your request. Please check your details and try again."
        );
        setViewState('error');
        return;
      }

      if (result.available === false) {
        // Conflict
        setConflictData({
          message: result.validation_error || "That time is already booked. Pick an available alternative below.",
          suggestedSlots: Array.isArray(result.suggestedSlots) ? result.suggestedSlots : []
        });
        setFieldErrors(prev => ({
          ...prev,
          preferred_time: result.validation_error || "Slot unavailable"
        }));
        return;
      }

      // Success
      setSuccessData({ result, data: { ...formData } });
      setViewState('success');

    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        // Likely approval_required = true in n8n — workflow is waiting on admin
        setSuccessData({
          result: { booking_id: null, pending: true },
          data: { ...formData }
        });
        setViewState('success');
      } else {
        setErrorMessage("Couldn't reach the booking service. Check your connection and try again.");
        setViewState('error');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     CANCEL APPOINTMENT
     ============================================================ */
  const handleCancelAppointment = async () => {
    if (!successData?.result?.booking_id) return;
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    setCancelling(true);
    setCancelStatus('');

    try {
      const params = new URLSearchParams({
        booking_id: successData.result.booking_id,
        ...successData.data
      });
      const res = await fetch(`${CONFIG.cancelWebhookUrl}?${params.toString()}`, {
        method: "GET"
      });
      const payload = await res.json().catch(() => null);
      const result = Array.isArray(payload) ? payload[0] : payload;

      if (!res.ok || result?.cancelled === false || result?.canceled === false) {
        throw new Error(result?.message || "The appointment could not be cancelled.");
      }

      setCancelStatus(result?.message || "Appointment cancelled successfully.");
      setSuccessData(prev => ({
        ...prev,
        cancelled: true
      }));
    } catch (err) {
      setCancelStatus(err.message || "Couldn't reach the cancellation service. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const handleApplySuggestedSlot = (slot) => {
    setFormData(prev => ({
      ...prev,
      preferred_date: slot.date,
      preferred_time: slot.time
    }));
    setConflictData(null);
    setFieldErrors(prev => ({ ...prev, preferred_time: null }));
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      client_email: '',
      client_phone: '',
      service_type: CONFIG.services[0],
      preferred_date: toISODate(today),
      preferred_time: '',
      message: ''
    });
    setFieldErrors({});
    setConflictData(null);
    setSuccessData(null);
    setErrorMessage('');
    setCancelStatus('');
    setViewState('form');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-fadeIn max-h-[92vh] overflow-y-auto">

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* VIEW 1: BOOKING FORM */}
        {viewState === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DFBA84]/20 text-[#0B1E36] text-[11px] font-bold uppercase tracking-wider">
                <span className="text-sm">{CONFIG.business.icon}</span>
                {CONFIG.business.name}
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#0B1E36]">
                Book an Appointment
              </h3>
              <p className="text-xs text-slate-500 font-light">
                {CONFIG.business.tagline} • {CONFIG.business.location}
              </p>
            </div>

            {/* Conflict / Alt Slots Box */}
            {conflictData && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
                <div className="flex items-start gap-2 text-amber-800 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{conflictData.message}</span>
                </div>
                {conflictData.suggestedSlots.length > 0 && (
                  <div>
                    <span className="block text-[11px] font-medium text-amber-700 mb-1.5">
                      Suggested alternative slots:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {conflictData.suggestedSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplySuggestedSlot(slot)}
                          className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold border border-amber-300 transition-colors"
                        >
                          {slot.day || slot.date}, {formatTime(slot.time)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Service Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Service *
              </label>
              <select
                value={formData.service_type}
                onChange={e => setFormData({ ...formData, service_type: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] outline-none font-medium text-[#0B1E36] ${fieldErrors.service_type ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                  }`}
              >
                {CONFIG.services.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {fieldErrors.service_type && (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.service_type}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.client_name}
                  onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] outline-none ${fieldErrors.client_name ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                    }`}
                />
              </div>
              {fieldErrors.client_name && (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.client_name}</p>
              )}
            </div>

            {/* Phone & Email */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.client_phone}
                    onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] outline-none ${fieldErrors.client_phone ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                      }`}
                  />
                </div>
                {fieldErrors.client_phone && (
                  <p className="text-[11px] text-red-600 mt-1">{fieldErrors.client_phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="rahul@example.com"
                    value={formData.client_email}
                    onChange={e => setFormData({ ...formData, client_email: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] outline-none ${fieldErrors.client_email ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                      }`}
                  />
                </div>
                {fieldErrors.client_email && (
                  <p className="text-[11px] text-red-600 mt-1">{fieldErrors.client_email}</p>
                )}
              </div>
            </div>

            {/* Date & Time Slot */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={toISODate(today)}
                    max={toISODate(maxDate)}
                    value={formData.preferred_date}
                    onChange={e => setFormData({ ...formData, preferred_date: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:border-[#14B8A6] outline-none font-medium text-[#0B1E36] ${fieldErrors.preferred_date ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                      }`}
                  />
                </div>
                {fieldErrors.preferred_date && (
                  <p className="text-[11px] text-red-600 mt-1">{fieldErrors.preferred_date}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Available Slot *
                </label>
                <select
                  disabled={availableSlots.length === 0}
                  value={formData.preferred_time}
                  onChange={e => setFormData({ ...formData, preferred_time: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white focus:border-[#14B8A6] outline-none font-medium text-[#0B1E36] disabled:bg-slate-100 disabled:text-slate-400 ${fieldErrors.preferred_time ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                    }`}
                >
                  {availableSlots.length === 0 ? (
                    <option value="">No slots available this day</option>
                  ) : (
                    availableSlots.map(t => (
                      <option key={t} value={t}>
                        {formatTime(t)}
                      </option>
                    ))
                  )}
                </select>
                {fieldErrors.preferred_time && (
                  <p className="text-[11px] text-red-600 mt-1">{fieldErrors.preferred_time}</p>
                )}
              </div>
            </div>

            {/* Additional Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Message / Symptoms (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="Mention any dental issue, pain level or past treatment..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#14B8A6] outline-none resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || availableSlots.length === 0}
              className="w-full py-3.5 rounded-full bg-[#0B1E36] text-[#DFBA84] font-bold text-sm shadow-xl hover:bg-[#14B8A6] hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending…</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* VIEW 2: SUCCESS PANEL */}
        {viewState === 'success' && successData && (
          <div className="text-center space-y-5 py-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs uppercase tracking-wider text-[#DFBA84] font-bold">
                {successData.result.pending ? 'Request Pending Review' : 'Appointment Confirmed'}
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#0B1E36]">
                {successData.result.pending ? 'Request Received!' : 'Booking Successful!'}
              </h3>
              <p className="text-xs text-slate-600 px-4">
                {successData.result.pending
                  ? "Thank you. Your request needs a quick review — you'll get a confirmation email shortly."
                  : "Thank you for choosing us. Your appointment request has been received."}
              </p>
            </div>

            {/* Booking Details */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200 text-left space-y-1.5 text-xs">
              <div><span className="text-slate-500">Service:</span> <strong>{successData.data.service_type}</strong></div>
              <div><span className="text-slate-500">Date:</span> <strong>{successData.data.preferred_date}</strong></div>
              <div><span className="text-slate-500">Time:</span> <strong>{formatTime(successData.data.preferred_time)}</strong></div>
              <div><span className="text-slate-500">Patient:</span> <strong>{successData.data.client_name}</strong></div>
              {successData.result.booking_id && (
                <div className="pt-1 border-t border-slate-200 mt-1">
                  <span className="text-slate-500">Booking ID:</span> <strong className="text-[#0B1E36] font-mono">{successData.result.booking_id}</strong>
                </div>
              )}
            </div>

            {/* Cancellation Status & Action */}
            {cancelStatus && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
                {cancelStatus}
              </div>
            )}

            {successData.result.booking_id && !successData.cancelled && (
              <button
                type="button"
                onClick={handleCancelAppointment}
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold underline underline-offset-4 disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel appointment</span>
                  </>
                )}
              </button>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Book Another
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-full bg-[#0B1E36] hover:bg-[#14B8A6] text-[#DFBA84] hover:text-white font-semibold text-xs shadow-md transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: ERROR PANEL */}
        {viewState === 'error' && (
          <div className="text-center space-y-5 py-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif text-2xl font-bold text-[#0B1E36]">
                Unable to Complete Booking
              </h3>
              <p className="text-xs text-red-600 max-w-sm mx-auto">
                {errorMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setViewState('form')}
              className="px-6 py-3 rounded-full bg-[#0B1E36] text-[#DFBA84] hover:bg-[#14B8A6] hover:text-white font-semibold text-xs shadow-md transition-all"
            >
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

