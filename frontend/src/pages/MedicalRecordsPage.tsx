import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Download, FileImage, FileText, Plus, UploadCloud } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { medicalRecordAPI, patientAPI, type MedicalRecord, type PatientProfile } from '../services/api';
import { useAuthStore } from '../store/authStore';

const doctorName = (record: MedicalRecord) => record.doctorId?.userId?.name || `${record.doctorId?.userId?.firstName || ''} ${record.doctorId?.userId?.lastName || ''}`.trim() || 'Hospital doctor';

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
      patientAPI.getAll().then((result) => setPatients(result.data.patients || result.data.data || [])).catch((error) => console.error('Unable to load patients', error));
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
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Unable to upload the medical record.';
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

  return <div className="flex h-screen bg-slate-50 text-slate-800"><Sidebar /><div className="flex min-w-0 flex-1 flex-col overflow-hidden"><Navbar /><main className="flex-1 overflow-auto p-6 md:p-8">
    <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Patient care records</p><h1 className="text-3xl font-bold text-slate-900">Medical Records</h1><p className="mt-1 text-sm text-slate-500">Prescriptions and uploaded clinical documents refresh automatically.</p></div>
    {(role === 'doctor' || role === 'admin') && <section className="mb-6 rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><UploadCloud className="text-cyan-700" /><h2 className="text-lg font-bold">Upload prescription or medical record</h2></div><form onSubmit={upload} className="grid gap-3 md:grid-cols-2"><select required value={selectedPatient} onChange={(event) => setSelectedPatient(event.target.value)} className="rounded-xl border p-2.5"><option value="">Select patient</option>{patients.map((patient) => { const user = typeof patient.userId === 'string' ? undefined : patient.userId; const name = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unnamed patient'; return <option key={patient._id} value={patient._id}>{name} · {patient.patientId || patient._id}{user?.email ? ` · ${user.email}` : ''}</option>; })}</select><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Record title" className="rounded-xl border p-2.5" /><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Notes for patient (optional)" className="rounded-xl border p-2.5 md:col-span-2" /><input id="medical-record-file" required type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} className="rounded-xl border p-2.5 md:col-span-2" /><p className="text-xs text-slate-500 md:col-span-2">PDF, JPG, PNG, or WebP up to 8 MB.</p>{uploadError && <p className="text-sm font-medium text-red-600 md:col-span-2">{uploadError}</p>}<button disabled={uploading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"><Plus size={17} /> {uploading ? 'Uploading...' : 'Upload record'}</button></form></section>}
    {role === 'doctor' || role === 'admin' ? <div className="mb-4"><label className="text-sm font-semibold text-slate-700">View records for patient</label></div> : null}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{loadError && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 md:col-span-2 xl:col-span-3">{loadError}</div>}{!loading && records.map((record) => <article key={record._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="rounded-xl bg-cyan-50 p-3 text-cyan-700">{record.fileType === 'application/pdf' ? <FileText size={22} /> : <FileImage size={22} />}</span><div><h2 className="font-bold text-slate-900">{record.title}</h2><p className="text-xs capitalize text-slate-500">{record.recordType} · {new Date(record.uploadedAt).toLocaleDateString('en-IN')}</p></div></div><button type="button" onClick={() => download(record)} className="rounded-lg p-2 text-cyan-700 hover:bg-cyan-50" aria-label={`Download ${record.fileName}`}><Download size={18} /></button></div><p className="mt-4 text-sm text-slate-600">{record.notes || 'No additional notes.'}</p><p className="mt-3 text-xs text-slate-500">Uploaded by {doctorName(record)}</p></article>)}{!loading && !loadError && records.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 md:col-span-2 xl:col-span-3">No medical records have been uploaded yet.</div>}{loading && <div className="p-8 text-slate-500">Loading medical records...</div>}</section>
  </main></div></div>;
}
