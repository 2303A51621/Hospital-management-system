import { useEffect, useState } from 'react';
import {
  History,
  Search,
  User,
  Calendar,
  Pill,
  FlaskConical,
  FileText,
  Clock,
  Plus,
  ShieldAlert,
  Activity,
  Heart,
  RefreshCw,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { doctorPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorPatientHistoryPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [timelineData, setTimelineData] = useState<{ patient: any; timeline: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [search, setSearch] = useState('');

  // Add Note Modal
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [condition, setCondition] = useState('');
  const [treatment, setTreatment] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Add Allergy Modal
  const [allergyModalOpen, setAllergyModalOpen] = useState(false);
  const [allergen, setAllergen] = useState('');
  const [severity, setSeverity] = useState('Severe');
  const [reaction, setReaction] = useState('Anaphylaxis / Rash');

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await doctorPortalAPI.getPatients({ limit: 100 });
      const pts = res.data.data || [];
      setPatients(pts);
      if (pts.length > 0) {
        setSelectedPatientId(pts[0]._id);
        fetchTimeline(pts[0]._id);
      }
    } catch (err: any) {
      toast.error('Failed to load patients list');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async (patientId: string) => {
    try {
      setLoadingTimeline(true);
      const res = await doctorPortalAPI.getPatientTimeline(patientId);
      setTimelineData(res.data.data);
    } catch (err: any) {
      toast.error('Failed to load patient timeline');
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handlePatientSelect = (patId: string) => {
    setSelectedPatientId(patId);
    fetchTimeline(patId);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    try {
      await doctorPortalAPI.addClinicalNote(selectedPatientId, {
        condition,
        treatment,
        notes: clinicalNotes,
      });
      toast.success('Clinical note added to medical history');
      setNoteModalOpen(false);
      setCondition('');
      setTreatment('');
      setClinicalNotes('');
      fetchTimeline(selectedPatientId);
    } catch (err) {
      toast.error('Failed to add clinical note');
    }
  };

  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !allergen.trim()) return;
    try {
      await doctorPortalAPI.addPatientAllergy(selectedPatientId, {
        allergen,
        severity,
        reaction,
      });
      toast.success('Allergy recorded successfully');
      setAllergyModalOpen(false);
      setAllergen('');
      fetchTimeline(selectedPatientId);
    } catch (err) {
      toast.error('Failed to record allergy');
    }
  };

  const filteredPatients = patients.filter((p) => {
    const name = p.name || p.user?.name || '';
    const phone = p.phone || p.user?.phone || '';
    const pid = p.patientId || '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || phone.includes(q) || pid.toLowerCase().includes(q);
  });

  const pat = timelineData?.patient;
  const timeline = timelineData?.timeline || [];

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
                  <History className="w-3.5 h-3.5" />
                  Longitudinal Patient Record
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Patient Medical History & Timeline
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Complete chronological clinical timeline tracking consultations, prescriptions, lab results, and history.
                </p>
              </div>

              {selectedPatientId && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAllergyModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-semibold transition"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Record Allergy
                  </button>
                  <button
                    onClick={() => setNoteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Clinical Note
                  </button>
                </div>
              )}
            </div>

            {/* Main 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Patient List (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="font-bold text-slate-800 text-sm flex items-center justify-between">
                    <span>Select Patient</span>
                    <span className="text-xs text-slate-500 font-normal">({filteredPatients.length})</span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, ID or phone..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  {loading ? (
                    <div className="p-6 text-center text-xs text-slate-400">Loading directory...</div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No patients found</div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
                      {filteredPatients.map((p) => {
                        const isSelected = p._id === selectedPatientId;
                        return (
                          <div
                            key={p._id}
                            onClick={() => handlePatientSelect(p._id)}
                            className={`p-3 rounded-lg cursor-pointer transition text-left ${
                              isSelected
                                ? 'bg-teal-50/80 border border-teal-200 text-teal-900'
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">{p.name}</span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {p.bloodGroup || 'Blood: N/A'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                              <span>{p.patientId || 'MRN-N/A'}</span>
                              <span>
                                {p.age ? `${p.age} yrs` : ''} • {p.gender || ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Timeline & Profile (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {loadingTimeline ? (
                  <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                    <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Loading chronological medical history...</p>
                  </div>
                ) : !pat ? (
                  <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                    <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-slate-700">Select a Patient</h3>
                    <p className="text-sm text-slate-500">
                      Choose any patient from the left column to view their complete clinical timeline.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Patient Overview Card */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-lg">
                            {pat.name?.[0] || 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-bold text-slate-900">{pat.name}</h2>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                                {pat.patientId || 'PT-REC'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {pat.gender} • {pat.age ? `${pat.age} years old` : 'Age N/A'} • Phone:{' '}
                              {pat.phone || pat.emergencyContact || 'Not recorded'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
                            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Blood</span>
                            <span className="font-bold text-slate-800">{pat.bloodGroup || '—'}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
                            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Events</span>
                            <span className="font-bold text-teal-700">{timeline.length}</span>
                          </div>
                        </div>
                      </div>

                      {/* Allergies & Chronic Conditions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="bg-red-50/60 p-3 rounded-lg border border-red-100">
                          <span className="font-bold text-red-800 flex items-center gap-1.5 mb-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                            Known Patient Allergies ({pat.allergies?.length || 0})
                          </span>
                          {pat.allergies && pat.allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {pat.allergies.map((a: any, i: number) => {
                                const label = typeof a === 'string' ? a : `${a.allergen} (${a.severity || 'Alert'})`;
                                return (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-md bg-white border border-red-200 text-red-700 font-semibold text-[11px]"
                                  >
                                    {label}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">No allergies recorded</span>
                          )}
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                            <Heart className="w-3.5 h-3.5 text-teal-600" />
                            Pre-existing Conditions & Medical History
                          </span>
                          {pat.medicalHistory && pat.medicalHistory.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {pat.medicalHistory.map((m: any, i: number) => {
                                const desc = typeof m === 'string' ? m : m.condition || m.notes || 'Recorded history';
                                return (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px]"
                                  >
                                    {desc}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">No chronic illnesses on record</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Chronological Timeline */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <History className="w-4 h-4 text-teal-600" />
                          Chronological History Stream
                        </h3>
                        <span className="text-xs text-slate-400">Oldest to Most Recent</span>
                      </div>

                      {timeline.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No past consultations, prescriptions or test records found for this patient.
                        </div>
                      ) : (
                        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                          {timeline.map((event, idx) => {
                            const dateStr = new Date(event.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            });

                            let icon = <Clock className="w-3.5 h-3.5 text-slate-600" />;
                            let dotColor = 'bg-slate-400';
                            let title = 'Clinical Event';

                            if (event.type === 'consultation') {
                              icon = <Activity className="w-3.5 h-3.5 text-teal-600" />;
                              dotColor = 'bg-teal-500 ring-4 ring-teal-100';
                              title = `Consultation — ${event.data.finalDiagnosis || event.data.preliminaryDiagnosis || 'Clinical Visit'}`;
                            } else if (event.type === 'prescription') {
                              icon = <Pill className="w-3.5 h-3.5 text-blue-600" />;
                              dotColor = 'bg-blue-500 ring-4 ring-blue-100';
                              title = `Prescription Issued (${event.data.medicines?.length || 0} meds)`;
                            } else if (event.type === 'lab_test') {
                              icon = <FlaskConical className="w-3.5 h-3.5 text-purple-600" />;
                              dotColor = event.data.isAbnormal
                                ? 'bg-red-500 ring-4 ring-red-100'
                                : 'bg-purple-500 ring-4 ring-purple-100';
                              title = `Diagnostic Investigation: ${event.data.testName || 'Lab Test'}`;
                            } else if (event.type === 'medical_history_entry') {
                              icon = <FileText className="w-3.5 h-3.5 text-amber-600" />;
                              dotColor = 'bg-amber-500 ring-4 ring-amber-100';
                              title = `Medical History Update: ${event.data.condition || 'Clinical Note'}`;
                            }

                            return (
                              <div key={idx} className="relative group">
                                {/* Dot */}
                                <div
                                  className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full ${dotColor} transition`}
                                />

                                <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200 transition space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      {icon}
                                      <span className="font-bold text-slate-900">{title}</span>
                                    </div>
                                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                                      <Calendar className="w-3 h-3" />
                                      {dateStr}
                                    </span>
                                  </div>

                                  {/* Consultation Body */}
                                  {event.type === 'consultation' && (
                                    <div className="text-xs text-slate-700 space-y-1">
                                      {event.data.symptoms?.length > 0 && (
                                        <div>
                                          <span className="font-semibold text-slate-600">Symptoms: </span>
                                          {event.data.symptoms.join(', ')}
                                        </div>
                                      )}
                                      {event.data.vitals && (
                                        <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-100 flex flex-wrap gap-2">
                                          {event.data.vitals.bloodPressure && <span>BP: {event.data.vitals.bloodPressure}</span>}
                                          {event.data.vitals.temperature && <span>Temp: {event.data.vitals.temperature}°F</span>}
                                          {event.data.vitals.pulseRate && <span>Pulse: {event.data.vitals.pulseRate} bpm</span>}
                                          {event.data.vitals.spo2 && <span>SpO2: {event.data.vitals.spo2}%</span>}
                                        </div>
                                      )}
                                      {event.data.treatment && (
                                        <div className="text-slate-600">
                                          <span className="font-semibold">Treatment: </span>
                                          {event.data.treatment}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Prescription Body */}
                                  {event.type === 'prescription' && (
                                    <div className="text-xs text-slate-700 space-y-1">
                                      <div className="flex flex-wrap gap-1">
                                        {(event.data.medicines || []).map((m: any, mi: number) => (
                                          <span
                                            key={mi}
                                            className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium"
                                          >
                                            {m.name} ({m.dosage}) • {m.frequency}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Lab Test Body */}
                                  {event.type === 'lab_test' && (
                                    <div className="text-xs text-slate-700 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold">Status:</span>
                                        <span className="capitalize text-slate-800">{event.data.status}</span>
                                        {event.data.isAbnormal && (
                                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                                            Abnormal
                                          </span>
                                        )}
                                      </div>
                                      {event.data.doctorComments && (
                                        <div className="text-slate-500 italic">
                                          Doctor notes: "{event.data.doctorComments}"
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Medical History Note */}
                                  {event.type === 'medical_history_entry' && (
                                    <div className="text-xs text-slate-700">
                                      {event.data.treatment && <div>Treatment: {event.data.treatment}</div>}
                                      {event.data.notes && <div className="text-slate-500 italic">{event.data.notes}</div>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ADD CLINICAL NOTE MODAL */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Add Clinical History Note</h3>
              <button onClick={() => setNoteModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Condition / Diagnosis *
                </label>
                <input
                  type="text"
                  required
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes Mellitus"
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Treatment / Regimen
                </label>
                <input
                  type="text"
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="e.g. Metformin 500mg BD + Dietary modification"
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Physician's Progress Notes
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Patient reports compliance. Fasting blood sugar well controlled..."
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setNoteModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ALLERGY MODAL */}
      {allergyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                Record Patient Drug Allergy
              </h3>
              <button onClick={() => setAllergyModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddAllergy} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Allergen / Drug Class *
                </label>
                <input
                  type="text"
                  required
                  value={allergen}
                  onChange={(e) => setAllergen(e.target.value)}
                  placeholder="e.g. Penicillin, Aspirin, Sulfa drugs"
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white"
                >
                  <option value="Severe">Severe (Life-threatening / Anaphylaxis)</option>
                  <option value="Moderate">Moderate (Hives, swelling, bronchospasm)</option>
                  <option value="Mild">Mild (Mild rash, pruritus)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observed Reaction
                </label>
                <input
                  type="text"
                  value={reaction}
                  onChange={(e) => setReaction(e.target.value)}
                  placeholder="e.g. Facial edema, urticaria"
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setAllergyModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                >
                  Save Allergy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
