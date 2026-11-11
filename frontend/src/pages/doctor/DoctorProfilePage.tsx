import { useEffect, useState } from 'react';
import {
  User,
  ShieldCheck,
  FileSignature,
  Lock,
  Save,
  RefreshCw,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { doctorPortalAPI, authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorProfilePage() {
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable Profile fields
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState<number>(5);
  const [consultationFee, setConsultationFee] = useState<number>(500);
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [digitalSignature, setDigitalSignature] = useState('');

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await doctorPortalAPI.getProfile();
      const doc = res.data?.data;
      setDoctor(doc);
      if (doc) {
        setQualifications(doc.qualification || doc.qualifications || 'MBBS, MD');
        setExperience(doc.experience || 5);
        setConsultationFee(doc.consultationFee || 500);
        setPhone(doc.userId?.phone || doc.phone || '');
        setBio(doc.bio || '');
        setDigitalSignature(doc.digitalSignature || `Dr. ${doc.name} (Reg: KMC-${doc._id?.slice(-6) || '202688'})`);
      }
    } catch (err: any) {
      toast.error('Failed to load doctor profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await doctorPortalAPI.updateProfile({
        qualifications,
        experience,
        consultationFee,
        phone,
        bio,
        digitalSignature,
      });
      toast.success(res.data.message || 'Profile saved successfully!');
      loadProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      setChangingPassword(true);
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold mb-2">
                  <User className="w-3.5 h-3.5" />
                  Credentials & Practitioner Portfolio
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Doctor Profile & Digital Signature
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Manage your clinical credentials, consultation tariffs, contact info, and cryptographic e-signature.
                </p>
              </div>

              <button
                onClick={loadProfile}
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Loading doctor profile...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Overview Card (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="relative w-28 h-28 mx-auto">
                      <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white font-extrabold flex items-center justify-center text-4xl shadow-lg shadow-teal-500/20">
                        {doctor?.name?.[0] || 'D'}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Dr. {doctor?.name || 'Physician'}</h2>
                      <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mt-0.5">
                        {doctor?.specialization || 'Clinical Specialist'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{doctor?.department || 'Medical Division'}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-left text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Doctor ID</span>
                        <span className="font-mono font-bold text-slate-800">
                          {doctor?._id?.slice(-8).toUpperCase() || 'DOC-REG'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Rating</span>
                        <span className="font-bold text-amber-600">★ {doctor?.rating || '4.9'} / 5.0</span>
                      </div>
                    </div>

                    {/* Digital Signature Badge */}
                    <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-left space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                        <FileSignature className="w-4 h-4 text-teal-600" />
                        Verified Digital Signature
                      </div>
                      <div className="font-serif italic text-xs text-teal-800 font-semibold truncate">
                        "{digitalSignature || 'Dr. ' + (doctor?.name || 'Verified')}"
                      </div>
                      <div className="text-[10px] text-teal-600 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Attached automatically to all issued Rx
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Form Tabs: Profile & Security (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Profile Edit Form */}
                  <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Authorized Profile Information</h3>
                        <p className="text-xs text-slate-500">Update professional bio, tariffs, and credentials</p>
                      </div>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Full Name (Read-Only)
                        </label>
                        <input
                          type="text"
                          disabled
                          value={`Dr. ${doctor?.name || ''}`}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-100 text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Primary Specialization (Read-Only)
                        </label>
                        <input
                          type="text"
                          disabled
                          value={doctor?.specialization || ''}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-100 text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Academic Qualifications *
                        </label>
                        <input
                          type="text"
                          required
                          value={qualifications}
                          onChange={(e) => setQualifications(e.target.value)}
                          placeholder="e.g. MBBS, MD (General Medicine), DM (Cardio)"
                          className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Clinical Experience (Years)
                        </label>
                        <input
                          type="number"
                          value={experience}
                          onChange={(e) => setExperience(parseInt(e.target.value) || 0)}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Consultation Fee (₹ INR)
                        </label>
                        <input
                          type="number"
                          value={consultationFee}
                          onChange={(e) => setConsultationFee(parseInt(e.target.value) || 0)}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Contact Phone Number
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 9876543210"
                          className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Professional Description / Biography
                      </label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Brief summary of clinical expertise, special interests, and publications..."
                        className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-teal-500"
                      />
                    </div>

                    {/* Digital Signature Configuration */}
                    <div className="p-4 rounded-xl border border-teal-200 bg-slate-50/70 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileSignature className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-bold text-slate-900 uppercase">
                          Electronic Signature Format (e-Sign)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        This digital identifier will be stamped with an audit timestamp onto all medical prescriptions,
                        diagnostic requisitions, and finalized consultation sheets.
                      </p>
                      <input
                        type="text"
                        value={digitalSignature}
                        onChange={(e) => setDigitalSignature(e.target.value)}
                        placeholder="Dr. Full Name, MD - Council Reg #12345"
                        className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white font-serif italic text-teal-900"
                      />
                    </div>
                  </form>

                  {/* Password & Security Card */}
                  <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-600" />
                        <h3 className="font-bold text-slate-900 text-sm">Account Security & Password</h3>
                      </div>
                      <button
                        type="submit"
                        disabled={changingPassword}
                        className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition disabled:opacity-50"
                      >
                        {changingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2"
                        />
                      </div>
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
