import { useState } from 'react';
import {
  Settings,
  Bell,
  Shield,
  Mic,
  Save,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import toast from 'react-hot-toast';

export default function DoctorSettingsPage() {
  const [notifyEmergency, setNotifyEmergency] = useState(true);
  const [notifyLabResults, setNotifyLabResults] = useState(true);
  const [notifyAppointments, setNotifyAppointments] = useState(true);
  const [notifyReferrals, setNotifyReferrals] = useState(true);

  const [enableDrugInteractions, setEnableDrugInteractions] = useState(true);
  const [enableAllergyAlerts, setEnableAllergyAlerts] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState('en-US');
  const [autoSaveConsultationDrafts, setAutoSaveConsultationDrafts] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Clinical settings & notification preferences saved!');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold mb-2">
                  <Settings className="w-3.5 h-3.5" />
                  Preferences & Clinical Configuration
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Doctor Settings
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Configure real-time clinical alerts, safety rule engines, voice dictation, and portal notifications.
                </p>
              </div>

              <button
                onClick={handleSaveSettings}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm transition shadow-teal-600/20"
              >
                <Save className="w-4 h-4" />
                Save Preferences
              </button>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Bell className="w-4 h-4 text-teal-600" />
                <h2 className="font-bold text-slate-900 text-base">Alerts & Real-Time Notifications</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Emergency Patient Notifications</div>
                    <div className="text-[11px] text-slate-500">
                      Receive immediate pop-up sound & alert badges for triage category red / casualty patients
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyEmergency}
                    onChange={(e) => setNotifyEmergency(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Abnormal Diagnostic Result Alerts</div>
                    <div className="text-[11px] text-slate-500">
                      Alert immediately when pathology/imaging marks findings as abnormal
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyLabResults}
                    onChange={(e) => setNotifyLabResults(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Appointment Bookings & Rescheduling</div>
                    <div className="text-[11px] text-slate-500">
                      Notify upon patient booking, cancellation, or schedule modifications
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyAppointments}
                    onChange={(e) => setNotifyAppointments(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Inter-Departmental Referral Alerts</div>
                    <div className="text-[11px] text-slate-500">
                      Notify when a colleague transfers or refers a patient for your specialist review
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyReferrals}
                    onChange={(e) => setNotifyReferrals(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Clinical Safety Rules */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Shield className="w-4 h-4 text-teal-600" />
                <h2 className="font-bold text-slate-900 text-base">Clinical Safety Automation</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Live Drug-Drug Interaction Checker</div>
                    <div className="text-[11px] text-slate-500">
                      Warn in real-time when prescribing potentially conflicting pharmaceuticals
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableDrugInteractions}
                    onChange={(e) => setEnableDrugInteractions(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Patient Allergy Cross-Reactivity Alerts</div>
                    <div className="text-[11px] text-slate-500">
                      Automatically check patient allergy records (Penicillins, NSAIDs, Sulfas) before issuing prescriptions
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableAllergyAlerts}
                    onChange={(e) => setEnableAllergyAlerts(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Auto-Save Consultation Drafts</div>
                    <div className="text-[11px] text-slate-500">
                      Periodically persist consultation progress to prevent data loss during network disruptions
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSaveConsultationDrafts}
                    onChange={(e) => setAutoSaveConsultationDrafts(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Voice Dictation Configuration */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Mic className="w-4 h-4 text-teal-600" />
                <h2 className="font-bold text-slate-900 text-base">Voice Dictation Settings (Web Speech API)</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Speech Recognition Language
                  </label>
                  <select
                    value={voiceLanguage}
                    onChange={(e) => setVoiceLanguage(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="en-US">English (United States)</option>
                    <option value="en-IN">English (India)</option>
                    <option value="en-GB">English (United Kingdom)</option>
                    <option value="hi-IN">Hindi (India)</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                  <div className="font-bold text-slate-800 mb-0.5">Microphone Status</div>
                  <span>Web Speech API is supported in modern browsers (Chrome, Edge, Safari).</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
