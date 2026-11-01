import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Plus, Search, User, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { authAPI, type StaffMember } from '../services/api';

const categories = [
  { key: 'doctors', label: 'Doctors', color: 'bg-orange-400', light: 'bg-orange-50 text-orange-700' },
  { key: 'nurses', label: 'Nurses', color: 'bg-blue-500', light: 'bg-blue-50 text-blue-700' },
  { key: 'technicians', label: 'Technicians', color: 'bg-pink-400', light: 'bg-pink-50 text-pink-700' },
  { key: 'erCare', label: 'ER Care', color: 'bg-green-400', light: 'bg-green-50 text-green-700' },
];

const staffName = (staff: StaffMember) => staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Staff member';
const roleLabel = (role: string) => role === 'lab_technician' ? 'Technician' : role === 'receptionist' ? 'ER Care' : role[0].toUpperCase() + role.slice(1);

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'nurse' });
  const [weekStart, setWeekStart] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return date;
  });

  const refresh = useCallback(async () => {
    const response = await authAPI.getStaff();
    setStaff(response.data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh().catch((error) => { console.error('Unable to load staff', error); setLoading(false); });
    const timer = window.setInterval(() => refresh().catch((error) => console.error('Unable to refresh staff', error)), 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const visibleStaff = staff.filter((member) => `${staffName(member)} ${member.email} ${member.role}`.toLowerCase().includes(search.toLowerCase()));
  const grouped = useMemo(() => categories.map((category) => ({ ...category, members: visibleStaff.filter((member) => category.key === 'doctors' ? member.role === 'doctor' : category.key === 'nurses' ? member.role === 'nurse' : category.key === 'technicians' ? member.role === 'lab_technician' : ['receptionist', 'pharmacist'].includes(member.role)) })), [visibleStaff]);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return date;
  });
  const dateRange = `${weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}`;
  const shiftMembers = (categoryKey: string, day: Date) => grouped.find((category) => category.key === categoryKey)?.members.filter((member) => {
    if (member.role !== 'doctor' || !member.doctorProfile?.availability?.length) return true;
    const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });
    return member.doctorProfile.availability.some((shift) => shift.day === dayName);
  }) || [];
  const addStaff = async (event: FormEvent) => {
    event.preventDefault();
    await authAPI.createStaff(form);
    setForm({ name: '', email: '', password: '', role: 'nurse' });
    setFormOpen(false);
    await refresh();
  };

  return <div className="flex h-screen bg-[#f5f6f8] text-slate-800"><Sidebar /><div className="flex min-w-0 flex-1 flex-col overflow-hidden"><Navbar /><main className="flex-1 overflow-auto p-5 md:p-8">
    <div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900">Staff Management</h1><p className="mt-1 text-sm text-slate-500">Live staffing, availability, and shift coverage</p></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-cyan-700"><User size={18} /></div></div>
    <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{grouped.map((category) => { const onDuty = category.members.filter((member) => member.status === 'active').length; const percent = category.members.length ? Math.round((onDuty / category.members.length) * 100) : 0; return <div key={category.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between"><span className="text-sm text-slate-500">{category.label}</span><span className="text-xs font-semibold text-emerald-600">{category.members.length ? `↑ ${percent}%` : '—'}</span></div><div className="mt-7 flex items-end justify-between"><span className="text-2xl font-bold">{onDuty}<span className="text-sm font-normal text-slate-400">/{category.members.length}</span></span><span className="text-2xl font-bold">{percent}%</span></div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${category.color}`} style={{ width: `${percent}%` }} /></div><div className="mt-4 flex justify-between text-xs text-slate-500"><span>{onDuty} active now</span><span>{category.members.length - onDuty} off duty</span></div></div>; })}</section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><button onClick={() => setWeekStart(new Date(weekStart.getTime() - 604800000))} className="rounded-lg border border-slate-200 p-2"><ChevronLeft size={16} /></button><button className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Today</button><button onClick={() => setWeekStart(new Date(weekStart.getTime() + 604800000))} className="rounded-lg border border-slate-200 p-2"><ChevronRight size={16} /></button><span className="text-sm font-semibold">{dateRange}</span></div><button onClick={() => setFormOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} /> Add Staff</button></div>{formOpen && <form onSubmit={addStaff} className="mb-4 grid gap-2 rounded-xl bg-slate-50 p-4 md:grid-cols-5"><input required placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-lg border p-2 text-sm" /><input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="rounded-lg border p-2 text-sm" /><input required minLength={8} type="password" placeholder="Temporary password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="rounded-lg border p-2 text-sm" /><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="rounded-lg border p-2 text-sm"><option value="doctor">Doctor</option><option value="nurse">Nurse</option><option value="lab_technician">Technician</option><option value="receptionist">ER Care</option><option value="pharmacist">Pharmacist</option></select><button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Create Staff</button></form>}<div className="mb-4 flex flex-wrap items-center gap-2"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" /></div><button className="rounded-lg border border-slate-200 p-2"><Filter size={16} /></button><span className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold">Week</span></div><div className="overflow-x-auto"><div className="min-w-[900px]"><div className="grid grid-cols-[90px_repeat(7,minmax(110px,1fr))] border-b border-slate-200 text-xs text-slate-500"><div className="p-3">Time</div>{weekDays.map((day) => <div key={day.toISOString()} className="border-l border-slate-100 p-3 text-center font-semibold">{day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</div>)}</div>{['06:00 AM – 06:00 PM', '06:00 PM – 06:00 AM'].map((shift) => <div key={shift} className="grid grid-cols-[90px_repeat(7,minmax(110px,1fr))] border-b border-slate-100"><div className="p-3 text-xs text-slate-500">{shift}</div>{weekDays.map((day) => <div key={`${shift}-${day.toISOString()}`} className="space-y-1 border-l border-slate-100 p-2">{categories.map((category) => { const members = shiftMembers(category.key, day); return <div key={category.key} className={`flex items-center justify-between rounded-md px-2 py-2 text-xs font-semibold ${category.light}`}><span><b>{members.length}</b> {category.label === 'Technicians' ? 'Tech' : category.label}</span><ChevronDown size={13} /></div>; })}</div>)}</div>)}</div></div></section>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Staff directory</h2><span className="text-xs text-slate-500">{loading ? 'Updating...' : `${visibleStaff.length} staff · refreshes every 15 seconds`}</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{visibleStaff.map((member) => <div key={member._id} className="rounded-xl border border-slate-100 p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"><Users size={18} /></div><div className="min-w-0"><p className="truncate font-semibold">{staffName(member)}</p><p className="text-xs text-slate-500">{roleLabel(member.role)}</p></div></div><p className="mt-3 truncate text-xs text-slate-500">{member.email}</p><span className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${member.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{member.status}</span></div>)}</div></section>
  </main></div></div>;
}
