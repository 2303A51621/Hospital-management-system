import { useEffect, useState } from 'react';
import {
  CreditCard,
  Printer,
  RefreshCw,
  QrCode,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientPaymentsPage() {
  const [billings, setBillings] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalBilled: 0, totalPaid: 0, totalOutstanding: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Payment checkout simulator modal
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const loadBilling = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getPatientBilling();
      setBillings(res.data?.data || []);
      if (res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch (err: any) {
      toast.error('Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const handlePayNow = (inv: any) => {
    setSelectedInvoice(inv);
    setCheckoutModal(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      setProcessingPayment(true);
      const res = await patientPortalAPI.processPayment({
        billingId: selectedInvoice._id,
        amount: selectedInvoice.outstandingAmount || selectedInvoice.totalAmount,
        paymentMethod,
        transactionReference: `TXN-${Date.now()}`,
      });
      toast.success(res.data?.message || 'Payment successfully processed!');
      setCheckoutModal(false);
      loadBilling();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredBillings = billings.filter((b) => {
    if (filterStatus !== 'all' && b.paymentStatus !== filterStatus) return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20 text-teal-100 mb-2">
                    <CreditCard size={14} className="text-teal-300" />
                    Patient Accounts & Invoicing
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Payments & Medical Invoices</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Transparent billing for consultations, pharmacy prescriptions, diagnostic tests, and hospital care.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={loadBilling}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-all"
                  >
                    <RefreshCw size={14} /> Refresh Invoices
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="clinical-card p-5 border-l-4 border-l-teal-600">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Billed</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  ₹{summary.totalBilled.toLocaleString()}
                </div>
                <span className="text-xs text-slate-400 mt-1 block">Cumulative medical expenses</span>
              </div>

              <div className="clinical-card p-5 border-l-4 border-l-emerald-600">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Paid</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">
                  ₹{summary.totalPaid.toLocaleString()}
                </div>
                <span className="text-xs text-slate-400 mt-1 block">Successfully settled invoices</span>
              </div>

              <div className="clinical-card p-5 border-l-4 border-l-amber-500">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Balance</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-2">
                  ₹{summary.totalOutstanding.toLocaleString()}
                </div>
                <span className="text-xs text-slate-400 mt-1 block">Due for settlement</span>
              </div>
            </div>

            {/* Invoices List */}
            <div className="clinical-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {['all', 'pending', 'paid', 'partially_paid'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterStatus === status ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {status === 'all' ? 'All Invoices' : status.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>

                <span className="text-xs font-semibold text-slate-500">{filteredBillings.length} Invoices Found</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading billing records...</div>
              ) : filteredBillings.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">No invoices matching selected filter.</div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Services / Line Items</th>
                        <th className="py-3 px-4">Total Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBillings.map((inv) => {
                        const isPaid = inv.paymentStatus === 'paid';
                        const isPending = inv.paymentStatus === 'pending';

                        return (
                          <tr key={inv._id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                              {inv.invoiceNumber || inv._id.slice(-8).toUpperCase()}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {new Date(inv.createdAt || inv.invoiceDate).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800">
                                {inv.items && inv.items.length > 0
                                  ? inv.items.map((i: any) => i.description || i.name).join(', ')
                                  : 'Outpatient Medical Consultation'}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {inv.department || 'Outpatient Department'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-extrabold text-slate-900 text-sm">
                                ₹{(inv.totalAmount || 0).toLocaleString()}
                              </span>
                              {inv.outstandingAmount > 0 && (
                                <span className="block text-[10px] text-amber-600 font-bold">
                                  Due: ₹{inv.outstandingAmount.toLocaleString()}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                  isPaid
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : isPending
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {inv.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!isPaid && (
                                  <button
                                    onClick={() => handlePayNow(inv)}
                                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm"
                                  >
                                    Pay Now
                                  </button>
                                )}
                                <button
                                  onClick={() => window.print()}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                                  title="Print Receipt"
                                >
                                  <Printer size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment Checkout Modal Simulator */}
            {checkoutModal && selectedInvoice && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <form
                  onSubmit={handleProcessPayment}
                  className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-teal-700">Payment Gateway</span>
                      <h3 className="text-base font-extrabold text-slate-900">Hospital Checkout</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutModal(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-400 block font-mono">Invoice #{selectedInvoice._id.slice(-6).toUpperCase()}</span>
                      <span className="font-bold text-slate-800">Hospital Medical Settlement</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block">Total Due</span>
                      <span className="text-lg font-black text-teal-900">
                        ₹{(selectedInvoice.outstandingAmount || selectedInvoice.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">Select Payment Instrument</label>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                          paymentMethod === 'upi' ? 'bg-teal-50 border-teal-600 text-teal-900' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        UPI / QR
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                          paymentMethod === 'card' ? 'bg-teal-50 border-teal-600 text-teal-900' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Debit / Credit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('netbanking')}
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                          paymentMethod === 'netbanking' ? 'bg-teal-50 border-teal-600 text-teal-900' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        NetBanking
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 text-center space-y-3">
                      <div className="h-28 w-28 bg-white border border-teal-200 rounded-xl mx-auto flex items-center justify-center p-2 shadow-inner">
                        <QrCode size={90} className="text-teal-900" />
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        Scan with Google Pay, PhonePe, Paytm or BHIM UPI
                      </span>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="Or enter UPI ID (e.g. mobile@upi)"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-center focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-2 text-xs">
                      <input
                        type="text"
                        placeholder="Card Number (4000 1234 5678 9010)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="MM / YY"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-center"
                        />
                        <input
                          type="password"
                          placeholder="CVV"
                          maxLength={3}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-center"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'netbanking' && (
                    <select className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
                      <option>State Bank of India</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                    </select>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutModal(false)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processingPayment}
                      className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20"
                    >
                      {processingPayment ? 'Authorizing Payment...' : 'Authorize Settlement'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
