import { useCallback, useEffect, useMemo, useState } from 'react';
import { BedDouble, CircleEllipsis, Filter, RefreshCw, Search, Wrench } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { wardAPI, type BedRecord, type WardRecord } from '../services/api';

type WardView = { ward: WardRecord; beds: BedRecord[] };
const statusStyles: Record<BedRecord['status'], string> = {
  available: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  occupied: 'border-blue-300 bg-blue-50 text-blue-800',
  reserved: 'border-amber-300 bg-amber-50 text-amber-800',
  maintenance: 'border-red-300 bg-red-50 text-red-800',
};
const statusLabel = { available: 'Available', occupied: 'Occupied', reserved: 'Reserved', maintenance: 'Maintenance' };

export default function WardsPage() {
  const [wards, setWards] = useState<WardView[]>([]);
  const [summary, setSummary] = useState({ totalBeds: 0, occupiedBeds: 0, availableBeds: 0, maintenanceBeds: 0 });
  const [activeWard, setActiveWard] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const response = await wardAPI.getDashboard();
    setWards(response.data.data || []);
    setSummary(response.data.summary);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh().catch((error) => { console.error('Unable to load ward dashboard', error); setLoading(false); });
    const timer = window.setInterval(() => refresh().catch((error) => console.error('Unable to refresh ward dashboard', error)), 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const selectedWards = activeWard === 'all' ? wards : wards.filter((item) => item.ward._id === activeWard);
  const filteredBeds = useMemo(() => selectedWards.flatMap((item) => item.beds.map((bed) => ({ bed, ward: item.ward }))).filter(({ bed }) => bed.bedNumber.toLowerCase().includes(search.toLowerCase())), [selectedWards, search]);
  const occupancy = summary.totalBeds ? Math.round((summary.occupiedBeds / summary.totalBeds) * 100) : 0;
  const updateStatus = async (bed: BedRecord, status: BedRecord['status']) => {
    await wardAPI.updateBedStatus(bed._id, status);
    await refresh();
  };

  return <div className="flex h-screen bg-[#f4f7fa] text-slate-800"><Sidebar /><div className="flex min-w-0 flex-1 flex-col overflow-hidden"><Navbar /><main className="flex-1 overflow-auto p-5 md:p-8">
    <div className="mb-6 flex items-center justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Capacity & care operations</p><h1 className="text-3xl font-bold text-slate-900">Bed & Wards</h1><p className="mt-1 text-sm text-slate-500">Live bed occupancy, ward availability, and maintenance status.</p></div><button onClick={() => refresh().catch((error) => console.error('Unable to refresh wards', error))} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"><RefreshCw size={16} /> Refresh</button></div>
    <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total beds</p><div className="mt-5 flex items-end justify-between"><p className="text-3xl font-bold">{summary.totalBeds}<span className="text-sm font-normal text-slate-400"> beds</span></p><span className="font-bold text-slate-700">{occupancy}%</span></div><div className="mt-3 h-2 rounded-full bg-orange-100"><div className="h-2 rounded-full bg-orange-400" style={{ width: `${occupancy}%` }} /></div><p className="mt-3 text-xs text-slate-500">{summary.occupiedBeds} occupied</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Occupied beds</p><p className="mt-5 text-3xl font-bold">{summary.occupiedBeds}</p><p className="mt-3 text-xs text-emerald-600">Live admissions</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Available beds</p><p className="mt-5 text-3xl font-bold">{summary.availableBeds}</p><div className="mt-3 h-2 rounded-full bg-emerald-100"><div className="h-2 rounded-full bg-emerald-600" style={{ width: `${summary.totalBeds ? (summary.availableBeds / summary.totalBeds) * 100 : 0}%` }} /></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Maintenance</p><p className="mt-5 text-3xl font-bold">{summary.maintenanceBeds}</p><p className="mt-3 text-xs text-red-600">Requires attention</p></div></section>
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2">{['all', ...wards.map((item) => item.ward._id)].map((id) => <button key={id} onClick={() => setActiveWard(id)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeWard === id ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'}`}>{id === 'all' ? 'All wards' : wards.find((item) => item.ward._id === id)?.ward.wardName}</button>)}</div><span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Real-time updating</span></div><div className="mb-4 flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search bed number" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" /></div><button className="rounded-lg border border-slate-200 p-2"><Filter size={17} /></button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">{filteredBeds.map(({ bed, ward }) => <div key={bed._id} className={`rounded-xl border p-3 ${statusStyles[bed.status]}`}><div className="flex items-center justify-between"><p className="font-semibold">{bed.bedNumber}</p><CircleEllipsis size={16} /></div><p className="mt-3 flex items-center gap-2 text-sm"><BedDouble size={16} /> {statusLabel[bed.status]}</p><p className="mt-1 text-xs opacity-70">{ward.wardName}</p><select value={bed.status} onChange={(event) => updateStatus(bed, event.target.value as BedRecord['status'])} className="mt-3 w-full rounded-md border border-current/20 bg-white/60 px-2 py-1 text-xs"><option value="available">Available</option><option value="occupied">Occupied</option><option value="reserved">Reserved</option><option value="maintenance">Maintenance</option></select></div>)}</div>{loading && <p className="p-8 text-center text-slate-500">Loading bed status...</p>}{!loading && filteredBeds.length === 0 && <p className="p-8 text-center text-slate-500">No beds found.</p>}</section>
    <section className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Wards availability</h2>{wards.map(({ ward }) => <div key={ward._id} className="mb-4"><div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{ward.wardName}</span><span>{ward.availableBeds}/{ward.totalBeds} available</span></div><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-cyan-500" style={{ width: `${ward.totalBeds ? (ward.availableBeds / ward.totalBeds) * 100 : 0}%` }} /></div></div>)}</div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Bed status legend</h2><div className="grid gap-3 sm:grid-cols-2">{Object.entries(statusStyles).map(([status, style]) => <div key={status} className={`rounded-xl border p-3 ${style}`}><div className="flex items-center gap-2 font-semibold">{status === 'maintenance' ? <Wrench size={16} /> : <BedDouble size={16} />} {statusLabel[status as BedRecord['status']]}</div><p className="mt-1 text-xs opacity-75">{status === 'available' ? 'Ready for admission' : status === 'occupied' ? 'Patient currently admitted' : status === 'reserved' ? 'Reserved for incoming patient' : 'Unavailable for repairs'}</p></div>)}</div></div></section>
  </main></div></div>;
}
