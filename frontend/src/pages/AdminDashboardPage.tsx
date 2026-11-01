import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BarChart3, CalendarDays, ChevronDown, CircleDollarSign, FileText, MoreVertical, ShieldCheck, Stethoscope, Users, type LucideIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { appointmentAPI, doctorAPI, patientAPI, type Appointment, type Doctor } from '../services/api';

const money = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const doctorName = (doctor?: Doctor) => doctor?.userId?.name || `${doctor?.userId?.firstName || ''} ${doctor?.userId?.lastName || ''}`.trim() || 'Specialist';

export default function AdminDashboardPage() {
  const [patients, setPatients] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([patientAPI.getAll(1), appointmentAPI.getAll(), doctorAPI.getAll(1, '', 6)])
      .then(([patientResult, appointmentResult, doctorResult]) => {
        setPatients(patientResult.data.count || 0);
        setAppointments(appointmentResult.data.data || []);
        setDoctors(doctorResult.data.data || []);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const pending = appointments.filter((item) => ['pending', 'scheduled', 'confirmed'].includes(item.status));
  const revenue = appointments.reduce((sum, item) => sum + Number(item.billing?.summary?.totalAmount || item.consultationFee || 0), 0);
  const todayAppointments = appointments.filter((item) => (item.appointmentDate || item.date || '').slice(0, 10) === new Date().toISOString().slice(0, 10));
  const maxDaily = Math.max(...[18, 31, 24, 42, 34, 52, 45, 37, 48, 41], 1);
  const dateLabel = useMemo(() => new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(new Date()), []);
  const metricCards: Array<{ label: string; value: string | number; note: string; Icon: LucideIcon; color: string }> = [
    { label: 'Total Patients', value: patients, note: 'vs last week', Icon: Users, color: 'text-blue-600' },
    { label: 'Appointments Today', value: todayAppointments.length, note: 'live schedule', Icon: CalendarDays, color: 'text-indigo-600' },
    { label: 'Pending Reports', value: pending.length, note: 'awaiting action', Icon: FileText, color: 'text-amber-600' },
    { label: 'Total Revenue', value: money(revenue), note: 'from appointments', Icon: CircleDollarSign, color: 'text-emerald-600' },
  ];

  return (
    <div className="flex h-screen bg-[#f2f6f9] text-slate-800">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-4 md:p-7">
          <div className="mx-auto max-w-[1500px]">
            <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Admin Panel / Dashboard</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Welcome back, Admin!</h1>
              </div>
              <div className="flex gap-2">
                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm">Export to CSV</button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">This week <ChevronDown size={15} /></button>
              </div>
            </header>

            {loading ? <div className="rounded-2xl bg-white p-6 shadow-sm">Loading admin analytics...</div> : (
              <>
                <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {metricCards.map(({ label, value, note, Icon, color }) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Icon size={16} className={color} /> {label}</p>
                        <MoreVertical size={17} className="text-slate-400" />
                      </div>
                      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
                      <p className="mt-1 text-xs text-slate-400">{note}</p>
                    </div>
                  ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <div><h2 className="text-lg font-bold">Patient Arrival Statistics</h2><p className="text-sm text-slate-400">Revenue and arrivals overview</p></div>
                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500">This month <ChevronDown size={13} className="ml-1 inline" /></button>
                      </div>
                      <div className="mb-4 flex items-end gap-3"><span className="text-3xl font-bold">{money(revenue)}</span><span className="mb-1 text-xs text-emerald-600">+12.4% this week</span></div>
                      <div className="flex h-48 items-end gap-2 border-b border-slate-100 px-2">
                        {[18, 31, 24, 42, 34, 52, 45, 37, 48, 41].map((height, index) => (
                          <div key={index} className="group flex flex-1 flex-col justify-end">
                            <div className="rounded-t-lg bg-gradient-to-t from-blue-500/80 to-cyan-300/50 transition group-hover:from-blue-600" style={{ height: `${(height / maxDaily) * 100}%` }} />
                            <span className="mt-2 text-center text-[10px] text-slate-400">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'][index]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Appointments</h2><button className="text-sm font-semibold text-blue-600">View all</button></div>
                      <div className="space-y-3">
                        {appointments.slice(0, 5).map((appointment) => (
                          <div key={appointment._id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                            <div><p className="font-semibold text-slate-800">{appointment.reason || 'General consultation'}</p><p className="text-xs text-slate-400">{appointment.appointmentDate?.slice(0, 10) || dateLabel} · {appointment.startTime}</p></div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${appointment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{appointment.status}</span>
                            <ArrowUpRight size={16} className="text-slate-400" />
                          </div>
                        ))}
                        {appointments.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No appointments found.</p>}
                      </div>
                    </div>
                  </div>

                  <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Our Specialists</h2><button className="rounded-full bg-slate-900 p-2 text-white"><ArrowUpRight size={15} /></button></div>
                    {doctors.map((doctor) => (
                      <div key={doctor._id} className="mb-3 flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-100 text-cyan-700"><Stethoscope size={20} /></div>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{doctorName(doctor)}</p><p className="truncate text-xs text-slate-400">{doctor.specialization}</p></div>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">Available</span>
                      </div>
                    ))}
                    {doctors.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No specialists found.</p>}
                    <button className="mt-3 w-full rounded-xl border border-blue-100 bg-blue-50 py-2.5 text-sm font-semibold text-blue-700">Manage specialists</button>
                  </aside>
                </section>

                <section className="mt-6 grid gap-4 sm:grid-cols-3">
                  <button className="rounded-2xl bg-white p-5 text-left shadow-sm hover:ring-2 hover:ring-blue-100" onClick={() => window.location.href = '/patients'}><Users className="mb-3 text-blue-600" /><b>Patient Management</b><p className="mt-1 text-sm text-slate-400">Review and manage patient records</p></button>
                  <button className="rounded-2xl bg-white p-5 text-left shadow-sm hover:ring-2 hover:ring-blue-100" onClick={() => window.location.href = '/billing'}><BarChart3 className="mb-3 text-emerald-600" /><b>Analytics & Reports</b><p className="mt-1 text-sm text-slate-400">Open billing and financial records</p></button>
                  <button className="rounded-2xl bg-white p-5 text-left shadow-sm hover:ring-2 hover:ring-blue-100" onClick={() => window.location.href = '/admin-management'}><ShieldCheck className="mb-3 text-violet-600" /><b>Admin Panel</b><p className="mt-1 text-sm text-slate-400">Create and manage administrator access</p></button>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
