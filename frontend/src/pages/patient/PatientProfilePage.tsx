import { useEffect, useState } from 'react';
import {
  User,
  Save,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI, authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function PatientProfilePage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [gender, setGender] = useState('female');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [conditionsText, setConditionsText] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRel, setEmergencyRel] = useState('');

  // Password Update
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getProfile();
      const p = res.data?.data?.patient || {};
      const u = res.data?.data?.user || user || {};

      setName(u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim());
      setPhone(u.phone || '');
      setBloodGroup(p.bloodGroup || 'O+');
      setGender(p.gender || 'female');
      setDateOfBirth(p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '');
      setAllergiesText((p.allergies || []).join(', '));
      setConditionsText((p.chronicConditions || []).join(', '));

      if (p.emergencyContact) {
        setEmergencyName(p.emergencyContact.name || '');
        setEmergencyPhone(p.emergencyContact.phone || '');
        setEmergencyRel(p.emergencyContact.relationship || '');
      }
    } catch (err: any) {
      toast.error('Failed to load patient profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const allergies = allergiesText.split(',').map((s) => s.trim()).filter(Boolean);
      const chronicConditions = conditionsText.split(',').map((s) => s.trim()).filter(Boolean);

      const res = await patientPortalAPI.updateProfile({
        name,
        phone,
        bloodGroup,
        gender,
        dateOfBirth: dateOfBirth || undefined,
        allergies,
        chronicConditions,
        emergencyContact: {
          name: emergencyName,
          phone: emergencyPhone,
          relationship: emergencyRel,
        },
      });
      toast.success(res.data?.message || 'Profile updated successfully!');
      if (res.data?.data?.user) {
        setUser({ ...user, ...res.data.data.user });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      setUpdatingPassword(true);
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Security password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20 text-teal-100 mb-2">
                    <User size={14} className="text-teal-300" />
                    Patient Electronic Demographics
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Personal & Medical Profile</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Manage your personal details, blood group, recorded allergies, and emergency next-of-kin contacts.
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="clinical-card p-12 text-center text-slate-400 text-xs">Loading patient demographics...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Details Form (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleSaveProfile} className="clinical-card p-6 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Personal Demographics</h3>
                    <span className="text-xs text-slate-400 font-mono">Patient EMR #{user?._id?.slice(-6).toUpperCase()}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Registered Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-600"
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

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  {/* Medical Criticals */}
                  <div className="pt-3 border-t border-slate-100 space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Medical Flags & Chronic Profile
                    </h4>

                    <div className="text-xs space-y-3">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">
                          Known Drug & Food Allergies (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={allergiesText}
                          onChange={(e) => setAllergiesText(e.target.value)}
                          placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-600 block mb-1">
                          Existing Chronic Conditions (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={conditionsText}
                          onChange={(e) => setConditionsText(e.target.value)}
                          placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="pt-3 border-t border-slate-100 space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Emergency Contact (Next of Kin)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Contact Name</label>
                        <input
                          type="text"
                          value={emergencyName}
                          onChange={(e) => setEmergencyName(e.target.value)}
                          placeholder="Full name"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Relationship</label>
                        <input
                          type="text"
                          value={emergencyRel}
                          onChange={(e) => setEmergencyRel(e.target.value)}
                          placeholder="Spouse / Parent / Sibling"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Emergency Phone</label>
                        <input
                          type="tel"
                          value={emergencyPhone}
                          onChange={(e) => setEmergencyPhone(e.target.value)}
                          placeholder="+91..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20 flex items-center gap-2"
                    >
                      <Save size={14} /> {saving ? 'Saving...' : 'Save Demographics'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password & Security Box (1 col) */}
              <div className="space-y-6">
                <form onSubmit={handleUpdatePassword} className="clinical-card p-6 space-y-4 text-xs">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Lock size={16} className="text-teal-700" />
                    <h3 className="text-sm font-bold text-slate-900">Security & Password</h3>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-sm"
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>

                {/* Account Accreditation Note */}
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck size={16} className="text-teal-700" /> Verified Health ID
                  </div>
                  <p className="text-teal-800 text-[11px] leading-relaxed">
                    Your electronic health record is stored in compliance with the National Digital Health Mission (ABDM) standards.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}
