import { useEffect, useState } from 'react';
import {
  FlaskConical,
  Download,
  Upload,
  Search,
  AlertTriangle,
  RefreshCw,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientMedicalReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Upload external report modal
  const [uploadModal, setUploadModal] = useState(false);
  const [testName, setTestName] = useState('');
  const [testCategory, setTestCategory] = useState('Blood Test');
  const [fileUrl, setFileUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getMedicalReports();
      const list = res.data?.data || [];
      setReports(list);
      if (list.length > 0 && !selectedReport) {
        setSelectedReport(list[0]);
      }
    } catch (err: any) {
      toast.error('Failed to load lab and diagnostic reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      toast.error('Please enter the investigation name');
      return;
    }
    try {
      setUploading(true);
      await patientPortalAPI.uploadDocument({
        name: testName.trim(),
        documentType: testCategory,
        fileUrl: fileUrl.trim() || 'https://kushalhospitals.com/reports/sample.pdf',
        notes: notes.trim(),
      });
      toast.success('Investigation report uploaded successfully');
      setUploadModal(false);
      setTestName('');
      setNotes('');
      loadReports();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (typeFilter !== 'all' && (r.testType || '').toLowerCase() !== typeFilter.toLowerCase()) return false;
    const name = (r.testName || '').toLowerCase();
    const doc = (r.doctorId?.userId?.name || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || doc.includes(q);
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
                    <FlaskConical size={14} className="text-teal-300" />
                    Laboratory & Imaging Diagnostics
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Diagnostic & Laboratory Reports</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Access verified hematology, biochemistry, radiology scans, and histopathology test results.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setUploadModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 text-xs font-bold transition-all shadow-md shadow-teal-950/20"
                  >
                    <Upload size={14} /> Upload External Report
                  </button>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="clinical-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                {[
                  { id: 'all', label: 'All Tests' },
                  { id: 'blood', label: 'Blood Tests' },
                  { id: 'imaging', label: 'Scans & X-Rays' },
                  { id: 'urine', label: 'Urine / Pathology' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTypeFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      typeFilter === tab.id ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search test name or doctor..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 bg-slate-50 w-56"
                  />
                </div>
                <button
                  onClick={loadReports}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                  title="Refresh"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Content: Split List and Report Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reports List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="py-12 text-center text-slate-400 text-xs">Loading laboratory investigations...</div>
                ) : filteredReports.length === 0 ? (
                  <div className="clinical-card p-8 text-center text-xs text-slate-400">
                    No laboratory reports found
                  </div>
                ) : (
                  filteredReports.map((report) => {
                    const isSelected = selectedReport?._id === report._id;
                    const isCompleted = report.status === 'completed';

                    return (
                      <div
                        key={report._id}
                        onClick={() => setSelectedReport(report)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-teal-50/70 border-teal-500 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-400 uppercase">
                            #{report._id.slice(-6).toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {report.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">{report.testName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {report.testType || 'Diagnostic'} • {new Date(report.createdAt || report.date).toLocaleDateString()}
                        </p>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-600">
                            Dr. {report.doctorId?.userId?.name || 'Referred Physician'}
                          </span>
                          <span className="text-teal-700 font-bold">Inspect →</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Report Preview Panel */}
              <div className="lg:col-span-2">
                {!selectedReport ? (
                  <div className="clinical-card p-12 text-center text-slate-400 text-xs">
                    Select an investigation to view detailed parameters and clinician comments.
                  </div>
                ) : (
                  <div className="clinical-card p-6 sm:p-8 space-y-6 bg-white border border-slate-200">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 mb-1">
                          <FlaskConical size={12} /> {selectedReport.testType || 'Laboratory Investigation'}
                        </div>
                        <h2 className="text-xl font-black text-slate-900">{selectedReport.testName}</h2>
                        <p className="text-xs text-slate-500">
                          Referred by: Dr. {selectedReport.doctorId?.userId?.name || 'Attending Physician'} • Ordered on{' '}
                          {new Date(selectedReport.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.print()}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <Printer size={14} /> Print
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20 flex items-center gap-1.5"
                        >
                          <Download size={14} /> Download PDF
                        </button>
                      </div>
                    </div>

                    {/* Investigation Results Table */}
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                        Parametric Test Results
                      </h3>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Parameter Measured</th>
                              <th className="py-2.5 px-3">Observed Value</th>
                              <th className="py-2.5 px-3">Reference Interval</th>
                              <th className="py-2.5 px-3">Unit</th>
                              <th className="py-2.5 px-3">Clinical Evaluation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(selectedReport.parameters || [
                              { name: 'Observed Indicator Value', value: selectedReport.result || 'Normal Range', normalRange: 'Within Reference Range', unit: 'Index', isAbnormal: false },
                            ]).map((param: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-3 px-3 font-bold text-slate-900">{param.name}</td>
                                <td className="py-3 px-3 font-mono font-bold text-slate-800">{param.value}</td>
                                <td className="py-3 px-3 text-slate-500">{param.normalRange || 'Standard'}</td>
                                <td className="py-3 px-3 text-slate-500">{param.unit || '-'}</td>
                                <td className="py-3 px-3">
                                  {param.isAbnormal ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      <AlertTriangle size={10} /> Abnormal
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 size={10} /> Normal
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Clinical Comments */}
                    {selectedReport.notes && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <strong className="text-slate-900 block font-bold">Pathologist / Radiologist Observations:</strong>
                        <p className="text-slate-600 leading-relaxed">{selectedReport.notes}</p>
                      </div>
                    )}

                    {/* Accreditations */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Kushal Central Diagnostic Laboratories • NABL Certified</span>
                      <span>Verified by Chief Clinical Pathologist</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* External Report Upload Modal */}
            {uploadModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <form
                  onSubmit={handleUploadReport}
                  className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-900">Upload External Diagnostic Report</h3>
                    <button
                      type="button"
                      onClick={() => setUploadModal(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Investigation Name *</label>
                    <input
                      type="text"
                      required
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="e.g. Brain MRI, 2D Echocardiogram, HbA1c"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Diagnostic Modality</label>
                    <select
                      value={testCategory}
                      onChange={(e) => setTestCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 bg-white"
                    >
                      <option value="Blood Test">Blood Investigation (Hematology / Biochemistry)</option>
                      <option value="X-Ray">Radiography (X-Ray)</option>
                      <option value="MRI">Magnetic Resonance Imaging (MRI)</option>
                      <option value="CT Scan">Computed Tomography (CT Scan)</option>
                      <option value="Ultrasound">Sonography / Ultrasound</option>
                      <option value="Biopsy">Histopathology / Biopsy</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">File Link or Cloud URL</label>
                    <input
                      type="text"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://... (or leave blank for test mock)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Clinical Notes (Optional)</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any notes from referring physician or laboratory..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadModal(false)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20"
                    >
                      {uploading ? 'Attaching...' : 'Upload Report'}
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
