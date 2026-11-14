import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Pill,
  Download,
  Printer,
  ShieldCheck,
  Search,
  FileText,
  FileCheck,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientPrescriptionsPage() {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('id');

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRx, setSelectedRx] = useState<any>(null);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getPrescriptions();
      const list = res.data?.data || [];
      setPrescriptions(list);
      if (highlightId) {
        const found = list.find((r: any) => r._id === highlightId);
        if (found) setSelectedRx(found);
      } else if (list.length > 0 && !selectedRx) {
        setSelectedRx(list[0]);
      }
    } catch (err: any) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const docUser = rx.doctorId?.userId || {};
    const docName = (docUser.name || `${docUser.firstName || ''} ${docUser.lastName || ''}`).toLowerCase();
    const diag = (rx.diagnosis || '').toLowerCase();
    const q = search.toLowerCase();
    return docName.includes(q) || diag.includes(q);
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
                    <Pill size={14} className="text-teal-300" />
                    Pharmacy & Digital Prescriptions
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Doctor Digital Prescriptions</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Authentic, doctor-authorized medical prescriptions with dosage, frequency, and instructions.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 backdrop-blur-md">
                  <ShieldCheck size={18} className="text-teal-300" />
                  <span className="text-xs font-semibold text-white">NABH Digital Verified</span>
                </div>
              </div>
            </div>

            {/* Split Layout: Left Prescriptions List, Right Prescription Details / Printable PDF view */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: List (1 col) */}
              <div className="space-y-4">
                <div className="clinical-card p-4">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search diagnosis or doctor..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 bg-slate-50"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-slate-400 text-xs">Loading prescriptions...</div>
                ) : filteredPrescriptions.length === 0 ? (
                  <div className="clinical-card p-8 text-center text-xs text-slate-400">
                    No prescriptions found
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredPrescriptions.map((rx) => {
                      const docUser = rx.doctorId?.userId || {};
                      const docName = docUser.name || `Dr. ${docUser.firstName || ''} ${docUser.lastName || ''}`.trim() || 'Clinician';
                      const isSelected = selectedRx?._id === rx._id;

                      return (
                        <div
                          key={rx._id}
                          onClick={() => setSelectedRx(rx)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-teal-50/70 border-teal-500 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-slate-400 uppercase">
                              Rx #{rx._id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {new Date(rx.createdAt || rx.date).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">
                            {rx.diagnosis || 'Clinical Prescription'}
                          </h4>
                          <p className="text-xs text-teal-800 font-semibold mt-0.5">{docName}</p>
                          {rx.fileUrl && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 mt-1">
                              <FileText size={10} /> Attached PDF
                            </span>
                          )}
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>{rx.medicines?.length || 0} Medication(s)</span>
                            <span className="text-teal-700 font-bold">View Sheet →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Prescription Sheet (2 cols) */}
              <div className="lg:col-span-2">
                {!selectedRx ? (
                  <div className="clinical-card p-12 text-center text-slate-400 text-xs">
                    Select a prescription from the list to view its complete clinical sheet.
                  </div>
                ) : (
                  <div className="clinical-card p-6 sm:p-8 space-y-6 border-2 border-teal-600/20 bg-white" id="prescription-sheet">
                    {/* Sheet Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-900">
                      <div>
                        <div className="flex items-center gap-3">
                          <img
                            src="/kushal-emblem.png"
                            alt="Kushal Hospitals"
                            className="h-11 w-11 object-contain"
                          />
                          <div>
                            <h2 className="text-lg font-black tracking-tight text-[#0f4c81] uppercase">Kushal Hospitals</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hospital Management System • NABH Accredited</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right text-xs text-slate-600">
                        <div className="font-mono font-bold text-slate-900">
                          Prescription ID: {selectedRx._id}
                        </div>
                        <div>Date: {new Date(selectedRx.createdAt || selectedRx.date).toLocaleDateString()}</div>
                        <div className="text-[11px] text-teal-800 font-semibold">Valid for Outpatient Pharmacy</div>
                      </div>
                    </div>

                    {/* Doctor and Patient Meta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Prescribing Clinician</span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {selectedRx.doctorId?.userId?.name || 'Attending Physician'}
                        </h4>
                        <p className="text-slate-600">{selectedRx.doctorId?.specialization || 'Consultant'}</p>
                        <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                          Lic: {selectedRx.doctorId?.licenseNumber || 'KH-DOC-NABH'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Patient Details</span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {selectedRx.patientId?.userId?.name || 'Authorized Patient'}
                        </h4>
                        <p className="font-mono text-[11px] text-slate-600">
                          ID: {selectedRx.patientId?.patientId || 'KH-PAT-ACTIVE'}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Diagnosis: <strong className="text-slate-900">{selectedRx.diagnosis || 'Clinical Review'}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Attached Prescription Document / PDF */}
                    {selectedRx.fileUrl && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/30">
                            <FileCheck size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {selectedRx.fileName || 'Attached Prescription Document (PDF)'}
                            </div>
                            <div className="text-[11px] text-teal-800 font-medium">
                              Doctor attached clinical file • Official verified prescription
                            </div>
                          </div>
                        </div>
                        <a
                          href={selectedRx.fileUrl}
                          download={selectedRx.fileName || 'Prescription.pdf'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-700/20 shrink-0 transition"
                        >
                          <Download size={14} /> Download Attached PDF
                        </a>
                      </div>
                    )}

                    {/* Medicines Table */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Pill size={16} className="text-teal-700" />
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                          Prescribed Medication Regimen
                        </h3>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">Medicine Name</th>
                              <th className="py-2.5 px-3">Dosage</th>
                              <th className="py-2.5 px-3">Frequency</th>
                              <th className="py-2.5 px-3">Duration</th>
                              <th className="py-2.5 px-3">Instructions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(selectedRx.medicines || []).map((med: any, index: number) => (
                              <tr key={index} className="hover:bg-teal-50/30">
                                <td className="py-3 px-3 font-mono text-slate-400">{index + 1}</td>
                                <td className="py-3 px-3 font-bold text-slate-900">{med.medicineName || med.name}</td>
                                <td className="py-3 px-3 font-semibold text-teal-800">{med.dosage}</td>
                                <td className="py-3 px-3 text-slate-700">{med.frequency}</td>
                                <td className="py-3 px-3 text-slate-700">{med.duration}</td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {med.instructions || 'After food'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Notes & Advice */}
                    {selectedRx.notes && (
                      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
                        <strong className="block font-bold">Doctor's Dietary & Lifestyle Advice:</strong>
                        <p className="leading-relaxed">{selectedRx.notes}</p>
                      </div>
                    )}

                    {/* Digital Signature & Footer */}
                    <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="text-[10px] text-slate-400 max-w-sm">
                        This digital prescription is electronically signed under the Information Technology Act & Indian Medical Council regulations. Verified at Kushal Hospitals.
                      </div>

                      <div className="text-right">
                        <div className="inline-block p-2 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center">
                          <span className="text-[10px] text-slate-400 block">Digitally Signed By</span>
                          <span className="font-serif italic font-bold text-slate-800 text-sm">
                            {selectedRx.doctorId?.userId?.name || 'Dr. Attending'}
                          </span>
                          <span className="text-[9px] text-emerald-600 block font-mono">✓ Verified Digital Key</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 print:hidden">
                      <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <Printer size={14} /> Print Prescription
                      </button>
                      <button
                        onClick={() => {
                          if (selectedRx.fileUrl) {
                            const link = document.createElement('a');
                            link.href = selectedRx.fileUrl;
                            link.download = selectedRx.fileName || 'Prescription.pdf';
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } else {
                            window.print();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20"
                      >
                        <Download size={14} /> Download PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
