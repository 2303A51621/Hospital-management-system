import { useEffect, useState } from 'react';
import {
  Share2,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { doctorPortalAPI, doctorAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorReferralsPage() {
  const [outgoingReferrals, setOutgoingReferrals] = useState<any[]>([]);
  const [incomingReferrals, setIncomingReferrals] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [colleagueDoctors, setColleagueDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [search, setSearch] = useState('');

  // Create Referral Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('Cardiology');
  const [toDoctorId, setToDoctorId] = useState('');
  const [priority, setPriority] = useState('Routine');
  const [reason, setReason] = useState('');
  const [clinicalSummary, setClinicalSummary] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [refRes, patRes, docRes] = await Promise.all([
        doctorPortalAPI.getReferrals(),
        doctorPortalAPI.getPatients({ limit: 100 }),
        doctorAPI.getAll(1, '', 100),
      ]);
      setOutgoingReferrals(refRes.data?.data?.outgoing || []);
      setIncomingReferrals(refRes.data?.data?.incoming || []);
      setPatients(patRes.data?.data || []);
      setColleagueDoctors(docRes.data?.data || []);
    } catch (err: any) {
      toast.error('Failed to load specialist referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !targetDepartment || !reason) {
      toast.error('Please fill all required referral fields');
      return;
    }

    try {
      const res = await doctorPortalAPI.createReferral({
        patientId,
        toDoctorId: toDoctorId || undefined,
        department: targetDepartment,
        priority,
        reason,
        clinicalSummary,
      });
      toast.success(res.data.message || 'Specialist referral submitted successfully!');
      setCreateModalOpen(false);
      setPatientId('');
      setReason('');
      setClinicalSummary('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit referral');
    }
  };

  const handleUpdateStatus = async (refId: string, status: string) => {
    try {
      await doctorPortalAPI.updateReferralStatus(refId, status);
      toast.success(`Referral updated to ${status}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update referral status');
    }
  };

  const listToRender = activeTab === 'outgoing' ? outgoingReferrals : incomingReferrals;
  const filteredList = listToRender.filter((ref) => {
    const patName = ref.patientId?.name || ref.patientId?.user?.name || '';
    const dept = ref.department || '';
    const code = ref.referralCode || '';
    const q = search.toLowerCase();
    return patName.toLowerCase().includes(q) || dept.toLowerCase().includes(q) || code.toLowerCase().includes(q);
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
                  <Share2 className="w-3.5 h-3.5" />
                  Inter-Departmental Referral Management
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Specialist Referrals
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Refer patients to hospital specialists, track incoming referrals, and exchange clinical context.
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
                  New Referral
                </button>
              </div>
            </div>

            {/* Referral Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Outgoing Referrals</div>
                  <div className="text-2xl font-bold text-slate-900">{outgoingReferrals.length}</div>
                  <div className="text-[11px] text-teal-600 font-medium">Referred by you</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Incoming Referrals</div>
                  <div className="text-2xl font-bold text-indigo-900">{incomingReferrals.length}</div>
                  <div className="text-[11px] text-indigo-600 font-medium">Referred to you</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Urgent Referrals</div>
                  <div className="text-2xl font-bold text-amber-600">
                    {[...outgoingReferrals, ...incomingReferrals].filter(
                      (r) => r.priority === 'Urgent' || r.priority === 'Emergency'
                    ).length}
                  </div>
                  <div className="text-[11px] text-amber-600 font-medium">Requires rapid evaluation</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Tabs & Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('outgoing')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition ${
                    activeTab === 'outgoing'
                      ? 'bg-white text-teal-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Outgoing Referrals ({outgoingReferrals.length})
                </button>
                <button
                  onClick={() => setActiveTab('incoming')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition ${
                    activeTab === 'incoming'
                      ? 'bg-white text-indigo-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Incoming Referrals ({incomingReferrals.length})
                </button>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, department, code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Referrals List */}
            {loading ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Loading specialist referrals...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                <Share2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-700">
                  No {activeTab} referrals found
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                  {activeTab === 'outgoing'
                    ? 'You have not referred any patients to other departments yet.'
                    : 'No patients have been referred to you from other doctors.'}
                </p>
                {activeTab === 'outgoing' && (
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Create Referral
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredList.map((ref) => {
                  const pat = ref.patientId || {};
                  const patName = pat.name || pat.user?.name || 'Assigned Patient';
                  const dateStr = new Date(ref.createdAt || Date.now()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={ref._id}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-base">{patName}</span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-600">
                                {ref.referralCode || 'REF-N/A'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                              <span>Dept: <strong className="text-slate-800">{ref.department}</strong></span>
                              <span>•</span>
                              <span>{dateStr}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                ref.priority === 'Emergency'
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : ref.priority === 'Urgent'
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {ref.priority || 'Routine'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                ref.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : ref.status === 'Accepted'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : ref.status === 'Declined'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {ref.status || 'Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Reason & Summary */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1">
                          <div>
                            <span className="font-bold text-slate-700">Reason: </span>
                            <span className="text-slate-800">{ref.reason}</span>
                          </div>
                          {ref.clinicalSummary && (
                            <div className="text-slate-600 italic">
                              <span className="font-semibold text-slate-700">Summary: </span>
                              {ref.clinicalSummary}
                            </div>
                          )}
                        </div>

                        {/* Doctor Context */}
                        <div className="text-xs text-slate-500 flex items-center justify-between">
                          {activeTab === 'outgoing' ? (
                            <span>
                              Referred To:{' '}
                              <strong className="text-slate-700">
                                {ref.toDoctorId?.name ? `Dr. ${ref.toDoctorId.name}` : ref.department + ' Specialist'}
                              </strong>
                            </span>
                          ) : (
                            <span>
                              Referred By:{' '}
                              <strong className="text-slate-700">
                                {ref.fromDoctorId?.name ? `Dr. ${ref.fromDoctorId.name}` : 'Attending Physician'}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons for Incoming Referrals */}
                      {activeTab === 'incoming' && ref.status === 'Pending' && (
                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(ref._id, 'Declined')}
                            className="px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(ref._id, 'Accepted')}
                            className="px-3 py-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold shadow-sm"
                          >
                            Accept Referral
                          </button>
                        </div>
                      )}

                      {activeTab === 'incoming' && ref.status === 'Accepted' && (
                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end">
                          <button
                            onClick={() => handleUpdateStatus(ref._id, 'Completed')}
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold"
                          >
                            Mark Completed
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CREATE REFERRAL MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-teal-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Refer Patient to Specialist</h3>
                  <p className="text-xs text-slate-500">Provide clinical indication and department transfer</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Patient *
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                >
                  <option value="">-- Choose Assigned Patient --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.patientId || 'ID'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Target Department *
                  </label>
                  <select
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    required
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Pulmonology">Pulmonology</option>
                    <option value="Nephrology">Nephrology</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="ENT">ENT</option>
                    <option value="General Surgery">General Surgery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="Routine">Routine (Elective)</option>
                    <option value="Urgent">Urgent (Within 48h)</option>
                    <option value="Emergency">Emergency (Immediate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Specific Specialist (Optional)
                </label>
                <select
                  value={toDoctorId}
                  onChange={(e) => setToDoctorId(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                >
                  <option value="">-- Any Available Specialist in Department --</option>
                  {colleagueDoctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      Dr. {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reason for Referral *
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Uncontrolled hypertension with chest tightness"
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Clinical Summary & Workup Done
                </label>
                <textarea
                  rows={3}
                  value={clinicalSummary}
                  onChange={(e) => setClinicalSummary(e.target.value)}
                  placeholder="ECG shows sinus tachycardia, troponin negative. Patient referred for 2D Echocardiogram..."
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-md shadow-teal-600/20"
                >
                  Issue Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
