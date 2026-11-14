import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Pill,
  CheckCircle2,
  Search,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { nursePortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NurseMedicationsPage() {
  const [searchParams] = useSearchParams();
  const urlPatientId = searchParams.get('patientId');

  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(urlPatientId || '');
  const [scheduledMeds, setScheduledMeds] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Administration Modal State
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<any | null>(null);
  const [adminAction, setAdminAction] = useState<'administered' | 'refused' | 'missed'>('administered');
  const [reason, setReason] = useState('');
  const [preBp, setPreBp] = useState('');
  const [prePulse, setPrePulse] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 5 Rights Checkboxes State
  const [fiveRights, setFiveRights] = useState({
    rightPatient: true,
    rightMedication: true,
    rightDose: true,
    rightRoute: true,
    rightTime: true,
    allergyChecked: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [patRes, medRes] = await Promise.all([
        nursePortalAPI.getPatients(),
        nursePortalAPI.getMedications({ patientId: selectedPatientId || undefined }),
      ]);
      setPatients(patRes.data.data || []);
      setScheduledMeds(medRes.data.data?.scheduledMedications || []);
      setLogs(medRes.data.data?.administrationLogs || []);
    } catch (err: any) {
      toast.error('Failed to load electronic Medication Administration Record (eMAR)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPatientId]);

  const handleOpenAdministerModal = (med: any, action: 'administered' | 'refused' | 'missed') => {
    setSelectedMed(med);
    setAdminAction(action);
    setReason('');
    setPreBp('');
    setPrePulse('');
    setAdminNotes('');
    setFiveRights({
      rightPatient: true,
      rightMedication: true,
      rightDose: true,
      rightRoute: true,
      rightTime: true,
      allergyChecked: true,
    });
    setAdminModalOpen(true);
  };

  const handleSubmitAdminister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed) return;

    if ((adminAction === 'refused' || adminAction === 'missed') && !reason.trim()) {
      toast.error('Clinical justification is required when dose is refused or missed');
      return;
    }

    try {
      setSubmitting(true);
      const res = await nursePortalAPI.administerMedication({
        patientId: selectedMed.patientId,
        prescriptionId: selectedMed.prescriptionId,
        medicineName: selectedMed.medicineName,
        dosage: selectedMed.dosage,
        route: selectedMed.route || 'oral',
        frequency: selectedMed.frequency,
        status: adminAction,
        reasonForMissedOrRefused: reason,
        safetyChecksVerified: fiveRights,
        vitalSignsPreAdministration: {
          bloodPressure: preBp,
          heartRate: prePulse ? parseInt(prePulse) : undefined,
          notes: adminNotes,
        },
        notes: adminNotes,
      });

      toast.success(res.data.message || 'Medication event logged');
      setAdminModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record administration');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredScheduled = scheduledMeds.filter((m) => {
    const q = search.toLowerCase();
    const pName = (m.patientName || '').toLowerCase();
    const mName = (m.medicineName || '').toLowerCase();
    return pName.includes(q) || mName.includes(q);
  });

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
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800 border border-purple-200 mb-1">
                  <Pill size={14} className="text-purple-600" />
                  Electronic Medication Administration Record (eMAR)
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Medication Administration
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Administer doctor-prescribed regimens with multi-factor clinical safety and 5-Rights verification.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadData}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                  title="Refresh"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Strict Regulatory Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-amber-700 shrink-0" />
                <span>
                  <strong>Clinical Guardrail:</strong> Nurses administer verified doctor prescriptions only. Prescriptions, dosage changes, and discontinuations must originate via authorized physician orders.
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded shrink-0">
                NABH Safe MAR Protocol
              </span>
            </div>

            {/* Inpatient Filter & Search */}
            <div className="clinical-card p-4 bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase">Inpatient Filter:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-900 min-w-56"
                >
                  <option value="">All Assigned Inpatients ({patients.length})</option>
                  {patients.map((a) => (
                    <option key={a.patientId?._id} value={a.patientId?._id}>
                      {a.patientId?.userId?.name || 'Patient'} ({a.roomNumber || 'Room'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by drug or patient..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 w-56"
                />
              </div>
            </div>

            {/* Split: Scheduled Doses vs Historical Log */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 Cols): Active Due Medications (eMAR Worklist) */}
              <div className="lg:col-span-2 clinical-card p-5 sm:p-6 bg-white border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Scheduled Medication Administration</h3>
                    <p className="text-xs text-slate-500">Active doctor-prescribed orders ready for administration</p>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    {filteredScheduled.length} Regimen(s) Due
                  </span>
                </div>

                {filteredScheduled.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No active medications due for administration right now.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredScheduled.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-purple-300 transition space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">
                                #{med.patientIdStr || 'PT'}
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-900">{med.patientName}</h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 uppercase">
                                {med.route || 'Oral'}
                              </span>
                            </div>
                            <div className="text-base font-black text-purple-900 mt-1">
                              {med.medicineName} — <span className="font-semibold">{med.dosage}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenAdministerModal(med, 'administered')}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                            >
                              <CheckCircle2 size={14} /> Administer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAdministerModal(med, 'refused')}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                            >
                              Refuse / Defer
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200/60">
                          <div>Frequency: <strong>{med.frequency}</strong></div>
                          <div>Duration: <strong>{med.duration}</strong></div>
                          <div>Physician: <strong>{med.doctorName}</strong></div>
                        </div>

                        {med.instructions && (
                          <div className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                            Instructions: {med.instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column (1 Col): Administration History Log */}
              <div className="clinical-card p-5 bg-white border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900">eMAR Administration Log</h3>
                  <span className="text-xs text-slate-400 font-mono">{logs.length} logged</span>
                </div>

                {logs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No administration records logged yet.</div>
                ) : (
                  <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                    {logs.map((log) => {
                      const isAdmin = log.status === 'administered';
                      const isRef = log.status === 'refused' || log.status === 'missed';

                      return (
                        <div
                          key={log._id}
                          className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                            isAdmin
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : isRef
                              ? 'bg-rose-50/50 border-rose-200'
                              : 'bg-slate-50 border-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{log.medicineName}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                isAdmin
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isRef
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {log.status}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-600">
                            Dose: <strong>{log.dosage}</strong> ({log.route}) • {log.patientId?.userId?.name || 'Patient'}
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-200/40">
                            <span>By: {log.administeredBy?.name || 'Nurse'}</span>
                            <span>
                              {new Date(log.administeredAt || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {log.reasonForMissedOrRefused && (
                            <div className="text-[10px] text-rose-700 italic bg-white/70 p-1.5 rounded">
                              Reason: {log.reasonForMissedOrRefused}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ADMINISTER / SAFETY CHECK MODAL */}
            {adminModalOpen && selectedMed && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <form
                  onSubmit={handleSubmitAdminister}
                  className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden my-4 border border-slate-200"
                >
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
                        <Pill size={20} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">
                          {adminAction === 'administered' ? 'Verify & Administer Medication' : 'Document Refused / Deferred Dose'}
                        </h3>
                        <p className="text-[11px] text-slate-500">eMAR Double-Check Safety Protocol</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminModalOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Regimen Info Box */}
                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs space-y-1">
                      <div className="text-slate-500 font-mono text-[10px] uppercase font-bold">Patient & Prescription</div>
                      <div className="font-extrabold text-sm text-purple-950">
                        {selectedMed.patientName} — {selectedMed.medicineName} ({selectedMed.dosage})
                      </div>
                      <div className="text-[11px] text-purple-900">
                        Route: <strong>{selectedMed.route || 'Oral'}</strong> • Frequency: {selectedMed.frequency}
                      </div>
                    </div>

                    {/* Action Selector */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'administered', label: 'Administered' },
                        { id: 'refused', label: 'Patient Refused' },
                        { id: 'missed', label: 'Missed / Held' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAdminAction(item.id as any)}
                          className={`py-2 rounded-xl text-xs font-bold transition border ${
                            adminAction === item.id
                              ? 'bg-purple-700 text-white border-purple-700 shadow-md'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* If Administering: Enforce 5 Rights Checklist */}
                    {adminAction === 'administered' && (
                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-emerald-600" />
                          5 Rights of Medication Administration
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fiveRights.rightPatient}
                              onChange={(e) => setFiveRights({ ...fiveRights, rightPatient: e.target.checked })}
                              className="rounded text-teal-600"
                            />
                            <span>1. Right Patient Verified</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fiveRights.rightMedication}
                              onChange={(e) => setFiveRights({ ...fiveRights, rightMedication: e.target.checked })}
                              className="rounded text-teal-600"
                            />
                            <span>2. Right Medication Verified</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fiveRights.rightDose}
                              onChange={(e) => setFiveRights({ ...fiveRights, rightDose: e.target.checked })}
                              className="rounded text-teal-600"
                            />
                            <span>3. Right Dose Confirmed</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fiveRights.rightRoute}
                              onChange={(e) => setFiveRights({ ...fiveRights, rightRoute: e.target.checked })}
                              className="rounded text-teal-600"
                            />
                            <span>4. Right Route Confirmed</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fiveRights.rightTime}
                              onChange={(e) => setFiveRights({ ...fiveRights, rightTime: e.target.checked })}
                              className="rounded text-teal-600"
                            />
                            <span>5. Right Scheduled Time</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fiveRights.allergyChecked}
                              onChange={(e) => setFiveRights({ ...fiveRights, allergyChecked: e.target.checked })}
                              className="rounded text-teal-600"
                            />
                            <span>6. Allergy Conflict Checked</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Pre-Administration Vitals Check */}
                    {adminAction === 'administered' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Pre-dose BP (mmHg)</label>
                          <input
                            type="text"
                            value={preBp}
                            onChange={(e) => setPreBp(e.target.value)}
                            placeholder="e.g. 120/80"
                            className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Pre-dose Pulse (bpm)</label>
                          <input
                            type="number"
                            value={prePulse}
                            onChange={(e) => setPrePulse(e.target.value)}
                            placeholder="e.g. 72"
                            className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {/* If Refused / Missed: Mandatory Reason */}
                    {(adminAction === 'refused' || adminAction === 'missed') && (
                      <div>
                        <label className="text-[11px] font-bold text-rose-700 block mb-1">
                          Clinical Reason for Refusal / Deferral *
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. Patient experienced nausea; requested dose after meal. Doctor informed."
                          className="w-full text-xs rounded-xl border border-rose-300 p-2.5 bg-rose-50/40"
                        />
                      </div>
                    )}

                    {/* Nurse Remarks */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Administration Notes / Observations</label>
                      <textarea
                        rows={2}
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Administered with water, well tolerated..."
                        className="w-full text-xs rounded-xl border border-slate-200 p-2"
                      />
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAdminModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20"
                    >
                      {submitting ? 'Confirming...' : 'Save eMAR Entry'}
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
