import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarPlus,
  Stethoscope,
  CheckCircle2,
  RefreshCw,
  Clock,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientFollowUpsPage() {
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getFollowUps();
      setFollowUps(res.data?.data || []);
    } catch (err: any) {
      toast.error('Failed to load doctor follow-up recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

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
                    <Clock size={14} className="text-teal-300" />
                    Clinical Continuity of Care
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Doctor Follow-Up Tracker</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Scheduled checkups recommended by your physicians to ensure complete recovery and health management.
                  </p>
                </div>
                <button
                  onClick={loadFollowUps}
                  className="self-start md:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 backdrop-blur-md transition-all"
                >
                  <RefreshCw size={14} /> Refresh Tracker
                </button>
              </div>
            </div>

            {/* Follow-ups List */}
            <div className="clinical-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Recommended Follow-up Schedule</h3>
                <span className="text-xs font-semibold text-slate-500">{followUps.length} Registered Consultations</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading follow-up instructions...</div>
              ) : followUps.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                  <p className="font-semibold text-slate-700">No overdue follow-up consultations!</p>
                  <p className="text-slate-400">All your post-visit recommendations are up to date.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {followUps.map((item, idx) => {
                    const fDate = item.followUpDate ? new Date(item.followUpDate).toISOString().split('T')[0] : '';
                    const isOverdue = fDate && fDate < todayStr;

                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isOverdue ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                              isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-teal-50 text-teal-700'
                            }`}
                          >
                            <Stethoscope size={22} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">Dr. {item.doctorName}</h4>
                              {isOverdue ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                  Action Overdue
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Scheduled
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 mt-0.5">
                              Recommended Date: <strong className="text-slate-800">{new Date(item.followUpDate).toLocaleDateString()}</strong>
                            </p>

                            <p className="text-xs text-slate-600 mt-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                              <span className="font-bold text-slate-800">Doctor Advice:</span> {item.notes || 'Routine follow-up review for recovery tracking.'}
                            </p>
                          </div>
                        </div>

                        <div className="self-end md:self-center">
                          <Link
                            to={`/patient/book-appointment?doctorId=${item.doctorId}&followUp=true`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20"
                          >
                            <CalendarPlus size={14} /> Schedule Follow-up Visit
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
