import { useEffect, useMemo, useState } from 'react';
import { CreditCard, FileText, ShieldCheck, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { billingAPI, type BillingInvoice } from '../services/api';

type Invoice = BillingInvoice;

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [paymentReference, setPaymentReference] = useState('');
  const [claimProvider, setClaimProvider] = useState('Star Health');
  const [claimPolicy, setClaimPolicy] = useState('POL-2025-118');

  const fetchInvoices = async () => {
    try {
      const response = await billingAPI.getAll();
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      setInvoices(rows);
    } catch (error) {
      console.error('Unable to fetch billing records', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const totals = useMemo(() => {
    return invoices.reduce(
      (acc, invoice) => {
        const total = Number(invoice.summary?.totalAmount || 0);
        const paid = invoice.status === 'paid' || invoice.paymentDetails?.paymentStatus === 'completed' ? total : 0;
        acc.total += total;
        acc.paid += paid;
        acc.pending += invoice.status === 'issued' || invoice.paymentDetails?.paymentStatus === 'pending' ? total : 0;
        return acc;
      },
      { total: 0, paid: 0, pending: 0 }
    );
  }, [invoices]);

  const handleRecordPayment = async (invoiceId: string) => {
    try {
      await billingAPI.recordPayment(invoiceId, {
          paymentMethod: selectedMethod,
          paymentGateway: selectedMethod === 'upi' ? 'UPI' : 'Card Gateway',
          transactionId: paymentReference || `TXN-${Date.now()}`,
          paymentStatus: 'completed',
          insuranceProvider: claimProvider,
          policyNumber: claimPolicy,
          coverage: 'General hospitalisation',
        });

      await fetchInvoices();
    } catch (error) {
      console.error('Unable to record payment', error);
    }
  };

  const handleCreateDemoInvoice = async () => {
    try {
      await billingAPI.create({
          patientId: '000000000000000000000000',
          appointmentId: null,
          invoiceDate: new Date().toISOString(),
          billItems: [
            { itemType: 'consultation', description: 'General consultation', quantity: 1, unitPrice: 1200 },
            { itemType: 'lab-test', description: 'CBC test', quantity: 1, unitPrice: 650 },
            { itemType: 'medicine', description: 'Antibiotic course', quantity: 2, unitPrice: 350 },
            { itemType: 'bed-charges', description: 'Ward room charges', quantity: 1, unitPrice: 1800 },
          ],
          insurance: {
            insuranceProvider: claimProvider,
            policyNumber: claimPolicy,
            coverage: 'General hospitalisation',
            claimAmount: 2500,
          },
          paymentDetails: { paymentMethod: selectedMethod, paymentStatus: 'pending' },
          status: 'issued',
        });

      await fetchInvoices();
    } catch (error) {
      console.error('Unable to create invoice', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-700">Billing & Insurance</p>
              <h1 className="text-3xl font-bold text-slate-900">Billing & Payment Center</h1>
            </div>
            <button
              type="button"
              onClick={handleCreateDemoInvoice}
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-cyan-700 hover:to-blue-700"
            >
              Create Demo Invoice
            </button>
          </div>

          <section className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-slate-500">Total billed</p>
                <FileText className="h-5 w-5 text-cyan-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">₹{totals.total.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-slate-500">Paid</p>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-600">₹{totals.paid.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-slate-500">Pending</p>
                <ArrowUpRight className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-600">₹{totals.pending.toLocaleString('en-IN')}</p>
            </div>
          </section>

          <section className="mb-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-cyan-700" />
                <h2 className="text-xl font-semibold text-slate-900">Insurance Claim Support</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-700">
                  Provider
                  <input value={claimProvider} onChange={(e) => setClaimProvider(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
                </label>
                <label className="text-sm text-slate-700">
                  Policy Number
                  <input value={claimPolicy} onChange={(e) => setClaimPolicy(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
                </label>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Claims are routed as pending until approval, while payment gateways support UPI, cards, and insurance-backed settlement.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-cyan-700" />
                <h2 className="text-xl font-semibold text-slate-900">Payment</h2>
              </div>

              <label className="block text-sm text-slate-700">
                Method
                <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="insurance">Insurance</option>
                </select>
              </label>

              <label className="mt-4 block text-sm text-slate-700">
                Reference / Transaction ID
                <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" placeholder="TXN-123456" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Recent Billing Records</h2>

            {loading ? (
              <p className="text-slate-500">Loading billing records...</p>
            ) : invoices.length === 0 ? (
              <p className="text-slate-500">No billing records found yet.</p>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-slate-500">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'No date'} </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700 capitalize">
                          {invoice.status}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 capitalize">
                          {invoice.paymentDetails?.paymentStatus || 'pending'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Subtotal</p>
                        <p className="text-base font-semibold text-slate-800">₹{Number(invoice.summary?.subtotal || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Insurance</p>
                        <p className="text-base font-semibold text-slate-800">{invoice.insurance?.insuranceProvider || 'Not applicable'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Total</p>
                        <p className="text-base font-semibold text-slate-800">₹{Number(invoice.summary?.totalAmount || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {invoice.billItems?.map((item, index) => (
                        <span key={`${invoice._id}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                          {item.description} • ₹{Number(item.total || item.unitPrice || 0).toLocaleString('en-IN')}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleRecordPayment(invoice._id)}
                        className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                      >
                        Mark as Paid
                      </button>
                      {invoice.status === 'paid' ? (
                        <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" /> Payment recorded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          <XCircle className="h-4 w-4" /> Awaiting payment
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
