import { useEffect, useState } from 'react';
import {
  Stethoscope,
  Send,
  AlertTriangle,
  User,
  RefreshCw,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { nursePortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NurseDoctorCommsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Message compose form state
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [sending, setSending] = useState(false);
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docRes, commRes, patRes] = await Promise.all([
        nursePortalAPI.getDoctors(),
        nursePortalAPI.getDoctorCommunication(),
        nursePortalAPI.getPatients(),
      ]);

      setDoctors(docRes.data.data || []);
      setMessages(commRes.data.data || []);
      setPatients(patRes.data.data || []);

      if (docRes.data.data && docRes.data.data.length > 0) {
        setSelectedDoctorId(docRes.data.data[0]._id || docRes.data.data[0].userId?._id || '');
      }
    } catch (err: any) {
      toast.error('Failed to load doctor communication network');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      toast.error('Please select an attending physician');
      return;
    }
    if (!messageBody.trim()) {
      toast.error('Please enter a clinical message or inquiry');
      return;
    }

    try {
      setSending(true);
      await nursePortalAPI.sendDoctorCommunication({
        doctorUserId: selectedDoctorId,
        patientId: selectedPatientId || undefined,
        subject: subject.trim() || undefined,
        message: messageBody.trim(),
        isUrgent,
      });

      toast.success(isUrgent ? 'URGENT clinical dispatch sent to doctor' : 'Message dispatched to doctor');
      setMessageBody('');
      setSubject('');
      setIsUrgent(false);

      // Refresh message thread
      const res = await nursePortalAPI.getDoctorCommunication();
      setMessages(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (filterUrgentOnly && !m.isUrgent) return false;
    return true;
  });

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
                  <Stethoscope size={14} />
                  <span>Clinical Collaboration</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Doctor Communication Hub</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct clinical messaging channel with attending physicians, critical vitals alerts, and consultation notes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin text-teal-600' : ''} />
                  <span>Refresh Comms</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Compose & Attending Physician Directory (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Compose Box */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Send size={15} className="text-teal-600" />
                    <span>Send Clinical Dispatch</span>
                  </h2>

                  <form onSubmit={handleSendMessage} className="mt-4 space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Select Attending Doctor <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        required
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                      >
                        <option value="">-- Choose Attending Physician --</option>
                        {doctors.map((d: any) => {
                          const docUser = d.userId || d;
                          const name = docUser.name || `Dr. ${docUser.firstName || ''} ${docUser.lastName || ''}`.trim();
                          return (
                            <option key={d._id} value={docUser._id || d._id}>
                              {name} ({d.specialization || d.department || 'Consultant'})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Associate Inpatient (Optional)
                      </label>
                      <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      >
                        <option value="">-- General Unit Inquiry --</option>
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

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Reason</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Abnormal BP spike / Medication query / Rounding request"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Clinical Observation / Message <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        required
                        placeholder="Detail the patient symptoms, latest vitals, dose timing questions, or doctor review request..."
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isUrgent}
                          onChange={(e) => setIsUrgent(e.target.checked)}
                          className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                          <AlertTriangle size={13} />
                          Mark as Stat / Urgent Alert
                        </span>
                      </label>

                      <button
                        type="submit"
                        disabled={sending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                      >
                        <Send size={13} />
                        <span>{sending ? 'Sending...' : 'Dispatch'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Attending Physicians Directory */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Attending Medical Staff Directory
                  </h3>
                  <div className="space-y-3">
                    {doctors.slice(0, 4).map((doc, idx) => {
                      const docUser = doc.userId || doc;
                      const name = docUser.name || `Dr. ${docUser.firstName || ''} ${docUser.lastName || ''}`.trim();
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-800 text-xs font-bold">
                              Dr
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{name}</div>
                              <div className="text-[11px] text-teal-700 font-medium">
                                {doc.specialization || doc.department || 'Consultant'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedDoctorId(docUser._id || doc._id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-50 rounded-lg transition"
                          >
                            Select
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Communication Thread & Historical Messages (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Communication Logs & Active Threads</h2>
                      <p className="text-xs text-slate-500">Record of clinical transmissions between nurse and physicians</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFilterUrgentOnly(!filterUrgentOnly)}
                      className={`px-3 py-1 text-xs font-bold rounded-xl border transition ${
                        filterUrgentOnly
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {filterUrgentOnly ? 'Urgent Only' : 'Show All'}
                    </button>
                  </div>

                  <div className="mt-4 space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                    {loading ? (
                      <div className="flex h-40 items-center justify-center">
                        <RefreshCw size={22} className="animate-spin text-teal-600" />
                      </div>
                    ) : filteredMessages.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No communication dispatches recorded yet.
                      </div>
                    ) : (
                      filteredMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`rounded-2xl border p-4 transition ${
                            msg.isUrgent
                              ? 'bg-rose-50/40 border-rose-200 shadow-2xs'
                              : 'bg-white border-slate-200/80 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                                  msg.isUrgent ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {msg.isUrgent ? '!' : 'Dr'}
                              </span>
                              <div>
                                <span className="text-xs font-bold text-slate-900">
                                  {msg.subject || (msg.isUrgent ? 'URGENT Clinical Condition' : 'Routine Message')}
                                </span>
                                <div className="text-[11px] text-slate-500">
                                  To: {msg.doctor?.name || msg.recipientName || 'Attending Physician'}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              {msg.isUrgent && (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 mb-1">
                                  STAT / URGENT
                                </span>
                              )}
                              <div className="text-[10px] text-slate-400">
                                {msg.createdAt
                                  ? new Date(msg.createdAt).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Just now'}
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 whitespace-pre-wrap leading-relaxed">
                            {msg.message}
                          </div>

                          {msg.patient && (
                            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                              <User size={12} className="text-teal-600" />
                              <span>
                                Inpatient: <strong className="text-slate-700">{msg.patient.name || 'Assigned Patient'}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
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
