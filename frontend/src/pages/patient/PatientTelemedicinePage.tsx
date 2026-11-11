import { useEffect, useState } from 'react';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientTelemedicinePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [inCall, setInCall] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const loadTelemedicine = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getTelemedicine();
      const list = res.data?.data || [];
      setSessions(list);
      if (list.length > 0 && !activeSession) {
        setActiveSession(list[0]);
      }
    } catch (err: any) {
      toast.error('Failed to load telemedicine consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemedicine();
  }, []);

  const handleStartCall = (session: any) => {
    setActiveSession(session);
    setInCall(true);
    toast.success('Connected to Kushal Hospitals secure encrypted video room');
  };

  const handleEndCall = () => {
    setInCall(false);
    toast('Consultation call ended');
  };

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
                    <Video size={14} className="text-teal-300" />
                    Live Virtual Clinic • Telemedicine
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Online Video Consultations</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Connect face-to-face with your physician via HIPAA-compliant, end-to-end encrypted video channels.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 backdrop-blur-md">
                  <ShieldCheck size={18} className="text-teal-300" />
                  <span className="text-xs font-semibold text-white">256-Bit Encrypted Audio & Video</span>
                </div>
              </div>
            </div>

            {/* In-Call Active Consultation Screen */}
            {inCall && activeSession ? (
              <div className="clinical-card p-6 bg-slate-950 text-white border-none shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        Consultation with {activeSession.doctorId?.userId?.name || 'Dr. Attending'}
                      </h3>
                      <p className="text-[11px] text-teal-300">Room ID: {activeSession.telemedicineRoomId || 'KH-VROOM-2026'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-full">08:42 Elapsed</span>
                </div>

                {/* Video Streams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96">
                  {/* Doctor Video Box */}
                  <div className="relative rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center border border-white/10">
                    <img
                      src={activeSession.doctorId?.userId?.profilePicture || '/doctor-photos/doctor1.png'}
                      alt="Doctor Stream"
                      className="h-full w-full object-cover opacity-90"
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-semibold">
                      {activeSession.doctorId?.userId?.name || 'Attending Physician'} (Doctor)
                    </div>
                  </div>

                  {/* Patient Self Video Box */}
                  <div className="relative rounded-2xl bg-slate-800 overflow-hidden flex items-center justify-center border border-white/10">
                    {videoOn ? (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-teal-950">
                        <User size={64} className="text-teal-400/50" />
                        <span className="absolute text-xs text-teal-200">Camera Active (Self Preview)</span>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-xs flex flex-col items-center gap-2">
                        <VideoOff size={32} />
                        <span>Camera Paused</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-semibold">
                      You (Patient)
                    </div>
                  </div>
                </div>

                {/* Call Control Strip */}
                <div className="flex items-center justify-center gap-4 pt-3">
                  <button
                    onClick={() => setMicOn(!micOn)}
                    className={`p-3.5 rounded-full border transition-all ${
                      micOn ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-rose-600 border-rose-500 text-white'
                    }`}
                  >
                    {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>

                  <button
                    onClick={() => setVideoOn(!videoOn)}
                    className={`p-3.5 rounded-full border transition-all ${
                      videoOn ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-rose-600 border-rose-500 text-white'
                    }`}
                  >
                    {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30"
                  >
                    <PhoneOff size={18} /> Leave Consultation Room
                  </button>
                </div>
              </div>
            ) : null}

            {/* Scheduled Telemedicine Sessions */}
            <div className="clinical-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Scheduled Virtual Appointments</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Verified telemedicine consultations</p>
                </div>
                <button
                  onClick={loadTelemedicine}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading telemedicine sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs space-y-2">
                  <Video size={30} className="mx-auto text-slate-300" />
                  <p>No telemedicine consultations currently scheduled.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((ses) => {
                    const docUser = ses.doctorId?.userId || {};
                    const docName = docUser.name || `Dr. ${docUser.firstName || ''} ${docUser.lastName || ''}`.trim() || 'Clinician';

                    return (
                      <div
                        key={ses._id}
                        className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                            <Video size={22} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{docName}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                {ses.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {ses.doctorId?.specialization || 'Clinical Review'} •{' '}
                              {new Date(ses.appointmentDate).toLocaleDateString()} at {ses.timeSlot}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleStartCall(ses)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20"
                          >
                            <Video size={14} /> Join Video Room
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
