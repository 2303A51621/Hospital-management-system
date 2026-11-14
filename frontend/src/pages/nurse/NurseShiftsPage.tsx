import { useEffect, useState } from 'react';
import {
  Clock,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Plus,
  ClipboardList,
  FileText,
  X,
  History,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { nursePortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NurseShiftsPage() {
  const [shiftData, setShiftData] = useState<any>(null);
  const [handovers, setHandovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);

  // Handover Modal State
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverForm, setHandoverForm] = useState({
    outgoingShift: 'Morning (07:00 - 15:00)',
    incomingShift: 'Evening (15:00 - 23:00)',
    handoverSummary: '',
    criticalPatientObservations: '',
    pendingMedications: '',
    pendingTasks: '',
  });
  const [submittingHandover, setSubmittingHandover] = useState(false);

  // Acknowledge Modal
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [ackNotes, setAckNotes] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shiftRes, handoverRes] = await Promise.all([
        nursePortalAPI.getShiftStatus(),
        nursePortalAPI.getShiftHandovers(),
      ]);

      setShiftData(shiftRes.data.data);
      setHandovers(handoverRes.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load shift management and handover logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleClock = async () => {
    try {
      setClocking(true);
      const res = await nursePortalAPI.clockInOut({ action: 'toggle' });
      toast.success(res.data.message || 'Shift attendance logged');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update shift punch');
    } finally {
      setClocking(false);
    }
  };

  const handleCreateHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverForm.handoverSummary.trim()) {
      toast.error('Please enter a clinical handover summary');
      return;
    }

    try {
      setSubmittingHandover(true);
      const criticalObsArray = handoverForm.criticalPatientObservations
        ? [{ notes: handoverForm.criticalPatientObservations.trim() }]
        : [];
      const pendingMedsArray = handoverForm.pendingMedications
        ? handoverForm.pendingMedications.split('\n').filter((m) => m.trim())
        : [];
      const pendingTasksArray = handoverForm.pendingTasks
        ? handoverForm.pendingTasks.split('\n').filter((t) => t.trim())
        : [];

      await nursePortalAPI.createShiftHandover({
        outgoingShift: handoverForm.outgoingShift,
        incomingShift: handoverForm.incomingShift,
        handoverSummary: handoverForm.handoverSummary.trim(),
        criticalPatientObservations: criticalObsArray,
        pendingMedications: pendingMedsArray,
        pendingTasks: pendingTasksArray,
      });

      toast.success('Clinical Shift Handover documented successfully');
      setIsHandoverModalOpen(false);
      setHandoverForm({
        outgoingShift: 'Morning (07:00 - 15:00)',
        incomingShift: 'Evening (15:00 - 23:00)',
        handoverSummary: '',
        criticalPatientObservations: '',
        pendingMedications: '',
        pendingTasks: '',
      });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record shift handover');
    } finally {
      setSubmittingHandover(false);
    }
  };

  const handleAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledgingId) return;

    try {
      setAcknowledging(true);
      await nursePortalAPI.acknowledgeShiftHandover(acknowledgingId, {
        acknowledgementNotes: ackNotes.trim() || undefined,
      });

      toast.success('Shift handover acknowledged and signed');
      setAcknowledgingId(null);
      setAckNotes('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to acknowledge handover');
    } finally {
      setAcknowledging(false);
    }
  };

  const isOnDuty = shiftData?.nurse?.shiftStatus === 'on_duty' || shiftData?.currentShift?.status === 'on_duty';
  const attendances = shiftData?.attendanceHistory || [];

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
                  <Clock size={14} />
                  <span>Clinical Duty & Handover</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shift & Handover Console</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live attendance punch clock, shift transition protocols, SBAR handover reports, and relief sign-offs.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
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
                  onClick={() => setIsHandoverModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition"
                >
                  <Plus size={14} />
                  <span>Document Shift Handover</span>
                </button>
              </div>
            </div>

            {/* Shift Duty Status Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                      isOnDuty
                        ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isOnDuty ? '🩺' : '⏸️'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg font-black text-slate-900">
                        {isOnDuty ? 'On Active Nursing Duty' : 'Off Duty'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                          isOnDuty ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isOnDuty ? 'Clocked In' : 'Clocked Out'}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Shift: <strong className="text-slate-800">{shiftData?.nurse?.assignedShift || 'Day Shift'}</strong></span>
                      <span>• Ward: <strong className="text-slate-800">{shiftData?.nurse?.assignedWard || 'ICU / General'}</strong></span>
                      {shiftData?.nurse?.lastClockIn && (
                        <span>
                          • Clocked in at: {new Date(shiftData.nurse.lastClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleClock}
                    disabled={clocking}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition ${
                      isOnDuty
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    }`}
                  >
                    <UserCheck size={16} />
                    <span>{clocking ? 'Logging...' : isOnDuty ? 'Clock Out from Shift' : 'Clock In for Shift'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Handover Records Stream */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={16} className="text-teal-600" />
                  <span>Clinical Shift Handovers (SBAR Reports)</span>
                </h2>
                <span className="text-xs text-slate-500">{handovers.length} recorded handovers</span>
              </div>

              {loading ? (
                <div className="flex h-44 items-center justify-center rounded-2xl bg-white border border-slate-200/80">
                  <RefreshCw size={22} className="animate-spin text-teal-600" />
                </div>
              ) : handovers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <FileText size={24} className="mx-auto text-slate-400" />
                  <p className="mt-2 text-xs font-bold text-slate-800">No shift handovers documented yet</p>
                  <p className="text-[11px] text-slate-500">
                    Use the "Document Shift Handover" button at the end of your shift to record clinical transfer details.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {handovers.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 hover:border-teal-200 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                            {item.outgoingShift || 'Outgoing Shift'} ➔ {item.incomingShift || 'Incoming Shift'}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            By Nurse {item.outgoingNurse?.userId?.name || item.outgoingNurse?.employeeCode || 'Nurse'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.createdAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {item.acknowledged ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              <CheckCircle2 size={12} />
                              Acknowledged
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAcknowledgingId(item._id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition"
                            >
                              Sign & Acknowledge
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          General Shift Summary
                        </div>
                        <p className="text-xs text-slate-800 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 leading-relaxed whitespace-pre-wrap">
                          {item.handoverSummary}
                        </p>
                      </div>

                      {/* Observations, Pending Meds & Tasks */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        {item.criticalPatientObservations && item.criticalPatientObservations.length > 0 && (
                          <div className="bg-rose-50/40 rounded-xl p-3 border border-rose-100 text-xs">
                            <span className="font-bold text-rose-800 block mb-1">Critical Observations:</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-rose-900">
                              {item.criticalPatientObservations.map((obs: any, oidx: number) => (
                                <li key={oidx}>{obs.notes || obs}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.pendingMedications && item.pendingMedications.length > 0 && (
                          <div className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-100 text-xs">
                            <span className="font-bold text-emerald-800 block mb-1">Pending Medications:</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-emerald-900">
                              {item.pendingMedications.map((m: string, midx: number) => (
                                <li key={midx}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.pendingTasks && item.pendingTasks.length > 0 && (
                          <div className="bg-indigo-50/40 rounded-xl p-3 border border-indigo-100 text-xs">
                            <span className="font-bold text-indigo-800 block mb-1">Pending Tasks:</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-indigo-900">
                              {item.pendingTasks.map((t: string, tidx: number) => (
                                <li key={tidx}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {item.acknowledged && item.acknowledgementNotes && (
                        <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/50">
                          <span className="font-semibold text-slate-700">Relief Nurse Notes:</span> "{item.acknowledgementNotes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attendance History */}
            <div className="space-y-3 pt-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History size={16} className="text-teal-600" />
                <span>Duty Attendance Logs</span>
              </h2>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Shift Type</th>
                        <th className="px-4 py-3">Clock In</th>
                        <th className="px-4 py-3">Clock Out</th>
                        <th className="px-4 py-3">Total Hours</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {attendances.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            No attendance records logged yet.
                          </td>
                        </tr>
                      ) : (
                        attendances.map((att: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {new Date(att.date || att.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">{att.shiftType || 'Morning'}</td>
                            <td className="px-4 py-3 text-emerald-700 font-mono">
                              {att.clockInTime ? new Date(att.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '–'}
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-mono">
                              {att.clockOutTime ? new Date(att.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'On Duty'}
                            </td>
                            <td className="px-4 py-3 font-semibold">{att.totalHoursWorked ? `${att.totalHoursWorked} hrs` : '–'}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                {att.status || 'Present'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Handover Creation Modal */}
      {isHandoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList size={17} className="text-teal-600" />
                <span>Document Clinical Shift Handover (SBAR)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsHandoverModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateHandover} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Outgoing Shift</label>
                  <select
                    value={handoverForm.outgoingShift}
                    onChange={(e) => setHandoverForm({ ...handoverForm, outgoingShift: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                  >
                    <option value="Morning (07:00 - 15:00)">Morning (07:00 - 15:00)</option>
                    <option value="Evening (15:00 - 23:00)">Evening (15:00 - 23:00)</option>
                    <option value="Night (23:00 - 07:00)">Night (23:00 - 07:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Incoming Shift</label>
                  <select
                    value={handoverForm.incomingShift}
                    onChange={(e) => setHandoverForm({ ...handoverForm, incomingShift: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                  >
                    <option value="Evening (15:00 - 23:00)">Evening (15:00 - 23:00)</option>
                    <option value="Night (23:00 - 07:00)">Night (23:00 - 07:00)</option>
                    <option value="Morning (07:00 - 15:00)">Morning (07:00 - 15:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Overall Shift Summary <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={handoverForm.handoverSummary}
                  onChange={(e) => setHandoverForm({ ...handoverForm, handoverSummary: e.target.value })}
                  required
                  placeholder="Summarize ward status, admissions, discharges, critical events during your shift..."
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Critical Inpatient Observations</label>
                <textarea
                  rows={2}
                  value={handoverForm.criticalPatientObservations}
                  onChange={(e) => setHandoverForm({ ...handoverForm, criticalPatientObservations: e.target.value })}
                  placeholder="Notes on ICU or unstable patients needing frequent monitoring..."
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pending Medications (One per line)
                </label>
                <textarea
                  rows={2}
                  value={handoverForm.pendingMedications}
                  onChange={(e) => setHandoverForm({ ...handoverForm, pendingMedications: e.target.value })}
                  placeholder="e.g. IV Meropenem 1g due at 16:00 for Bed 4"
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pending Nursing Tasks (One per line)</label>
                <textarea
                  rows={2}
                  value={handoverForm.pendingTasks}
                  onChange={(e) => setHandoverForm({ ...handoverForm, pendingTasks: e.target.value })}
                  placeholder="e.g. Check post-op surgical drain output for Bed 2 at 18:00"
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHandover}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submittingHandover ? 'Submitting...' : 'Sign & Submit Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Acknowledge Modal */}
      {acknowledgingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Acknowledge Clinical Handover</span>
            </h3>

            <form onSubmit={handleAcknowledge} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600">
                By confirming, you certify that you have reviewed the patient status, critical observations, and pending medications for the upcoming shift.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Relief Nurse Acknowledgement Notes (Optional)
                </label>
                <input
                  type="text"
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  placeholder="e.g., Received handover, all beds verified in person."
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAcknowledgingId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={acknowledging}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {acknowledging ? 'Confirming...' : 'Confirm & Take Charge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
