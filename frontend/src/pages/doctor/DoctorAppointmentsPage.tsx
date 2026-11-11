import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Video,
  Check,
  X,
  Stethoscope,
  UserX,
  CalendarCheck,
  Search,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { appointmentAPI, doctorPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past' | 'all'>('today');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [rescheduleModal, setRescheduleModal] = useState<any | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('10:30');

  const [rejectModal, setRejectModal] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('Clinical schedule conflict');

  const [cancelModal, setCancelModal] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('Doctor emergency call-out');

  const navigate = useNavigate();

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentAPI.getAll();
      setAppointments(res.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await doctorPortalAPI.acceptAppointment(id);
      toast.success('Appointment accepted & patient notified');
      loadAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error accepting appointment');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal) return;
    try {
      await doctorPortalAPI.rejectAppointment(rejectModal._id, rejectReason);
      toast.success('Appointment rejected with reason logged');
      setRejectModal(null);
      loadAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error rejecting appointment');
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModal) return;
    try {
      await appointmentAPI.cancel(cancelModal._id);
      toast.success('Appointment cancelled');
      setCancelModal(null);
      loadAppointments();
    } catch (err: any) {
      toast.error('Error cancelling appointment');
    }
  };

  const handleNoShow = async (id: string) => {
    if (!window.confirm('Mark this patient as No-Show for their scheduled slot?')) return;
    try {
      await doctorPortalAPI.markAppointmentNoShow(id);
      toast.success('Appointment marked as No-Show');
      loadAppointments();
    } catch (err: any) {
      toast.error('Error updating status');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await appointmentAPI.complete(id);
      toast.success('Appointment marked completed');
      loadAppointments();
    } catch (err: any) {
      toast.error('Error completing appointment');
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModal || !newDate) return;
    try {
      await appointmentAPI.reschedule(rescheduleModal._id, {
        newAppointmentDate: newDate,
        newStartTime,
        newEndTime,
      });
      toast.success('Appointment successfully rescheduled');
      setRescheduleModal(null);
      loadAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Slot conflict or error rescheduling');
    }
  };

  // Filter logic
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const filteredAppointments = appointments.filter((a) => {
    const apptDate = (a.appointmentDate || a.date || '').slice(0, 10);
    // Tab filtering
    if (activeTab === 'today' && apptDate !== todayStr) return false;
    if (activeTab === 'upcoming' && (apptDate <= todayStr || ['completed', 'cancelled'].includes(a.status))) return false;
    if (activeTab === 'past' && (apptDate >= todayStr && a.status !== 'completed')) return false;

    // Status filter
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const patientName = (a.patientId?.userId?.name || a.userId?.name || '').toLowerCase();
      const reason = (a.reason || '').toLowerCase();
      const time = (a.startTime || '').toLowerCase();
      return patientName.includes(q) || reason.includes(q) || time.includes(q);
    }

    return true;
  });

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-auto p-4 md:p-7">
          <div className="mx-auto max-w-[1550px] space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Clinical Schedule</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Appointment Management</h1>
                <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                  Accept requests, manage daily consultation slots, reschedule, and conduct consultations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/doctor/availability')}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 shadow-sm hover:border-teal-500 flex items-center gap-1.5 transition"
                >
                  <CalendarCheck size={15} className="text-teal-600" />
                  Manage Availability & Slots
                </button>
              </div>
            </div>

            {/* Controls: Tabs & Filters */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto">
                {(['today', 'upcoming', 'past', 'all'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab === 'today' ? "Today's Schedule" : tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by patient, reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50 font-semibold text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No-Show</option>
                </select>
              </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-12 text-center text-slate-400 text-sm">Loading appointment queue...</div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="p-12 text-center">
                    <Calendar className="mx-auto text-slate-300 mb-2" size={38} />
                    <p className="text-sm font-bold text-slate-700">No appointments found</p>
                    <p className="text-xs text-slate-400 mt-1">There are no appointments matching this view.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase text-slate-500">
                        <th className="py-3 px-4 font-semibold">Date & Time</th>
                        <th className="py-3 px-4 font-semibold">Patient</th>
                        <th className="py-3 px-4 font-semibold">Type</th>
                        <th className="py-3 px-4 font-semibold">Reason</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAppointments.map((appt) => {
                        const patientName = appt.patientId?.userId?.name || appt.userId?.name || 'Patient';
                        const isEmergency = appt.priority === 'emergency' || appt.priority === 'urgent';
                        return (
                          <tr key={appt._id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="font-bold text-slate-900">
                                {new Date(appt.appointmentDate || appt.date).toLocaleDateString()}
                              </div>
                              <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                                <Clock size={12} /> {appt.startTime} - {appt.endTime}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {patientName}
                                {isEmergency && (
                                  <span className="rounded bg-rose-100 text-rose-800 px-1 py-0.2 text-[9px] font-bold">URGENT</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400">{appt.patientId?.patientId || 'ID: KH-P'}</div>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {appt.consultationType === 'telemedicine' ? <Video size={12} className="text-blue-600" /> : <Phone size={12} className="text-emerald-600" />}
                                {appt.consultationType === 'telemedicine' ? 'Video' : 'In-person'}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-xs text-slate-600 max-w-[200px] truncate">
                              {appt.reason || 'Routine consultation'}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                  appt.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : appt.status === 'confirmed'
                                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                    : appt.status === 'cancelled'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : appt.status === 'no-show'
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {appt.status}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {appt.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleAccept(appt._id)}
                                      title="Accept request"
                                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button
                                      onClick={() => setRejectModal(appt)}
                                      title="Reject with reason"
                                      className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition"
                                    >
                                      <X size={14} />
                                    </button>
                                  </>
                                )}

                                {['pending', 'confirmed', 'scheduled'].includes(appt.status) && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setRescheduleModal(appt);
                                        setNewDate((appt.appointmentDate || appt.date || '').slice(0, 10));
                                      }}
                                      title="Reschedule"
                                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                    >
                                      <Calendar size={14} />
                                    </button>
                                    <button
                                      onClick={() => setCancelModal(appt)}
                                      title="Cancel appointment"
                                      className="p-1.5 rounded-lg bg-slate-100 text-rose-600 hover:bg-rose-50 transition"
                                    >
                                      <XCircle size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleNoShow(appt._id)}
                                      title="Mark No-Show"
                                      className="p-1.5 rounded-lg bg-slate-100 text-amber-700 hover:bg-amber-100 transition"
                                    >
                                      <UserX size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleComplete(appt._id)}
                                      title="Mark Completed"
                                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                                    >
                                      <CheckCircle2 size={14} />
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={() => navigate(`/doctor/consultations?appointmentId=${appt._id}&patientId=${appt.patientId?._id || ''}`)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 shadow transition flex items-center gap-1"
                                >
                                  <Stethoscope size={13} /> Consult
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
          </div>
        </main>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleReject} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Decline Appointment Request</h3>
            <p className="text-xs text-slate-500">Provide an authorized clinical reason. The patient will be notified immediately.</p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rejection</label>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setRejectModal(null)} className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow">Decline Appointment</button>
            </div>
          </form>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleReschedule} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Reschedule Appointment</h3>
            <p className="text-xs text-slate-500">Select a new date and consultation slot for this patient.</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Appointment Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                <input
                  type="time"
                  required
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setRescheduleModal(null)} className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-xs font-bold rounded-xl bg-teal-700 text-white hover:bg-teal-800 shadow">Save Reschedule</button>
            </div>
          </form>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCancel} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Cancel Appointment</h3>
            <p className="text-xs text-slate-500">Document the cancellation reason. The patient will be notified automatically.</p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cancellation Reason</label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCancelModal(null)} className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100">Back</button>
              <button type="submit" className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow">Confirm Cancellation</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
