import { useEffect, useState } from 'react';
import {
  Siren,
  Clock,
  User,
  CheckCircle2,
  RefreshCw,
  Flame,
  X,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { nursePortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NurseEmergencyPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Trigger Modal
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [triggerForm, setTriggerForm] = useState({
    patientId: '',
    alertType: 'Code Blue (Cardiac/Resp Arrest)',
    severity: 'critical',
    symptoms: '',
    bp: '',
    pulse: '',
    spo2: '',
    temp: '',
    rr: '',
    actionsTaken: '',
  });
  const [triggering, setTriggering] = useState(false);

  // Resolve Modal
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [resolveForm, setResolveForm] = useState({
    status: 'resolved',
    resolutionNotes: '',
    doctorResponseTimeMinutes: 3,
  });
  const [resolving, setResolving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertRes, patRes] = await Promise.all([
        nursePortalAPI.getEmergencyAlerts(),
        nursePortalAPI.getPatients(),
      ]);

      setAlerts(alertRes.data.data || []);
      setPatients(patRes.data.data || []);

      if (patRes.data.data && patRes.data.data.length > 0 && !triggerForm.patientId) {
        const firstPat = patRes.data.data[0];
        setTriggerForm((prev) => ({
          ...prev,
          patientId: firstPat.patientId?._id || firstPat.patientId || firstPat._id,
        }));
      }
    } catch (err: any) {
      toast.error('Failed to load emergency alert system');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerForm.patientId) {
      toast.error('Please select an inpatient');
      return;
    }
    if (!triggerForm.symptoms.trim()) {
      toast.error('Please describe acute symptoms or emergency condition');
      return;
    }

    try {
      setTriggering(true);
      await nursePortalAPI.triggerEmergencyAlert({
        patientId: triggerForm.patientId,
        alertType: triggerForm.alertType,
        severity: triggerForm.severity,
        symptoms: triggerForm.symptoms.trim(),
        vitalsAtAlert: {
          bp: triggerForm.bp.trim() || undefined,
          pulse: triggerForm.pulse ? Number(triggerForm.pulse) : undefined,
          spo2: triggerForm.spo2 ? Number(triggerForm.spo2) : undefined,
          temp: triggerForm.temp ? Number(triggerForm.temp) : undefined,
          rr: triggerForm.rr ? Number(triggerForm.rr) : undefined,
        },
        actionsTaken: triggerForm.actionsTaken.trim() || undefined,
      });

      toast.error('EMERGENCY CODE BROADCAST TO RAPID RESPONSE TEAM', {
        duration: 6000,
        icon: '🚨',
      });
      setIsTriggerModalOpen(false);
      setTriggerForm({
        patientId: patients[0]?._id || '',
        alertType: 'Code Blue (Cardiac/Resp Arrest)',
        severity: 'critical',
        symptoms: '',
        bp: '',
        pulse: '',
        spo2: '',
        temp: '',
        rr: '',
        actionsTaken: '',
      });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to trigger emergency alert');
    } finally {
      setTriggering(false);
    }
  };

  const handleResolveEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlertId) return;

    try {
      setResolving(true);
      await nursePortalAPI.resolveEmergencyAlert(resolvingAlertId, {
        status: resolveForm.status,
        resolutionNotes: resolveForm.resolutionNotes.trim() || undefined,
        doctorResponseTimeMinutes: Number(resolveForm.doctorResponseTimeMinutes) || undefined,
      });

      toast.success('Emergency alert status updated successfully');
      setIsResolveModalOpen(false);
      setResolvingAlertId(null);
      setResolveForm({
        status: 'resolved',
        resolutionNotes: '',
        doctorResponseTimeMinutes: 3,
      });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update alert resolution');
    } finally {
      setResolving(false);
    }
  };

  const activeAlerts = alerts.filter((a) => a.status === 'active' || a.status === 'in_progress');
  const pastAlerts = alerts.filter((a) => a.status !== 'active' && a.status !== 'in_progress');

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header & Urgent Trigger Banner */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-700">
                  <Siren size={14} className="animate-pulse" />
                  <span>Stat Rapid Response Unit</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Emergency Alerts Console</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Code Blue activation, rapid response team dispatch, real-time resuscitation tracking, and incident resolution.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin text-teal-600' : ''} />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTriggerModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-black shadow-lg shadow-rose-500/25 transition animate-pulse"
                >
                  <Flame size={16} />
                  <span>TRIGGER STAT EMERGENCY</span>
                </button>
              </div>
            </div>

            {/* Active Emergency Broadcast Banner */}
            {activeAlerts.length > 0 && (
              <div className="rounded-2xl border-2 border-rose-500 bg-rose-50/90 p-5 shadow-lg shadow-rose-500/10 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md">
                    <Siren size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black uppercase tracking-wider">
                        ACTIVE STAT CODE ({activeAlerts.length})
                      </span>
                      <span className="text-xs font-bold text-rose-900">
                        Rapid Response Team & Crash Cart Dispatched
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-rose-800">
                      Medical officers on duty and crash team receive immediate auditory push notifications.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-center justify-between text-rose-700 text-xs font-bold">
                  <span>Active Emergency Codes</span>
                  <Siren size={16} />
                </div>
                <div className="mt-3 text-2xl font-black text-rose-900">{activeAlerts.length}</div>
                <div className="mt-1 text-xs text-rose-600 font-medium">Requires immediate bedside presence</div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-center justify-between text-teal-700 text-xs font-bold">
                  <span>Resolved Codes (Last 24h)</span>
                  <CheckCircle2 size={16} />
                </div>
                <div className="mt-3 text-2xl font-black text-slate-900">{pastAlerts.length}</div>
                <div className="mt-1 text-xs text-slate-500">Stabilized & transferred as indicated</div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-center justify-between text-indigo-700 text-xs font-bold">
                  <span>Avg RRT Response Time</span>
                  <Clock size={16} />
                </div>
                <div className="mt-3 text-2xl font-black text-indigo-900">2.8 min</div>
                <div className="mt-1 text-xs text-indigo-600 font-medium">Well within 5-min clinical threshold</div>
              </div>
            </div>

            {/* Active Alerts List */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Active & In-Progress Emergency Codes</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                  {activeAlerts.length} Active
                </span>
              </h2>

              {activeAlerts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                  <p className="mt-2 text-xs font-bold text-slate-800">No active emergency codes at this time</p>
                  <p className="text-[11px] text-slate-500">All inpatient units are currently stable and accounted for.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border-2 border-rose-300 p-5 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-sm">
                            🚨
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-rose-900">{alert.alertType}</span>
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                                {alert.severity || 'Critical'}
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <span className="flex items-center gap-1 font-bold text-slate-800">
                                <User size={13} className="text-teal-600" />
                                {alert.patient?.name || alert.patientName || 'Assigned Inpatient'}
                              </span>
                              <span className="text-slate-400">
                                • {alert.location?.ward || alert.ward || 'Ward'} / Room {alert.location?.roomNumber || alert.roomNumber || '–'} / Bed {alert.location?.bedNumber || alert.bedNumber || '–'}
                              </span>
                              <span className="flex items-center gap-1 text-slate-500">
                                <Clock size={12} />
                                {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setResolvingAlertId(alert._id);
                            setIsResolveModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                        >
                          <CheckCircle2 size={14} />
                          <span>Resolve / Log Outcomes</span>
                        </button>
                      </div>

                      <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100 text-xs text-rose-950">
                        <span className="font-bold">Acute Symptoms:</span> {alert.symptoms}
                      </div>

                      {alert.vitalsAtAlert && (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                          {alert.vitalsAtAlert.bp && (
                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 block">BP</span>
                              <span className="font-bold text-slate-800">{alert.vitalsAtAlert.bp}</span>
                            </div>
                          )}
                          {alert.vitalsAtAlert.pulse && (
                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 block">Pulse</span>
                              <span className="font-bold text-slate-800">{alert.vitalsAtAlert.pulse} bpm</span>
                            </div>
                          )}
                          {alert.vitalsAtAlert.spo2 && (
                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 block">SpO2</span>
                              <span className="font-bold text-rose-600">{alert.vitalsAtAlert.spo2}%</span>
                            </div>
                          )}
                          {alert.vitalsAtAlert.temp && (
                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 block">Temp</span>
                              <span className="font-bold text-slate-800">{alert.vitalsAtAlert.temp} °F</span>
                            </div>
                          )}
                          {alert.vitalsAtAlert.rr && (
                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 block">Resp Rate</span>
                              <span className="font-bold text-slate-800">{alert.vitalsAtAlert.rr} /min</span>
                            </div>
                          )}
                        </div>
                      )}

                      {alert.actionsTaken && (
                        <div className="text-xs text-slate-600">
                          <span className="font-bold text-slate-700">Immediate Nursing Actions:</span> {alert.actionsTaken}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Emergency Logs */}
            <div className="space-y-3 pt-4">
              <h2 className="text-sm font-bold text-slate-900">Incident Archive & Resolved Codes</h2>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                {pastAlerts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No past emergency logs recorded yet.</div>
                ) : (
                  <div className="space-y-3">
                    {pastAlerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{alert.alertType}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              Resolved
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>Inpatient: {alert.patient?.name || alert.patientName || 'Assigned Patient'}</span>
                            <span>• Response time: {alert.doctorResponseTimeMinutes || 3} mins</span>
                            <span>• {new Date(alert.createdAt).toLocaleString()}</span>
                          </div>
                          {alert.resolutionNotes && (
                            <p className="mt-1 text-xs text-slate-600 italic">"{alert.resolutionNotes}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Trigger Modal */}
      {isTriggerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-rose-600 font-black text-base">
                <Siren size={20} />
                <span>Stat Emergency Dispatch Trigger</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTriggerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTriggerEmergency} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Patient <span className="text-rose-500">*</span>
                </label>
                <select
                  value={triggerForm.patientId}
                  onChange={(e) => setTriggerForm({ ...triggerForm, patientId: e.target.value })}
                  required
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="">-- Choose Inpatient --</option>
                  {patients.map((p: any) => {
                    const pat = p.patientId || p;
                    const patName = pat.name || `${pat.firstName || ''} ${pat.lastName || ''}`.trim();
                    return (
                      <option key={p._id || pat._id} value={pat._id || p._id}>
                        {patName} ({p.ward || 'Ward'} - Bed {p.bedNumber || '–'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alert Category</label>
                  <select
                    value={triggerForm.alertType}
                    onChange={(e) => setTriggerForm({ ...triggerForm, alertType: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="Code Blue (Cardiac/Resp Arrest)">Code Blue (Arrest)</option>
                    <option value="Rapid Response (Acute Deterioration)">Rapid Response</option>
                    <option value="Acute Desaturation (<88%)">Acute Desaturation</option>
                    <option value="Severe Hypotension / Shock">Hypotension / Shock</option>
                    <option value="Seizure Activity">Seizure Activity</option>
                    <option value="Inpatient Fall with Injury">Fall with Injury</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={triggerForm.severity}
                    onChange={(e) => setTriggerForm({ ...triggerForm, severity: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="critical">Critical (Immediate STAT)</option>
                    <option value="urgent">Urgent (&lt;10 mins)</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Acute Symptoms & Presentation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={triggerForm.symptoms}
                  onChange={(e) => setTriggerForm({ ...triggerForm, symptoms: e.target.value })}
                  required
                  placeholder="e.g., Unresponsive, gasping respiration, cyanotic lips, no palpable carotid pulse..."
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Immediate Vitals at Bedside (If Accessible)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={triggerForm.bp}
                    onChange={(e) => setTriggerForm({ ...triggerForm, bp: e.target.value })}
                    placeholder="BP (e.g. 70/40)"
                    className="text-xs rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 focus:bg-white focus:outline-none"
                  />
                  <input
                    type="number"
                    value={triggerForm.pulse}
                    onChange={(e) => setTriggerForm({ ...triggerForm, pulse: e.target.value })}
                    placeholder="Pulse (bpm)"
                    className="text-xs rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 focus:bg-white focus:outline-none"
                  />
                  <input
                    type="number"
                    value={triggerForm.spo2}
                    onChange={(e) => setTriggerForm({ ...triggerForm, spo2: e.target.value })}
                    placeholder="SpO2 (%)"
                    className="text-xs rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Actions Taken by Nurse</label>
                <input
                  type="text"
                  value={triggerForm.actionsTaken}
                  onChange={(e) => setTriggerForm({ ...triggerForm, actionsTaken: e.target.value })}
                  placeholder="e.g., CPR cycle initiated, 100% O2 via NRBM, crash cart at bedside"
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTriggerModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={triggering}
                  className="px-5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {triggering ? 'BROADCASTING...' : 'CONFIRM CODE TRIGGER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Log Incident Resolution</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResolveEmergency} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resolution Status</label>
                <select
                  value={resolveForm.status}
                  onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                >
                  <option value="resolved">Patient Stabilized (Code Resolved)</option>
                  <option value="transferred_icu">Transferred to Intensive Care Unit</option>
                  <option value="doctors_arrived">Under Active Physician Management</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physician Response Time (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={resolveForm.doctorResponseTimeMinutes}
                  onChange={(e) => setResolveForm({ ...resolveForm, doctorResponseTimeMinutes: Number(e.target.value) })}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Resolution Notes</label>
                <textarea
                  rows={3}
                  value={resolveForm.resolutionNotes}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })}
                  placeholder="Detail resuscitation outcomes, medications administered by code team, current rhythm, and transfer plan..."
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {resolving ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
