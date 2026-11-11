import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  Stethoscope,
  Pill,
  ArrowRight,
  TrendingUp,
  Activity,
  RefreshCw,
  Bell,
  Check,
  X,
  Phone,
  Video,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { doctorPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await doctorPortalAPI.getDashboard();
      setData(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load doctor dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleAcceptAppointment = async (id: string) => {
    try {
      await doctorPortalAPI.acceptAppointment(id);
      toast.success('Appointment accepted');
      loadDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept appointment');
    }
  };

  const handleRejectAppointment = async (id: string) => {
    const reason = prompt('Please enter the reason for declining this appointment:', 'Doctor unavailable');
    if (reason === null) return;
    try {
      await doctorPortalAPI.rejectAppointment(id, reason);
      toast.success('Appointment declined');
      loadDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject appointment');
    }
  };

  const metrics = data?.metrics || {};
  const doctor = data?.doctor || {};
  const todayAppointments = data?.todayAppointments || [];
  const emergencyAlerts = data?.emergencyAlerts || [];
  const weeklyStats = data?.weeklyStats || [];
  const statusCounts = data?.statusCounts || { completed: 0, pending: 0, cancelled: 0, noShow: 0 };
  const recentFollowUps = data?.recentFollowUps || [];

  const maxWeekly = Math.max(...weeklyStats.map((w: any) => w.total), 1);

  if (loading && !data) {
    return (
      <div className="flex h-screen bg-[#f8fafc] text-slate-900">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-auto p-4 md:p-7">
          <div className="mx-auto max-w-[1550px] space-y-6">
            {/* Header with Welcome & Refresh */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-800 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-100">
                  <Activity size={14} /> Doctor Clinical Portal
                </span>
                <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">
                  Welcome, {doctor.name || 'Doctor'}
                </h1>
                <p className="mt-1 text-teal-100 text-sm md:text-base">
                  {doctor.specialization} Specialist • {doctor.department || 'General Medicine'} • ID: {doctor.licenseNumber || 'KH-DOC'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 relative z-10">
                <button
                  onClick={() => loadDashboard()}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-sm font-semibold backdrop-blur transition"
                >
                  <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <Link
                  to="/doctor/consultations"
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-teal-900 hover:bg-teal-50 px-4 py-2 text-sm font-bold shadow-md transition"
                >
                  <Stethoscope size={16} />
                  Start Consultation
                </Link>
              </div>

              {/* Background Glow */}
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
            </div>

            {/* Quick Action Navigation Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => navigate('/doctor/consultations')}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-teal-500 hover:shadow-md transition text-left group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Action</p>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-teal-700">Patient Consultation</p>
                </div>
                <span className="p-2.5 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition">
                  <Stethoscope size={18} />
                </span>
              </button>

              <button
                onClick={() => navigate('/doctor/prescriptions')}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-500 hover:shadow-md transition text-left group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Issue</p>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700">Digital Prescription</p>
                </div>
                <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Pill size={18} />
                </span>
              </button>

              <button
                onClick={() => navigate('/doctor/reports')}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-indigo-500 hover:shadow-md transition text-left group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Order</p>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700">Medical Tests & Scans</p>
                </div>
                <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <FileText size={18} />
                </span>
              </button>

              <button
                onClick={() => navigate('/doctor/appointments')}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-amber-500 hover:shadow-md transition text-left group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">View</p>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-amber-700">Today's Schedule</p>
                </div>
                <span className="p-2.5 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
                  <Calendar size={18} />
                </span>
              </button>
            </div>

            {/* Key Statistics Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Treated Patients</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalPatientsTreated || 0}</p>
                <span className="text-[10px] text-teal-600 font-medium">Unique treated</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-teal-200 bg-teal-50/30 shadow-sm">
                <p className="text-xs font-semibold text-teal-700">Today's Schedule</p>
                <p className="text-2xl font-black text-teal-900 mt-1">{metrics.todayAppointmentsCount || 0}</p>
                <span className="text-[10px] text-teal-700 font-medium">Scheduled today</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Upcoming Visits</p>
                <p className="text-2xl font-black text-indigo-900 mt-1">{metrics.upcomingAppointmentsCount || 0}</p>
                <span className="text-[10px] text-indigo-600 font-medium">Future bookings</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Completed</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{metrics.completedConsultationsCount || 0}</p>
                <span className="text-[10px] text-emerald-600 font-medium">Finished visits</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Pending</p>
                <p className="text-2xl font-black text-amber-700 mt-1">{metrics.pendingConsultationsCount || 0}</p>
                <span className="text-[10px] text-amber-600 font-medium">Awaiting doctor</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Cancelled</p>
                <p className="text-2xl font-black text-rose-700 mt-1">{metrics.cancelledAppointmentsCount || 0}</p>
                <span className="text-[10px] text-rose-600 font-medium">With reasons</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Follow-ups</p>
                <p className="text-2xl font-black text-sky-700 mt-1">{metrics.followUpsCount || 0}</p>
                <span className="text-[10px] text-sky-600 font-medium">Active reminders</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/40 shadow-sm">
                <p className="text-xs font-semibold text-rose-700">Emergencies</p>
                <p className="text-2xl font-black text-rose-800 mt-1">{metrics.emergencyAlertsCount || 0}</p>
                <span className="text-[10px] text-rose-600 font-medium">Priority queue</span>
              </div>
            </div>

            {/* Emergency Alerts Banner (If Any) */}
            {emergencyAlerts.length > 0 && (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 shadow-sm flex items-start gap-3">
                <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-bold text-rose-900 text-sm">Urgent & Emergency Patient Priority</h3>
                  <p className="text-xs text-rose-700 mt-0.5">
                    {emergencyAlerts.length} patient(s) have been flagged with urgent/emergency clinical priority.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {emergencyAlerts.map((appt: any) => (
                      <span key={appt._id} className="inline-flex items-center gap-1.5 text-xs bg-white border border-rose-300 px-2.5 py-1 rounded-lg text-rose-900 font-medium">
                        <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                        {appt.patientId?.userId?.name || appt.userId?.name || 'Patient'} • Slot: {appt.startTime} ({appt.reason || 'Urgent'})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Grid: Left Column (Today's Appointments) & Right Column (Analytics & Follow-ups) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Schedule Table */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg text-slate-900">Today's Appointment Schedule</h2>
                    <p className="text-xs text-slate-500">Live consultation timeline for today</p>
                  </div>
                  <Link
                    to="/doctor/appointments"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
                  >
                    View All <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="flex-1 overflow-x-auto p-4">
                  {todayAppointments.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto text-slate-300 mb-2" size={36} />
                      <p className="text-slate-600 font-medium text-sm">No appointments scheduled for today.</p>
                      <p className="text-slate-400 text-xs mt-1">Upcoming appointments will appear as patients book slots.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                          <th className="pb-3 font-semibold">Time</th>
                          <th className="pb-3 font-semibold">Patient</th>
                          <th className="pb-3 font-semibold">Type</th>
                          <th className="pb-3 font-semibold">Reason</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {todayAppointments.map((appt: any) => {
                          const patientName = appt.patientId?.userId?.name || appt.userId?.name || 'Patient';
                          const isEmergency = appt.priority === 'emergency' || appt.priority === 'urgent';
                          return (
                            <tr key={appt._id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 font-bold text-slate-900 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock size={13} className="text-slate-400" />
                                  {appt.startTime} - {appt.endTime}
                                </span>
                              </td>
                              <td className="py-3 font-semibold text-slate-900">
                                <div>
                                  <p className="flex items-center gap-1.5">
                                    {patientName}
                                    {isEmergency && (
                                      <span className="rounded bg-rose-100 text-rose-800 px-1 text-[10px] font-bold">EMERGENCY</span>
                                    )}
                                  </p>
                                  <span className="text-xs text-slate-400 font-normal">{appt.patientId?.patientId || 'ID: KH-P'}</span>
                                </div>
                              </td>
                              <td className="py-3 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                  {appt.consultationType === 'telemedicine' ? <Video size={12} className="text-blue-600" /> : <Phone size={12} className="text-emerald-600" />}
                                  {appt.consultationType === 'telemedicine' ? 'Video' : 'In-person'}
                                </span>
                              </td>
                              <td className="py-3 text-slate-600 max-w-[180px] truncate">{appt.reason || 'Routine checkup'}</td>
                              <td className="py-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                    appt.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : appt.status === 'confirmed'
                                      ? 'bg-teal-50 text-teal-700'
                                      : appt.status === 'cancelled'
                                      ? 'bg-rose-50 text-rose-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {appt.status}
                                </span>
                              </td>
                              <td className="py-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  {appt.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleAcceptAppointment(appt._id)}
                                        title="Accept appointment"
                                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleRejectAppointment(appt._id)}
                                        title="Reject with reason"
                                        className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition"
                                      >
                                        <X size={14} />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => navigate(`/doctor/consultations?appointmentId=${appt._id}&patientId=${appt.patientId?._id || ''}`)}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white transition"
                                  >
                                    Consult
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Right Column: Weekly Trends & Quick Follow-ups */}
              <div className="space-y-6">
                {/* Weekly Trend Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 text-sm">7-Day Consultation Volume</h3>
                    <TrendingUp size={16} className="text-teal-600" />
                  </div>

                  <div className="flex items-end justify-between gap-2 h-36 pt-4 border-b border-slate-100">
                    {weeklyStats.map((item: any) => {
                      const heightPercent = Math.round((item.total / maxWeekly) * 100);
                      return (
                        <div key={item.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <span className="text-[10px] font-bold text-slate-700">{item.total}</span>
                          <div
                            style={{ height: `${Math.max(heightPercent, 12)}%` }}
                            className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-teal-700 to-cyan-500 transition-all duration-300"
                          />
                          <span className="text-[10px] text-slate-400 font-semibold">{item.day}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Status Split</p>
                      <p className="font-bold text-emerald-700 mt-0.5">{statusCounts.completed} Completed</p>
                      <p className="font-bold text-amber-700">{statusCounts.pending} Pending</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Cancellations</p>
                      <p className="font-bold text-rose-700 mt-0.5">{statusCounts.cancelled} Cancelled</p>
                      <p className="font-bold text-slate-500">{statusCounts.noShow} No-Show</p>
                    </div>
                  </div>
                </div>

                {/* Follow-up Reminders */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Bell size={15} className="text-sky-600" /> Patient Follow-up Due
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                      {recentFollowUps.length} Due
                    </span>
                  </div>

                  {recentFollowUps.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No pending patient follow-ups.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {recentFollowUps.map((item: any) => (
                        <div key={item._id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">{item.patientId?.userId?.name || 'Patient'}</p>
                            <p className="text-slate-500 text-[11px] truncate max-w-[170px]">{item.followUp?.instructions || item.finalDiagnosis || 'Review progress'}</p>
                          </div>
                          <span className="text-sky-700 font-semibold whitespace-nowrap">
                            {item.followUp?.date ? new Date(item.followUp.date).toLocaleDateString() : 'Due'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
