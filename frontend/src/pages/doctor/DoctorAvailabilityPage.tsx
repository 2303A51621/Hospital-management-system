import { useEffect, useState } from 'react';
import {
  Calendar,
  ShieldCheck,
  Plus,
  RefreshCw,
  Flame,
  CalendarDays,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { doctorPortalAPI, doctorAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorAvailabilityPage() {
  const [profile, setProfile] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [colleagueDoctors, setColleagueDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Availability schedule state
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState('30');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Apply Leave Modal
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('Casual');
  const [leaveReason, setLeaveReason] = useState('');
  const [emergencyCoverDoctorId, setEmergencyCoverDoctorId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [profRes, leaveRes, docRes] = await Promise.all([
        doctorPortalAPI.getProfile(),
        doctorPortalAPI.getLeaveRequests(),
        doctorAPI.getAll(1, '', 100),
      ]);
      const prof = profRes.data?.data;
      setProfile(prof);
      setLeaveRequests(leaveRes.data?.data || []);
      setColleagueDoctors(docRes.data?.data || []);

      if (prof) {
        setAvailableDays(prof.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
        setEmergencyAvailable(!!prof.emergencyAvailable);
        if (prof.availability) {
          setStartHour(prof.availability.startTime || '09:00');
          setEndHour(prof.availability.endTime || '17:00');
        }
      }
    } catch (err: any) {
      toast.error('Failed to load doctor schedule data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter((d) => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      setSavingSchedule(true);
      await doctorPortalAPI.updateAvailability({
        availableDays,
        emergencyAvailable,
        availability: {
          days: availableDays,
          startTime: startHour,
          endTime: endHour,
        },
      });
      toast.success('Consultation schedule updated successfully!');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !leaveReason.trim()) {
      toast.error('Please specify leave dates and clinical reason');
      return;
    }
    try {
      const res = await doctorPortalAPI.applyLeave({
        startDate,
        endDate,
        leaveType,
        reason: leaveReason,
        emergencyCoverDoctorId: emergencyCoverDoctorId || undefined,
      });
      toast.success(res.data.message || 'Leave application submitted');
      setLeaveModalOpen(false);
      setStartDate('');
      setEndDate('');
      setLeaveReason('');
      setEmergencyCoverDoctorId('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    }
  };

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
                  <CalendarDays className="w-3.5 h-3.5" />
                  Roster & Shift Management
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Doctor Availability & Leave Management {profile?.name ? `— Dr. ${profile.name}` : ''}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Configure weekly OPD timings, manage consultation slots, on-call emergency status, and track leave approvals.
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
                  onClick={() => setLeaveModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm transition shadow-teal-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Apply for Leave
                </button>
              </div>
            </div>

            {/* Safety & Auto-Guard Banner */}
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/70 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <div className="text-xs text-teal-900">
                <strong className="font-bold">Automated Booking Conflict Prevention:</strong> The Kushal Hospitals
                scheduling engine automatically prevents new patient bookings during your approved leave dates and
                flags existing appointments for rescheduling.
              </div>
            </div>

            {/* Schedule Configuration Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Weekly OPD Consultation Schedule</h2>
                  <p className="text-xs text-slate-500">Select active days and working hours for patient bookings</p>
                </div>
                <button
                  onClick={handleSaveAvailability}
                  disabled={savingSchedule}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {savingSchedule ? 'Saving...' : 'Save Schedule Changes'}
                </button>
              </div>

              {/* Day Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Active Consultation Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Working Hours & Slot Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Shift Start Time
                  </label>
                  <input
                    type="time"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shift End Time</label>
                  <input
                    type="time"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Consultation Slot Duration
                  </label>
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="15">15 Minutes / Patient</option>
                    <option value="20">20 Minutes / Patient</option>
                    <option value="30">30 Minutes / Patient</option>
                    <option value="45">45 Minutes / Patient</option>
                    <option value="60">60 Minutes / Comprehensive</option>
                  </select>
                </div>
              </div>

              {/* Emergency Availability Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Emergency On-Call Duty</div>
                    <div className="text-[11px] text-slate-500">
                      Enable to receive emergency clinical notifications and casualty transfers outside normal hours
                    </div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emergencyAvailable}
                    onChange={(e) => setEmergencyAvailable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>

            {/* Leave Applications History */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Leave Applications & Approvals ({leaveRequests.length})
                </h2>
                <span className="text-xs text-slate-400">Subject to Medical Superintendent approval</span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading leave records...</div>
              ) : leaveRequests.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No leave requests recorded. Click "Apply for Leave" above to request time off.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {leaveRequests.map((leave) => {
                    const startStr = new Date(leave.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const endStr = new Date(leave.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div key={leave._id} className="py-3.5 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {startStr} — {endStr}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                              {leave.leaveType || 'General'}
                            </span>
                          </div>
                          <div className="text-slate-600">Reason: {leave.reason}</div>
                          {leave.emergencyCoverDoctorId && (
                            <div className="text-[11px] text-teal-700 font-medium">
                              Emergency Cover: Dr. {leave.emergencyCoverDoctorId.name || 'Assigned Colleague'}
                            </div>
                          )}
                        </div>

                        <div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              leave.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : leave.status === 'rejected'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {leave.status || 'Pending'}
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

      {/* APPLY LEAVE MODAL */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-teal-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Apply for Clinical Leave</h3>
                  <p className="text-xs text-slate-500">Submit planned absence to prevent patient booking conflicts</p>
                </div>
              </div>
              <button
                onClick={() => setLeaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="Casual">Casual Leave</option>
                    <option value="Sick">Medical / Sick Leave</option>
                    <option value="Conference">Medical Conference / CME</option>
                    <option value="Annual">Annual Paid Leave</option>
                    <option value="Emergency">Family Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cover Doctor (Optional)
                  </label>
                  <select
                    value={emergencyCoverDoctorId}
                    onChange={(e) => setEmergencyCoverDoctorId(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="">-- None Assigned --</option>
                    {colleagueDoctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        Dr. {d.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reason for Absence *
                </label>
                <textarea
                  rows={3}
                  required
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Attending Annual Cardiology Congress in New Delhi..."
                  className="w-full text-sm rounded-lg border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-md shadow-teal-600/20"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
