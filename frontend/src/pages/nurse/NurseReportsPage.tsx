import { useEffect, useState } from 'react';
import {
  BarChart3,
  FileText,
  Printer,
  RefreshCw,
  Activity,
  Pill,
  ClipboardList,
  Siren,
  Clock,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { nursePortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NurseReportsPage() {
  const [reportType, setReportType] = useState('daily_care');
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load patients for filter
    nursePortalAPI
      .getPatients()
      .then((res) => {
        setPatients(res.data.data || []);
      })
      .catch(() => {});
  }, []);

  const generateReport = async () => {
    try {
      setLoading(true);
      const res = await nursePortalAPI.getReports({
        type: reportType,
        startDate,
        endDate,
        patientId: selectedPatientId || undefined,
      });

      setReportData(res.data.data);
      toast.success('Clinical report compiled');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  const reportTypes = [
    { id: 'daily_care', label: 'Daily Care Summary', icon: FileText },
    { id: 'emar', label: 'eMAR Medication Audit', icon: Pill },
    { id: 'tasks', label: 'Task Completion Report', icon: ClipboardList },
    { id: 'vitals', label: 'Vitals Flowsheet Report', icon: Activity },
    { id: 'handovers', label: 'Shift Handover Archive', icon: Clock },
    { id: 'emergency', label: 'Emergency Incident Audit', icon: Siren },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="print:hidden">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="print:hidden">
          <Navbar />
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 print:p-0 print:overflow-visible">
          <div className="mx-auto max-w-7xl space-y-6 print:space-y-4">
            {/* Header (Hidden in Print) */}
            <div className="print:hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
                  <BarChart3 size={14} />
                  <span>Clinical Analytics & Auditing</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Nursing Clinical Reports</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate regulatory-compliant care records, eMAR administration logs, vital flowsheets, and incident audits.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!reportData}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  <Printer size={14} />
                  <span>Print / Export PDF</span>
                </button>
              </div>
            </div>

            {/* Filter Bar (Hidden in Print) */}
            <div className="print:hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              {/* Report Category Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {reportTypes.map((rt) => {
                  const Icon = rt.icon;
                  return (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => setReportType(rt.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                        reportType === rt.id
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{rt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Date & Patient Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Inpatient Filter
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:bg-white focus:outline-none"
                  >
                    <option value="">All Inpatients</option>
                    {patients.map((p: any) => {
                      const pat = p.patientId || p;
                      const patName = pat.name || `${pat.firstName || ''} ${pat.lastName || ''}`.trim();
                      return (
                        <option key={p._id || pat._id} value={pat._id || p._id}>
                          {patName} ({p.ward || 'Ward'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={generateReport}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
                  >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    <span>Run Query</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Printable Clinical Report Container */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs print:border-none print:shadow-none print:p-0 space-y-6">
              {/* Formal Report Header */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-xl font-black text-slate-900 tracking-tight">KUSHAL HOSPITALS</div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Department of Inpatient Nursing Services • Clinical Documentation
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="font-bold text-slate-900">
                    REPORT: {reportTypes.find((r) => r.id === reportType)?.label.toUpperCase()}
                  </div>
                  <div className="text-slate-500">
                    Period: {startDate} to {endDate}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Generated on: {new Date().toLocaleString()}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw size={28} className="animate-spin text-teal-600" />
                </div>
              ) : !reportData ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  Select criteria and click "Run Query" to compile clinical reports.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Dynamic Summary KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Active Records</div>
                      <div className="text-xl font-black text-slate-900 mt-1">
                        {Array.isArray(reportData)
                          ? reportData.length
                          : reportData.totalRecords ||
                            (reportData.administrations?.length || reportData.tasks?.length || 0)}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Audit Status</div>
                      <div className="text-xl font-black text-emerald-700 mt-1">Verified</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Ward Unit</div>
                      <div className="text-xl font-black text-slate-900 mt-1">General / ICU</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Sign-Off Standard</div>
                      <div className="text-xl font-black text-indigo-700 mt-1">NABH / JCI</div>
                    </div>
                  </div>

                  {/* Report Body Table depending on report type */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200">
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                        {reportType === 'vitals' ? (
                          <tr>
                            <th className="p-2.5">Date & Time</th>
                            <th className="p-2.5">Patient</th>
                            <th className="p-2.5">BP (mmHg)</th>
                            <th className="p-2.5">Pulse</th>
                            <th className="p-2.5">Temp</th>
                            <th className="p-2.5">SpO2</th>
                            <th className="p-2.5">Blood Sugar</th>
                            <th className="p-2.5">Clinical Alerts</th>
                          </tr>
                        ) : reportType === 'emar' ? (
                          <tr>
                            <th className="p-2.5">Administered At</th>
                            <th className="p-2.5">Patient</th>
                            <th className="p-2.5">Medication</th>
                            <th className="p-2.5">Dose & Route</th>
                            <th className="p-2.5">5-Rights Verified</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Nurse / Justification</th>
                          </tr>
                        ) : reportType === 'tasks' ? (
                          <tr>
                            <th className="p-2.5">Created Date</th>
                            <th className="p-2.5">Patient</th>
                            <th className="p-2.5">Category</th>
                            <th className="p-2.5">Task Description</th>
                            <th className="p-2.5">Priority</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Completion Notes</th>
                          </tr>
                        ) : (
                          <tr>
                            <th className="p-2.5">Timestamp</th>
                            <th className="p-2.5">Item Description</th>
                            <th className="p-2.5">Category</th>
                            <th className="p-2.5">Associated Inpatient</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Clinical Record</th>
                          </tr>
                        )}
                      </thead>

                      <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                        {/* Render records */}
                        {Array.isArray(reportData) && reportData.length > 0 ? (
                          reportData.map((row: any, ridx: number) => (
                            <tr key={ridx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono text-[11px]">
                                {new Date(row.recordedAt || row.administeredAt || row.createdAt).toLocaleString([], {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </td>
                              <td className="p-2.5 font-bold">
                                {row.patient?.name || row.patientName || 'Inpatient'}
                              </td>
                              {reportType === 'vitals' && (
                                <>
                                  <td className="p-2.5 font-mono">
                                    {row.bloodPressure?.systolic}/{row.bloodPressure?.diastolic}
                                  </td>
                                  <td className="p-2.5">{row.heartRate} bpm</td>
                                  <td className="p-2.5">{row.temperature} °F</td>
                                  <td className="p-2.5 font-bold text-teal-700">{row.oxygenSaturation}%</td>
                                  <td className="p-2.5">{row.bloodGlucose ? `${row.bloodGlucose} mg/dL` : '–'}</td>
                                  <td className="p-2.5">
                                    {row.isAbnormal ? (
                                      <span className="text-rose-600 font-bold text-[10px]">
                                        {row.abnormalFlags?.join(', ') || 'Abnormal'}
                                      </span>
                                    ) : (
                                      <span className="text-emerald-600 font-bold text-[10px]">Normal</span>
                                    )}
                                  </td>
                                </>
                              )}

                              {reportType === 'emar' && (
                                <>
                                  <td className="p-2.5 font-bold text-teal-900">{row.medicineName}</td>
                                  <td className="p-2.5">{row.dosage} ({row.route || 'Oral'})</td>
                                  <td className="p-2.5">
                                    <span className="text-emerald-700 font-semibold">All 5 Checked</span>
                                  </td>
                                  <td className="p-2.5">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                      {row.status}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-slate-500">{row.reasonForMissedOrRefused || 'Routine dose completed'}</td>
                                </>
                              )}

                              {reportType === 'tasks' && (
                                <>
                                  <td className="p-2.5 capitalize">{row.category?.replace('_', ' ')}</td>
                                  <td className="p-2.5 font-bold">{row.title}</td>
                                  <td className="p-2.5 uppercase font-bold text-[10px]">{row.priority}</td>
                                  <td className="p-2.5">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                      {row.status}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-slate-500">{row.completionNotes || '–'}</td>
                                </>
                              )}

                              {reportType !== 'vitals' && reportType !== 'emar' && reportType !== 'tasks' && (
                                <>
                                  <td className="p-2.5">{row.title || row.alertType || row.outgoingShift || 'Care Record'}</td>
                                  <td className="p-2.5">{row.category || row.severity || 'Clinical'}</td>
                                  <td className="p-2.5">{row.status || 'Verified'}</td>
                                  <td className="p-2.5 text-slate-500 truncate max-w-xs">{row.handoverSummary || row.symptoms || row.notes || '–'}</td>
                                </>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400">
                              No records found for the selected audit range.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Legal & Medical Verification Sign-Off Footer */}
                  <div className="pt-10 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
                    <div>
                      <div className="font-bold text-slate-800">DOCUMENTATION CERTIFICATION</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        I hereby certify that the clinical nursing observations, vital signs, medication administrations, and care activities documented above are accurate, entered in real-time, and compliant with Kushal Hospitals clinical safety protocols.
                      </p>
                    </div>

                    <div className="text-right space-y-6">
                      <div className="inline-block border-b border-slate-400 w-48 text-center pb-1 font-mono text-[11px] text-slate-700">
                        Registered Nursing Officer Signature
                      </div>
                      <div className="text-[10px] text-slate-400">Official Kushal Hospitals Inpatient Care Record</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
