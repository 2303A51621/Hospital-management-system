import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  RefreshCw,
  Thermometer,
  Pill,
  AlertTriangle,
  BedDouble,
  X,
  Activity,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { nursePortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NursePatientsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');

  // Selected patient profile modal
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await nursePortalAPI.getPatients({
        search,
        priority: priorityFilter,
        ward: wardFilter,
      });
      setAssignments(res.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load assigned patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [priorityFilter, wardFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPatients();
  };

  const openPatientProfile = async (patientId: string) => {
    try {
      setSelectedPatientId(patientId);
      setLoadingProfile(true);
      const res = await nursePortalAPI.getPatientCareDetail(patientId);
      setProfileData(res.data.data);
    } catch (err: any) {
      toast.error('Failed to load patient clinical detail');
    } finally {
      setLoadingProfile(false);
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
                  <Users size={14} className="text-teal-600" />
                  Assigned Inpatient Ward Census
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Assigned Patient Management
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Monitor health status, diagnoses, medications, and beds for patients under your direct nursing care.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadPatients}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
                  title="Refresh roster"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="clinical-card p-4 bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by patient name, ID, room, or bed..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 bg-slate-50"
                />
              </form>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 text-slate-700"
                >
                  <option value="all">All Acuity Levels</option>
                  <option value="critical">Critical Patients</option>
                  <option value="urgent">Urgent Monitoring</option>
                  <option value="normal">Routine / Normal</option>
                </select>

                <select
                  value={wardFilter}
                  onChange={(e) => setWardFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 text-slate-700"
                >
                  <option value="all">All Hospital Wards</option>
                  <option value="ICU">ICU Critical Care</option>
                  <option value="General Ward">General Ward A</option>
                  <option value="Step-Down">Step-Down Unit</option>
                </select>

                <button
                  type="button"
                  onClick={loadPatients}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Patients Grid */}
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">Loading assigned patient roster...</div>
            ) : assignments.length === 0 ? (
              <div className="clinical-card p-12 text-center text-slate-400 text-xs">
                No patients match the selected search or filter criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {assignments.map((a) => {
                  const p = a.patientId || {};
                  const user = p.userId || {};
                  const isCritical = a.priority === 'critical';
                  const isUrgent = a.priority === 'urgent';

                  return (
                    <div
                      key={a._id}
                      className={`clinical-card p-5 bg-white border transition-all flex flex-col justify-between ${
                        isCritical
                          ? 'border-rose-300 ring-2 ring-rose-200/50 shadow-md'
                          : isUrgent
                          ? 'border-amber-300 shadow-sm'
                          : 'border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header: Acuity Badge & Room info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <BedDouble size={14} className="text-teal-700" />
                            <span>{a.roomNumber || 'Room 101'} • {a.bedNumber || 'Bed 01'}</span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                                : isUrgent
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {a.priority}
                          </span>
                        </div>

                        {/* Patient info */}
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900">{user.name || 'Inpatient'}</h3>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            ID: {p.patientId || 'KH-PAT'} | Gender: {p.gender || 'Unknown'} | Blood: {p.bloodGroup || 'O+'}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">Ward: <strong>{a.wardName || 'General Ward'}</strong></div>
                        </div>

                        {/* Care Instructions */}
                        {a.careInstructions && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic">
                            Care Note: {a.careInstructions}
                          </div>
                        )}

                        {/* Allergies Pill */}
                        {p.allergies && p.allergies.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            <AlertTriangle size={12} /> Allergies: {p.allergies.join(', ')}
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openPatientProfile(p._id)}
                          className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
                        >
                          View Full Chart →
                        </button>

                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/nurse/vitals?patientId=${p._id}`}
                            className="p-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200"
                            title="Take Vitals"
                          >
                            <Thermometer size={14} />
                          </Link>
                          <Link
                            to={`/nurse/medications?patientId=${p._id}`}
                            className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200"
                            title="Administer Meds"
                          >
                            <Pill size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* COMPREHENSIVE PATIENT CLINICAL PROFILE MODAL */}
            {selectedPatientId && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-4 border border-slate-200">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 via-slate-50 to-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-teal-600/30">
                        {profileData?.patient?.userId?.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-extrabold text-slate-900">
                            {profileData?.patient?.userId?.name || 'Patient Chart'}
                          </h2>
                          <span className="font-mono text-xs font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                            {profileData?.patient?.patientId || 'KH-PAT'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Room: {profileData?.assignment?.roomNumber} • Bed: {profileData?.assignment?.bedNumber} • Ward: {profileData?.assignment?.wardName}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(null);
                        setProfileData(null);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loadingProfile ? (
                      <div className="py-12 text-center text-xs text-slate-400">Loading comprehensive medical chart...</div>
                    ) : !profileData ? (
                      <div className="py-8 text-center text-xs text-slate-400">No chart details found.</div>
                    ) : (
                      <>
                        {/* Patient Meta Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender & Blood</span>
                            <span className="font-bold text-slate-800">{profileData.patient?.gender || 'N/A'}, {profileData.patient?.bloodGroup || 'O+'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                            <span className="font-bold text-slate-800">{profileData.patient?.userId?.phone || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Acuity Priority</span>
                            <span className="font-bold text-teal-800 uppercase">{profileData.assignment?.priority || 'Normal'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Contact</span>
                            <span className="font-bold text-slate-800">
                              {profileData.patient?.emergencyContact?.name || 'Guardian'} ({profileData.patient?.emergencyContact?.phone || 'N/A'})
                            </span>
                          </div>
                        </div>

                        {/* Medical Conditions & Allergies */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 text-xs space-y-1">
                            <span className="font-bold text-rose-900 uppercase tracking-wide block flex items-center gap-1.5">
                              <AlertTriangle size={13} /> Documented Allergies:
                            </span>
                            <div className="text-slate-700">
                              {profileData.patient?.allergies?.length > 0 ? (
                                <ul className="list-disc pl-4 space-y-0.5">
                                  {profileData.patient.allergies.map((a: any, i: number) => (
                                    <li key={i}>{typeof a === 'string' ? a : `${a.allergen} (${a.severity || 'mild'})`}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-slate-400">No documented drug allergies on record.</span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                            <span className="font-bold text-amber-900 uppercase tracking-wide block">
                              Chronic Conditions & History:
                            </span>
                            <div className="text-slate-700">
                              {profileData.patient?.chronicDiseases?.length > 0 ? (
                                <ul className="list-disc pl-4 space-y-0.5">
                                  {profileData.patient.chronicDiseases.map((c: any, i: number) => (
                                    <li key={i}>{typeof c === 'string' ? c : c.disease}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-slate-400">No chronic medical co-morbidities logged.</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Active Doctor Prescriptions (Read Only for Nurse) */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Pill size={14} className="text-purple-600" />
                              Doctor-Prescribed Regimens ({profileData.prescriptions?.length || 0})
                            </h3>
                            <span className="text-[10px] text-slate-400 font-semibold">Authorized by Attending Doctors</span>
                          </div>

                          {profileData.prescriptions?.length === 0 ? (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-400 text-center">
                              No active prescriptions on file.
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                                  <tr>
                                    <th className="py-2.5 px-3">Medication Name</th>
                                    <th className="py-2.5 px-3">Dosage</th>
                                    <th className="py-2.5 px-3">Frequency</th>
                                    <th className="py-2.5 px-3">Duration</th>
                                    <th className="py-2.5 px-3">Prescribing Physician</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {profileData.prescriptions.map((rx: any) =>
                                    (rx.medicines || []).map((m: any, idx: number) => (
                                      <tr key={`${rx._id}-${idx}`} className="hover:bg-slate-50/50">
                                        <td className="py-2.5 px-3 font-bold text-slate-900">{m.medicineName || m.name}</td>
                                        <td className="py-2.5 px-3 font-semibold text-purple-700">{m.dosage}</td>
                                        <td className="py-2.5 px-3 text-slate-600">{m.frequency}</td>
                                        <td className="py-2.5 px-3 text-slate-600">{m.duration}</td>
                                        <td className="py-2.5 px-3 text-slate-500">
                                          Dr. {rx.doctorId?.userId?.name || 'Physician'}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Recent Vitals Stream */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Activity size={14} className="text-teal-600" />
                            Recent Recorded Vitals
                          </h3>

                          {profileData.vitals?.length === 0 ? (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-400 text-center">
                              No vitals logged yet for this patient.
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                                  <tr>
                                    <th className="py-2.5 px-3">Timestamp</th>
                                    <th className="py-2.5 px-3">BP (mmHg)</th>
                                    <th className="py-2.5 px-3">Heart Rate</th>
                                    <th className="py-2.5 px-3">SpO2</th>
                                    <th className="py-2.5 px-3">Temp</th>
                                    <th className="py-2.5 px-3">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {profileData.vitals.slice(0, 5).map((v: any) => (
                                    <tr key={v._id} className="hover:bg-slate-50/50">
                                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                                        {new Date(v.recordedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                      </td>
                                      <td className="py-2.5 px-3 font-bold">{v.bloodPressure?.systolic}/{v.bloodPressure?.diastolic}</td>
                                      <td className="py-2.5 px-3">{v.heartRate} bpm</td>
                                      <td className="py-2.5 px-3 font-bold text-teal-700">{v.oxygenSaturation}%</td>
                                      <td className="py-2.5 px-3">{v.temperature}°F</td>
                                      <td className="py-2.5 px-3">
                                        {v.isAbnormal ? (
                                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                            Abnormal
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            Normal
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Kushal Hospitals Clinical Inpatient Registry</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(null);
                        setProfileData(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
                    >
                      Close Chart
                    </button>
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
