import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Plus,
  AlertTriangle,
  RefreshCw,
  Mail,
  Inbox,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { doctorPortalAPI, doctorAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Compose Modal
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [receiverId, setReceiverId] = useState('');
  const [recipientCategory, setRecipientCategory] = useState<'doctor' | 'patient'>('doctor');
  const [patientId, setPatientId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [messageType, setMessageType] = useState('clinical_query');
  const [priority, setPriority] = useState('normal');

  // Quick Reply state
  const [replyText, setReplyText] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [msgRes, patRes, docRes] = await Promise.all([
        doctorPortalAPI.getMessages(),
        doctorPortalAPI.getPatients({ limit: 100 }),
        doctorAPI.getAll(1, '', 100),
      ]);
      const msgs = msgRes.data?.data || [];
      setMessages(msgs);
      setUnreadCount(msgRes.data?.unreadCount || 0);
      setPatients(patRes.data?.data || []);
      setDoctors(docRes.data?.data || []);
      if (msgs.length > 0 && !selectedMessage) {
        setSelectedMessage(msgs[0]);
      }
    } catch (err: any) {
      toast.error('Failed to load clinical messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectMessage = async (msg: any) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      try {
        await doctorPortalAPI.markMessageRead(msg._id);
        setMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? { ...m, isRead: true } : m))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        // silent
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId || !body.trim()) {
      toast.error('Please select recipient and enter message text');
      return;
    }
    try {
      await doctorPortalAPI.sendMessage({
        receiverId,
        patientId: patientId || undefined,
        subject: subject || 'Clinical Query',
        body,
        messageType,
        priority,
      });
      toast.success('Message delivered successfully!');
      setComposeModalOpen(false);
      setBody('');
      setSubject('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    }
  };

  const handleSendQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;
    const recipientUser = selectedMessage.senderId;
    if (!recipientUser?._id) {
      toast.error('Cannot determine recipient');
      return;
    }
    try {
      await doctorPortalAPI.sendMessage({
        receiverId: recipientUser._id,
        patientId: selectedMessage.patientId?._id || undefined,
        subject: `Re: ${selectedMessage.subject || 'Message'}`,
        body: replyText,
        messageType: selectedMessage.messageType || 'clinical_query',
        priority: selectedMessage.priority || 'normal',
      });
      toast.success('Reply sent');
      setReplyText('');
      loadData();
    } catch (err) {
      toast.error('Failed to send reply');
    }
  };

  const filteredMessages = messages.filter((m) => {
    const sender = m.senderId?.name || '';
    const subj = m.subject || '';
    const bodyTxt = m.body || '';
    const matchesSearch =
      sender.toLowerCase().includes(search.toLowerCase()) ||
      subj.toLowerCase().includes(search.toLowerCase()) ||
      bodyTxt.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'unread') return !m.isRead;
    if (filterType === 'emergency') return m.priority === 'emergency';
    if (filterType === 'clinical') return m.messageType === 'clinical_query';
    return true;
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Clinical Communications
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Doctor Messaging & Alerts
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Secure messaging hub between physicians, patients, nursing staff, and emergency coordinators.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadData}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setComposeModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm transition shadow-teal-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Compose Message
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Total Messages</div>
                  <div className="text-2xl font-bold text-slate-800">{messages.length}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Inbox className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Unread Messages</div>
                  <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Emergency Alerts</div>
                  <div className="text-2xl font-bold text-red-600">
                    {messages.filter((m) => m.priority === 'emergency').length}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Main Chat Interface (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
              {/* Message List (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {/* Search & Filters */}
                <div className="p-3 border-b border-slate-100 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition ${
                        filterType === 'all' ? 'bg-teal-50 text-teal-800' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All ({messages.length})
                    </button>
                    <button
                      onClick={() => setFilterType('unread')}
                      className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition ${
                        filterType === 'unread' ? 'bg-blue-50 text-blue-800' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                    <button
                      onClick={() => setFilterType('emergency')}
                      className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition ${
                        filterType === 'emergency' ? 'bg-red-50 text-red-800' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Urgent & Emergency
                    </button>
                  </div>
                </div>

                {/* Message list scrollable */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {loading ? (
                    <div className="p-8 text-center text-xs text-slate-400">Loading messages...</div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">No messages found</div>
                  ) : (
                    filteredMessages.map((msg) => {
                      const isSelected = selectedMessage?._id === msg._id;
                      const senderName = msg.senderId?.name || 'Kushal Staff';
                      const timeStr = new Date(msg.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={msg._id}
                          onClick={() => handleSelectMessage(msg)}
                          className={`p-3.5 cursor-pointer transition text-left flex flex-col gap-1 ${
                            isSelected
                              ? 'bg-teal-50/70 border-l-4 border-l-teal-600'
                              : !msg.isRead
                              ? 'bg-blue-50/30 font-semibold'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900 truncate max-w-[180px]">{senderName}</span>
                            <span className="text-[10px] text-slate-400">{timeStr}</span>
                          </div>

                          <div className="text-xs font-semibold text-slate-800 truncate">{msg.subject || 'Message'}</div>

                          <div className="text-[11px] text-slate-500 truncate">{msg.body}</div>

                          <div className="flex items-center gap-1.5 mt-1">
                            {msg.priority === 'emergency' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                Emergency
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              {msg.messageType?.replace('_', ' ')}
                            </span>
                            {!msg.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 ml-auto" title="Unread" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Message Details & Reply Panel (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
                {selectedMessage ? (
                  <>
                    <div className="p-5 border-b border-slate-100 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">{selectedMessage.subject || 'Subject'}</h2>
                          <div className="text-xs text-slate-500 mt-0.5">
                            From: <strong className="text-slate-800">{selectedMessage.senderId?.name || 'Staff'}</strong> ({selectedMessage.senderId?.role || 'User'})
                          </div>
                          {selectedMessage.patientId && (
                            <div className="text-xs text-teal-700 font-medium mt-0.5">
                              Regarding Patient: {selectedMessage.patientId?.name || 'Assigned Patient'}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              selectedMessage.priority === 'emergency'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {selectedMessage.priority || 'Normal'}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(selectedMessage.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {selectedMessage.body}
                      </div>

                      {selectedMessage.priority === 'emergency' && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>This communication is marked as High Priority / Clinical Emergency alert.</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Reply Box */}
                    <form onSubmit={handleSendQuickReply} className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Write a quick clinical response..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Reply
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-400 text-sm m-auto">
                    Select a message from the left to read its full thread.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* COMPOSE MESSAGE MODAL */}
      {composeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-teal-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Compose Clinical Message</h3>
                  <p className="text-xs text-slate-500">Communicate with colleagues, nurses, or patients</p>
                </div>
              </div>
              <button
                onClick={() => setComposeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Recipient Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientCategory('doctor');
                      setReceiverId('');
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      recipientCategory === 'doctor'
                        ? 'bg-teal-50 border-teal-500 text-teal-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Physicians & Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientCategory('patient');
                      setReceiverId('');
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      recipientCategory === 'patient'
                        ? 'bg-teal-50 border-teal-500 text-teal-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Patients
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Recipient *
                </label>
                <select
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  required
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                >
                  <option value="">-- Choose Recipient --</option>
                  {recipientCategory === 'doctor'
                    ? doctors.map((d) => (
                        <option key={d._id} value={d.userId?._id || d.userId || d._id}>
                          Dr. {d.name} ({d.specialization})
                        </option>
                      ))
                    : patients.map((p) => (
                        <option key={p._id} value={p.userId?._id || p.userId || p._id}>
                          {p.name} ({p.patientId || 'ID'})
                        </option>
                      ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Message Type
                  </label>
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="clinical_query">Clinical Query</option>
                    <option value="emergency_alert">Emergency Alert</option>
                    <option value="referral">Referral Update</option>
                    <option value="lab_alert">Diagnostic Alert</option>
                    <option value="general">General Message</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Associate Patient (Optional)
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                >
                  <option value="">-- No specific patient --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.patientId || 'ID'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Second opinion on ECG findings for Bed 12"
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Message Content *</label>
                <textarea
                  rows={4}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type clear clinical observations, recommendations, or questions..."
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setComposeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-md shadow-teal-600/20"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
