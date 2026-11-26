import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  ShieldCheck,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { onlineConsultationAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminOnlineConsultationsPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>({
    totalConsultations: 0,
    completedConsultations: 0,
    totalRevenue: 0,
    avgDurationMinutes: 0,
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await onlineConsultationAPI.getAdminConsultations({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: 20,
      });

      if (res.data?.success) {
        setConsultations(res.data.data || []);
        if (res.data.analytics) setAnalytics(res.data.analytics);
        if (res.data.pagination) setTotalPages(res.data.pagination.pages || 1);
      }
    } catch (err: any) {
      toast.error('Failed to load admin online consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, page]);

  // Export report to CSV
  const handleExportCSV = () => {
    if (consultations.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Consultation ID', 'Meeting Room ID', 'Doctor', 'Patient', 'Date', 'Time', 'Fee', 'Payment Status', 'Call Status', 'Duration (mins)'];
    const rows = consultations.map((c) => [
      c.consultationId,
      c.meetingRoomId,
      c.doctorId?.userId?.name || 'N/A',
      c.patientId?.userId?.name || 'N/A',
      new Date(c.scheduledDate).toLocaleDateString(),
      c.startTime,
      c.consultationFee,
      c.paymentStatus,
      c.status,
      Math.round((c.callDurationSeconds || 0) / 60),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kushal_online_consultations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Consultation audit report exported successfully');
  };

  const filtered = consultations.filter((c) => {
    const docName = (c.doctorId?.userId?.name || '').toLowerCase();
    const patName = (c.patientId?.userId?.name || '').toLowerCase();
    const cId = (c.consultationId || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return docName.includes(q) || patName.includes(q) || cId.includes(q);
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
                    <ShieldCheck size={14} className="text-teal-300" />
                    Hospital Administration & Telehealth Audit
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Online Consultations Master Desk</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Monitor telehealth bookings, track doctor-patient sessions, audit revenue settlements, and export analytics.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-900 text-xs font-extrabold shadow hover:bg-teal-50 transition"
                  >
                    <Download size={14} /> Export CSV Report
                  </button>
                  <button
                    onClick={loadData}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md transition"
                    title="Refresh data"
                  >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
            </div>

            {/* Analytics KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Video Bookings
                </span>
                <p className="text-2xl font-black text-slate-900">{analytics.totalConsultations || 0}</p>
                <span className="text-[10px] text-teal-700 font-bold">Platform-wide records</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-emerald-200 bg-emerald-50/30 shadow-sm space-y-1">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                  Completed Sessions
                </span>
                <p className="text-2xl font-black text-emerald-950">{analytics.completedConsultations || 0}</p>
                <span className="text-[10px] text-emerald-700 font-bold">Successfully consulted</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Video Revenue
                </span>
                <p className="text-2xl font-black text-teal-950">₹{analytics.totalRevenue || 0}</p>
                <span className="text-[10px] text-teal-700 font-bold">Direct paid consultations</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Avg Session Duration
                </span>
                <p className="text-2xl font-black text-slate-800">{analytics.avgDurationMinutes || 0} mins</p>
                <span className="text-[10px] text-slate-400 font-medium">Standard clinical time</span>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <Filter size={15} className="text-slate-400 shrink-0" />
                {['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctor, patient or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500 w-full sm:w-64"
                />
              </div>
            </div>

            {/* Master Consultations Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Consultation / Room</th>
                      <th className="py-3 px-4">Attending Doctor</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Scheduled Slot</th>
                      <th className="py-3 px-4">Fee & Settlement</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Call Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No online consultation sessions found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((c) => {
                        const doc = c.doctorId;
                        const docName = doc?.userId?.name || 'Physician';
                        const pat = c.patientId;
                        const patName = pat?.userId?.name || 'Patient';

                        return (
                          <tr key={c._id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-slate-800 block">{c.consultationId}</span>
                              <span className="font-mono text-[10px] text-teal-700">{c.meetingRoomId}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 block">{docName}</span>
                              <span className="text-[11px] text-slate-400">{doc?.specialization}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 block">{patName}</span>
                              <span className="text-[11px] text-slate-400">
                                {pat?.gender} • Blood: {pat?.bloodGroup || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800 block">
                                {new Date(c.scheduledDate).toLocaleDateString()}
                              </span>
                              <span className="text-teal-800 font-semibold text-[11px]">{c.startTime}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 block">₹{c.consultationFee || 600}</span>
                              <span
                                className={`text-[10px] font-bold uppercase ${
                                  c.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                                }`}
                              >
                                {c.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                  c.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : c.status === 'in-progress'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : c.status === 'confirmed'
                                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                                    : c.status === 'pending'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                              {c.callDurationSeconds ? `${Math.round(c.callDurationSeconds / 60)} mins` : '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Page {page} of {totalPages}</span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
