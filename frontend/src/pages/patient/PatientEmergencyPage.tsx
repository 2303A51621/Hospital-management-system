import { useEffect, useState } from 'react';
import {
  PhoneCall,
  Siren,
  MapPin,
  HeartPulse,
  User,
  Navigation,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientEmergencyPage() {
  const [emergencyData, setEmergencyData] = useState<any>(null);

  useEffect(() => {
    const loadEmergency = async () => {
      try {
        const res = await patientPortalAPI.getEmergencyInfo();
        setEmergencyData(res.data?.data);
      } catch (err: any) {
        toast.error('Failed to load emergency hotline details');
      }
    };
    loadEmergency();
  }, []);

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Urgent Red Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-900 via-rose-800 to-red-700 p-6 sm:p-8 text-white shadow-xl shadow-rose-950/20">
              <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-rose-500/20 blur-2xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20 text-rose-100 mb-2">
                    <Siren size={14} className="text-white animate-bounce" />
                    24/7 Level-1 Trauma & Casualty Center
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Emergency Support & Rapid Response</h1>
                  <p className="text-xs sm:text-sm text-rose-100 mt-1">
                    Direct access to cardiac emergency units, stroke team, intensive care, and 24/7 GPS-enabled ambulance dispatch.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="tel:108"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-rose-900 hover:bg-rose-50 text-sm font-black transition-all shadow-xl shadow-rose-950/30"
                  >
                    <PhoneCall size={18} className="text-rose-700" /> Dial 108 Emergency
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Hotlines Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="clinical-card p-6 border-l-4 border-l-rose-600 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital Ambulance Desk</span>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <Siren size={20} />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-900 font-mono">1800-200-108</div>
                <p className="text-xs text-slate-500">Immediate hospital fleet dispatch with paramedics on board.</p>
                <a
                  href="tel:1800200108"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  <PhoneCall size={14} /> Call Ambulance Desk
                </a>
              </div>

              <div className="clinical-card p-6 border-l-4 border-l-amber-500 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Casualty Trauma Care</span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <HeartPulse size={20} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">+91 99000 11223</div>
                <p className="text-xs text-slate-500">Accident, chest pain, acute respiratory distress & trauma triage.</p>
                <a
                  href="tel:9900011223"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                >
                  <PhoneCall size={14} /> Call Casualty Triage
                </a>
              </div>

              <div className="clinical-card p-6 border-l-4 border-l-teal-600 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">General Helpdesk</span>
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                    <PhoneCall size={20} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">1800-200-4499</div>
                <p className="text-xs text-slate-500">Patient admission inquiries, bed availability and blood bank.</p>
                <a
                  href="tel:18002004499"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold"
                >
                  <PhoneCall size={14} /> Call Hospital Desk
                </a>
              </div>
            </div>

            {/* Hospital Casualty Navigation & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="clinical-card p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <MapPin size={18} className="text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">Hospital Casualty Center Location</h3>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div>
                    <strong className="block text-slate-900 text-sm">Kushal Hospitals Main Campus</strong>
                    <p className="text-slate-500 mt-0.5">
                      Emergency Gate 1, Medical College Road, Health City, Sector 4, Hyderabad, Telangana - 500081
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-800 block">Emergency Entry Directions:</span>
                    <p className="text-slate-600">
                      Take Gate 1 ramp directly to Lower Ground Casualty Bay. Free emergency ambulance drop-off zone with zero barrier access.
                    </p>
                  </div>

                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
                  >
                    <Navigation size={14} /> Open GPS Navigation Map
                  </a>
                </div>
              </div>

              {/* Patient Emergency Contact Card */}
              <div className="clinical-card p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <User size={18} className="text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">Your Registered Emergency Contact</h3>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Name</span>
                    <span className="font-bold text-slate-900">
                      {emergencyData?.emergencyContact?.name || 'Primary Next of Kin'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Relationship</span>
                    <span className="font-semibold text-slate-800">
                      {emergencyData?.emergencyContact?.relationship || 'Family Member'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Emergency Phone</span>
                    <span className="font-mono font-bold text-teal-900">
                      {emergencyData?.emergencyContact?.phone || '+91 98765 43210'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  In acute medical situations, Kushal Hospitals clinical triage automatically notifies your emergency contact via SMS alert.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
