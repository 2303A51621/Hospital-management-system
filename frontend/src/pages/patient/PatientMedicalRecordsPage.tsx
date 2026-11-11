import { useEffect, useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Pill,
  FlaskConical,
  Upload,
  Calendar,
  User,
  HeartPulse,
  Stethoscope,
  RefreshCw,
  Search,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientMedicalRecordsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  // Upload modal
  const [uploadModal, setUploadModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Laboratory Report');
  const [fileUrl, setFileUrl] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getMedicalRecords();
      setData(res.data?.data);
    } catch (err: any) {
      toast.error('Failed to load electronic health records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      toast.error('Please enter a document title');
      return;
    }
    try {
      setUploading(true);
      await patientPortalAPI.uploadDocument({
        name: docName.trim(),
        documentType: docType,
        fileUrl: fileUrl.trim() || 'https://kushalhospitals.com/records/sample.pdf',
        notes: docNotes.trim(),
      });
      toast.success('Document uploaded to electronic health records');
      setUploadModal(false);
      setDocName('');
      setDocNotes('');
      loadRecords();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const timeline = data?.timeline || [];
  const allergies = data?.allergies || [];
  const conditions = data?.chronicConditions || [];

  const filteredTimeline = timeline.filter((item: any) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const doc = (item.doctorName || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || doc.includes(q);
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
                    <FileText size={14} className="text-teal-300" />
                    Electronic Health Records (EMR)
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Personal Medical Records & Timeline</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Your complete longitudinal clinical timeline of doctor visits, diagnoses, vitals, prescriptions, and diagnostics.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setUploadModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 text-xs font-bold transition-all shadow-md shadow-teal-950/20"
                  >
                    <Upload size={14} /> Upload Health Document
                  </button>
                </div>
              </div>
            </div>

            {/* Top Critical Summary: Allergies & Chronic Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="clinical-card p-5 border-l-4 border-l-rose-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={15} className="text-rose-600" /> Recorded Allergies
                  </span>
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    {allergies.length} Critical Flags
                  </span>
                </div>
                {allergies.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No drug or food allergies recorded.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allergies.map((allergy: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="clinical-card p-5 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartPulse size={15} className="text-amber-600" /> Chronic Medical Conditions
                  </span>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {conditions.length} Active Records
                  </span>
                </div>
                {conditions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No chronic ailments or existing comorbidities noted.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {conditions.map((cond: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold"
                      >
                        {cond}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filter and Timeline Container */}
            <div className="clinical-card p-6 space-y-6">
              {/* Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {[
                    { id: 'all', label: 'All Events' },
                    { id: 'consultation', label: 'Consultations' },
                    { id: 'prescription', label: 'Prescriptions' },
                    { id: 'lab_test', label: 'Lab Reports' },
                    { id: 'appointment', label: 'Appointments' },
                    { id: 'document', label: 'Documents' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterType(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterType === tab.id ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
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
                      placeholder="Search medical records..."
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 bg-slate-50 w-52"
                    />
                  </div>
                  <button
                    onClick={loadRecords}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                    title="Refresh"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Chronological Timeline */}
              {loading ? (
                <div className="py-20 text-center text-slate-400">Compiling electronic medical timeline...</div>
              ) : filteredTimeline.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold">No timeline events match your filter</p>
                </div>
              ) : (
                <div className="relative pl-6 sm:pl-8 border-l-2 border-teal-200/70 space-y-8 my-4">
                  {filteredTimeline.map((item: any, idx: number) => {
                    const isConsult = item.type === 'consultation';
                    const isRx = item.type === 'prescription';
                    const isLab = item.type === 'lab_test';
                    const isDoc = item.type === 'document';

                    return (
                      <div key={idx} className="relative group">
                        {/* Dot on Timeline */}
                        <div
                          className={`absolute -left-[31px] sm:-left-[39px] top-1.5 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm ${
                            isConsult
                              ? 'bg-teal-700'
                              : isRx
                              ? 'bg-emerald-600'
                              : isLab
                              ? 'bg-cyan-600'
                              : isDoc
                              ? 'bg-purple-600'
                              : 'bg-slate-600'
                          }`}
                        >
                          {isConsult && <Stethoscope size={12} />}
                          {isRx && <Pill size={12} />}
                          {isLab && <FlaskConical size={12} />}
                          {isDoc && <FileText size={12} />}
                          {!isConsult && !isRx && !isLab && !isDoc && <Calendar size={12} />}
                        </div>

                        {/* Content Card */}
                        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-teal-300 hover:shadow-sm transition-all space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-extrabold text-slate-900">{item.title}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                {item.type.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 font-medium">
                              {new Date(item.date).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                          {item.doctorName && (
                            <div className="text-xs text-teal-800 font-semibold flex items-center gap-1.5 pt-1">
                              <User size={13} /> Attending Doctor: {item.doctorName}
                            </div>
                          )}

                          {item.notes && (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 mt-2">
                              <strong className="text-slate-900">Clinical Remarks:</strong> {item.notes}
                            </div>
                          )}

                          {item.medicines && item.medicines.length > 0 && (
                            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1.5 mt-2">
                              <span className="text-[11px] font-bold text-emerald-900 uppercase">Prescribed Medicines:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {item.medicines.map((m: any, mIdx: number) => (
                                  <div key={mIdx} className="text-xs text-slate-800 flex justify-between bg-white p-2 rounded-lg border border-emerald-200/60">
                                    <span className="font-bold">{m.name}</span>
                                    <span className="text-emerald-700 font-medium">{m.dosage} • {m.frequency}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Document Upload Modal */}
            {uploadModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <form
                  onSubmit={handleUploadSubmit}
                  className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-900">Upload Health Document</h3>
                    <button
                      type="button"
                      onClick={() => setUploadModal(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Document Title *</label>
                    <input
                      type="text"
                      required
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="e.g. Chest X-Ray 2026, Lipid Profile"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Document Category</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 bg-white"
                    >
                      <option value="Laboratory Report">Laboratory Report</option>
                      <option value="Radiology / Scan">Radiology / X-Ray / MRI / CT</option>
                      <option value="Discharge Summary">Hospital Discharge Summary</option>
                      <option value="Prior Prescription">Prior Doctor Prescription</option>
                      <option value="Vaccination Record">Vaccination Certificate</option>
                      <option value="Insurance Document">Insurance Card / Policy</option>
                      <option value="Other">Other Medical File</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">File URL / Cloud Link</label>
                    <input
                      type="text"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://... (or leave empty for demo mock upload)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Patient Notes (Optional)</label>
                    <textarea
                      rows={2}
                      value={docNotes}
                      onChange={(e) => setDocNotes(e.target.value)}
                      placeholder="Any observations or dates regarding this report..."
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
                      {uploading ? 'Attaching...' : 'Add to Health Record'}
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
