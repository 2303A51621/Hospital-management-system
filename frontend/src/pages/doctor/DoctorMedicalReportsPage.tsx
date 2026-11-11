import { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  MessageSquare,
  FlaskConical,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { doctorPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorMedicalReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'abnormal'>('all');
  const [search, setSearch] = useState('');

  // Order Test Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderPatientId, setOrderPatientId] = useState('');
  const [orderTestName, setOrderTestName] = useState('Complete Blood Count (CBC)');
  const [orderTestType, setOrderTestType] = useState('Laboratory');
  const [orderCategory, setOrderCategory] = useState('Hematology');
  const [orderRemarks, setOrderRemarks] = useState('');

  // Review Report Modal
  const [reviewModalReport, setReviewModalReport] = useState<any | null>(null);
  const [reviewDoctorComments, setReviewDoctorComments] = useState('');
  const [reviewIsAbnormal, setReviewIsAbnormal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [repRes, patRes] = await Promise.all([
        doctorPortalAPI.getReports(),
        doctorPortalAPI.getPatients({ limit: 100 }),
      ]);
      setReports(repRes.data.data || []);
      setPatients(patRes.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load medical reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOrderTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderPatientId) {
      toast.error('Please select a patient');
      return;
    }
    try {
      const res = await doctorPortalAPI.orderDiagnosticTest({
        patientId: orderPatientId,
        testName: orderTestName,
        testType: orderTestType,
        testCategory: orderCategory,
        remarks: orderRemarks,
      });
      toast.success(res.data.message || 'Diagnostic investigation ordered');
      setOrderModalOpen(false);
      setOrderRemarks('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to order investigation');
    }
  };

  const handleReviewReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalReport) return;
    try {
      const res = await doctorPortalAPI.reviewReport(reviewModalReport._id, {
        doctorComments: reviewDoctorComments,
        isAbnormal: reviewIsAbnormal,
      });
      toast.success(res.data.message || 'Report reviewed and saved');
      setReviewModalReport(null);
      loadData();
    } catch (err: any) {
      toast.error('Failed to submit review');
    }
  };

  const openReviewModal = (report: any) => {
    setReviewModalReport(report);
    setReviewDoctorComments(report.doctorComments || '');
    setReviewIsAbnormal(!!report.isAbnormal);
  };

  const filteredReports = reports.filter((rep) => {
    const patName = rep.patientId?.name || rep.patientId?.user?.name || '';
    const testName = rep.testName || '';
    const matchesSearch =
      patName.toLowerCase().includes(search.toLowerCase()) ||
      testName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'pending') return rep.status !== 'completed';
    if (activeTab === 'completed') return rep.status === 'completed';
    if (activeTab === 'abnormal') return !!rep.isAbnormal;
    return true;
  });

  const abnormalCount = reports.filter((r) => r.isAbnormal).length;
  const pendingCount = reports.filter((r) => r.status !== 'completed').length;

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
                  <FlaskConical className="w-3.5 h-3.5" />
                  Laboratory & Imaging Diagnostics
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Medical Reports Management
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Order investigations (blood tests, X-ray, MRI, CT), review lab findings, and flag abnormal parameters.
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
                  onClick={() => setOrderModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm transition shadow-teal-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Order Investigation
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Total Investigations</div>
                  <div className="text-2xl font-bold text-slate-800">{reports.length}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Pending Results</div>
                  <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Completed & Available</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {reports.filter((r) => r.status === 'completed').length}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Abnormal Findings</div>
                  <div className="text-2xl font-bold text-red-600">{abnormalCount}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({reports.length})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    activeTab === 'pending'
                      ? 'bg-white text-amber-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    activeTab === 'completed'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setActiveTab('abnormal')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    activeTab === 'abnormal' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Abnormal Flags ({abnormalCount})
                </button>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search test name or patient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            {/* Reports List */}
            {loading ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Loading diagnostic records...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-700">No medical reports found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                  No diagnostic investigations matching the selected filter.
                </p>
                <button
                  onClick={() => setOrderModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Order First Investigation
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="py-3 px-4">Test Name & Category</th>
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Order Date</th>
                        <th className="py-3 px-4">Status & Flag</th>
                        <th className="py-3 px-4">Physician Review</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReports.map((rep) => {
                        const pat = rep.patientId || {};
                        const patName = pat.name || pat.user?.name || 'Assigned Patient';
                        const orderDate = new Date(rep.createdAt || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });

                        return (
                          <tr key={rep._id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{rep.testName || 'Diagnostic Investigation'}</div>
                              <div className="text-xs text-slate-400">
                                {rep.testCategory || 'General'} • {rep.testType || 'Clinical Test'}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{patName}</div>
                              <div className="text-xs text-slate-400">{pat.patientId || 'ID'}</div>
                            </td>

                            <td className="py-3 px-4 text-xs text-slate-600">{orderDate}</td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    rep.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {rep.status === 'completed' ? 'Results Ready' : 'Pending Lab'}
                                </span>

                                {rep.isAbnormal && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Abnormal
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {rep.reviewedAt ? (
                                <div>
                                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
                                  </span>
                                  {rep.doctorComments && (
                                    <div className="text-[11px] text-slate-500 italic truncate max-w-xs">
                                      "{rep.doctorComments}"
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">Awaiting Doctor Review</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {rep.reportFile && (
                                  <a
                                    href={rep.reportFile}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-slate-500 hover:text-teal-700 border border-slate-200 rounded-lg hover:bg-white transition"
                                    title="Download / View Attachment"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                )}
                                <button
                                  onClick={() => openReviewModal(rep)}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold border border-teal-200 transition"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  Review
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ORDER INVESTIGATION MODAL */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-teal-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Order Diagnostic Investigation</h3>
                  <p className="text-xs text-slate-500">Blood tests, Radiographs, MRI, CT Scans</p>
                </div>
              </div>
              <button
                onClick={() => setOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOrderTest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Patient *
                </label>
                <select
                  value={orderPatientId}
                  onChange={(e) => setOrderPatientId(e.target.value)}
                  required
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                >
                  <option value="">-- Choose Assigned Patient --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.patientId || 'ID'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Investigation Type
                  </label>
                  <select
                    value={orderTestType}
                    onChange={(e) => setOrderTestType(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="Laboratory">Laboratory</option>
                    <option value="Radiology">Radiology (X-Ray)</option>
                    <option value="Imaging">Advanced Imaging (CT / MRI)</option>
                    <option value="Cardiology">Cardiology (ECG / Echo)</option>
                    <option value="Pathology">Pathology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    value={orderCategory}
                    onChange={(e) => setOrderCategory(e.target.value)}
                    placeholder="e.g. Hematology, Biochemistry"
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Test Name *</label>
                <input
                  type="text"
                  required
                  value={orderTestName}
                  onChange={(e) => setOrderTestName(e.target.value)}
                  placeholder="e.g. Complete Blood Count (CBC) / Chest X-Ray PA / Brain MRI"
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Clinical Indication / Remarks
                </label>
                <textarea
                  rows={2}
                  value={orderRemarks}
                  onChange={(e) => setOrderRemarks(e.target.value)}
                  placeholder="Suspected infection, persistent dry cough for 3 weeks..."
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-md shadow-teal-600/20"
                >
                  Confirm Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW REPORT MODAL */}
      {reviewModalReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">Review Diagnostic Report</h3>
                <p className="text-xs text-slate-500">
                  {reviewModalReport.testName} • {reviewModalReport.patientId?.name || 'Patient'}
                </p>
              </div>
              <button
                onClick={() => setReviewModalReport(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewReport} className="p-6 space-y-4">
              {reviewModalReport.results && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-xs font-bold text-slate-600 uppercase mb-1">Laboratory Findings</div>
                  <pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans">
                    {typeof reviewModalReport.results === 'object'
                      ? JSON.stringify(reviewModalReport.results, null, 2)
                      : reviewModalReport.results}
                  </pre>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Physician's Clinical Comments & Correlation
                </label>
                <textarea
                  rows={3}
                  value={reviewDoctorComments}
                  onChange={(e) => setReviewDoctorComments(e.target.value)}
                  placeholder="Findings consistent with mild iron deficiency anemia. Initiate oral iron supplementation."
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5"
                />
              </div>

              <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-800">Flag as Abnormal Finding</div>
                  <div className="text-[11px] text-red-600">
                    Highlights critical values requiring urgent patient follow-up
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={reviewIsAbnormal}
                  onChange={(e) => setReviewIsAbnormal(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-red-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalReport(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-md shadow-teal-600/20"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
