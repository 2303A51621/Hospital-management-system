import { useEffect, useState } from 'react';
import {
  User,
  Shield,
  Key,
  Phone,
  Award,
  Clock,
  BedDouble,
  CheckCircle2,
  Lock,
  Save,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { nursePortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NurseProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Editable Contact
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await nursePortalAPI.getProfile();
      const p = res.data.data;
      setProfile(p);
      setPhone(p.user?.phone || p.phone || '');
      setEmergencyContact(p.emergencyContact || '');
    } catch (err: any) {
      toast.error('Failed to load nurse profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingContact(true);
      await nursePortalAPI.updateProfile({
        phone: phone.trim(),
        emergencyContact: emergencyContact.trim(),
      });
      toast.success('Contact information updated successfully');
      fetchProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update contact info');
    } finally {
      setSavingContact(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setChangingPassword(true);
      await nursePortalAPI.updateProfile({
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const nurseData = profile || {};
  const name = profile?.name || 'Sister Mary Joseph';
  const nurseId = profile?.nurseId || 'NUR-7024';
  const licenseNumber = profile?.licenseNumber || 'KMC-NUR-829104';
  const qualifications = Array.isArray(profile?.qualification)
    ? profile.qualification.join(', ')
    : profile?.qualification || 'B.Sc. Nursing, RN (Registered Nurse)';
  const assignedWard = profile?.assignedWardName || 'General Ward A';
  const assignedShift = profile?.shift ? `${profile.shift.toUpperCase()} SHIFT` : 'Day Shift (07:00 - 15:00)';
  const department = profile?.department || 'General Medicine';
  const email = profile?.email || 'nurse@kushalhospitals.com';

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
                <User size={14} />
                <span>Professional Staff Credentialing</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Nurse Profile & Credentials</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Hospital staff identification, nursing council registration, assigned wards, and secure credentials.
              </p>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl bg-white border border-slate-200/80">
                <RefreshCw size={24} className="animate-spin text-teal-600" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* ID Badge Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-8 text-white shadow-xl">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-500/20 text-3xl font-black text-teal-300 ring-2 ring-teal-400/40">
                        {name ? name.charAt(0) : 'N'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-black tracking-tight">{name}</h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold border border-teal-400/30">
                            RN Officer
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-teal-200/80">
                          <span className="font-mono">ID: {nurseId}</span>
                          <span>• License: {licenseNumber}</span>
                          <span>• {qualifications}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                        <CheckCircle2 size={13} />
                        <span>Verified Inpatient Staff</span>
                      </div>
                      <div className="text-[11px] text-teal-300/70 mt-1">Kushal Hospitals Healthcare Network</div>
                    </div>
                  </div>
                </div>

                {/* Duty Assignment & Contact Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assigned Duties & Clinical Roles */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Award size={16} className="text-teal-600" />
                      <span>Clinical Assignment & Schedule</span>
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <BedDouble size={14} className="text-teal-600" /> Assigned Ward
                        </span>
                        <span className="font-bold text-slate-900">{assignedWard}</span>
                      </div>

                      <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Clock size={14} className="text-teal-600" /> Assigned Shift
                        </span>
                        <span className="font-bold text-slate-900">{assignedShift}</span>
                      </div>

                      <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Shield size={14} className="text-teal-600" /> Clinical Department
                        </span>
                        <span className="font-bold text-slate-900">{department}</span>
                      </div>

                      <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <FileCheck size={14} className="text-teal-600" /> Digital Signature Hash
                        </span>
                        <span className="font-mono text-[11px] font-bold text-teal-800">
                          {nurseData.digitalSignatureHash || 'SHA256-NURSE-ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Edit Form */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                      <Phone size={16} className="text-teal-600" />
                      <span>Contact & Emergency Details</span>
                    </h3>

                    <form onSubmit={handleUpdateContact} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          disabled
                          value={email}
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500 cursor-not-allowed font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Emergency Contact (Name & Phone)
                        </label>
                        <input
                          type="text"
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="e.g. Spouse / Parent (+91 98765 00000)"
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={savingContact}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                        >
                          <Save size={13} />
                          <span>{savingContact ? 'Saving...' : 'Save Contact Details'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Password Change Form */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                    <Key size={16} className="text-teal-600" />
                    <span>Security & Password Protection</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Protect patient privacy by changing your password periodically. Never share clinical login credentials.
                  </p>

                  <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    <div className="sm:col-span-3 pt-1">
                      <button
                        type="submit"
                        disabled={changingPassword}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                      >
                        <Lock size={13} />
                        <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
