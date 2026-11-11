import { useState } from 'react';
import {
  Settings,
  Bell,
  Download,
  Smartphone,
  Mail,
  FileText,
  Save,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientSettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsReminders, setSmsReminders] = useState(true);
  const [labResultAlerts, setLabResultAlerts] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Notification preferences updated!');
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const res = await patientPortalAPI.getMedicalRecords();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data?.data || {}, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'kushal_health_records_export.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Electronic health record export generated successfully!');
    } catch (err: any) {
      toast.error('Failed to export medical data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20 text-teal-100 mb-2">
                    <Settings size={14} className="text-teal-300" />
                    Account Preferences & Data Sovereignty
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Patient Portal Settings</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Manage your healthcare communication channels, privacy controls, and data portability.
                  </p>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <form onSubmit={handleSavePreferences} className="clinical-card p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Bell size={18} className="text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">Communication & Clinical Reminders</h3>
              </div>

              <div className="space-y-4 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Smartphone size={18} className="text-teal-700" />
                    <div>
                      <span className="font-bold text-slate-900 block">SMS Appointment Reminders</span>
                      <span className="text-slate-500">Receive 24h and 2h SMS reminders before consultations</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsReminders}
                    onChange={(e) => setSmsReminders(e.target.checked)}
                    className="h-4 w-4 rounded text-teal-700 focus:ring-teal-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-teal-700" />
                    <div>
                      <span className="font-bold text-slate-900 block">Email Health Reports & Invoices</span>
                      <span className="text-slate-500">Receive digital prescriptions and invoice copies via registered email</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="h-4 w-4 rounded text-teal-700 focus:ring-teal-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-teal-700" />
                    <div>
                      <span className="font-bold text-slate-900 block">Instant Lab Result Ready Alerts</span>
                      <span className="text-slate-500">Real-time notification when lab tests are finalized by pathologist</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={labResultAlerts}
                    onChange={(e) => setLabResultAlerts(e.target.checked)}
                    className="h-4 w-4 rounded text-teal-700 focus:ring-teal-600"
                  />
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20 flex items-center gap-2"
                >
                  <Save size={14} /> Save Preferences
                </button>
              </div>
            </form>

            {/* Health Data Export */}
            <div className="clinical-card p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Download size={18} className="text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">ABDM Health Data Portability</h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Download a complete, machine-readable export of your consultations, prescriptions, lab results, vitals, and diagnostic history in secure JSON format.
              </p>

              <button
                onClick={handleExportData}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100 text-xs font-bold transition-all"
              >
                <Download size={14} /> {exporting ? 'Generating Export...' : 'Export Complete Health Archive (JSON)'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
