import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertTriangle, Archive, CalendarClock, ChevronDown, Edit3, Package, Plus, Search, ShoppingCart, Trash2, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { medicineAPI, type Medicine } from '../services/api';

type InventoryFilter = 'all' | 'low' | 'expiring';
type MedicineForm = {
  medicineName: string;
  genericName: string;
  medicineType: string;
  strength: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  sellingPrice: number;
};

const emptyForm: MedicineForm = {
  medicineName: '', genericName: '', medicineType: 'tablet', strength: '',
  manufacturer: '', batchNumber: '', expiryDate: '', quantity: 0, unit: 'pieces',
  minThreshold: 10, sellingPrice: 0,
};

const daysUntil = (date: string) => (new Date(date).getTime() - Date.now()) / 86400000;
const isLowStock = (medicine: Medicine) => medicine.stock.quantity <= (medicine.stock.minThreshold || 0);
const isExpiring = (medicine: Medicine) => daysUntil(medicine.expiryDate) >= 0 && daysUntil(medicine.expiryDate) <= 90;

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [form, setForm] = useState<MedicineForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InventoryFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refresh = useCallback(async () => {
    const result = await medicineAPI.getAll(search);
    setMedicines(result.data.data || []);
    setLastUpdated(new Date());
    setLoading(false);
  }, [search]);

  useEffect(() => {
    refresh().catch((error) => { console.error('Unable to load pharmacy inventory', error); setLoading(false); });
    const timer = window.setInterval(() => refresh().catch((error) => console.error('Unable to refresh pharmacy inventory', error)), 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const lowStock = useMemo(() => medicines.filter(isLowStock), [medicines]);
  const expiring = useMemo(() => medicines.filter(isExpiring), [medicines]);
  const filteredMedicines = useMemo(() => medicines.filter((medicine) => {
    if (filter === 'low') return isLowStock(medicine);
    if (filter === 'expiring') return isExpiring(medicine);
    return true;
  }), [filter, medicines]);
  const inventoryValue = medicines.reduce((sum, item) => sum + item.stock.quantity * Number(item.cost?.sellingPrice || 0), 0);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await medicineAPI.create({
      medicineName: form.medicineName,
      genericName: form.genericName,
      medicineType: form.medicineType,
      strength: form.strength,
      manufacturer: form.manufacturer,
      batchNumber: form.batchNumber,
      expiryDate: form.expiryDate,
      cost: { sellingPrice: Number(form.sellingPrice) },
      stock: { quantity: Number(form.quantity), unit: form.unit, minThreshold: Number(form.minThreshold) },
    });
    setForm(emptyForm);
    setFormOpen(false);
    await refresh();
  };

  const archive = async (id: string) => {
    await medicineAPI.archive(id);
    await refresh();
  };

  return (
    <div className="flex h-screen bg-[#f5f8fb] text-slate-800">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-5 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Medicine inventory, sales & purchase orders</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">Pharmacy Management</h1>
              <p className="mt-1 text-xs text-slate-500">Live data · Updated {lastUpdated.toLocaleTimeString()}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">Online Store <span className="ml-1 inline-block h-2 w-2 rounded-full bg-emerald-500" /></button>
              <button type="button" onClick={() => setFormOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"><Plus size={16} /> New Purchase</button>
            </div>
          </div>

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border-l-4 border-blue-500 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total Medicines</p><p className="mt-2 text-2xl font-bold">{medicines.length}</p><p className="mt-2 text-xs text-slate-500"><Package size={13} className="mr-1 inline text-blue-500" />Active inventory items</p></div>
            <div className="rounded-2xl border-l-4 border-amber-400 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Low Stock</p><p className="mt-2 text-2xl font-bold text-amber-600">{lowStock.length}</p><p className="mt-2 text-xs text-amber-600"><AlertTriangle size={13} className="mr-1 inline" />Needs restocking</p></div>
            <div className="rounded-2xl border-l-4 border-red-500 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Expiring Soon</p><p className="mt-2 text-2xl font-bold text-red-600">{expiring.length}</p><p className="mt-2 text-xs text-red-600"><CalendarClock size={13} className="mr-1 inline" />Within 90 days</p></div>
            <div className="rounded-2xl border-l-4 border-emerald-500 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Today Sales</p><p className="mt-2 text-2xl font-bold text-emerald-600">₹0</p><p className="mt-2 text-xs text-emerald-600"><TrendingUp size={13} className="mr-1 inline" />Ready for sales tracking</p></div>
            <div className="rounded-2xl border-l-4 border-indigo-500 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Inventory Value</p><p className="mt-2 text-2xl font-bold text-indigo-600">₹{inventoryValue.toLocaleString('en-IN')}</p><p className="mt-2 text-xs text-slate-500"><ShoppingCart size={13} className="mr-1 inline" />Selling-price value</p></div>
          </section>

          <nav className="mb-4 flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm">
            {['Inventory', 'Sales', 'Purchases', 'Order List', 'Customers', 'Credit & Loyalty', 'Expiry Returns', 'Supplier Dues', 'Profit & Loss'].map((item, index) => <button key={item} type="button" className={`rounded-lg px-3 py-2 text-xs font-semibold ${index === 0 ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{item}</button>)}
          </nav>

          {lowStock.length > 0 && <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800"><AlertTriangle size={17} /> {lowStock.length} medicine(s) below minimum stock level.</div>}
          {expiring.length > 0 && <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"><CalendarClock size={17} /> {expiring.length} medicine(s) expiring within 90 days.</div>}

          {formOpen && <form onSubmit={submit} className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
            <input required placeholder="Medicine name" value={form.medicineName} onChange={(event) => setForm({ ...form, medicineName: event.target.value })} className="rounded-xl border p-2.5 text-sm" />
            <input required placeholder="Generic name" value={form.genericName} onChange={(event) => setForm({ ...form, genericName: event.target.value })} className="rounded-xl border p-2.5 text-sm" />
            <select value={form.medicineType} onChange={(event) => setForm({ ...form, medicineType: event.target.value })} className="rounded-xl border p-2.5 text-sm"><option>tablet</option><option>capsule</option><option>syrup</option><option>injection</option><option>drops</option><option>cream</option><option>powder</option><option>spray</option></select>
            <input required placeholder="Strength" value={form.strength} onChange={(event) => setForm({ ...form, strength: event.target.value })} className="rounded-xl border p-2.5 text-sm" />
            <input required placeholder="Manufacturer" value={form.manufacturer} onChange={(event) => setForm({ ...form, manufacturer: event.target.value })} className="rounded-xl border p-2.5 text-sm" />
            <input required placeholder="Batch number" value={form.batchNumber} onChange={(event) => setForm({ ...form, batchNumber: event.target.value })} className="rounded-xl border p-2.5 text-sm" />
            <input required type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} className="rounded-xl border p-2.5 text-sm" />
            <input required type="number" min="0" placeholder="Quantity" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} className="rounded-xl border p-2.5 text-sm" />
            <input required type="number" min="0" placeholder="MRP / selling price" value={form.sellingPrice} onChange={(event) => setForm({ ...form, sellingPrice: Number(event.target.value) })} className="rounded-xl border p-2.5 text-sm" />
            <button type="submit" className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white md:col-span-3">Add medicine to inventory</button>
          </form>}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search medicines..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" /></div>
              {(['all', 'low', 'expiring'] as InventoryFilter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${filter === value ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600'}`}>{value === 'all' ? 'All' : value === 'low' ? `Low Stock ${lowStock.length}` : `Expiring ${expiring.length}`}</button>)}
              <button type="button" onClick={() => setFormOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus size={14} /> Add Medicine</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Stock</th><th className="p-3">MRP</th><th className="p-3">Batch</th><th className="p-3">Expiry</th><th className="p-3">Actions</th></tr></thead>
                <tbody>
                  {!loading && filteredMedicines.map((medicine) => <tr key={medicine._id} className="border-b border-slate-100">
                    <td className="p-3"><p className="font-semibold text-slate-900">{medicine.medicineName}</p><p className="text-xs text-slate-500">{medicine.genericName} · {medicine.strength || 'Standard'}</p></td>
                    <td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize">{medicine.medicineType}</span></td>
                    <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${isLowStock(medicine) ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{medicine.stock.quantity} {medicine.stock.unit || 'units'}</span>{isLowStock(medicine) && <p className="mt-1 text-[10px] text-red-600">Min: {medicine.stock.minThreshold}</p>}</td>
                    <td className="p-3 font-semibold">₹{Number(medicine.cost?.sellingPrice || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-slate-500">{medicine.batchNumber}</td>
                    <td className={`p-3 ${isExpiring(medicine) ? 'font-semibold text-red-600' : 'text-slate-600'}`}>{new Date(medicine.expiryDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3"><div className="flex gap-3"><button type="button" className="text-blue-600" aria-label={`Edit ${medicine.medicineName}`}><Edit3 size={16} /></button><button type="button" onClick={() => archive(medicine._id)} className="text-red-600" aria-label={`Archive ${medicine.medicineName}`}><Trash2 size={16} /></button><Archive size={16} className="text-slate-400" /></div></td>
                  </tr>)}
                  {!loading && filteredMedicines.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-slate-500">No medicines found.</td></tr>}
                  {loading && <tr><td colSpan={7} className="p-10 text-center text-slate-500">Loading inventory...</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>Showing {filteredMedicines.length} medicines</span><span className="inline-flex items-center gap-1">More actions <ChevronDown size={14} /></span></div>
          </section>
        </main>
      </div>
    </div>
  );
}
