import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  User,
  FileText,
  Pill,
  RefreshCw,
  Search,
  Check,
  Lock,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { onlineConsultationAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorVideoConsultationsPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'today' | 'upcoming' | 'completed'>('today');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [rejectModalItem, setRejectModalItem] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('Schedule conflict with in-person clinical emergency');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // View notes / prescription modal
  const [viewDetailsModal, setViewDetailsModal] = useState<any | null>(null);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const res = await onlineConsultationAPI.getDoctorConsultations();
      setConsultations(res.data?.data || []);
    } catch (err: any) {
      toast.error('Failed to load doctor video consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, []);

  // Handle Accept
  const handleAccept = async (id: string) => {
    try {
      setUpdatingId(id);
      await onlineConsultationAPI.updateStatus(id, { status: 'confirmed' });
      toast.success('Consultation request accepted. Patient notified.');
      loadConsultations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept consultation');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Reject
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem) return;
    try {
      setUpdatingId(rejectModalItem._id);
      await onlineConsultationAPI.updateStatus(rejectModalItem._id, {
        status: 'rejected',
        rejectionReason: rejectReason.trim(),
      });
      toast.success('Consultation declined with logged reason');
      setRejectModalItem(null);
      loadConsultations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to decline consultation');
    } finally {
      setUpdatingId(null);
    }
  };

  const now = new Date();
  const isDateToday = (dStr: string) => {
    const d = new Date(dStr);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  // Filter consultations
  const filteredList = consultations.filter((c) => {
    const pName = (c.patientId?.userId?.name || '').toLowerCase();
    const cId = (c.consultationId || '').toLowerCase();
    const rId = (c.meetingRoomId || '').toLowerCase();
    const sTerm = searchTerm.toLowerCase();

    const matchesSearch = pName.includes(sTerm) || cId.includes(sTerm) || rId.includes(sTerm);

    if (!matchesSearch) return false;

    if (activeTab === 'pending') return c.status === 'pending';
    if (activeTab === 'today') return isDateToday(c.scheduledDate) && c.status !== 'cancelled' && c.status !== 'rejected';
    if (activeTab === 'upcoming') {
      const isFuture = new Date(c.scheduledDate).getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return isFuture && (c.status === 'confirmed' || c.status === 'pending');
    }
    if (activeTab === 'completed') return c.status === 'completed';

    return true; // 'all'
  });

  const pendingCount = consultations.filter((c) => c.status === 'pending').length;
  const todayCount = consultations.filter((c) => isDateToday(c.scheduledDate) && c.status !== 'cancelled' && c.status !== 'rejected').length;
  const completedCount = consultations.filter((c) => c.status === 'completed').length;

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
                    <Video size={14} className="text-teal-300" />
                    Doctor Telehealth Operations Desk
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Virtual Video Consultations</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Manage appointments, admit patients from waiting rooms, and issue post-call prescriptions.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                  <button
                    onClick={loadConsultations}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold backdrop-blur-md transition"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick KPI Stat Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Today's Sessions</span>
                <p className="text-2xl font-black text-teal-950 mt-1">{todayCount}</p>
                <span className="text-[10px] text-teal-700 font-bold">Scheduled for today</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-200 bg-amber-50/30 shadow-sm">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Pending Approval</span>
                <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
                <span className="text-[10px] text-amber-700 font-bold">Awaiting your confirmation</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-emerald-200 bg-emerald-50/30 shadow-sm">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Completed</span>
                <p className="text-2xl font-black text-emerald-950 mt-1">{completedCount}</p>
                <span className="text-[10px] text-emerald-700 font-bold">Prescriptions issued</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
                <p className="text-2xl font-black text-slate-800 mt-1">{consultations.length}</p>
                <span className="text-[10px] text-slate-500 font-medium">All video records</span>
              </div>
            </div>

            {/* Controls Bar: Tabs + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveTab('today')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeTab === 'today' ? 'bg-teal-700 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Today ({todayCount})
                </button>

                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeTab === 'pending' ? 'bg-teal-700 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Pending Requests ({pendingCount})
                </button>

                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeTab === 'upcoming' ? 'bg-teal-700 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Upcoming
                </button>

                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeTab === 'completed' ? 'bg-teal-700 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Completed ({completedCount})
                </button>

                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeTab === 'all' ? 'bg-teal-700 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  All ({consultations.length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient or room ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-teal-500 w-full sm:w-64"
                />
              </div>
            </div>

            {/* Consultations List */}
            {filteredList.length === 0 ? (
              <div className="clinical-card p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-2">
                <Video size={36} className="mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">No video consultations found</h3>
                <p className="text-xs text-slate-400">There are no appointments matching the selected tab or search filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredList.map((c) => {
                  const pat = c.patientId;
                  const patUser = pat?.userId;
                  const pName = patUser?.name || `${patUser?.firstName || ''} ${patUser?.lastName || ''}`.trim() || 'Patient';
                  const isReady = c.status === 'confirmed' || c.status === 'waiting' || c.status === 'in-progress';

                  return (
                    <div
                      key={c._id}
                      className="clinical-card bg-white p-5 rounded-3xl border border-teal-100 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 font-bold shrink-0">
                            <User size={22} />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm">{pName}</h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {pat?.gender || 'N/A'} • Blood: {pat?.bloodGroup || 'Not set'}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            c.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : c.status === 'in-progress'
                              ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
                              : c.status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      {/* Details Box */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date</span>
                          <span className="font-bold text-slate-800">
                            {new Date(c.scheduledDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Time Slot</span>
                          <span className="font-extrabold text-teal-800">{c.startTime}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Consultation ID</span>
                          <span className="font-mono text-slate-700 font-bold text-[11px]">{c.consultationId}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Payment</span>
                          <span className="font-bold text-emerald-700 capitalize">
                            ₹{c.consultationFee || 600} ({c.paymentStatus})
                          </span>
                        </div>
                      </div>

                      {/* Reason & Symptoms */}
                      {(c.reason || (c.symptoms && c.symptoms.length > 0)) && (
                        <div className="text-xs space-y-1">
                          {c.reason && (
                            <p className="text-slate-700">
                              <span className="font-bold text-slate-600">Chief Complaint: </span>
                              {c.reason}
                            </p>
                          )}
                          {c.symptoms && c.symptoms.length > 0 && (
                            <p className="text-slate-600 text-[11px]">
                              <span className="font-bold">Symptoms: </span>
                              {c.symptoms.join(', ')}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Lock size={12} className="text-teal-600" /> Room: {c.meetingRoomId}
                        </span>

                        <div className="flex items-center gap-2">
                          {c.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                disabled={updatingId === c._id}
                                onClick={() => setRejectModalItem(c)}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition"
                              >
                                Decline
                              </button>
                              <button
                                type="button"
                                disabled={updatingId === c._id}
                                onClick={() => handleAccept(c._id)}
                                className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-700/20 transition flex items-center gap-1"
                              >
                                <Check size={14} /> Accept Request
                              </button>
                            </>
                          )}

                          {isReady && (
                            <Link
                              to={`/video-consultation?room=${encodeURIComponent(c.meetingRoomId)}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-700 hover:to-teal-900 text-white text-xs font-black shadow-md shadow-teal-700/20 transition active:scale-95"
                            >
                              <Video size={14} /> Start Video Call
                            </Link>
                          )}

                          {c.status === 'completed' && (
                            <button
                              type="button"
                              onClick={() => setViewDetailsModal(c)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition"
                            >
                              <FileText size={13} /> Notes & Prescription
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* DECLINE APPOINTMENT MODAL */}
            {rejectModalItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                <form
                  onSubmit={handleReject}
                  className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
                >
                  <h3 className="text-base font-extrabold text-slate-900">Decline Video Consultation</h3>
                  <p className="text-xs text-slate-500">
                    State the clinical reason for declining this request. The patient will be notified automatically.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rejection *</label>
                    <textarea
                      rows={3}
                      required
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRejectModalItem(null)}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={updatingId === rejectModalItem._id}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow"
                    >
                      Confirm Decline
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* VIEW NOTES & PRESCRIPTION MODAL */}
            {viewDetailsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-teal-100 overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-5 text-white flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold">Clinical Notes & Prescription</h3>
                      <p className="text-xs text-teal-100/90">
                        {viewDetailsModal.consultationId} • Patient: {viewDetailsModal.patientId?.userId?.name || 'Patient'}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewDetailsModal(null)}
                      className="text-white/80 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-4 text-xs">
                    {viewDetailsModal.diagnosis && (
                      <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100">
                        <span className="text-[10px] text-teal-800 font-bold uppercase tracking-wider block">Diagnosis</span>
                        <p className="font-extrabold text-slate-900 text-sm mt-0.5">{viewDetailsModal.diagnosis}</p>
                      </div>
                    )}

                    {viewDetailsModal.clinicalNotes && (
                      <div className="space-y-1">
                        <span className="font-bold text-slate-700 block">Doctor's Clinical Notes</span>
                        <p className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed">
                          {viewDetailsModal.clinicalNotes}
                        </p>
                      </div>
                    )}

                    {viewDetailsModal.prescriptions && viewDetailsModal.prescriptions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Pill size={14} className="text-teal-600" /> Prescribed Medications
                        </span>
                        <div className="space-y-2">
                          {viewDetailsModal.prescriptions.map((m: any, i: number) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                              <p className="font-extrabold text-slate-900 text-xs">{m.medicineName}</p>
                              <p className="text-slate-500 text-[11px] mt-0.5">
                                {m.dosage} • {m.frequency} • Duration: {m.duration}
                              </p>
                              {m.instructions && <p className="text-slate-600 text-[11px] italic mt-0.5">Instructions: {m.instructions}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
