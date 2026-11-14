import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  HeartPulse,
  Wind,
  Droplets,
  Scale,
  RefreshCw,
  Bell,
  X,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { nursePortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NurseVitalsPage() {
  const [searchParams] = useSearchParams();
  const urlPatientId = searchParams.get('patientId');

  const [patients, setAssignments] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(urlPatientId || '');
  const [vitalsList, setVitalsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Record Vitals Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    patientId: urlPatientId || '',
    temperature: 98.6,
    bpSystolic: 120,
    bpDiastolic: 80,
    heartRate: 72,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    bloodGlucose: '',
    bloodGlucoseType: 'random',
    height: '',
    weight: '',
    painScore: 0,
    notes: '',
    notifyDoctor: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const patRes = await nursePortalAPI.getPatients();
      const patientList = patRes.data.data || [];
      setAssignments(patientList);

      const targetId = selectedPatientId || (patientList[0]?.patientId?._id || '');
      if (targetId) {
        setSelectedPatientId(targetId);
        const vRes = await nursePortalAPI.getPatientVitals(targetId);
        setVitalsList(vRes.data.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to load patient vitals data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePatientChange = async (pId: string) => {
    setSelectedPatientId(pId);
    setForm((prev) => ({ ...prev, patientId: pId }));
    try {
      setLoading(true);
      const vRes = await nursePortalAPI.getPatientVitals(pId);
      setVitalsList(vRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load vitals for selected patient');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) {
      toast.error('Please select an inpatient');
      return;
    }

    try {
      setSubmitting(true);
      const res = await nursePortalAPI.recordVitals({
        patientId: form.patientId,
        temperature: Number(form.temperature),
        bloodPressure: {
          systolic: Number(form.bpSystolic),
          diastolic: Number(form.bpDiastolic),
        },
        heartRate: Number(form.heartRate),
        respiratoryRate: Number(form.respiratoryRate),
        oxygenSaturation: Number(form.oxygenSaturation),
        bloodGlucose: form.bloodGlucose ? Number(form.bloodGlucose) : undefined,
        bloodGlucoseType: form.bloodGlucoseType,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        painScore: Number(form.painScore),
        notes: form.notes,
        notifyDoctor: form.notifyDoctor,
      });

      toast.success(res.data.message || 'Vitals recorded successfully!');
      setModalOpen(false);
      handlePatientChange(form.patientId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record vitals');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatientObj = patients.find((a) => a.patientId?._id === selectedPatientId)?.patientId;
  const latestReading = vitalsList[0] || null;

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
                  <Activity size={14} className="text-teal-600" />
                  Clinical Hemodynamic Monitoring
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Patient Vital Signs Monitor
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Record body temperature, arterial BP, pulse rate, SpO2, respiratory rate, and blood glucose.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setForm((prev) => ({ ...prev, patientId: selectedPatientId }));
                    setModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20"
                >
                  <Plus size={15} /> Record New Vitals
                </button>
                <button
                  onClick={loadData}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                  title="Refresh"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Inpatient Selector Bar */}
            <div className="clinical-card p-4 bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase">Select Inpatient:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => handlePatientChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-900 focus:ring-2 focus:ring-teal-600 min-w-56"
                >
                  {patients.map((a) => (
                    <option key={a.patientId?._id} value={a.patientId?._id}>
                      {a.patientId?.userId?.name || 'Patient'} ({a.roomNumber || 'Room'} • {a.bedNumber || 'Bed'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPatientObj && (
                <div className="text-xs text-slate-500 font-mono">
                  ID: <span className="font-bold text-slate-800">{selectedPatientObj.patientId || 'KH-PAT'}</span> • Blood: {selectedPatientObj.bloodGroup || 'O+'}
                </div>
              )}
            </div>

            {/* Latest Readings Spotlight Cards */}
            {latestReading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className={`clinical-card p-4 border ${latestReading.temperature > 100.4 ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Temp</span>
                    <Thermometer size={16} className={latestReading.temperature > 100.4 ? 'text-rose-600' : 'text-teal-600'} />
                  </div>
                  <div className="text-xl font-black text-slate-900">{latestReading.temperature}°F</div>
                  <div className="text-[10px] font-semibold text-slate-500 mt-1">Normal: 97.8 - 99.1°F</div>
                </div>

                <div className={`clinical-card p-4 border ${latestReading.bloodPressure?.systolic >= 140 ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Blood Pressure</span>
                    <Activity size={16} className="text-blue-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900">
                    {latestReading.bloodPressure?.systolic}/{latestReading.bloodPressure?.diastolic}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 mt-1">mmHg (Target 120/80)</div>
                </div>

                <div className={`clinical-card p-4 border ${latestReading.heartRate > 100 || latestReading.heartRate < 60 ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Pulse / HR</span>
                    <HeartPulse size={16} className="text-rose-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900">{latestReading.heartRate} bpm</div>
                  <div className="text-[10px] font-semibold text-slate-500 mt-1">Target: 60 - 100 bpm</div>
                </div>

                <div className={`clinical-card p-4 border ${latestReading.oxygenSaturation < 95 ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">SpO2 Oxygen</span>
                    <Droplets size={16} className="text-teal-600" />
                  </div>
                  <div className="text-xl font-black text-teal-800">{latestReading.oxygenSaturation}%</div>
                  <div className="text-[10px] font-semibold text-slate-500 mt-1">Target: ≥ 95%</div>
                </div>

                <div className="clinical-card p-4 bg-white border border-slate-200">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Resp Rate</span>
                    <Wind size={16} className="text-indigo-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900">{latestReading.respiratoryRate}/min</div>
                  <div className="text-[10px] font-semibold text-slate-500 mt-1">Target: 12 - 20/min</div>
                </div>

                <div className="clinical-card p-4 bg-white border border-slate-200">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Blood Sugar</span>
                    <Scale size={16} className="text-amber-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900">
                    {latestReading.bloodGlucose ? `${latestReading.bloodGlucose}` : '—'} <span className="text-xs font-normal">mg/dL</span>
                  </div>
                  <div className="text-[10px] text-amber-700 font-semibold mt-1 capitalize">{latestReading.bloodGlucoseType || 'Random'}</div>
                </div>
              </div>
            ) : null}

            {/* Abnormal Alert Strip if latest is abnormal */}
            {latestReading && latestReading.isAbnormal && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                  <div className="text-xs">
                    <strong className="font-bold">Clinical Threshold Alerts Detected: </strong>
                    <span>{latestReading.abnormalFlags?.join(', ') || 'Abnormal readings recorded'}</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-mono font-bold bg-rose-200 text-rose-800 px-2 py-0.5 rounded">
                  Requires Observation
                </span>
              </div>
            )}

            {/* Vitals History Table */}
            <div className="clinical-card p-6 bg-white border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Historical Vitals Flowsheet</h3>
                  <p className="text-xs text-slate-500">Full chronological sequence of measurements recorded by floor nurses</p>
                </div>
                <span className="text-xs text-slate-400 font-medium">Total: {vitalsList.length} reading(s)</span>
              </div>

              {vitalsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No vitals logged yet for this patient. Click "Record New Vitals" above.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3">Date & Time</th>
                        <th className="py-3 px-3">Temp (°F)</th>
                        <th className="py-3 px-3">BP (mmHg)</th>
                        <th className="py-3 px-3">Pulse (bpm)</th>
                        <th className="py-3 px-3">Resp Rate</th>
                        <th className="py-3 px-3">SpO2 (%)</th>
                        <th className="py-3 px-3">Glucose</th>
                        <th className="py-3 px-3">Pain (0-10)</th>
                        <th className="py-3 px-3">Recorded By</th>
                        <th className="py-3 px-3">Evaluation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {vitalsList.map((v) => (
                        <tr key={v._id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 text-slate-600 text-[11px]">
                            {new Date(v.recordedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 px-3 font-semibold">{v.temperature}°F</td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {v.bloodPressure?.systolic}/{v.bloodPressure?.diastolic}
                          </td>
                          <td className="py-3 px-3">{v.heartRate}</td>
                          <td className="py-3 px-3">{v.respiratoryRate}</td>
                          <td className={`py-3 px-3 font-bold ${v.oxygenSaturation < 95 ? 'text-rose-600' : 'text-teal-700'}`}>
                            {v.oxygenSaturation}%
                          </td>
                          <td className="py-3 px-3">{v.bloodGlucose || '—'}</td>
                          <td className="py-3 px-3">{v.painScore ?? 0}/10</td>
                          <td className="py-3 px-3 font-sans text-slate-500 text-[11px]">{v.recordedBy?.name || 'Staff Nurse'}</td>
                          <td className="py-3 px-3 font-sans">
                            {v.isAbnormal ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                <AlertTriangle size={10} /> Abnormal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 size={10} /> Normal
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

            {/* RECORD VITALS MODAL */}
            {modalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <form
                  onSubmit={handleSubmitVitals}
                  className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-4 border border-slate-200"
                >
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30">
                        <Activity size={20} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">Record Patient Vitals</h3>
                        <p className="text-[11px] text-slate-500">Automated clinical threshold and doctor alert engine</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Patient select */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                        Inpatient Target *
                      </label>
                      <select
                        required
                        value={form.patientId}
                        onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                        className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50"
                      >
                        <option value="">-- Choose Inpatient --</option>
                        {patients.map((a) => (
                          <option key={a.patientId?._id} value={a.patientId?._id}>
                            {a.patientId?.userId?.name || 'Patient'} ({a.roomNumber || 'Room'} - {a.bedNumber || 'Bed'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Core Grid: Temp, BP, Pulse, RR, SpO2 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Body Temp (°F) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={form.temperature}
                          onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) || 0 })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono"
                          placeholder="98.6"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          BP Systolic (mmHg) *
                        </label>
                        <input
                          type="number"
                          required
                          value={form.bpSystolic}
                          onChange={(e) => setForm({ ...form, bpSystolic: parseInt(e.target.value) || 0 })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono"
                          placeholder="120"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          BP Diastolic (mmHg) *
                        </label>
                        <input
                          type="number"
                          required
                          value={form.bpDiastolic}
                          onChange={(e) => setForm({ ...form, bpDiastolic: parseInt(e.target.value) || 0 })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono"
                          placeholder="80"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Heart Rate (bpm) *
                        </label>
                        <input
                          type="number"
                          required
                          value={form.heartRate}
                          onChange={(e) => setForm({ ...form, heartRate: parseInt(e.target.value) || 0 })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono"
                          placeholder="72"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Resp Rate (/min) *
                        </label>
                        <input
                          type="number"
                          required
                          value={form.respiratoryRate}
                          onChange={(e) => setForm({ ...form, respiratoryRate: parseInt(e.target.value) || 0 })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono"
                          placeholder="16"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          SpO2 Oxygen (%) *
                        </label>
                        <input
                          type="number"
                          required
                          value={form.oxygenSaturation}
                          onChange={(e) => setForm({ ...form, oxygenSaturation: parseInt(e.target.value) || 0 })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono"
                          placeholder="98"
                        />
                      </div>
                    </div>

                    {/* Secondary: Glucose, Height, Weight, Pain */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Glucose (mg/dL)</label>
                        <input
                          type="number"
                          value={form.bloodGlucose}
                          onChange={(e) => setForm({ ...form, bloodGlucose: e.target.value })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono"
                          placeholder="110"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Type</label>
                        <select
                          value={form.bloodGlucoseType}
                          onChange={(e) => setForm({ ...form, bloodGlucoseType: e.target.value })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2"
                        >
                          <option value="random">Random</option>
                          <option value="fasting">Fasting</option>
                          <option value="post_prandial">Post-Prandial</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={form.weight}
                          onChange={(e) => setForm({ ...form, weight: e.target.value })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono"
                          placeholder="70"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Pain Scale (0-10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={form.painScore}
                          onChange={(e) => setForm({ ...form, painScore: parseInt(e.target.value) || 0 })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2 font-mono"
                        />
                      </div>
                    </div>

                    {/* Clinical Notes */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Nursing Observations / Notes</label>
                      <textarea
                        rows={2}
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Patient alert, skin warm, no respiratory distress observed..."
                        className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                      />
                    </div>

                    {/* Notify Doctor checkbox */}
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-amber-600" />
                        <div>
                          <div className="text-xs font-bold text-amber-950">Send Alert to Attending Doctor</div>
                          <div className="text-[10px] text-amber-800">Dispatch clinical alert if values require prompt physician review</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.notifyDoctor}
                        onChange={(e) => setForm({ ...form, notifyDoctor: e.target.checked })}
                        className="h-4 w-4 text-teal-600 rounded border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20"
                    >
                      {submitting ? 'Recording...' : 'Save & Log Vitals'}
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
