import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Stethoscope,
  Video,
  XCircle,
  RefreshCw,
  Search,
  CalendarPlus,
  FileText,
  Printer,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientAppointmentsPage() {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('id');

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'today' | 'past' | 'cancelled' | 'pending'>('all');
  const [search, setSearch] = useState('');

  // Modals
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [rescheduleApt, setRescheduleApt] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [rescheduling, setRescheduling] = useState(false);

  const [cancelApt, setCancelApt] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getAppointments();
      const list = res.data?.data || [];
      setAppointments(list);
      if (highlightId) {
        const found = list.find((a: any) => a._id === highlightId);
        if (found) setSelectedApt(found);
      }
    } catch (err: any) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // Filter slots when reschedule date changes
  useEffect(() => {
    if (!rescheduleApt || !rescheduleDate) return;
    const fetchSlots = async () => {
      try {
        const res = await patientPortalAPI.getDoctorSlots(rescheduleApt.doctorId?._id, rescheduleDate);
        const slots = res.data?.data?.slots || [];
        setAvailableSlots(slots);
        if (slots.length > 0) setRescheduleSlot(slots[0]);
      } catch (e) {
        const fallback = ['10:00 AM', '11:30 AM', '02:30 PM', '04:00 PM'];
        setAvailableSlots(fallback);
        setRescheduleSlot(fallback[0]);
      }
    };
    fetchSlots();
  }, [rescheduleApt, rescheduleDate]);

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleSlot) {
      toast.error('Please pick a date and slot');
      return;
    }
    try {
      setRescheduling(true);
      await patientPortalAPI.rescheduleAppointment(rescheduleApt._id, {
        appointmentDate: rescheduleDate,
        timeSlot: rescheduleSlot,
        reason: rescheduleReason,
      });
      toast.success('Appointment rescheduled successfully');
      setRescheduleApt(null);
      loadAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reschedule');
    } finally {
      setRescheduling(false);
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    try {
      setCancelling(true);
      await patientPortalAPI.cancelAppointment(cancelApt._id, cancelReason);
      toast.success('Appointment cancelled');
      setCancelApt(null);
      loadAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = apt.appointmentDate ? new Date(apt.appointmentDate).toISOString().split('T')[0] : '';
    const docUser = apt.doctorId?.userId || {};
    const docName = (docUser.name || `${docUser.firstName || ''} ${docUser.lastName || ''}`).toLowerCase();
    const matchesSearch = docName.includes(search.toLowerCase()) || (apt.reason || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'today') {
      return aptDate === todayStr && apt.status !== 'cancelled';
    }
    if (activeTab === 'upcoming') {
      return (aptDate >= todayStr || apt.status === 'confirmed' || apt.status === 'pending') && apt.status !== 'cancelled' && apt.status !== 'completed';
    }
    if (activeTab === 'past') {
      return apt.status === 'completed' || (aptDate < todayStr && apt.status !== 'pending');
    }
    if (activeTab === 'cancelled') {
      return apt.status === 'cancelled';
    }
    if (activeTab === 'pending') {
      return apt.status === 'pending';
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20 text-teal-100 mb-2">
                    <Calendar size={14} className="text-teal-300" />
                    Patient Consultation Bookings
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Scheduled Appointments</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Manage upcoming appointments, reschedule visits, review past consultations, and download booking passes.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/patient/book-appointment"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 text-xs font-bold transition-all shadow-md shadow-teal-950/20"
                  >
                    <CalendarPlus size={15} /> Book New Appointment
                  </Link>
                </div>
              </div>
            </div>

            {/* Filter and Tab Bar */}
            <div className="clinical-card p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Status Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'upcoming', label: 'Upcoming' },
                    { id: 'today', label: 'Today' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'cancelled', label: 'Cancelled' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === tab.id
                          ? 'bg-white text-teal-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search and View Toggle */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter by doctor or reason..."
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-slate-50 w-48 sm:w-64"
                    />
                  </div>
                  <button
                    onClick={loadAppointments}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                    title="Refresh"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Appointments List View */}
            {loading ? (
              <div className="py-20 text-center text-slate-400">Loading appointments...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="clinical-card p-12 text-center">
                <div className="h-16 w-16 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Calendar size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Appointments Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  No consultation records match the selected filter. You can book a consultation anytime.
                </p>
                <Link
                  to="/patient/book-appointment"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold"
                >
                  <CalendarPlus size={14} /> Schedule Now
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((apt) => {
                  const docUser = apt.doctorId?.userId || {};
                  const docName = docUser.name || `Dr. ${docUser.firstName || ''} ${docUser.lastName || ''}`.trim() || 'Attending Clinician';
                  const dateStr = new Date(apt.appointmentDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={apt._id}
                      className="clinical-card p-5 hover:border-teal-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                          {apt.type === 'video' ? <Video size={24} /> : <Stethoscope size={24} />}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900">{docName}</h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                apt.status === 'confirmed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : apt.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : apt.status === 'completed'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {apt.status}
                            </span>
                            {apt.type === 'video' && (
                              <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                Telemedicine
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>{apt.doctorId?.specialization || 'Outpatient Clinic'}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">{dateStr}</span>
                            <span>•</span>
                            <span className="font-bold text-teal-800">{apt.timeSlot || '10:00 AM'}</span>
                            <span>•</span>
                            <span className="font-mono text-slate-400">ID: {apt._id.slice(-6).toUpperCase()}</span>
                          </p>

                          <p className="text-xs text-slate-600 mt-1.5 italic">
                            Reason: "{apt.reason || 'General health consultation'}"
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                        {apt.type === 'video' && apt.status === 'confirmed' && (
                          <Link
                            to="/patient/telemedicine"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                          >
                            <Video size={13} /> Join Room
                          </Link>
                        )}

                        <button
                          onClick={() => setSelectedApt(apt)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1"
                        >
                          <FileText size={13} /> Details
                        </button>

                        {(apt.status === 'pending' || apt.status === 'confirmed') && (
                          <>
                            <button
                              onClick={() => {
                                setRescheduleApt(apt);
                                setRescheduleDate(new Date(apt.appointmentDate).toISOString().split('T')[0]);
                                setRescheduleSlot(apt.timeSlot || '');
                              }}
                              className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-100 text-xs font-semibold text-teal-800"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => {
                                setCancelApt(apt);
                                setCancelReason('');
                              }}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-semibold text-rose-700"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Appointment Details Modal */}
            {selectedApt && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-teal-700 tracking-wider">Appointment Pass</span>
                      <h3 className="text-base font-extrabold text-slate-900">Consultation Details</h3>
                    </div>
                    <button
                      onClick={() => setSelectedApt(null)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Appointment ID</span>
                        <span className="font-mono font-bold text-slate-800">{selectedApt._id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status</span>
                        <span className="font-bold uppercase text-teal-800">{selectedApt.status}</span>
                      </div>
                    </div>

                    <div className="space-y-2 py-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Clinician</span>
                        <span className="font-bold text-slate-800">
                          {selectedApt.doctorId?.userId?.name || 'Attending Physician'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Specialization</span>
                        <span className="font-semibold text-slate-700">{selectedApt.doctorId?.specialization}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Scheduled Date</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(selectedApt.appointmentDate).toLocaleDateString()} at {selectedApt.timeSlot}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Consultation Mode</span>
                        <span className="font-semibold uppercase text-slate-800">{selectedApt.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Consultation Fee</span>
                        <span className="font-extrabold text-slate-900">₹{selectedApt.doctorId?.consultationFee || 600}</span>
                      </div>
                    </div>

                    {selectedApt.symptoms && selectedApt.symptoms.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-slate-500 block mb-1 font-bold">Reported Symptoms:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedApt.symptoms.map((s: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-teal-50 text-teal-800 rounded-md text-[11px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                    >
                      <Printer size={14} /> Print Pass
                    </button>
                    <button
                      onClick={() => setSelectedApt(null)}
                      className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800"
                    >
                      Close Pass
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reschedule Modal */}
            {rescheduleApt && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <form
                  onSubmit={handleConfirmReschedule}
                  className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-900">Reschedule Consultation</h3>
                    <button
                      type="button"
                      onClick={() => setRescheduleApt(null)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">New Consultation Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Select Time Slot</label>
                    <select
                      value={rescheduleSlot}
                      onChange={(e) => setRescheduleSlot(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 bg-white"
                    >
                      {availableSlots.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Reason for Rescheduling</label>
                    <input
                      type="text"
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      placeholder="e.g. Schedule conflict, travel change"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRescheduleApt(null)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={rescheduling}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20"
                    >
                      {rescheduling ? 'Rescheduling...' : 'Confirm New Slot'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Cancel Appointment Modal */}
            {cancelApt && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <form
                  onSubmit={handleConfirmCancel}
                  className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-900 text-rose-900">Cancel Appointment</h3>
                    <button
                      type="button"
                      onClick={() => setCancelApt(null)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to cancel your scheduled appointment with{' '}
                    <strong>{cancelApt.doctorId?.userId?.name || 'the physician'}</strong> on{' '}
                    {new Date(cancelApt.appointmentDate).toLocaleDateString()} at {cancelApt.timeSlot}?
                  </p>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Reason for Cancellation *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Please let us know why you are cancelling..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCancelApt(null)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                    >
                      Keep Appointment
                    </button>
                    <button
                      type="submit"
                      disabled={cancelling}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
                    >
                      {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
