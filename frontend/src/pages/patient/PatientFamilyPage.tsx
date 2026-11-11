import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Trash2,
  CalendarPlus,
  HeartPulse,
  AlertTriangle,
  User,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientFamilyPage() {
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Member Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('Child');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('female');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergiesText, setAllergiesText] = useState('');
  const [conditionsText, setConditionsText] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadFamily = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getFamilyMembers();
      setFamilyMembers(res.data?.data || []);
    } catch (err: any) {
      toast.error('Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamily();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter the full legal name');
      return;
    }
    try {
      setSaving(true);
      const allergies = allergiesText.split(',').map((s) => s.trim()).filter(Boolean);
      const chronicConditions = conditionsText.split(',').map((s) => s.trim()).filter(Boolean);

      await patientPortalAPI.addFamilyMember({
        fullName: fullName.trim(),
        relationship,
        dateOfBirth: dob || undefined,
        gender,
        bloodGroup,
        allergies,
        chronicConditions,
        notes: notes.trim(),
      });
      toast.success('Family member added to your health account');
      setModalOpen(false);
      setFullName('');
      setAllergiesText('');
      setConditionsText('');
      setNotes('');
      loadFamily();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add dependent');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your dependents?`)) return;
    try {
      await patientPortalAPI.deleteFamilyMember(id);
      toast.success('Family member profile removed');
      loadFamily();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove dependent');
    }
  };

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
                    <Users size={14} className="text-teal-300" />
                    Family Health Network
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Family Members & Dependents</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Manage appointments, medical records, and clinical care for your parents, children, and spouse under one login.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 text-xs font-bold transition-all shadow-md shadow-teal-950/20"
                  >
                    <UserPlus size={15} /> Add Family Member
                  </button>
                </div>
              </div>
            </div>

            {/* Family Members Grid */}
            <div className="clinical-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Registered Dependents</h3>
                <span className="text-xs font-semibold text-slate-500">{familyMembers.length} Dependents</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading family profiles...</div>
              ) : familyMembers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <Users size={32} className="mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-700">No dependents registered yet.</p>
                  <p className="text-slate-400">Add children, parents, or spouse to book appointments for them seamlessly.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {familyMembers.map((fam) => (
                    <div
                      key={fam._id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 transition-all flex flex-col justify-between space-y-4 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                            {fam.relationship}
                          </span>
                          <button
                            onClick={() => handleDeleteMember(fam._id, fam.fullName)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 mt-3">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
                            <User size={22} />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900">{fam.fullName}</h4>
                            <p className="text-xs text-slate-500">
                              {fam.gender ? fam.gender.toUpperCase() : 'N/A'} • Blood: {fam.bloodGroup || 'Not set'}
                            </p>
                          </div>
                        </div>

                        {/* Medical Summary */}
                        <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5">
                          {fam.allergies && fam.allergies.length > 0 && (
                            <div className="flex items-start gap-1.5 text-rose-700">
                              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                              <span className="truncate">Allergies: {fam.allergies.join(', ')}</span>
                            </div>
                          )}
                          {fam.chronicConditions && fam.chronicConditions.length > 0 && (
                            <div className="flex items-start gap-1.5 text-amber-700">
                              <HeartPulse size={13} className="shrink-0 mt-0.5" />
                              <span className="truncate">Conditions: {fam.chronicConditions.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <Link
                          to={`/patient/book-appointment?familyMemberId=${fam._id}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold transition-all"
                        >
                          <CalendarPlus size={14} /> Book Appointment
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Family Member Modal */}
            {modalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <form
                  onSubmit={handleAddMember}
                  className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-900">Add Dependent Family Member</h3>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar, Priya Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Relationship</label>
                      <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="Child">Child (Son / Daughter)</option>
                        <option value="Spouse">Spouse (Husband / Wife)</option>
                        <option value="Parent">Parent (Father / Mother)</option>
                        <option value="Sibling">Sibling (Brother / Sister)</option>
                        <option value="Other">Other Family Member</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      Allergies (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={allergiesText}
                      onChange={(e) => setAllergiesText(e.target.value)}
                      placeholder="e.g. Penicillin, Peanuts"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      Known Medical Conditions (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={conditionsText}
                      onChange={(e) => setConditionsText(e.target.value)}
                      placeholder="e.g. Asthma, Hypertension"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20"
                    >
                      {saving ? 'Registering...' : 'Save Member'}
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
