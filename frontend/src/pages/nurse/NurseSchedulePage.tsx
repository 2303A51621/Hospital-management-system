import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock,
  User,
  Activity,
  Pill,
  ClipboardList,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Search,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { nursePortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NurseSchedulePage() {
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'vitals' | 'medication' | 'tasks' | 'rounds'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('today');

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await nursePortalAPI.getCareSchedule();
      setScheduleItems(res.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load nursing care schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const filteredItems = scheduleItems.filter((item) => {
    if (activeTab !== 'all' && item.type !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const patientMatch = (item.patientName || item.patient?.name || '').toLowerCase().includes(q);
      const titleMatch = (item.title || item.name || item.medicineName || '').toLowerCase().includes(q);
      const roomMatch = (item.room || item.ward || '').toLowerCase().includes(q);
      if (!patientMatch && !titleMatch && !roomMatch) return false;
    }
    return true;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'vitals':
        return { label: 'Vitals Round', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: Activity };
      case 'medication':
        return { label: 'Medication Due', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Pill };
      case 'tasks':
        return { label: 'Nursing Task', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: ClipboardList };
      case 'rounds':
        return { label: 'Doctor Round', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
      default:
        return { label: 'Care Event', bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: CalendarDays };
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
                  <CalendarDays size={14} />
                  <span>Inpatient Care Workflow</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Patient Care Schedule</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time timeline of scheduled vital sign rounds, medication administrations, dressing and hygiene.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchSchedule}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin text-teal-600' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Quick Day Selector & Search */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Day:</span>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                    {[
                      { id: 'today', label: 'Today (Live)' },
                      { id: 'tomorrow', label: 'Tomorrow' },
                      { id: 'upcoming', label: 'All 7 Days' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedDay(tab.id)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          selectedDay === tab.id
                            ? 'bg-white text-teal-900 shadow-xs border border-slate-200/60'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter categories */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'All Activities' },
                    { id: 'medication', label: 'Medications' },
                    { id: 'vitals', label: 'Vitals Rounds' },
                    { id: 'tasks', label: 'Nursing Tasks' },
                    { id: 'rounds', label: 'Doctor Visits' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveTab(cat.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        activeTab === cat.id
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by patient name, room, task or medication..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
            </div>

            {/* Shift Care Schedule Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { time: '06:00 - 08:00', label: 'Morning Vitals & Fasting Sugar', badge: 'Early Morning' },
                { time: '08:00 - 10:00', label: 'Morning eMAR & Dressing', badge: 'Core Morning' },
                { time: '12:00 - 14:00', label: 'Noon Meds & Doctor Rounds', badge: 'Mid-Day' },
                { time: '18:00 - 20:00', label: 'Evening eMAR & Shift Prep', badge: 'Evening' },
              ].map((slot, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
                  <div className="flex items-center justify-between text-[11px] text-teal-700 font-bold">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {slot.time}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-[10px]">
                      {slot.badge}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-slate-800">{slot.label}</p>
                </div>
              ))}
            </div>

            {/* Timeline Stream */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Care Activity Timeline</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-600 font-semibold">
                  {filteredItems.length} activities
                </span>
              </h2>

              {loading ? (
                <div className="flex h-48 items-center justify-center rounded-2xl bg-white border border-slate-200/80">
                  <RefreshCw size={24} className="animate-spin text-teal-600" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                    <Calendar size={22} />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-800">No scheduled activities found</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    All current medication rounds and tasks are completed, or no items match your active filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredItems.map((item, idx) => {
                    const badge = getTypeBadge(item.type);
                    const IconComp = badge.icon;
                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-teal-200 hover:shadow-sm transition"
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${badge.bg}`}
                          >
                            <IconComp size={18} />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                              >
                                {badge.label}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {item.title || item.medicineName || item.description || 'Routine Check'}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <User size={13} className="text-teal-600" />
                                {item.patientName || item.patient?.name || 'Assigned Inpatient'}
                              </span>
                              {(item.ward || item.room) && (
                                <span className="text-slate-400">
                                  • {item.ward || 'Ward'} / Room {item.room || item.roomNumber || '–'}
                                </span>
                              )}
                              {item.scheduledTime && (
                                <span className="flex items-center gap-1 text-slate-600 font-semibold">
                                  <Clock size={12} className="text-slate-400" />
                                  {new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              {item.dosage && (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px]">
                                  Dose: {item.dosage}
                                </span>
                              )}
                            </div>

                            {item.instructions && (
                              <p className="mt-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 inline-block">
                                <span className="font-semibold text-slate-700">Instructions:</span> {item.instructions}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                            <CheckCircle2 size={13} />
                            <span>On Track</span>
                          </span>
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
