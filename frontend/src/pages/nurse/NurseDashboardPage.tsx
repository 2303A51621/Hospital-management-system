import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Activity,
  Pill,
  ClipboardList,
  AlertTriangle,
  Siren,
  Clock,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  HeartPulse,
  Thermometer,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { nursePortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NurseDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await nursePortalAPI.getDashboard();
      setData(res.data.data);
    } catch (err: any) {
      toast.error('Failed to load nurse clinical dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleToggleClock = async () => {
    try {
      setClocking(true);
      const res = await nursePortalAPI.clockInOut({ action: 'toggle' });
      toast.success(res.data.message || 'Shift attendance updated');
      loadDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update shift status');
    } finally {
      setClocking(false);
    }
  };

  const stats = data?.stats || {};
  const nurse = data?.nurse || {};
  const criticalPatients = data?.criticalPatients || [];
  const assignedPatients = data?.assignedPatients || [];
  const todayTasks = data?.todayTasks || [];
  const recentVitals = data?.recentVitals || [];
  const emergencyAlerts = data?.emergencyAlerts || [];

  const isOnDuty = nurse.currentShiftStatus === 'on_duty';

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Clinical Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b2545] via-[#134074] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl shadow-cyan-950/10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl" />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20 text-teal-100 mb-2">
                    <HeartPulse size={14} className="text-teal-300" />
                    Inpatient Clinical Nursing Station • {nurse.assignedWardName || 'General Ward A'}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Welcome, {nurse.name || 'Nurse Specialist'}
                  </h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-2xl">
                    Shift: <strong className="text-white capitalize">{nurse.shift || 'Morning'}</strong> | Nurse ID: <span className="font-mono">{nurse.nurseId || 'NUR'}</span> | Department: {nurse.department || 'Inpatient'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleToggleClock}
                    disabled={clocking}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                      isOnDuty
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/30'
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-900/30'
                    }`}
                  >
                    <Clock size={15} />
                    {isOnDuty ? 'On Duty (Click to Clock Out)' : 'Off Duty (Click to Clock In)'}
                  </button>

                  <button
                    onClick={loadDashboard}
                    className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition"
                    title="Refresh data"
                  >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  </button>

                  <Link
                    to="/nurse/emergency"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-950/30"
                  >
                    <Siren size={15} className="animate-bounce" />
                    Emergency Stat Call
                  </Link>
                </div>
              </div>
            </div>

            {/* Critical Patient Alert Banner (if any) */}
            {criticalPatients.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-rose-900/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <ShieldAlert size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                      <span>CRITICAL ATTENTION REQUIRED: {criticalPatients.length} Patient(s) High Acuity</span>
                    </h3>
                    <p className="text-xs text-rose-800">
                      {criticalPatients.map((c: any) => `${c.patientId?.userId?.name || 'Patient'} (${c.roomNumber || 'ICU'})`).join(', ')}
                    </p>
                  </div>
                </div>
                <Link
                  to="/nurse/patients?priority=critical"
                  className="inline-flex items-center gap-1 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white px-3.5 py-2 rounded-xl shrink-0"
                >
                  Inspect Critical Beds →
                </Link>
              </div>
            )}

            {/* Core KPI Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="clinical-card p-4 bg-white border border-slate-200">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Assigned</span>
                  <Users size={16} className="text-teal-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{stats.totalAssignedPatients ?? 0}</div>
                <div className="text-[10px] text-teal-700 font-semibold mt-1">Inpatient Census</div>
              </div>

              <div className="clinical-card p-4 bg-white border border-slate-200">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Under Care</span>
                  <UserCheck size={16} className="text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{stats.patientsUnderCare ?? 0}</div>
                <div className="text-[10px] text-blue-700 font-semibold mt-1">Active Bed Care</div>
              </div>

              <div className="clinical-card p-4 bg-white border border-slate-200">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Tasks</span>
                  <ClipboardList size={16} className="text-amber-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{stats.pendingTasksCount ?? 0}</div>
                <div className="text-[10px] text-amber-700 font-semibold mt-1">{stats.overdueTasksCount ?? 0} Overdue</div>
              </div>

              <div className="clinical-card p-4 bg-white border border-slate-200">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Meds Due</span>
                  <Pill size={16} className="text-purple-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{stats.medicationsDueCount ?? 0}</div>
                <div className="text-[10px] text-purple-700 font-semibold mt-1">{stats.medicationsAdministeredToday ?? 0} Administered</div>
              </div>

              <div className="clinical-card p-4 bg-white border border-slate-200">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Critical</span>
                  <AlertTriangle size={16} className="text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-600">{stats.criticalPatientsCount ?? 0}</div>
                <div className="text-[10px] text-rose-700 font-semibold mt-1">{stats.urgentPatientsCount ?? 0} Urgent</div>
              </div>

              <div className="clinical-card p-4 bg-white border border-slate-200">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Task Rate</span>
                  <TrendingUp size={16} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600">{stats.taskCompletionRate ?? 85}%</div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-1">Compliance Rate</div>
              </div>
            </div>

            {/* Middle Section: Assigned Patients Quick Table & Nursing Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 Cols): Assigned Patients Under Active Care */}
              <div className="lg:col-span-2 clinical-card p-5 sm:p-6 bg-white border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Assigned Inpatients</h3>
                    <p className="text-xs text-slate-500">Direct patient assignments for your current ward shift</p>
                  </div>
                  <Link
                    to="/nurse/patients"
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900"
                  >
                    View All Patients <ArrowRight size={13} />
                  </Link>
                </div>

                {assignedPatients.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No patients currently assigned.</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Patient</th>
                          <th className="py-2.5 px-3">Room / Bed</th>
                          <th className="py-2.5 px-3">Ward</th>
                          <th className="py-2.5 px-3">Acuity</th>
                          <th className="py-2.5 px-3 text-right">Quick Care</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {assignedPatients.map((a: any) => {
                          const p = a.patientId || {};
                          const user = p.userId || {};
                          const isCrit = a.priority === 'critical';
                          const isUrg = a.priority === 'urgent';

                          return (
                            <tr key={a._id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900">{user.name || 'Patient'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{p.patientId || 'ID'}</div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-800">{a.roomNumber || 'Room 101'}</div>
                                <div className="text-[10px] text-slate-500">{a.bedNumber || 'Bed 01'}</div>
                              </td>
                              <td className="py-3 px-3 text-slate-600 font-medium">{a.wardName || 'General Ward A'}</td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                    isCrit
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                      : isUrg
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {a.priority || 'Normal'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right space-x-1">
                                <Link
                                  to={`/nurse/vitals?patientId=${p._id}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded border border-teal-200"
                                  title="Record vitals"
                                >
                                  <Thermometer size={12} /> Vitals
                                </Link>
                                <Link
                                  to={`/nurse/medications?patientId=${p._id}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded border border-purple-200"
                                  title="Administer Meds"
                                >
                                  <Pill size={12} /> eMAR
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column (1 Col): Shift Action Hub & Pending Tasks */}
              <div className="space-y-6">
                {/* Shift Quick Hub */}
                <div className="clinical-card p-5 bg-gradient-to-br from-slate-900 to-[#0e2a47] text-white space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-300">
                      Nursing Duty Controls
                    </span>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isOnDuty ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="text-xl font-black">{nurse.assignedWardName || 'General Inpatient Station'}</div>
                    <div className="text-xs text-slate-300 mt-0.5">Shift: {nurse.shift?.toUpperCase() || 'MORNING'}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                    <Link
                      to="/nurse/vitals"
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-center text-xs font-bold transition flex flex-col items-center gap-1"
                    >
                      <Activity size={18} className="text-teal-300" />
                      <span>Take Vitals</span>
                    </Link>
                    <Link
                      to="/nurse/medications"
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-center text-xs font-bold transition flex flex-col items-center gap-1"
                    >
                      <Pill size={18} className="text-purple-300" />
                      <span>Medication</span>
                    </Link>
                    <Link
                      to="/nurse/notes"
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-center text-xs font-bold transition flex flex-col items-center gap-1"
                    >
                      <ClipboardList size={18} className="text-blue-300" />
                      <span>Progress Note</span>
                    </Link>
                    <Link
                      to="/nurse/shifts"
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-center text-xs font-bold transition flex flex-col items-center gap-1"
                    >
                      <Clock size={18} className="text-amber-300" />
                      <span>Handover</span>
                    </Link>
                  </div>
                </div>

                {/* Today's Nursing Tasks list */}
                <div className="clinical-card p-5 bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-900">Priority Nursing Tasks</h3>
                    <Link to="/nurse/tasks" className="text-[11px] font-bold text-teal-700 hover:underline">
                      All Tasks ({stats.pendingTasksCount || 0})
                    </Link>
                  </div>

                  {todayTasks.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">All nursing care tasks up to date!</div>
                  ) : (
                    <div className="space-y-2">
                      {todayTasks.slice(0, 4).map((t: any) => (
                        <div
                          key={t._id}
                          className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-800 line-clamp-1">{t.title}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {t.patientId?.userId?.name || 'Patient'} • Due:{' '}
                              {new Date(t.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              t.priority === 'urgent'
                                ? 'bg-rose-100 text-rose-800'
                                : t.priority === 'high'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Recent Vitals Stream & Emergency Log */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Vitals Recorded */}
              <div className="clinical-card p-5 sm:p-6 bg-white border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Recent Vital Signs Logs</h3>
                    <p className="text-xs text-slate-500">Live hemodynamic values recorded across your ward beds</p>
                  </div>
                  <Link to="/nurse/vitals" className="text-xs font-bold text-teal-700 hover:underline">
                    Vitals Center →
                  </Link>
                </div>

                {recentVitals.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No vitals logged today yet.</div>
                ) : (
                  <div className="space-y-2.5">
                    {recentVitals.map((v: any) => (
                      <div
                        key={v._id}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          v.isAbnormal ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50/50 border-slate-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {v.patientId?.userId?.name || 'Inpatient'}
                            </span>
                            {v.isAbnormal && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                Abnormal Flag
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Logged on {new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span className="text-slate-700">BP: <strong>{v.bloodPressure?.systolic}/{v.bloodPressure?.diastolic}</strong></span>
                          <span className="text-slate-700">HR: <strong>{v.heartRate}</strong> bpm</span>
                          <span className={v.oxygenSaturation < 94 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                            SpO2: <strong>{v.oxygenSaturation}%</strong>
                          </span>
                          <span className="text-slate-700">Temp: <strong>{v.temperature}°F</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emergency Alerts & Incident Stream */}
              <div className="clinical-card p-5 sm:p-6 bg-white border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Clinical Emergency Alerts</h3>
                    <p className="text-xs text-slate-500">Rapid Response & Code Blue triggers for this ward</p>
                  </div>
                  <Link to="/nurse/emergency" className="text-xs font-bold text-rose-700 hover:underline">
                    Emergency Console →
                  </Link>
                </div>

                {emergencyAlerts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
                    No active emergency alerts on the floor. All beds stable.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {emergencyAlerts.map((e: any) => (
                      <div
                        key={e._id}
                        className="p-3 rounded-xl border border-rose-200 bg-rose-50/70 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-950 flex items-center gap-1.5">
                            <Siren size={13} className="text-rose-600" /> {e.alertType}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                            {e.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-700">
                          Patient: <strong>{e.patientId?.userId?.name || 'Patient'}</strong> • Location: {e.location?.ward} ({e.location?.roomNumber})
                        </div>
                        <p className="text-[11px] text-rose-900 font-medium italic">{e.symptoms}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
