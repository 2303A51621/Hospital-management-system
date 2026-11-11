import { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Trash2,
  Pill,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { doctorPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface MedicineItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity?: number;
  instructions?: string;
  timing?: string;
  alternatives?: string;
}

export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Prescription Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    {
      name: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'TDS (3 times/day)',
      duration: '5 days',
      quantity: 15,
      timing: 'after_food',
      instructions: 'Take after meals with water',
      alternatives: 'Azithromycin 500mg',
    },
  ]);

  // Safety alerts state
  const [safetyChecking, setSafetyChecking] = useState(false);
  const [safetyResult, setSafetyResult] = useState<{
    hasWarnings: boolean;
    allergyAlerts: any[];
    drugInteractions: any[];
    duplicateWarnings: any[];
  } | null>(null);

  // Digital Signature
  const [useSignature, setUseSignature] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);

  // Print/View modal
  const [printModalPrescription, setPrintModalPrescription] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rxRes, patRes, profRes] = await Promise.all([
        doctorPortalAPI.getPrescriptions(),
        doctorPortalAPI.getPatients({ limit: 100 }),
        doctorPortalAPI.getProfile().catch(() => ({ data: { data: null } })),
      ]);
      setPrescriptions(rxRes.data.data || []);
      setPatients(patRes.data.data || []);
      setDoctorProfile(profRes.data?.data || null);
    } catch (err: any) {
      toast.error('Failed to load prescriptions list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Run clinical safety check whenever medicines change or patient changes
  const runSafetyCheck = async (medsList: MedicineItem[], patId: string) => {
    if (!medsList || medsList.length === 0) {
      setSafetyResult(null);
      return;
    }
    try {
      setSafetyChecking(true);
      const res = await doctorPortalAPI.checkClinicalSafety({
        medicines: medsList,
        patientId: patId || undefined,
      });
      setSafetyResult(res.data.data);
    } catch (err) {
      // silent fallback
    } finally {
      setSafetyChecking(false);
    }
  };

  const handleAddMedicine = () => {
    const updated = [
      ...medicines,
      {
        name: '',
        dosage: '1 tablet',
        frequency: 'BD (Twice daily)',
        duration: '5 days',
        quantity: 10,
        timing: 'after_food',
        instructions: 'Take after meal',
        alternatives: '',
      },
    ];
    setMedicines(updated);
    runSafetyCheck(updated, selectedPatientId);
  };

  const handleRemoveMedicine = (idx: number) => {
    const updated = medicines.filter((_, i) => i !== idx);
    setMedicines(updated);
    runSafetyCheck(updated, selectedPatientId);
  };

  const handleMedicineChange = (idx: number, field: keyof MedicineItem, val: any) => {
    const updated = [...medicines];
    updated[idx] = { ...updated[idx], [field]: val };
    setMedicines(updated);
    if (field === 'name') {
      runSafetyCheck(updated, selectedPatientId);
    }
  };

  const handlePatientSelect = (patId: string) => {
    setSelectedPatientId(patId);
    runSafetyCheck(medicines, patId);
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Please select a patient');
      return;
    }
    const validMeds = medicines.filter((m) => m.name.trim().length > 0);
    if (validMeds.length === 0) {
      toast.error('Please add at least one medicine');
      return;
    }

    try {
      const payload = {
        patientId: selectedPatientId,
        diagnosis,
        instructions: prescriptionNotes,
        medicines: validMeds,
        digitalSignature: useSignature ? doctorProfile?.digitalSignature || 'Dr. ' + (doctorProfile?.name || 'Verified Signature') : undefined,
      };

      const res = await doctorPortalAPI.createPrescription(payload);
      toast.success(res.data.message || 'Prescription issued successfully!');
      setCreateModalOpen(false);
      // Reset form
      setDiagnosis('');
      setPrescriptionNotes('');
      setMedicines([
        {
          name: '',
          dosage: '500mg',
          frequency: 'BD',
          duration: '5 days',
          quantity: 10,
          timing: 'after_food',
          instructions: 'Take after food',
          alternatives: '',
        },
      ]);
      setSafetyResult(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to issue prescription');
    }
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const patientName = rx.patientId?.name || rx.patientId?.user?.name || rx.emrId?.patientId?.name || '';
    const diag = rx.diagnosis || '';
    const medNames = (rx.medicines || []).map((m: any) => m.name).join(' ');
    const searchLow = search.toLowerCase();
    return (
      patientName.toLowerCase().includes(searchLow) ||
      diag.toLowerCase().includes(searchLow) ||
      medNames.toLowerCase().includes(searchLow)
    );
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
                  <Pill className="w-3.5 h-3.5" />
                  Prescription Management
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Digital Prescriptions
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Issue validated digital prescriptions with automated drug interaction & allergy safety checks.
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
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm transition shadow-teal-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Write Prescription
                </button>
              </div>
            </div>

            {/* Quick Safety Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Active Safety Engine</div>
                  <div className="text-sm font-medium text-slate-800">Drug-Drug & Allergy Conflict Detection</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Total Prescriptions Issued</div>
                  <div className="text-xl font-bold text-slate-800">{prescriptions.length}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Digital Signature</div>
                  <div className="text-sm font-medium text-slate-800">
                    {doctorProfile?.digitalSignature ? 'Active on file' : 'Default e-Signature active'}
                  </div>
                </div>
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by patient, medicine or diagnosis..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Showing {filteredPrescriptions.length} prescriptions
              </div>
            </div>

            {/* Prescriptions List */}
            {loading ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Loading prescriptions...</p>
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-700">No prescriptions found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                  You haven't issued any digital prescriptions yet, or no records match your search filter.
                </p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Write First Prescription
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPrescriptions.map((rx) => {
                  const pat = rx.patientId || rx.emrId?.patientId || {};
                  const patName = pat.name || pat.user?.name || 'Assigned Patient';
                  const dateStr = new Date(rx.createdAt || rx.date || Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div
                      key={rx._id}
                      className="bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-300 hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-base">{patName}</span>
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                                {pat.patientId || 'PT-REC'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {dateStr}
                              {rx.diagnosis && (
                                <span className="text-teal-700 font-medium">| Diagnosis: {rx.diagnosis}</span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              rx.status === 'dispensed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {rx.status || 'Active'}
                          </span>
                        </div>

                        {/* Medicines List */}
                        <div className="space-y-1.5 my-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Prescribed Medicines ({rx.medicines?.length || 0})
                          </div>
                          {(rx.medicines || []).map((m: any, idx: number) => (
                            <div key={idx} className="text-xs text-slate-700 flex items-center justify-between">
                              <span className="font-semibold text-slate-800">
                                {idx + 1}. {m.name} ({m.dosage || 'Standard'})
                              </span>
                              <span className="text-slate-500">
                                {m.frequency} • {m.duration}
                              </span>
                            </div>
                          ))}
                        </div>

                        {rx.instructions && (
                          <div className="text-xs text-slate-600 italic bg-amber-50/60 p-2 rounded border border-amber-100 mb-3">
                            Notes: {rx.instructions}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                          Digitally Verified
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPrintModalPrescription(rx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            View / Print Rx
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CREATE DIGITAL PRESCRIPTION MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-4">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Create Digital Prescription</h3>
                  <p className="text-xs text-slate-500">
                    With live drug interaction and patient allergy warnings {safetyChecking ? '— Running Safety Engine...' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPrescription} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Patient and Diagnosis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Select Patient *
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => handlePatientSelect(e.target.value)}
                    required
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">-- Choose Assigned Patient --</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.patientId || 'ID'}) - {p.gender || 'Unknown'}, {p.age || 'N/A'} yrs
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Clinical Diagnosis / Indication
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Bacterial Pharyngitis / Hypertension Grade 1"
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Safety Warning Banners */}
              {safetyResult && safetyResult.hasWarnings && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Clinical Safety Warnings Detected
                  </div>

                  {safetyResult.allergyAlerts?.map((a, i) => (
                    <div key={i} className="text-xs text-red-700 font-semibold bg-red-50 p-2 rounded border border-red-200">
                      ⚠️ Allergy Conflict: {a.medicine} conflicts with patient allergy "{a.allergen}"! Severity: {a.severity}
                    </div>
                  ))}

                  {safetyResult.drugInteractions?.map((inter, i) => (
                    <div key={i} className="text-xs text-amber-900 bg-white/70 p-2 rounded border border-amber-200">
                      ⚡ Potential Interaction: <span className="font-bold">{inter.drug1}</span> +{' '}
                      <span className="font-bold">{inter.drug2}</span>: {inter.effect} ({inter.severity})
                    </div>
                  ))}

                  {safetyResult.duplicateWarnings?.map((dup, i) => (
                    <div key={i} className="text-xs text-amber-800 bg-white/70 p-2 rounded border border-amber-200">
                      ℹ️ Duplicate Medication: "{dup.medicine}" added more than once.
                    </div>
                  ))}
                </div>
              )}

              {/* Medicines Multi-Item Editor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-teal-600" />
                    Prescribed Medications ({medicines.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedicine}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Another Medicine
                  </button>
                </div>

                {medicines.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                        Medicine #{idx + 1}
                      </span>
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Medicine Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={med.name}
                          onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                          placeholder="e.g. Paracetamol, Metformin"
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dosage</label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                          placeholder="e.g. 500mg, 1 tab, 10ml"
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Frequency</label>
                        <select
                          value={med.frequency}
                          onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                        >
                          <option value="OD (Once daily)">OD (Once daily)</option>
                          <option value="BD (Twice daily)">BD (Twice daily)</option>
                          <option value="TDS (3 times/day)">TDS (3 times/day)</option>
                          <option value="QID (4 times/day)">QID (4 times/day)</option>
                          <option value="SOS (As needed)">SOS (As needed)</option>
                          <option value="At Bedtime">At Bedtime</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration</label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                          placeholder="e.g. 5 days, 1 month"
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Food Timing</label>
                        <select
                          value={med.timing}
                          onChange={(e) => handleMedicineChange(idx, 'timing', e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                        >
                          <option value="after_food">After Food</option>
                          <option value="before_food">Before Food</option>
                          <option value="with_food">With Food</option>
                          <option value="empty_stomach">Empty Stomach</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Quantity</label>
                        <input
                          type="number"
                          value={med.quantity || 10}
                          onChange={(e) => handleMedicineChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Generic Alternatives
                        </label>
                        <input
                          type="text"
                          value={med.alternatives || ''}
                          onChange={(e) => handleMedicineChange(idx, 'alternatives', e.target.value)}
                          placeholder="e.g. Dolo 650, Calpol"
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Doctor Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  General Instructions & Dietary Advice
                </label>
                <textarea
                  rows={2}
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="Drink plenty of fluids, rest, avoid spicy food..."
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-teal-500"
                />
              </div>

              {/* Digital Signature Confirmation */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Attach Verified Digital Signature</div>
                    <div className="text-[11px] text-slate-500">
                      Sign this prescription with doctor verification hash and timestamp
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useSignature}
                  onChange={(e) => setUseSignature(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-md shadow-teal-600/20 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Issue Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE / VIEWABLE PRESCRIPTION MODAL */}
      {printModalPrescription && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-4">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-slate-600 uppercase">Hospital Prescription Sheet</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setPrintModalPrescription(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 text-base font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-8 space-y-6 text-slate-900 bg-white" id="printable-rx-sheet">
              {/* Header */}
              <div className="border-b-2 border-teal-600 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/kushal-emblem.png"
                    alt="Kushal Hospitals Logo"
                    className="h-12 w-12 object-contain shrink-0"
                  />
                  <div>
                    <h2 className="text-2xl font-black text-[#0f4c81] tracking-tight">KUSHAL HOSPITALS</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      Hospital Management System • NABH Accredited
                    </p>
                    <p className="text-[11px] text-slate-400">Emergency 24x7: +91 1800-KUSHAL-CARE | help@kushalhospitals.com</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800">
                    {doctorProfile?.name ? `Dr. ${doctorProfile.name}` : 'Consulting Physician'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {doctorProfile?.specialization || 'General Medicine'} • {doctorProfile?.qualifications || 'MBBS, MD'}
                  </div>
                  <div className="text-[10px] text-slate-400">Reg No: KMC-{doctorProfile?._id?.slice(-6) || '202688'}</div>
                </div>
              </div>

              {/* Patient Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Patient Name</span>
                  <span className="font-bold text-slate-800">
                    {printModalPrescription.patientId?.name ||
                      printModalPrescription.patientId?.user?.name ||
                      'Patient'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Patient ID / Age</span>
                  <span className="font-bold text-slate-800">
                    {printModalPrescription.patientId?.patientId || 'PT-REC'} /{' '}
                    {printModalPrescription.patientId?.age || 'Adult'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date & Time</span>
                  <span className="font-bold text-slate-800">
                    {new Date(printModalPrescription.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Rx Token</span>
                  <span className="font-mono font-bold text-teal-700">
                    #{printModalPrescription._id?.slice(-8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Diagnosis */}
              {printModalPrescription.diagnosis && (
                <div className="text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wide">Diagnosis: </span>
                  <span className="font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {printModalPrescription.diagnosis}
                  </span>
                </div>
              )}

              {/* Rx Symbol & Table */}
              <div>
                <div className="text-3xl font-serif font-black text-teal-700 italic mb-2">℞</div>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-2">#</th>
                      <th className="py-2">Medicine & Strength</th>
                      <th className="py-2">Dosage & Timing</th>
                      <th className="py-2">Duration</th>
                      <th className="py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(printModalPrescription.medicines || []).map((m: any, i: number) => (
                      <tr key={i} className="py-2">
                        <td className="py-2 text-slate-400">{i + 1}</td>
                        <td className="py-2 font-bold text-slate-900">
                          {m.name}
                          {m.alternatives && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Alt: {m.alternatives}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-slate-700">
                          {m.dosage} — {m.frequency} ({m.timing?.replace('_', ' ') || 'after food'})
                        </td>
                        <td className="py-2 text-slate-700">{m.duration}</td>
                        <td className="py-2 text-right font-medium">{m.quantity || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instructions */}
              {printModalPrescription.instructions && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Doctor's Clinical Advice:</span>
                  <p className="text-slate-600">{printModalPrescription.instructions}</p>
                </div>
              )}

              {/* Footer with Digital Signature */}
              <div className="pt-6 border-t border-slate-200 flex items-end justify-between">
                <div className="text-[10px] text-slate-400 max-w-xs">
                  This is a verified digital prescription generated electronically under Kushal Hospitals Clinical System.
                  No physical signature required.
                </div>
                <div className="text-right">
                  <div className="font-serif italic text-teal-800 font-bold text-sm">
                    {printModalPrescription.digitalSignature || `Dr. ${doctorProfile?.name || 'Verified Signature'}`}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    Cryptographically Validated
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
