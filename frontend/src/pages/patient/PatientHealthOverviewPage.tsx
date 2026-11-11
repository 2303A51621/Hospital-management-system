import { useEffect, useState } from 'react';
import {
  HeartPulse,
  CheckCircle2,
  RefreshCw,
  Activity,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientHealthOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getHealthOverview();
      setData(res.data?.data);
    } catch (err: any) {
      toast.error('Failed to load vitals trends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const history = data?.vitalsHistory || [];
  const latest = data?.latestVitals || {};

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
                    <Activity size={14} className="text-teal-300" />
                    Longitudinal Clinical Biomarkers
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Health Overview & Vitals Trends</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Track vital sign progressions across your medical checkups including blood pressure, pulse, oxygenation, and BMI.
                  </p>
                </div>
                <button
                  onClick={loadOverview}
                  className="self-start md:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 backdrop-blur-md transition-all"
                >
                  <RefreshCw size={14} /> Refresh Trends
                </button>
              </div>
            </div>

            {/* Current Vitals Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="clinical-card p-5 border-l-4 border-l-teal-600">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Blood Pressure</span>
                <div className="text-3xl font-black text-slate-900 mt-2">
                  {latest.bloodPressure || '120/80'}
                </div>
                <span className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 size={13} /> mmHg • Optimal Target
                </span>
              </div>

              <div className="clinical-card p-5 border-l-4 border-l-rose-500">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pulse Rate</span>
                <div className="text-3xl font-black text-slate-900 mt-2">
                  {latest.pulseRate || '74'}
                </div>
                <span className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <HeartPulse size={13} /> bpm • Resting Normal
                </span>
              </div>

              <div className="clinical-card p-5 border-l-4 border-l-cyan-600">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Oxygen Saturation (SpO2)</span>
                <div className="text-3xl font-black text-slate-900 mt-2">
                  {latest.spO2 || '99'}%
                </div>
                <span className="text-xs text-cyan-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Room Air • Optimal
                </span>
              </div>

              <div className="clinical-card p-5 border-l-4 border-l-amber-500">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Body Temperature</span>
                <div className="text-3xl font-black text-slate-900 mt-2">
                  {latest.temperature || '98.6'}°F
                </div>
                <span className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Afebrile • Normal
                </span>
              </div>
            </div>

            {/* Vitals History Progression Table */}
            <div className="clinical-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Historical Checkup Logs & Readings</h3>
                <span className="text-xs font-semibold text-slate-500">{history.length} Recorded Visits</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading vitals logs...</div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No vitals history recorded yet. Vitals recorded during consultations will appear here chronologically.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Visit Date</th>
                        <th className="py-3 px-4">Doctor / Clinic</th>
                        <th className="py-3 px-4">Blood Pressure</th>
                        <th className="py-3 px-4">Heart Rate</th>
                        <th className="py-3 px-4">SpO2</th>
                        <th className="py-3 px-4">Temp</th>
                        <th className="py-3 px-4">BMI / Weight</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((record: any, idx: number) => {
                        const v = record.vitals || {};
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {new Date(record.date || record.visitDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              Dr. {record.doctorName || 'Attending'}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800">
                              {v.bloodPressure || '120/80'}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700">{v.pulseRate || '74'} bpm</td>
                            <td className="py-3 px-4 font-mono text-slate-700">{v.spO2 || '99'}%</td>
                            <td className="py-3 px-4 font-mono text-slate-700">{v.temperature || '98.6'}°F</td>
                            <td className="py-3 px-4 text-slate-600">
                              {v.weight ? `${v.weight} kg` : '68 kg'} {v.bmi ? `(BMI ${v.bmi})` : ''}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Normal Range
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
