import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Mail, Phone, RefreshCw, Search, Users, User, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { appointmentAPI, patientAPI, type Appointment, type AuthUser, type PatientProfile } from '../services/api';
import { toDateString } from '../utils/dateUtils';

const userDetails = (patient: PatientProfile) => {
  const user = typeof patient.userId === 'string' ? undefined : patient.userId as AuthUser;
  return {
    name: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Assigned Patient',
    email: user?.email || 'No email on file',
    phone: user?.phone || 'No phone recorded',
  };
};

const appointmentStatusClass = (status: Appointment['status']) => {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'cancelled' || status === 'no-show') return 'bg-rose-50 text-rose-700 border border-rose-200';
  return 'bg-blue-50 text-blue-700 border border-blue-200';
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refresh = useCallback(async () => {
    const [patientResult, appointmentResult] = await Promise.all([
      patientAPI.getAll(),
      appointmentAPI.getAll(),
    ]);
    setPatients(patientResult.data.patients || patientResult.data.data || []);
    setAppointments(appointmentResult.data.data || []);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh().catch((error) => {
      console.error('Unable to load patients and appointments', error);
      setLoading(false);
    });
    const timer = window.setInterval(() => {
      refresh().catch((error) => console.error('Unable to refresh patients and appointments', error));
    }, 10000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const appointmentsByPatient = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((appointment) => {
      const patientId = typeof appointment.patientId === 'string'
        ? appointment.patientId
        : appointment.patientId?._id;
      if (!patientId) return;
      map.set(patientId, [...(map.get(patientId) || []), appointment]);
    });
    map.forEach((items, patientId) => {
      items.sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')));
      map.set(patientId, items);
    });
    return map;
  }, [appointments]);

  const filteredPatients = patients.filter((patient) => {
    const details = userDetails(patient);
    const value = `${details.name} ${details.email} ${patient.patientId || ''}`.toLowerCase();
    return value.includes(search.toLowerCase());
  });

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Medical Hero Banner */}
            <section className="relative z-10 rounded-3xl border border-teal-800/30 bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10 overflow-hidden">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-teal-100 text-xs font-semibold backdrop-blur-md border border-white/20">
                    <ShieldCheck size={14} className="text-teal-300" />
                    Centralized Electronic Medical Registry
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Patients Directory</h1>
                  <p className="mt-1 text-sm text-teal-100/90 max-w-xl">
                    Live patient clinical admissions, demographics, contact data, and active appointment schedules.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => refresh().catch(console.error)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2 text-xs font-bold text-white shadow-sm transition backdrop-blur-md"
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>
            </section>

            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-clinical flex items-center justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Users size={16} className="text-teal-600" /> Registered Patients
                  </p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900">{patients.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center">
                  <User size={24} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-clinical flex items-center justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <CalendarDays size={16} className="text-blue-600" /> Total Appointments
                  </p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900">{appointments.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center">
                  <CalendarDays size={24} />
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-clinical">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by patient name, email, or MRN..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-800 transition focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Auto-syncs every 10s • Last: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>

            {/* Patients Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-clinical">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                    <tr>
                      <th className="p-4">Patient Profile</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">Demographics</th>
                      <th className="p-4">Latest Appointment</th>
                      <th className="p-4 text-right">Total Visits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!loading &&
                      filteredPatients.map((patient) => {
                        const details = userDetails(patient);
                        const patientAppointments = appointmentsByPatient.get(patient._id) || [];
                        const latest = patientAppointments[0];
                        const doctorName =
                          latest?.doctorId && typeof latest.doctorId !== 'string'
                            ? latest.doctorId.userId?.name ||
                              `${latest.doctorId.userId?.firstName || ''} ${
                                latest.doctorId.userId?.lastName || ''
                              }`.trim()
                            : '';
                        return (
                          <tr key={patient._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0">
                                  {details.name[0] || 'P'}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{details.name}</p>
                                  <p className="text-xs text-slate-400 font-mono font-semibold">
                                    {patient.patientId || patient._id?.slice(-8).toUpperCase()}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="p-4 text-xs text-slate-600">
                              <p className="flex items-center gap-1.5 font-medium">
                                <Mail size={13} className="text-slate-400" /> {details.email}
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 font-medium text-slate-700">
                                <Phone size={13} className="text-teal-600" /> {details.phone}
                              </p>
                            </td>

                            <td className="p-4 text-xs text-slate-600">
                              <span className="font-semibold text-slate-800">{patient.gender || '—'}</span>
                              {patient.bloodGroup ? (
                                <span className="ml-1.5 px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700 text-[11px]">
                                  {patient.bloodGroup}
                                </span>
                              ) : null}
                            </td>

                            <td className="p-4 text-xs">
                              {latest ? (
                                <div>
                                  <p className="font-bold text-slate-800">
                                    {doctorName ? `Dr. ${doctorName}` : 'Attending Clinician'}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {toDateString(latest.appointmentDate)} • {latest.startTime}
                                  </p>
                                  <span
                                    className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${appointmentStatusClass(
                                      latest.status
                                    )}`}
                                  >
                                    {latest.status}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No visits booked</span>
                              )}
                            </td>

                            <td className="p-4 text-right">
                              <span className="font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                                {patientAppointments.length}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                    {!loading && filteredPatients.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 text-xs">
                          No patients matched your search filter.
                        </td>
                      </tr>
                    )}

                    {loading && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 text-xs">
                          <RefreshCw className="w-5 h-5 animate-spin text-teal-600 mx-auto mb-2" />
                          Loading patient records...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
