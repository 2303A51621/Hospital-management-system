import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  FileText,
  Stethoscope,
  Pill,
  ArrowRight,
  Activity,
  RefreshCw,
  Bell,
  CreditCard,
  Video,
  FlaskConical,
  PhoneCall,
  User,
  HeartPulse,
  Download,
  CalendarPlus,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function PatientDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((state) => state.user);

  const loadDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await patientPortalAPI.getDashboard();
      setData(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load patient dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const patient = data?.patient;
  const stats = data?.stats || {
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    cancelledAppointments: 0,
    prescriptionsCount: 0,
    pendingLabReports: 0,
    outstandingPayment: 0,
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Patient Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10">
              <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl" />
              <div className="pointer-events-none absolute left-1/3 -bottom-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-2xl" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-md p-1 border border-white/20 shadow-inner flex items-center justify-center overflow-hidden shrink-0">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      <User size={38} className="text-teal-200" />
                    )}
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20 text-teal-100 mb-2">
                      <HeartPulse size={14} className="text-teal-300 animate-pulse" />
                      Patient Portal • Kushal Hospitals
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      Welcome back, {user?.name || `${user?.firstName || 'Valued'} ${user?.lastName || 'Patient'}`}
                    </h1>
                    <p className="text-sm text-teal-100/90 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Patient ID: <strong className="font-mono text-white">{patient?.patientId || 'KH-PAT-NEW'}</strong></span>
                      <span>Blood Group: <strong className="text-white">{patient?.bloodGroup || 'Not Recorded'}</strong></span>
                      <span>Emergency: <strong className="text-rose-300">{patient?.emergencyContact?.phone || '108'}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={loadDashboard}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2.5 text-xs font-semibold backdrop-blur-md border border-white/20 text-white transition-all shadow-sm"
                  >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    Sync Records
                  </button>
                  <Link
                    to="/patient/book-appointment"
                    className="inline-flex items-center gap-2 rounded-xl bg-white text-teal-900 hover:bg-teal-50 px-4 py-2.5 text-xs font-bold transition-all shadow-lg shadow-teal-950/20"
                  >
                    <CalendarPlus size={15} className="text-teal-700" />
                    Book New Appointment
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="clinical-card p-5 border-l-4 border-l-teal-600">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Visits</span>
                  <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
                    <Calendar size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-900">{stats.upcomingAppointments}</span>
                  <span className="text-xs text-slate-500 ml-2">scheduled</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>Pending approval: {stats.pendingAppointments}</span>
                  <Link to="/patient/appointments" className="text-teal-700 hover:underline font-semibold flex items-center gap-1">
                    View <ChevronRightIcon />
                  </Link>
                </div>
              </div>

              <div className="clinical-card p-5 border-l-4 border-l-emerald-600">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prescriptions</span>
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                    <Pill size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-900">{stats.prescriptionsCount}</span>
                  <span className="text-xs text-slate-500 ml-2">digital Rx</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>Valid digital signatures</span>
                  <Link to="/patient/prescriptions" className="text-emerald-700 hover:underline font-semibold flex items-center gap-1">
                    Access <ChevronRightIcon />
                  </Link>
                </div>
              </div>

              <div className="clinical-card p-5 border-l-4 border-l-cyan-600">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Medical Reports</span>
                  <div className="p-2.5 bg-cyan-50 text-cyan-700 rounded-xl">
                    <FlaskConical size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-900">{data?.labReports?.length || 0}</span>
                  <span className="text-xs text-slate-500 ml-2">lab results</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>{stats.pendingLabReports} pending review</span>
                  <Link to="/patient/reports" className="text-cyan-700 hover:underline font-semibold flex items-center gap-1">
                    Reports <ChevronRightIcon />
                  </Link>
                </div>
              </div>

              <div className="clinical-card p-5 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Due</span>
                  <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                    <CreditCard size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-900">₹{stats.outstandingPayment?.toLocaleString() || 0}</span>
                  <span className="text-xs text-slate-500 ml-2">due</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className={stats.outstandingPayment > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600'}>
                    {stats.outstandingPayment > 0 ? 'Payment required' : 'All clear'}
                  </span>
                  <Link to="/patient/payments" className="text-amber-700 hover:underline font-semibold flex items-center gap-1">
                    Pay <ChevronRightIcon />
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="clinical-card p-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Healthcare Quick Actions</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <Link
                  to="/patient/doctors"
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 transition-all text-center"
                >
                  <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Stethoscope size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">Find Doctor</span>
                  <span className="text-[10px] text-slate-400">35+ Specialists</span>
                </Link>

                <Link
                  to="/patient/book-appointment"
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 transition-all text-center"
                >
                  <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-md shadow-teal-600/20">
                    <CalendarPlus size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">Book Visit</span>
                  <span className="text-[10px] text-slate-400">Real-time slots</span>
                </Link>

                <Link
                  to="/patient/records"
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all text-center"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <FileText size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">Health History</span>
                  <span className="text-[10px] text-slate-400">Timeline & Vitals</span>
                </Link>

                <Link
                  to="/patient/telemedicine"
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-center"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Video size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900">Video Consult</span>
                  <span className="text-[10px] text-slate-400">Live Virtual Clinic</span>
                </Link>

                <Link
                  to="/patient/family"
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 transition-all text-center"
                >
                  <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <User size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-purple-900">Family Members</span>
                  <span className="text-[10px] text-slate-400">Manage Dependents</span>
                </Link>

                <Link
                  to="/patient/emergency"
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl border border-rose-100 bg-rose-50/50 hover:bg-rose-100/70 hover:border-rose-300 transition-all text-center"
                >
                  <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-md shadow-rose-600/20">
                    <PhoneCall size={20} />
                  </div>
                  <span className="text-xs font-bold text-rose-900">Emergency SOS</span>
                  <span className="text-[10px] text-rose-500">24/7 Ambulance</span>
                </Link>
              </div>
            </div>

            {/* Main Split Content: Left 8 cols, Right 4 cols */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Consultations & Timeline (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Follow-up Reminders Alert Banner */}
                {data?.followUps && data.followUps.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
                        <Clock size={18} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-amber-900">Recommended Follow-up Visit Required</h4>
                        <p className="text-xs text-amber-800 mt-1">
                          Dr. {data.followUps[0].doctorName} recommended a follow-up consultation on{' '}
                          <strong>{new Date(data.followUps[0].followUpDate).toLocaleDateString()}</strong>.
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <Link
                            to={`/patient/book-appointment?doctorId=${data.followUps[0].doctorId}&followUp=true`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 text-white hover:bg-amber-800 px-3 py-1.5 text-xs font-semibold shadow-sm"
                          >
                            <CalendarPlus size={13} /> Schedule Follow-up Now
                          </Link>
                          <Link to="/patient/follow-ups" className="text-xs font-medium text-amber-800 hover:underline">
                            View All Follow-ups ({data.followUps.length})
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming Appointments List */}
                <div className="clinical-card p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Upcoming Appointments</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Your confirmed and scheduled consultations</p>
                    </div>
                    <Link
                      to="/patient/appointments"
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
                    >
                      View All ({stats.totalAppointments}) <ArrowRight size={14} />
                    </Link>
                  </div>

                  {loading ? (
                    <div className="py-12 text-center text-slate-400">Loading your schedule...</div>
                  ) : !data?.upcomingAppointments || data.upcomingAppointments.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <div className="h-14 w-14 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-3">
                        <Calendar size={26} />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800">No Upcoming Appointments</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                        You have no consultations scheduled for the coming days. Book with our expert clinicians anytime.
                      </p>
                      <Link
                        to="/patient/book-appointment"
                        className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 text-xs font-bold shadow-md shadow-teal-700/20"
                      >
                        <CalendarPlus size={14} /> Book Consultation
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.upcomingAppointments.map((apt: any) => {
                        const doctorUser = apt.doctorId?.userId || {};
                        const doctorName = doctorUser.name || `Dr. ${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() || 'Attending Doctor';
                        return (
                          <div
                            key={apt._id}
                            className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-teal-200 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                                {apt.type === 'video' ? <Video size={22} /> : <Stethoscope size={22} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-900">{doctorName}</h4>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                      apt.status === 'confirmed'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                  >
                                    {apt.status}
                                  </span>
                                  {apt.type === 'video' && (
                                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                      Telemedicine
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                  <span>{apt.doctorId?.specialization || 'General Consultation'}</span>
                                  <span>•</span>
                                  <span className="font-medium text-slate-700">
                                    {new Date(apt.appointmentDate).toLocaleDateString(undefined, {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                  <span>•</span>
                                  <span className="font-semibold text-teal-700">{apt.timeSlot || '10:00 AM'}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {apt.type === 'video' && apt.status === 'confirmed' && (
                                <Link
                                  to="/patient/telemedicine"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                                >
                                  <Video size={13} /> Join Room
                                </Link>
                              )}
                              <Link
                                to={`/patient/appointments?id=${apt._id}`}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                              >
                                View Pass
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Prescriptions Preview */}
                <div className="clinical-card p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Recent Digital Prescriptions</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Doctor-signed medication guidelines</p>
                    </div>
                    <Link
                      to="/patient/prescriptions"
                      className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      All Prescriptions <ArrowRight size={14} />
                    </Link>
                  </div>

                  {!data?.prescriptions || data.prescriptions.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">No recent prescriptions issued.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.prescriptions.slice(0, 3).map((rx: any) => {
                        const doc = rx.doctorId?.userId || {};
                        const docName = doc.name || `Dr. ${doc.firstName || ''} ${doc.lastName || ''}`.trim() || 'Clinician';
                        return (
                          <div key={rx._id} className="py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                <Pill size={18} />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">
                                  {rx.diagnosis || 'Clinical Prescription'}
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  Issued by {docName} • {new Date(rx.createdAt || rx.date).toLocaleDateString()}
                                </p>
                                <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                                  {rx.medicines?.length || 0} medicine(s) prescribed
                                </p>
                              </div>
                            </div>
                            <Link
                              to={`/patient/prescriptions?id=${rx._id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                            >
                              <Download size={13} /> View / PDF
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Vitals, Notifications, Reports (1 col) */}
              <div className="space-y-6">
                {/* Health Overview & Vitals Card */}
                <div className="clinical-card p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Activity size={16} className="text-teal-700" /> Latest Health Vitals
                    </h3>
                    <Link to="/patient/health-overview" className="text-xs text-teal-700 font-semibold hover:underline">
                      Trends
                    </Link>
                  </div>

                  {data?.latestConsultation?.vitals ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Blood Pressure</span>
                        <div className="text-lg font-extrabold text-slate-800 mt-0.5">
                          {data.latestConsultation.vitals.bloodPressure || '120/80'}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-semibold">mmHg • Normal</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Pulse Rate</span>
                        <div className="text-lg font-extrabold text-slate-800 mt-0.5">
                          {data.latestConsultation.vitals.pulseRate || '74'}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-semibold">bpm • Resting</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">SpO2 (Oxygen)</span>
                        <div className="text-lg font-extrabold text-slate-800 mt-0.5">
                          {data.latestConsultation.vitals.spO2 || '99'}%
                        </div>
                        <span className="text-[10px] text-teal-600 font-semibold">Optimal</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Temperature</span>
                        <div className="text-lg font-extrabold text-slate-800 mt-0.5">
                          {data.latestConsultation.vitals.temperature || '98.6'}°F
                        </div>
                        <span className="text-[10px] text-emerald-600 font-semibold">Afebrile</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                      No vitals recorded recently. Your vitals will update following your next clinical checkup.
                    </div>
                  )}
                </div>

                {/* Notifications Panel */}
                <div className="clinical-card p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Bell size={16} className="text-teal-700" /> Notifications
                    </h3>
                    <span className="text-xs text-slate-400">Recent</span>
                  </div>

                  {!data?.notifications || data.notifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">No pending notifications</div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.notifications.slice(0, 4).map((notif: any) => (
                        <div
                          key={notif._id}
                          className={`p-3 rounded-xl border text-xs ${
                            notif.read ? 'bg-white border-slate-100 text-slate-600' : 'bg-teal-50/50 border-teal-100 text-teal-950 font-medium'
                          }`}
                        >
                          <div className="font-semibold">{notif.title || 'System Notification'}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{notif.message}</div>
                          <div className="text-[9px] text-slate-400 mt-1 text-right">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hospital Helpline & Care Support */}
                <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50/50 p-5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-900">24/7 Patient Care Desk</h4>
                  <p className="text-xs text-teal-800/90 mt-1">
                    Need assistance with appointment booking, lab reports or admission guidance?
                  </p>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-teal-200/50">
                    <span className="text-xs font-mono font-bold text-teal-950">1800-200-4499</span>
                    <a
                      href="tel:18002004499"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-sm"
                    >
                      <PhoneCall size={12} /> Call Desk
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
