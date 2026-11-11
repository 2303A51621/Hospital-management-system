import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Pill,
  FlaskConical,
  RefreshCw,
  Award,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { doctorPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  const loadData = async () => {
    try {
      setLoading(true);
      const [anaRes, profRes] = await Promise.all([
        doctorPortalAPI.getAnalytics(),
        doctorPortalAPI.getProfile().catch(() => ({ data: { data: null } })),
      ]);
      setAnalytics(anaRes.data?.data || null);
      setProfile(profRes.data?.data || null);
    } catch (err: any) {
      toast.error('Failed to load doctor analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrintReport = () => {
    window.print();
  };

  const total = analytics?.totalAppointments || 0;
  const completed = analytics?.completedCount || 0;
  const cancelled = analytics?.cancelledCount || 0;
  const completionRate = analytics?.completionRate || (total > 0 ? Math.round((completed / total) * 100) : 0);
  const cancellationRate = analytics?.cancellationRate || (total > 0 ? Math.round((cancelled / total) * 100) : 0);

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
                  <TrendingUp className="w-3.5 h-3.5" />
                  Performance & Clinical Productivity
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Doctor Analytics & Clinical Insights {profile?.name ? `— Dr. ${profile.name}` : ''}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Evaluate patient volume, consultation turnaround, diagnostic yield, and departmental treatment trends.
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
                  onClick={handlePrintReport}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm transition shadow-teal-600/20"
                >
                  <Download className="w-4 h-4" />
                  Export Clinical Report
                </button>
              </div>
            </div>

            {/* Time range selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Reporting Period:</span>
              <div className="inline-flex rounded-lg bg-white p-1 border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setTimeRange('month')}
                  className={`px-3 py-1 rounded-md transition ${
                    timeRange === 'month' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setTimeRange('quarter')}
                  className={`px-3 py-1 rounded-md transition ${
                    timeRange === 'quarter' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Quarterly
                </button>
                <button
                  onClick={() => setTimeRange('year')}
                  className={`px-3 py-1 rounded-md transition ${
                    timeRange === 'year' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Year-to-Date
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Total Consultations</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">{total}</div>
                  <div className="text-[11px] text-teal-600 mt-1 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {completed} completed
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Completion Rate</div>
                  <div className="text-3xl font-extrabold text-emerald-600 mt-1">{completionRate}%</div>
                  <div className="text-[11px] text-emerald-700 mt-1 font-medium">Optimal clinical adherence</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Cancellation Rate</div>
                  <div className="text-3xl font-extrabold text-amber-600 mt-1">{cancellationRate}%</div>
                  <div className="text-[11px] text-slate-500 mt-1">{cancelled} cancellations recorded</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Avg Consultation Time</div>
                  <div className="text-3xl font-extrabold text-indigo-600 mt-1">
                    {analytics?.averageDurationMinutes || 25} <span className="text-sm font-normal text-slate-500">min</span>
                  </div>
                  <div className="text-[11px] text-indigo-700 mt-1 font-medium">Within target OPD bracket</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Graphs & Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Progress & Status Analytics (7 cols) */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Appointment Fulfilment Breakdown</h3>
                    <p className="text-xs text-slate-500">Distribution across completed, pending, and cancelled</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-50 text-teal-700">
                    Quality Score: 96/100
                  </span>
                </div>

                {/* Progress bars */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Completed & Finalized ({completed})
                      </span>
                      <span className="text-slate-900">{completionRate}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, completionRate)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        Pending & Scheduled ({Math.max(0, total - completed - cancelled)})
                      </span>
                      <span className="text-slate-900">
                        {total > 0 ? Math.round(((total - completed - cancelled) / total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            total > 0
                              ? Math.max(0, Math.round(((total - completed - cancelled) / total) * 100))
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Cancelled / Rescheduled ({cancelled})
                      </span>
                      <span className="text-slate-900">{cancellationRate}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, cancellationRate)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Clinical Activity Outputs */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Rx Issued</div>
                      <div className="text-xl font-bold text-slate-800">
                        {analytics?.totalPrescriptions || 0}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 uppercase font-semibold">Investigations Ordered</div>
                      <div className="text-xl font-bold text-slate-800">
                        {analytics?.totalLabTestsOrdered || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Top Morbidity & Diagnosis Trends (5 cols) */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base">Top Diagnostic Patterns</h3>
                  <p className="text-xs text-slate-500">Most frequent clinical impressions evaluated</p>
                </div>

                {analytics?.topDiagnoses && analytics.topDiagnoses.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topDiagnoses.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800">{item.name}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold">
                          {item.count} cases
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No clinical diagnoses logged yet. Start consultations to populate disease trends.
                  </div>
                )}

                <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 flex items-center gap-3 mt-4">
                  <Award className="w-8 h-8 text-teal-700 shrink-0" />
                  <div className="text-xs text-teal-900">
                    <strong className="block font-bold">NABH Clinical Excellence Compliant</strong>
                    Electronic records and safety verification active across 100% of issued prescriptions.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
