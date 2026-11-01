import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, CircleDollarSign, FileText, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { appointmentAPI, billingAPI, type Appointment } from '../services/api';

type Invoice = { status?: string; summary?: { totalAmount?: number }; paymentDetails?: { paymentStatus?: string } };

export default function AnalyticsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [updatedAt, setUpdatedAt] = useState(new Date());

  const refresh = async () => {
    const [appointmentResult, invoiceResult] = await Promise.all([appointmentAPI.getAll(), billingAPI.getAll()]);
    setAppointments(appointmentResult.data.data || []);
    setInvoices(invoiceResult.data.data || []);
    setUpdatedAt(new Date());
  };

  useEffect(() => {
    refresh().catch((error) => console.error('Unable to load analytics', error));
    const timer = window.setInterval(() => refresh().catch((error) => console.error('Unable to refresh analytics', error)), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const totals = useMemo(() => ({
    revenue: invoices.reduce((sum, invoice) => sum + Number(invoice.summary?.totalAmount || 0), 0),
    paid: invoices.filter((invoice) => invoice.status === 'paid' || invoice.paymentDetails?.paymentStatus === 'completed').length,
    completed: appointments.filter((appointment) => appointment.status === 'completed').length,
  }), [appointments, invoices]);

  const cards = [
    { label: 'Total revenue', value: `₹${totals.revenue.toLocaleString('en-IN')}`, icon: CircleDollarSign, color: 'text-emerald-600' },
    { label: 'Appointments', value: appointments.length, icon: CalendarDays, color: 'text-blue-600' },
    { label: 'Completed visits', value: totals.completed, icon: Activity, color: 'text-cyan-600' },
    { label: 'Paid invoices', value: totals.paid, icon: FileText, color: 'text-violet-600' },
  ];

  return <div className="flex h-screen bg-slate-50 text-slate-800"><Sidebar /><div className="flex min-w-0 flex-1 flex-col overflow-hidden"><Navbar /><main className="flex-1 overflow-auto p-6">
    <div className="mb-6 flex items-center justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Live reporting</p><h1 className="text-3xl font-bold text-slate-900">Analytics & Reports</h1></div><button onClick={() => refresh().catch((error) => console.error('Unable to refresh analytics', error))} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"><RefreshCw size={16} /> Refresh</button></div>
    <p className="mb-5 text-xs text-slate-500">Auto-refreshes every 30 seconds · Last updated {updatedAt.toLocaleTimeString()}</p>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className={`mb-4 ${color}`} /><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></div>)}</section>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-slate-900">Appointment status</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{['pending', 'confirmed', 'scheduled', 'completed', 'cancelled'].map((status) => <div key={status} className="rounded-xl bg-slate-50 p-4"><p className="text-sm capitalize text-slate-500">{status}</p><p className="mt-1 text-2xl font-bold">{appointments.filter((item) => item.status === status).length}</p></div>)}</div></section>
  </main></div></div>;
}
