import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Download, FileImage, FileText, Plus, UploadCloud, ShieldCheck, FileHeart, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { medicalRecordAPI, patientAPI, type MedicalRecord, type PatientProfile } from '../services/api';
import { useAuthStore } from '../store/authStore';

const doctorName = (record: MedicalRecord) =>
  record.doctorId?.userId?.name ||
  `${record.doctorId?.userId?.firstName || ''} ${record.doctorId?.userId?.lastName || ''}`.trim() ||
  'Hospital Clinician';

export default function MedicalRecordsPage() {
  const role = useAuthStore((state) => state.user?.role);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [form, setForm] = useState({ title: 'Prescription', notes: '', file: null as File | null });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [loadError, setLoadError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const result = await medicalRecordAPI.getAll(selectedPatient || undefined);
      setRecords(result.data.data || []);
      setLoadError('');
    } catch (error) {
      console.error('Unable to load medical records', error);
      setLoadError('Unable to load medical records. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedPatient]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => refresh(), 10000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (role === 'doctor' || role === 'admin') {
      patientAPI
        .getAll()
        .then((result) => setPatients(result.data.patients || result.data.data || []))
        .catch((error) => console.error('Unable to load patients', error));
    }
  }, [role]);

  const upload = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPatient || !form.file) return;
    setUploading(true);
    setUploadError('');
    try {
      const data = new FormData();
      data.append('patientId', selectedPatient);
      data.append('title', form.title);
      data.append('notes', form.notes);
      data.append('file', form.file);
      await medicalRecordAPI.upload(data);
      setForm({ title: 'Prescription', notes: '', file: null });
      const input = document.getElementById('medical-record-file') as HTMLInputElement | null;
      if (input) input.value = '';
      await refresh();
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Unable to upload the medical record.';
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  const download = async (record: MedicalRecord) => {
    const response = await medicalRecordAPI.getFile(record._id);
    const link = document.createElement('a');
    link.href = response.data.data.fileData;
    link.download = response.data.data.fileName;
    link.click();
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Medical Hero Banner */}
            <section className="relative z-10 rounded-3xl border border-teal-800/30 bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10 overflow-hidden">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-teal-100 text-xs font-semibold backdrop-blur-md border border-white/20">
                    <ShieldCheck size={14} className="text-teal-300" />
                    Encrypted Health Records Storage
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Medical Records</h1>
                  <p className="mt-1 text-sm text-teal-100/90 max-w-xl">
                    Digital prescriptions, diagnostic test attachments, imaging scans, and clinical visit summaries.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => refresh()}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2 text-xs font-bold text-white shadow-sm transition backdrop-blur-md"
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>
            </section>

            {/* Upload Section for Clinicians / Admins */}
            {(role === 'doctor' || role === 'admin') && (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-clinical space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <UploadCloud size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Upload Clinical Record or Document</h2>
                    <p className="text-xs text-slate-500">PDF, JPG, PNG or WebP clinical documents up to 8 MB</p>
                  </div>
                </div>

                <form onSubmit={upload} className="grid gap-3.5 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Select Patient *</label>
                    <select
                      required
                      value={selectedPatient}
                      onChange={(event) => setSelectedPatient(event.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50/70 focus:bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">-- Choose Assigned Patient --</option>
                      {patients.map((patient) => {
                        const user = typeof patient.userId === 'string' ? undefined : patient.userId;
                        const name =
                          user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Patient';
                        return (
                          <option key={patient._id} value={patient._id}>
                            {name} • {patient.patientId || 'ID'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Document Title *</label>
                    <input
                      required
                      value={form.title}
                      onChange={(event) => setForm({ ...form, title: event.target.value })}
                      placeholder="e.g. Discharge Summary / Post-Op Care Notes"
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50/70 focus:bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Clinical Notes / Description
                    </label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(event) => setForm({ ...form, notes: event.target.value })}
                      placeholder="Summary of findings or instructions for the patient..."
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50/70 focus:bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Select Medical File *
                    </label>
                    <input
                      id="medical-record-file"
                      required
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50/70"
                    />
                  </div>

                  {uploadError && (
                    <p className="text-xs font-semibold text-rose-600 md:col-span-2 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                      {uploadError}
                    </p>
                  )}

                  <div className="md:col-span-2 flex justify-end">
                    <button
                      disabled={uploading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 disabled:opacity-50 transition"
                    >
                      <Plus size={15} />
                      {uploading ? 'Encrypting & Uploading...' : 'Upload Medical Record'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* Records Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileHeart size={18} className="text-teal-600" />
                  Archived Clinical Documents ({records.length})
                </h2>
              </div>

              {loadError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-xs text-rose-700 font-semibold">
                  {loadError}
                </div>
              )}

              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 shadow-clinical">
                  <RefreshCw className="w-5 h-5 animate-spin text-teal-600 mx-auto mb-2" />
                  Loading medical records...
                </div>
              ) : records.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 text-xs shadow-clinical">
                  <FileText size={38} className="mx-auto mb-2 text-slate-300" />
                  No medical records found in this category.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {records.map((record) => (
                    <article
                      key={record._id}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-clinical hover:border-teal-200 hover:shadow-clinical-hover transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="rounded-xl bg-teal-50 p-2.5 text-teal-700 border border-teal-100">
                              {record.fileType === 'application/pdf' ? <FileText size={20} /> : <FileImage size={20} />}
                            </span>
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm">{record.title}</h3>
                              <p className="text-[11px] capitalize text-slate-400">
                                {record.recordType || 'Clinical Document'} •{' '}
                                {new Date(record.uploadedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => download(record)}
                            className="p-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white transition"
                            title={`Download ${record.fileName}`}
                          >
                            <Download size={16} />
                          </button>
                        </div>

                        {record.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {record.notes}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Issuer: {doctorName(record)}</span>
                        <span className="font-semibold text-teal-700">Verified</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
