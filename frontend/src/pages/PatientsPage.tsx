import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Mail, Phone, RefreshCw, Search, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { appointmentAPI, patientAPI, type Appointment, type AuthUser, type PatientProfile } from '../services/api';

const userDetails = (patient: PatientProfile) => {
  const user = typeof patient.userId === 'string' ? undefined : patient.userId as AuthUser;
  return {
    name: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unnamed patient',
    email: user?.email || 'No email',
    phone: user?.phone || 'No phone',
  };
};

const appointmentStatusClass = (status: Appointment['status']) => {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'cancelled' || status === 'no-show') return 'bg-red-100 text-red-700';
  return 'bg-blue-100 text-blue-700';
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
    <div className="flex h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Live patient registry</p>
              <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
              <p className="mt-1 text-sm text-slate-500">New appointments appear automatically within 10 seconds.</p>
            </div>
            <button type="button" onClick={() => refresh().catch((error) => console.error('Unable to refresh patients', error))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="flex items-center gap-2 text-sm text-slate-500"><Users size={16} className="text-cyan-600" /> Registered patients</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{patients.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays size={16} className="text-blue-600" /> Total appointments</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{appointments.length}</p>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient name, email, or ID" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-cyan-500" />
            </div>
            <span className="hidden text-xs text-slate-500 sm:block">Updated {lastUpdated.toLocaleTimeString()}</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="p-4">Patient</th><th className="p-4">Contact</th><th className="p-4">Profile</th><th className="p-4">Latest appointment</th><th className="p-4">Appointments</th></tr>
              </thead>
              <tbody>
                {!loading && filteredPatients.map((patient) => {
                  const details = userDetails(patient);
                  const patientAppointments = appointmentsByPatient.get(patient._id) || [];
                  const latest = patientAppointments[0];
                  const doctorName = latest?.doctorId && typeof latest.doctorId !== 'string'
                    ? latest.doctorId.userId?.name || `${latest.doctorId.userId?.firstName || ''} ${latest.doctorId.userId?.lastName || ''}`.trim()
                    : '';
                  return (
                    <tr key={patient._id} className="border-t border-slate-100 align-top">
                      <td className="p-4"><p className="font-semibold text-slate-900">{details.name}</p><p className="text-xs text-slate-500">{patient.patientId || patient._id}</p></td>
                      <td className="p-4 text-slate-600"><p className="flex items-center gap-1"><Mail size={14} /> {details.email}</p><p className="mt-1 flex items-center gap-1"><Phone size={14} /> {details.phone}</p></td>
                      <td className="p-4 text-slate-600">{patient.gender || '—'}{patient.bloodGroup ? ` · ${patient.bloodGroup}` : ''}</td>
                      <td className="p-4">{latest ? <><p className="font-semibold text-slate-800">{doctorName || 'Doctor assigned'}</p><p className="text-xs text-slate-500">{latest.appointmentDate?.slice(0, 10)} · {latest.startTime}</p><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${appointmentStatusClass(latest.status)}`}>{latest.status}</span></> : <span className="text-slate-400">No appointment yet</span>}</td>
                      <td className="p-4 font-semibold text-slate-700">{patientAppointments.length}</td>
                    </tr>
                  );
                })}
                {!loading && filteredPatients.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-500">No patients found.</td></tr>}
                {loading && <tr><td colSpan={5} className="p-10 text-center text-slate-500">Loading patients...</td></tr>}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
