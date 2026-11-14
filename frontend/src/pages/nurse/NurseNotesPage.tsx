import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  ShieldCheck,
  History,
  X,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { nursePortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NurseNotesPage() {
  const [searchParams] = useSearchParams();
  const urlPatientId = searchParams.get('patientId');

  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(urlPatientId || '');
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Note Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: urlPatientId || '',
    noteType: 'progress',
    patientComplaints: '',
    observedSymptoms: '',
    patientCondition: 'stable',
    treatmentAndCareProvided: '',
    woundObservations: '',
    patientResponse: '',
    followUpPlan: '',
  });

  // Amendment Modal
  const [amendModalOpen, setAmendModalOpen] = useState(false);
  const [targetNote, setTargetNote] = useState<any | null>(null);
  const [amendmentText, setAmendmentText] = useState('');
  const [amendmentReason, setAmendmentReason] = useState('Clinical follow-up note');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const patRes = await nursePortalAPI.getPatients();
      const patList = patRes.data.data || [];
      setPatients(patList);

      const targetId = selectedPatientId || (patList[0]?.patientId?._id || '');
      if (targetId) {
        setSelectedPatientId(targetId);
        const nRes = await nursePortalAPI.getNotes(targetId);
        setNotes(nRes.data.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to load nursing progress notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePatientChange = async (pId: string) => {
    setSelectedPatientId(pId);
    setForm((prev) => ({ ...prev, patientId: pId }));
    try {
      setLoading(true);
      const res = await nursePortalAPI.getNotes(pId);
      setNotes(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load notes for patient');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.treatmentAndCareProvided.trim()) {
      toast.error('Patient and treatment care summary are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await nursePortalAPI.createNote(form);
      toast.success(res.data.message || 'Nursing progress note signed & saved!');
      setCreateModalOpen(false);
      setForm({
        patientId: selectedPatientId,
        noteType: 'progress',
        patientComplaints: '',
        observedSymptoms: '',
        patientCondition: 'stable',
        treatmentAndCareProvided: '',
        woundObservations: '',
        patientResponse: '',
        followUpPlan: '',
      });
      handlePatientChange(form.patientId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save nursing note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAmendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetNote || !amendmentText.trim()) return;

    try {
      setSubmitting(true);
      const res = await nursePortalAPI.amendNote(targetNote._id, {
        amendmentNote: amendmentText,
        reason: amendmentReason,
      });
      toast.success(res.data.message || 'Traceable amendment saved');
      setAmendModalOpen(false);
      handlePatientChange(selectedPatientId);
    } catch (err: any) {
      toast.error('Failed to amend note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-200 mb-1">
                  <FileText size={14} className="text-teal-600" />
                  Clinical Progress Documentation & Audit Log
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Nursing Notes & Documentation
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Record daily progress, patient complaints, clinical interventions, and wound observations with traceable digital signatures.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setForm((prev) => ({ ...prev, patientId: selectedPatientId }));
                    setCreateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20"
                >
                  <Plus size={15} /> Write Progress Note
                </button>
                <button
                  onClick={loadData}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                  title="Refresh"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Inpatient Filter Bar */}
            <div className="clinical-card p-4 bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase">Select Inpatient:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => handlePatientChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-900 min-w-56"
                >
                  {patients.map((a) => (
                    <option key={a.patientId?._id} value={a.patientId?._id}>
                      {a.patientId?.userId?.name || 'Patient'} ({a.roomNumber || 'Room'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={16} className="text-teal-600" />
                <span>Signed Clinical Records • Immutable Audit Trail</span>
              </div>
            </div>

            {/* Notes Timeline Stream */}
            <div className="space-y-4">
              {loading ? (
                <div className="py-16 text-center text-xs text-slate-400">Loading signed nursing notes...</div>
              ) : notes.length === 0 ? (
                <div className="clinical-card p-12 text-center text-slate-400 text-xs bg-white border border-slate-200">
                  No nursing progress notes recorded yet for this patient. Click "Write Progress Note" above.
                </div>
              ) : (
                notes.map((note) => {
                  const isCritical = note.patientCondition === 'critical' || note.patientCondition === 'deteriorating';

                  return (
                    <div
                      key={note._id}
                      className="clinical-card p-6 bg-white border border-slate-200 space-y-4 relative"
                    >
                      {/* Top Meta Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 uppercase">
                            {note.noteType || 'Progress Note'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isCritical ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            Condition: {note.patientCondition}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="font-mono text-[11px]">
                            {new Date(note.signedAt || note.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                          <span className="font-bold text-slate-700">Signed by {note.recordedBy?.name || 'Floor Nurse'}</span>
                        </div>
                      </div>

                      {/* Content Sections */}
                      <div className="space-y-3 text-xs">
                        {note.patientComplaints && (
                          <div>
                            <strong className="text-slate-900 block font-bold text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">
                              Patient Subjective Complaints:
                            </strong>
                            <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              {note.patientComplaints}
                            </p>
                          </div>
                        )}

                        {note.observedSymptoms && (
                          <div>
                            <strong className="text-slate-900 block font-bold text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">
                              Objective Clinical Observations:
                            </strong>
                            <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              {note.observedSymptoms}
                            </p>
                          </div>
                        )}

                        <div>
                          <strong className="text-slate-900 block font-bold text-[11px] uppercase tracking-wide text-teal-800 mb-0.5">
                            Interventions & Treatment Care Provided:
                          </strong>
                          <p className="text-slate-800 leading-relaxed font-medium bg-teal-50/40 p-3 rounded-xl border border-teal-100">
                            {note.treatmentAndCareProvided}
                          </p>
                        </div>

                        {note.woundObservations && (
                          <div>
                            <strong className="text-slate-900 block font-bold text-[11px] uppercase tracking-wide text-amber-800 mb-0.5">
                              Wound / Skin Assessment:
                            </strong>
                            <p className="text-slate-700 leading-relaxed bg-amber-50/40 p-2.5 rounded-xl border border-amber-100">
                              {note.woundObservations}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {note.patientResponse && (
                            <div className="text-[11px]">
                              <span className="font-bold text-slate-600 block">Patient Response:</span>
                              <span className="text-slate-700">{note.patientResponse}</span>
                            </div>
                          )}
                          {note.followUpPlan && (
                            <div className="text-[11px]">
                              <span className="font-bold text-slate-600 block">Follow-Up Plan:</span>
                              <span className="text-slate-700">{note.followUpPlan}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Amendments Log if any */}
                      {note.amendments && note.amendments.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 space-y-2 text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase">
                            <History size={13} className="text-teal-700" /> Traceable Amendments ({note.amendments.length})
                          </span>
                          {note.amendments.map((am: any, i: number) => (
                            <div key={i} className="pl-3 border-l-2 border-teal-600 text-[11px] text-slate-600">
                              <div className="font-semibold text-slate-800">{am.amendmentNote}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                Amended by {am.amendedBy?.name || 'Nurse'} • {new Date(am.amendedAt).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Signature Footer & Add Amendment Action */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5 font-mono">
                          <ShieldCheck size={13} className="text-emerald-600" />
                          <span>Hash: {note.signatureHash || 'KH-SIG-VERIFIED'}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setTargetNote(note);
                            setAmendmentText('');
                            setAmendModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition"
                        >
                          <Edit3 size={13} /> Add Traceable Amendment
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* CREATE NOTE MODAL */}
            {createModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <form
                  onSubmit={handleCreateNote}
                  className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-4 border border-slate-200"
                >
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-white">
                    <div className="flex items-center gap-2.5">
                      <FileText size={18} className="text-teal-700" />
                      <h3 className="font-extrabold text-slate-900 text-base">Write Nursing Progress Note</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreateModalOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Inpatient *</label>
                        <select
                          required
                          value={form.patientId}
                          onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50"
                        >
                          <option value="">-- Choose Inpatient --</option>
                          {patients.map((a) => (
                            <option key={a.patientId?._id} value={a.patientId?._id}>
                              {a.patientId?.userId?.name || 'Patient'} ({a.roomNumber || 'Room'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Overall Condition</label>
                        <select
                          value={form.patientCondition}
                          onChange={(e) => setForm({ ...form, patientCondition: e.target.value })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                        >
                          <option value="stable">Stable</option>
                          <option value="improving">Improving</option>
                          <option value="fair">Fair</option>
                          <option value="deteriorating">Deteriorating</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Patient Subjective Complaints</label>
                      <textarea
                        rows={2}
                        value={form.patientComplaints}
                        onChange={(e) => setForm({ ...form, patientComplaints: e.target.value })}
                        placeholder="e.g. Mild headache, chest tightness, nausea after morning medication..."
                        className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Observed Clinical Symptoms</label>
                      <textarea
                        rows={2}
                        value={form.observedSymptoms}
                        onChange={(e) => setForm({ ...form, observedSymptoms: e.target.value })}
                        placeholder="e.g. Pale skin, shallow breathing, surgical wound clean without discharge..."
                        className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Treatment & Nursing Interventions Provided *</label>
                      <textarea
                        required
                        rows={3}
                        value={form.treatmentAndCareProvided}
                        onChange={(e) => setForm({ ...form, treatmentAndCareProvided: e.target.value })}
                        placeholder="e.g. Checked IV cannula, administered IV Ceftriaxone, assisted with mobilization, repositioned to prevent decubitus..."
                        className="w-full text-xs rounded-xl border border-teal-300 p-2.5 bg-teal-50/20"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Wound / Skin Observations</label>
                        <input
                          type="text"
                          value={form.woundObservations}
                          onChange={(e) => setForm({ ...form, woundObservations: e.target.value })}
                          placeholder="e.g. Surgical incision clean, intact sutures"
                          className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Follow-Up Plan</label>
                        <input
                          type="text"
                          value={form.followUpPlan}
                          onChange={(e) => setForm({ ...form, followUpPlan: e.target.value })}
                          placeholder="e.g. Recheck vitals at 14:00, notify doctor if fever persists"
                          className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20"
                    >
                      {submitting ? 'Signing...' : 'Sign & Record Progress Note'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* AMENDMENT MODAL */}
            {amendModalOpen && targetNote && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <form
                  onSubmit={handleAmendNote}
                  className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-900 text-base">Add Traceable Amendment</h3>
                    <button type="button" onClick={() => setAmendModalOpen(false)} className="text-slate-400">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 text-amber-950 text-xs border border-amber-200">
                    <strong>Notice:</strong> In compliance with NABH clinical standards, original signed records cannot be overwritten. This amendment will be appended with your nurse ID and timestamp.
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Amendment Note *</label>
                    <textarea
                      required
                      rows={3}
                      value={amendmentText}
                      onChange={(e) => setAmendmentText(e.target.value)}
                      placeholder="e.g. Clarification: Patient subsequently reported fever subsided 30 mins post-medication."
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Reason for Amendment</label>
                    <input
                      type="text"
                      value={amendmentReason}
                      onChange={(e) => setAmendmentReason(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setAmendModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs"
                    >
                      {submitting ? 'Saving...' : 'Save Traceable Amendment'}
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
