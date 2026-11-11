import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Send,
  RefreshCw,
  Stethoscope,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getMessages(selectedDoctorId || undefined);
      setMessages(res.data?.data || []);
      const docList = res.data?.doctors || [];
      setDoctors(docList);
      if (docList.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docList[0]._id);
      }
    } catch (err: any) {
      toast.error('Failed to load doctor messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [selectedDoctorId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const currentDoc = doctors.find((d) => d._id === selectedDoctorId);
    const receiverId = currentDoc?.userId?._id || currentDoc?.userId || currentDoc?._id;

    if (!receiverId) {
      toast.error('Please select an attending clinician recipient');
      return;
    }

    try {
      setSending(true);
      await patientPortalAPI.sendMessage({
        receiverId,
        subject: subject.trim() || 'Patient Health Query',
        body: messageText.trim(),
      });
      setMessageText('');
      setSubject('');
      toast.success('Message sent to physician');
      loadMessages();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);
  const selectedDoctorName =
    selectedDoctor?.userId?.name ||
    `Dr. ${selectedDoctor?.userId?.firstName || ''} ${selectedDoctor?.userId?.lastName || ''}`.trim() ||
    'Attending Clinician';

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
                    <MessageSquare size={14} className="text-teal-300" />
                    Doctor Communication Channel
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Messages with Doctors</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Ask post-consultation follow-up questions, report medication tolerance, and receive clinical advice.
                  </p>
                </div>
              </div>
            </div>

            {/* Split Chat Layout */}
            <div className="clinical-card p-0 overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
              {/* Left Column: Doctor Contacts List */}
              <div className="border-r border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase">Consulting Doctors</span>
                  <button onClick={loadMessages} className="text-slate-400 hover:text-slate-600">
                    <RefreshCw size={13} />
                  </button>
                </div>

                {doctors.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No doctor threads yet. Book an appointment to message your doctor.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {doctors.map((doc) => {
                      const docName =
                        doc.userId?.name ||
                        `Dr. ${doc.userId?.firstName || ''} ${doc.userId?.lastName || ''}`.trim() ||
                        'Clinician';
                      const isSelected = selectedDoctorId === doc._id;

                      return (
                        <div
                          key={doc._id}
                          onClick={() => setSelectedDoctorId(doc._id)}
                          className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-teal-700 text-white shadow-sm'
                              : 'bg-white border border-slate-200 hover:bg-teal-50/50 text-slate-800'
                          }`}
                        >
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            <Stethoscope size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold truncate">{docName}</h4>
                            <p className={`text-[10px] truncate ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                              {doc.specialization}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Chat History and Message Composer */}
              <div className="md:col-span-2 flex flex-col justify-between p-4 sm:p-6 bg-white space-y-4">
                {/* Chat Top Bar */}
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold">
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{selectedDoctorName}</h3>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        ● Direct Medical Support Channel
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message History */}
                <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] max-h-[420px] p-2">
                  {loading ? (
                    <div className="py-12 text-center text-slate-400 text-xs">Loading dialogue history...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs">
                      No messages exchanged with {selectedDoctorName} yet. Send your query below.
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe = msg.senderRole === 'patient' || msg.senderModel === 'User';

                      return (
                        <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl p-3.5 text-xs ${
                              isMe
                                ? 'bg-teal-700 text-white rounded-br-none shadow-sm'
                                : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                            }`}
                          >
                            {msg.subject && <strong className="block mb-1 font-bold">{msg.subject}</strong>}
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.body || msg.message}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1 font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 space-y-2">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject (e.g. Question on tablet dosage, fever observation)"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 bg-slate-50"
                  />
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      required
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your clinical question here..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600"
                    />
                    <button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20 flex items-center justify-center gap-1.5 self-end"
                    >
                      <Send size={14} /> Send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
