import React, { useState, useEffect } from 'react';
import { X, Settings, Server, Check, RefreshCw, Zap, Calendar, MessageSquare, Copy, ExternalLink } from 'lucide-react';

export default function WhatsAppConfigModal({ isOpen, onClose }) {
  const [config, setConfig] = useState({
    enabled: false,
    provider: 'n8n',
    n8nWebhookUrl: '',
    n8nCancelWebhookUrl: '',
    twilio: {
      accountSid: '',
      authToken: '',
      senderNumber: 'whatsapp:+14155238886'
    },
    clinicDetails: {
      name: 'DermaCare Luxe Clinic',
      doctorName: 'Dr. Priya Sharma',
      phone: '+91 9157931095'
    }
  });

  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('n8n'); // 'n8n' | 'settings' | 'logs'
  const [saving, setSaving] = useState(false);
  const [testingN8n, setTestingN8n] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      fetchLogs();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/whatsapp/config');
      const data = await res.json();
      if (data.success && data.data) {
        setConfig(prev => ({ ...prev, ...data.data }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/whatsapp/logs');
      const data = await res.json();
      if (data.success && data.data) {
        setLogs(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleTestN8n = async () => {
    setTestingN8n(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/n8n/test', { method: 'POST' });
      const data = await res.json();
      setTestResult(data.result);
      fetchLogs();
    } catch (e) {
      setTestResult({ success: false, error: e.message });
    } finally {
      setTestingN8n(false);
    }
  };

  const samplePayloadJSON = JSON.stringify({
    event: "appointment.created",
    appointmentId: "DML-351281",
    patientName: "Ananya Mehta",
    patientPhone: "+919876543210",
    patientEmail: "ananya@example.com",
    service: "Acne & Scar Treatment",
    date: "Thursday, August 20, 2026",
    rawDate: "2026-08-20",
    time: "11:30 AM - 12:30 PM",
    googleCalendar: {
      eventId: "",
      summary: "DermaCare Luxe: Acne & Scar Treatment - Ananya Mehta",
      description: "Patient: Ananya Mehta\nPhone: +919876543210\nTreatment: Acne & Scar Treatment",
      startISO: "2026-08-20T11:30:00+05:30",
      endISO: "2026-08-20T12:30:00+05:30",
      timeZone: "Asia/Kolkata"
    },
    whatsappMessageBody: "Hello Ananya Mehta,\nYour appointment at DermaCare Luxe Clinic is confirmed!\nDate: Thursday, August 20, 2026\nTime: 11:30 AM - 12:30 PM"
  }, null, 2);

  const copyPayload = () => {
    navigator.clipboard.writeText(samplePayloadJSON);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B1E36] text-[#DFBA84] text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-[#14B8A6]" />
            n8n Automation &amp; Gateway Admin Portal
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#0B1E36]">
            n8n Workflow (WhatsApp + Google Calendar)
          </h3>
          <p className="text-xs text-slate-500 font-light">
            Connect your website bookings directly to n8n to send WhatsApp messages and auto-create Google Calendar events.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('n8n')}
            className={`pb-3 px-4 font-semibold text-xs transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'n8n'
                ? 'border-[#14B8A6] text-[#0B1E36]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Zap className="w-4 h-4 text-[#14B8A6]" />
            n8n Webhook Setup
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-4 font-semibold text-xs transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-[#14B8A6] text-[#0B1E36]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500" />
            Direct API Gateways
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-4 font-semibold text-xs transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-[#14B8A6] text-[#0B1E36]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Execution Logs ({logs.length})
          </button>
        </div>

        {activeTab === 'n8n' && (
          <div className="space-y-6 animate-fadeIn">
            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                n8n Webhook configuration saved!
              </div>
            )}

            {/* n8n Webhook Form */}
            <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#0B1E36] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#14B8A6]" />
                    n8n Webhook URL
                  </h4>
                  <p className="text-xs text-slate-500">Paste your n8n Webhook Trigger node URL below</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#0B1E36]">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                    className="w-4 h-4 accent-[#14B8A6] rounded"
                  />
                  Active
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Booking Created Webhook</label>
                <input
                  type="url"
                  placeholder="https://n8n.your-domain.com/webhook/dermacare-booking"
                  value={config.n8nWebhookUrl}
                  onChange={e => setConfig({ ...config, n8nWebhookUrl: e.target.value, provider: 'n8n' })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:border-[#14B8A6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Booking Cancelled Webhook (optional)</label>
                <input
                  type="url"
                  placeholder="Leave blank to use same webhook"
                  value={config.n8nCancelWebhookUrl || ''}
                  onChange={e => setConfig({ ...config, n8nCancelWebhookUrl: e.target.value, provider: 'n8n' })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:border-[#14B8A6] outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Use one webhook with `event` routing, or set a separate cancellation workflow URL.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-[#0B1E36] text-[#DFBA84] font-bold text-xs shadow-md hover:bg-[#14B8A6] hover:text-white transition-all"
                >
                  {saving ? 'Saving...' : 'Save n8n Endpoint'}
                </button>

                <button
                  type="button"
                  onClick={handleTestN8n}
                  disabled={testingN8n}
                  className="px-5 py-2.5 rounded-full bg-white border border-[#DFBA84] text-[#0B1E36] font-semibold text-xs shadow-sm hover:bg-[#FAF6EE] transition-all flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-[#14B8A6]" />
                  {testingN8n ? 'Triggering n8n...' : 'Test n8n Webhook'}
                </button>
              </div>

              {testResult && (
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                  <div className="font-semibold text-[#14B8A6]">Test Payload Sent to n8n:</div>
                  <div className="text-[11px] font-mono text-slate-600 truncate">{JSON.stringify(testResult)}</div>
                </div>
              )}
            </div>

            {/* How n8n Automation Works */}
            <div className="space-y-4">
              <h4 className="font-serif font-bold text-base text-[#0B1E36] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#DFBA84]" />
                How n8n Workflow Handles WhatsApp + Google Calendar:
              </h4>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">1</div>
                  <h5 className="font-bold text-xs text-[#0B1E36]">WhatsApp Confirmation Node</h5>
                  <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                    n8n takes `whatsappMessageBody` &amp; `patientPhone` and sends automatic WhatsApp message using <strong>WhatsApp Business API / Evolution API / Twilio</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">2</div>
                  <h5 className="font-bold text-xs text-[#0B1E36]">Google Calendar Event Node</h5>
                  <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                    n8n uses `googleCalendar` to create an event and should return `calendarEventId` so cancellation can delete the same event.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">3</div>
                  <h5 className="font-bold text-xs text-[#0B1E36]">Cancellation Router</h5>
                  <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                    When payload `event` is `appointment.cancelled`, n8n deletes `calendarEventId` and sends cancellation updates.
                  </p>
                </div>
              </div>

              {/* JSON Structure Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Sample JSON Payload sent to n8n:</span>
                  <button
                    onClick={copyPayload}
                    className="text-[11px] text-[#14B8A6] font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedPayload ? 'Copied JSON!' : 'Copy Sample Payload'}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-[#0B1E36] text-[#DFBA84] text-[11px] font-mono overflow-x-auto max-h-40 leading-tight">
                  {samplePayloadJSON}
                </pre>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'settings' && (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Direct Gateway Provider</label>
              <select
                value={config.provider}
                onChange={e => setConfig({ ...config, provider: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium text-[#0B1E36]"
              >
                <option value="n8n">n8n Workflow Automation (Recommended)</option>
                <option value="twilio">Twilio Programmable WhatsApp API</option>
                <option value="meta">Meta Cloud API (Official WhatsApp Business)</option>
                <option value="custom">Custom Webhook Endpoint</option>
              </select>
            </div>

            {config.provider === 'twilio' && (
              <div className="space-y-3 p-4 rounded-2xl border border-slate-200 bg-[#FAF9F6]">
                <h4 className="text-xs font-bold text-[#0B1E36] uppercase tracking-wider">Twilio Credentials</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account SID</label>
                  <input
                    type="text"
                    value={config.twilio.accountSid}
                    onChange={e => setConfig({
                      ...config,
                      twilio: { ...config.twilio, accountSid: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Auth Token</label>
                  <input
                    type="password"
                    value={config.twilio.authToken}
                    onChange={e => setConfig({
                      ...config,
                      twilio: { ...config.twilio, authToken: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-full bg-[#0B1E36] text-[#DFBA84] font-bold text-xs shadow-md hover:bg-[#14B8A6] hover:text-white transition-all"
            >
              {saving ? 'Saving...' : 'Save Direct Gateway Settings'}
            </button>
          </form>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
              <span>Recent 100 delivery attempts</span>
              <button onClick={fetchLogs} className="flex items-center gap-1 hover:text-[#0B1E36]">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No logs found yet. Book an appointment to trigger n8n automation.</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {logs.map((log, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-[#0B1E36]">{log.patientName} ({log.patientPhone})</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        log.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {log.event || 'notification'}: {log.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{log.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
