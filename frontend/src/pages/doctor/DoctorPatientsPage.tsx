import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Eye,
  Clock,
  AlertCircle,
  X,
  Stethoscope,
  ShieldAlert,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { doctorPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected patient for modal/profile view
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'prescriptions' | 'allergies' | 'reports'>('profile');

  // Clinical note modal
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteCondition, setNoteCondition] = useState('');
  const [noteTreatment, setNoteTreatment] = useState('');

  // Allergy modal
  const [allergyModalOpen, setAllergyModalOpen] = useState(false);
  const [allergen, setAllergen] = useState('');
  const [allergySeverity, setAllergySeverity] = useState('moderate');
  const [allergyReaction, setAllergyReaction] = useState('');

  const navigate = useNavigate();

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await doctorPortalAPI.getPatients({ search, page, limit: 15 });
      setPatients(res.data.data || []);
      setTotalPages(res.data.pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load patient records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [search, page]);

  const openPatientProfile = async (patient: any) => {
    setSelectedPatient(patient);
    setActiveTab('profile');
    try {
      setLoadingProfile(true);
      const res = await doctorPortalAPI.getPatientFullProfile(patient._id);
      setProfileData(res.data.data);
    } catch (err: any) {
      toast.error('Failed to load full clinical profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !noteCondition.trim()) return;
    try {
      await doctorPortalAPI.addClinicalNote(selectedPatient._id, {
        condition: noteCondition,
        treatment: noteTreatment,
      });
      toast.success('Clinical note added to medical history');
      setNoteModalOpen(false);
      setNoteCondition('');
      setNoteTreatment('');
      // Reload profile
      openPatientProfile(selectedPatient);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add clinical note');
    }
  };

  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !allergen.trim()) return;
    try {
      await doctorPortalAPI.addPatientAllergy(selectedPatient._id, {
        allergen,
        severity: allergySeverity,
        reaction: allergyReaction,
      });
      toast.success('Allergy recorded with clinical safety warning');
      setAllergyModalOpen(false);
      setAllergen('');
      setAllergyReaction('');
      openPatientProfile(selectedPatient);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add allergy');
    }
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] text-slate-800">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-auto p-4 md:p-7">
          <div className="mx-auto max-w-[1550px] space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Clinical Records</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">My Assigned Patients</h1>
                <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                  Access patient medical histories, clinical notes, chronic conditions, and previous consultations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-slate-700">
                  Total Patients: <strong className="text-teal-700">{totalCount}</strong>
                </span>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, ID (e.g. KH-P...), or phone number..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Patients Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-12 text-center text-slate-500 text-sm">Loading patient records...</div>
                ) : patients.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="mx-auto text-slate-300 mb-2" size={38} />
                    <p className="text-sm font-bold text-slate-700">No patients found</p>
                    <p className="text-xs text-slate-400 mt-1">Try another search query or wait for new assigned appointments.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase text-slate-500">
                        <th className="py-3 px-4 font-semibold">Patient Name / ID</th>
                        <th className="py-3 px-4 font-semibold">Contact</th>
                        <th className="py-3 px-4 font-semibold">Blood Group</th>
                        <th className="py-3 px-4 font-semibold">Latest Diagnosis</th>
                        <th className="py-3 px-4 font-semibold">Allergies</th>
                        <th className="py-3 px-4 font-semibold">Last Visit</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patients.map((p) => {
                        const user = p.userId || {};
                        const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Patient';
                        return (
                          <tr key={p._id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{name}</div>
                              <div className="text-xs text-slate-400">{p.patientId || 'ID: KH-P'}</div>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-600">
                              <div>{user.phone || 'No phone'}</div>
                              <div className="text-slate-400">{user.email || ''}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                                {p.bloodGroup || 'Unknown'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-700 max-w-[200px] truncate">
                              {p.lastDiagnosis || 'General Clinical Evaluation'}
                            </td>
                            <td className="py-3 px-4">
                              {p.allergiesCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                                  <AlertCircle size={12} /> {p.allergiesCount} Alert(s)
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">None logged</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-600">
                              {p.lastVisitDate ? new Date(p.lastVisitDate).toLocaleDateString() : 'New'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => openPatientProfile(p)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white transition flex items-center gap-1"
                                >
                                  <Eye size={13} /> View Profile
                                </button>
                                <button
                                  onClick={() => navigate(`/doctor/consultations?patientId=${p._id}`)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-teal-700 hover:text-white transition flex items-center gap-1"
                                >
                                  <Stethoscope size={13} /> Consult
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40"
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

      {/* Patient Profile Modal / Drawer */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-teal-950 text-white">
              <div>
                <span className="text-xs uppercase font-bold text-teal-300">Complete Clinical Patient File</span>
                <h2 className="text-xl font-bold mt-0.5">
                  {selectedPatient.userId?.name || 'Patient Profile'} ({selectedPatient.patientId || 'ID: KH-P'})
                </h2>
                <p className="text-xs text-slate-300">
                  {selectedPatient.gender || 'Gender N/A'} • Blood: {selectedPatient.bloodGroup || 'N/A'} • Contact: {selectedPatient.userId?.phone || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tab Controls & Action Buttons */}
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 text-xs">
                {(['profile', 'history', 'prescriptions', 'allergies', 'reports'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-xl font-bold capitalize transition ${
                      activeTab === tab ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNoteModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-600 hover:text-white transition flex items-center gap-1"
                >
                  <Plus size={13} /> Add Clinical Note
                </button>
                <button
                  onClick={() => setAllergyModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-600 hover:text-white transition flex items-center gap-1"
                >
                  <ShieldAlert size={13} /> Add Allergy
                </button>
                <button
                  onClick={() => navigate(`/doctor/patient-history?patientId=${selectedPatient._id}`)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white transition flex items-center gap-1"
                >
                  <Clock size={13} /> Full Timeline
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingProfile ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading clinical data...</div>
              ) : (
                <>
                  {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <h4 className="font-bold text-slate-800 text-sm border-b pb-1">Personal Details</h4>
                        <p><strong className="text-slate-500">Full Name:</strong> {selectedPatient.userId?.name || 'N/A'}</p>
                        <p><strong className="text-slate-500">Email:</strong> {selectedPatient.userId?.email || 'N/A'}</p>
                        <p><strong className="text-slate-500">Phone:</strong> {selectedPatient.userId?.phone || 'N/A'}</p>
                        <p><strong className="text-slate-500">Date of Birth:</strong> {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                        <p><strong className="text-slate-500">Address:</strong> {selectedPatient.address ? `${selectedPatient.address.city || ''}, ${selectedPatient.address.state || ''}` : 'Not provided'}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <h4 className="font-bold text-slate-800 text-sm border-b pb-1">Emergency Contact</h4>
                        <p><strong className="text-slate-500">Contact Person:</strong> {selectedPatient.emergencyContact?.name || 'None listed'}</p>
                        <p><strong className="text-slate-500">Relationship:</strong> {selectedPatient.emergencyContact?.relationship || 'N/A'}</p>
                        <p><strong className="text-slate-500">Emergency Phone:</strong> {selectedPatient.emergencyContact?.phone || 'N/A'}</p>
                        <h4 className="font-bold text-slate-800 text-sm border-b pt-2 pb-1">Insurance</h4>
                        <p><strong className="text-slate-500">Provider:</strong> {selectedPatient.insuranceDetails?.providerName || 'Self-pay'}</p>
                        <p><strong className="text-slate-500">Policy Number:</strong> {selectedPatient.insuranceDetails?.policyNumber || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'allergies' && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-800 text-sm">Documented Allergies & Drug Sensitivities</h4>
                      {(!selectedPatient.allergies || selectedPatient.allergies.length === 0) ? (
                        <p className="text-xs text-slate-400 py-4">No allergies recorded for this patient.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedPatient.allergies.map((a: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-xl border border-rose-200 bg-rose-50/60 text-xs">
                              <p className="font-bold text-rose-900">{a.allergen}</p>
                              <p className="text-rose-700 mt-0.5">Severity: <span className="font-semibold uppercase">{a.severity || 'Moderate'}</span></p>
                              <p className="text-slate-500 text-[11px]">Reaction: {a.reaction || 'Adverse hypersensitivity'}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-800 text-sm">Medical Conditions & Treatment History</h4>
                      {(!selectedPatient.medicalHistory || selectedPatient.medicalHistory.length === 0) ? (
                        <p className="text-xs text-slate-400 py-4">No medical history logged.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 text-xs">
                          {selectedPatient.medicalHistory.map((item: any, idx: number) => (
                            <div key={idx} className="py-2.5">
                              <span className="text-[11px] font-semibold text-slate-400">{item.date ? new Date(item.date).toLocaleDateString() : 'Historical'}</span>
                              <p className="font-bold text-slate-900 text-sm">{item.condition}</p>
                              <p className="text-slate-600 mt-0.5">{item.treatment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'prescriptions' && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-800 text-sm">Issued Prescriptions ({profileData?.prescriptions?.length || 0})</h4>
                      {(!profileData?.prescriptions || profileData.prescriptions.length === 0) ? (
                        <p className="text-xs text-slate-400 py-4">No prescriptions found.</p>
                      ) : (
                        <div className="space-y-2">
                          {profileData.prescriptions.map((rx: any) => (
                            <div key={rx._id} className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1">
                              <div className="flex justify-between font-bold text-slate-900">
                                <span>{rx.prescriptionId} - {rx.diagnosis || 'Prescription'}</span>
                                <span className="text-slate-500">{new Date(rx.prescriptionDate || rx.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {rx.medicines?.map((m: any, midx: number) => (
                                  <span key={midx} className="px-2 py-0.5 bg-white border rounded text-[11px] text-teal-800 font-semibold">
                                    {m.medicineName} ({m.dosage} - {m.frequency})
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'reports' && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-800 text-sm">Diagnostic & Lab Reports ({profileData?.labTests?.length || 0})</h4>
                      {(!profileData?.labTests || profileData.labTests.length === 0) ? (
                        <p className="text-xs text-slate-400 py-4">No diagnostic reports on file.</p>
                      ) : (
                        <div className="space-y-2">
                          {profileData.labTests.map((t: any) => (
                            <div key={t._id} className="p-3 bg-slate-50 border rounded-xl text-xs flex items-center justify-between">
                              <div>
                                <p className="font-bold text-slate-900">{t.testName} ({t.testType})</p>
                                <p className="text-slate-500 text-[11px]">Ordered: {new Date(t.orderDate).toLocaleDateString()} • Status: <span className="font-bold uppercase">{t.status}</span></p>
                                {t.doctorComments && <p className="text-teal-700 text-[11px] mt-1 font-medium">Doctor review: {t.doctorComments}</p>}
                              </div>
                              {t.isAbnormal && (
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">ABNORMAL</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Clinical Note Dialog */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAddNote} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Clinical Note</h3>
            <p className="text-xs text-slate-500">Attach clinical observations or condition updates to this patient's record.</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Diagnosis / Condition</label>
              <input
                type="text"
                required
                value={noteCondition}
                onChange={(e) => setNoteCondition(e.target.value)}
                placeholder="e.g. Essential Hypertension Grade 1"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Notes & Treatment</label>
              <textarea
                rows={4}
                required
                value={noteTreatment}
                onChange={(e) => setNoteTreatment(e.target.value)}
                placeholder="Enter doctor's examination findings, care plan, lifestyle changes, etc..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-teal-700 text-white hover:bg-teal-800 shadow"
              >
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Allergy Dialog */}
      {allergyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAddAllergy} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Record Patient Allergy</h3>
            <p className="text-xs text-slate-500">Document drug or environmental allergies to trigger real-time prescription warnings.</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Allergen Name</label>
              <input
                type="text"
                required
                value={allergen}
                onChange={(e) => setAllergen(e.target.value)}
                placeholder="e.g. Penicillin, Amoxicillin, Sulfa, Aspirin"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Severity</label>
              <select
                value={allergySeverity}
                onChange={(e) => setAllergySeverity(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="mild">Mild (minor rash, itching)</option>
                <option value="moderate">Moderate (urticaria, swelling)</option>
                <option value="severe">Severe (Anaphylaxis risk, airway compromise)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Reaction Description</label>
              <input
                type="text"
                value={allergyReaction}
                onChange={(e) => setAllergyReaction(e.target.value)}
                placeholder="e.g. Facial edema, wheezing, anaphylactoid reaction"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAllergyModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 shadow"
              >
                Record Allergy
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
