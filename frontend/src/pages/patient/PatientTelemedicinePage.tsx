import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  FileText,
  Pill,
  Search,
  Lock,
  Stethoscope,
  CalendarPlus,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { onlineConsultationAPI, doctorAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientTelemedicinePage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'book' | 'history'>('upcoming');

  // Consultations state
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Doctors & Booking state
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [searchDoctor, setSearchDoctor] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [consultationDate, setConsultationDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(true);

  // Payment state
  const [paymentMode, setPaymentMode] = useState<'pay_at_hospital' | 'online_simulation'>('pay_at_hospital');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isUpiVerified, setIsUpiVerified] = useState(false);
  const [upiTxnId, setUpiTxnId] = useState('');
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(null);

  // Details Modal (Notes & Prescription)
  const [selectedConsultationModal, setSelectedConsultationModal] = useState<any | null>(null);

  // Fetch Consultations
  const loadConsultations = async () => {
    try {
      setLoading(true);
      const res = await onlineConsultationAPI.getPatientConsultations();
      setConsultations(res.data?.data || []);
    } catch (err: any) {
      toast.error('Failed to load online video consultations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Doctors
  const loadDoctors = async () => {
    try {
      setLoading(true);
      const res = await doctorAPI.getAll(1, '', 50);
      const list = res.data?.data || [];
      setDoctors(list);
      if (list.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(list[0]._id);
      }
    } catch (err: any) {
      toast.error('Failed to load doctors list');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Available Slots when doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !consultationDate) return;
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        const res = await onlineConsultationAPI.getDoctorSlots(selectedDoctorId, consultationDate);
        const slots = res.data?.availableSlots || [];
        setAvailableSlots(slots);
        if (slots.length > 0) {
          setSelectedSlot(slots[0]);
        } else {
          setSelectedSlot('');
        }
      } catch (err) {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDoctorId, consultationDate]);

  useEffect(() => {
    loadConsultations();
    loadDoctors();
  }, []);

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);
  const doctorName = selectedDoctor
    ? selectedDoctor.userId?.name ||
      `Dr. ${selectedDoctor.userId?.firstName || ''} ${selectedDoctor.userId?.lastName || ''}`.trim() ||
      'Attending Physician'
    : 'Select Clinician';

  // Copy UPI VPA
  const handleCopyUpiId = () => {
    navigator.clipboard.writeText('kushalhospitals@icici');
    setCopiedUpi(true);
    toast.success('Hospital UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Simulate Instant UPI Verification
  const handleSimulateUpiPayment = () => {
    setVerifyingUpi(true);
    setTimeout(() => {
      const generatedTxn = 'UPI-' + Math.floor(100000 + Math.random() * 900000);
      setUpiTxnId(generatedTxn);
      setIsUpiVerified(true);
      setVerifyingUpi(false);
      toast.success(`Payment of ₹${selectedDoctor?.consultationFee || 600} verified via UPI!`);
    }, 700);
  };

  // Book Online Video Consultation
  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      toast.error('Please choose a doctor');
      return;
    }
    if (!consultationDate) {
      toast.error('Please select consultation date');
      return;
    }
    if (!selectedSlot) {
      toast.error('No available slot chosen. Please select another date or doctor.');
      return;
    }
    if (!consentAgreed) {
      toast.error('Please agree to the telehealth consent before booking.');
      return;
    }

    try {
      setBookingSubmitting(true);
      const payload: any = {
        doctorId: selectedDoctorId,
        scheduledDate: consultationDate,
        appointmentDate: consultationDate,
        startTime: selectedSlot,
        reason: reason.trim() || 'General Online Video Consultation',
        symptoms: symptoms ? symptoms.split(',').map((s) => s.trim()).filter(Boolean) : [],
        paymentMode,
        paymentStatus: paymentMode === 'online_simulation' && isUpiVerified ? 'completed' : 'pending',
        transactionId: paymentMode === 'online_simulation' ? (upiTxnId || `UPI-${Date.now().toString().slice(-6)}`) : undefined,
        patientConsent: { agreed: true },
      };

      const res = await onlineConsultationAPI.book(payload);
      toast.success('Online video consultation successfully scheduled!');
      setBookingSuccessData(res.data?.data);
      loadConsultations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book video consultation');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Filtered Doctors list
  const filteredDoctors = doctors.filter((doc) => {
    const name = (doc.userId?.name || `${doc.userId?.firstName || ''} ${doc.userId?.lastName || ''}`).toLowerCase();
    const spec = (doc.specialization || '').toLowerCase();
    const dept = (doc.department || '').toLowerCase();
    const query = searchDoctor.toLowerCase();
    const matchesSearch = name.includes(query) || spec.includes(query) || dept.includes(query);
    const matchesDept = selectedDepartment === 'All' || doc.department === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  // Upcoming vs Past consultations
  const upcomingConsultations = consultations.filter(
    (c) => c.status === 'pending' || c.status === 'confirmed' || c.status === 'in-progress' || c.status === 'waiting'
  );
  const pastConsultations = consultations.filter((c) => c.status === 'completed' || c.status === 'cancelled' || c.status === 'rejected');

  const departments = ['All', ...Array.from(new Set(doctors.map((d) => d.department).filter(Boolean)))];

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Stepper Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20 text-teal-100 mb-2">
                    <Video size={14} className="text-teal-300" />
                    Telehealth Virtual Clinic
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Online Video Consultations</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Connect face-to-face with certified specialists in high-definition, encrypted video rooms from home.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={() => {
                      setBookingSuccessData(null);
                      setActiveTab('book');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-900 text-xs font-extrabold shadow-md hover:bg-teal-50 transition"
                  >
                    <CalendarPlus size={15} /> Book Video Consult
                  </button>
                  <button
                    onClick={loadConsultations}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md transition"
                    title="Refresh consultations"
                  >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'upcoming'
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Video size={14} />
                <span>Upcoming Sessions ({upcomingConsultations.length})</span>
              </button>

              <button
                onClick={() => {
                  setBookingSuccessData(null);
                  setActiveTab('book');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'book'
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <CalendarPlus size={14} />
                <span>Schedule New Consultation</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'history'
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Clock size={14} />
                <span>Consultation History ({pastConsultations.length})</span>
              </button>
            </div>

            {/* TAB 1: UPCOMING VIDEO CONSULTATIONS */}
            {activeTab === 'upcoming' && (
              <div className="space-y-4">
                {upcomingConsultations.length === 0 ? (
                  <div className="clinical-card p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-full bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                      <Video size={32} />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h3 className="text-base font-extrabold text-slate-900">No Upcoming Video Consultations</h3>
                      <p className="text-xs text-slate-500">
                        You do not have any scheduled telehealth video consultations. Book an online appointment with our medical specialists in a few clicks.
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => setActiveTab('book')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-700/20 hover:bg-teal-800 transition"
                      >
                        <CalendarPlus size={15} /> Book Your First Video Session
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingConsultations.map((c) => {
                      const doc = c.doctorId;
                      const docUser = doc?.userId;
                      const dName = docUser?.name || `Dr. ${docUser?.firstName || ''} ${docUser?.lastName || ''}`.trim() || 'Doctor';
                      const isReadyToJoin = c.status === 'confirmed' || c.status === 'in-progress' || c.status === 'waiting';

                      return (
                        <div
                          key={c._id}
                          className="clinical-card bg-white p-5 rounded-3xl border border-teal-100 shadow-md hover:shadow-lg transition-all space-y-4"
                        >
                          {/* Card Top */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-2xl overflow-hidden bg-teal-50 border border-teal-100 shrink-0 flex items-center justify-center text-teal-700 font-bold">
                                {docUser?.profilePicture ? (
                                  <img src={docUser.profilePicture} alt={dName} className="w-full h-full object-cover" />
                                ) : (
                                  <User size={24} />
                                )}
                              </div>
                              <div>
                                <h3 className="font-extrabold text-slate-900 text-sm">{dName}</h3>
                                <p className="text-xs font-semibold text-teal-700">{doc?.specialization || 'Specialist'}</p>
                                <p className="text-[11px] text-slate-400">{doc?.department || 'Clinical Medicine'}</p>
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                c.status === 'confirmed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : c.status === 'in-progress'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>

                          {/* Consultation Timing & ID Info */}
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date</span>
                              <span className="font-bold text-slate-800">
                                {new Date(c.scheduledDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Time Slot</span>
                              <span className="font-extrabold text-teal-800">{c.startTime}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Appointment ID</span>
                              <span className="font-mono font-bold text-slate-700 text-[11px]">{c.consultationId}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Payment Status</span>
                              <span className="font-bold text-emerald-700 capitalize">{c.paymentStatus}</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="pt-1 flex items-center justify-between gap-3">
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                              <Lock size={12} className="text-teal-600" />
                              Room: {c.meetingRoomId}
                            </span>

                            <Link
                              to={`/video-consultation?room=${encodeURIComponent(c.meetingRoomId)}`}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-md transition ${
                                isReadyToJoin
                                  ? 'bg-gradient-to-r from-teal-600 to-teal-800 text-white hover:from-teal-700 hover:to-teal-900 shadow-teal-700/20 active:scale-95'
                                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              <Video size={14} />
                              <span>Join Video Consultation</span>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SCHEDULE / BOOK VIDEO CONSULTATION */}
            {activeTab === 'book' && (
              <div>
                {bookingSuccessData ? (
                  /* Success Confirmation Screen */
                  <div className="clinical-card p-8 sm:p-10 text-center max-w-xl mx-auto space-y-6 animate-fadeIn border-2 border-emerald-400/50 shadow-xl bg-white rounded-3xl">
                    <div className="relative mx-auto h-20 w-20">
                      <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-25 animate-ping" />
                      <div className="relative h-20 w-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 size={48} className="stroke-[2.5]" />
                      </div>
                    </div>

                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-200">
                        Consultation Booked
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mt-2">Video Consultation Confirmed!</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Your private telehealth consultation has been secured in the hospital scheduling network.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-left space-y-2.5 text-xs shadow-inner">
                      <div className="flex justify-between py-1 border-b border-teal-100">
                        <span className="text-slate-500 font-semibold uppercase text-[11px]">Physician</span>
                        <span className="font-extrabold text-teal-950">Dr. {bookingSuccessData.doctorName}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-teal-100">
                        <span className="text-slate-500 font-semibold uppercase text-[11px]">Specialization</span>
                        <span className="font-bold text-teal-800">{bookingSuccessData.specialization}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-teal-100">
                        <span className="text-slate-500 font-semibold uppercase text-[11px]">Consultation Date</span>
                        <span className="font-extrabold text-slate-900">
                          {new Date(bookingSuccessData.scheduledDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-teal-100">
                        <span className="text-slate-500 font-semibold uppercase text-[11px]">Time Slot</span>
                        <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {bookingSuccessData.startTime}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-teal-100">
                        <span className="text-slate-500 font-semibold uppercase text-[11px]">Consultation ID</span>
                        <span className="font-mono font-bold text-slate-800">{bookingSuccessData.consultationId}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 font-semibold uppercase text-[11px]">Meeting Room ID</span>
                        <span className="font-mono font-extrabold text-teal-900">{bookingSuccessData.meetingRoomId}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <Link
                        to={`/video-consultation?room=${encodeURIComponent(bookingSuccessData.meetingRoomId)}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-700/20 transition-all"
                      >
                        <Video size={16} /> Enter Video Room Now
                      </Link>
                      <button
                        onClick={() => {
                          setBookingSuccessData(null);
                          setActiveTab('upcoming');
                        }}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                      >
                        View All Upcoming Sessions
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Booking Multi-Section Form */
                  <form onSubmit={handleBookConsultation} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Columns: Doctor Selection, Date, Slot & Medical Reason */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Section 1: Doctor Selection */}
                      <div className="clinical-card p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                              <Stethoscope size={16} className="text-teal-600" />
                              1. Select Attending Doctor
                            </h3>
                            <p className="text-xs text-slate-400">Choose your physician based on specialization and availability</p>
                          </div>

                          {/* Filter Search & Department */}
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={selectedDepartment}
                              onChange={(e) => setSelectedDepartment(e.target.value)}
                              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500 text-slate-700 font-semibold"
                            >
                              {departments.map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept === 'All' ? 'All Departments' : dept}
                                </option>
                              ))}
                            </select>

                            <div className="relative">
                              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search doctor or specialty..."
                                value={searchDoctor}
                                onChange={(e) => setSearchDoctor(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500 w-44 sm:w-52"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Doctors Grid Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                          {filteredDoctors.map((doc) => {
                            const isSelected = doc._id === selectedDoctorId;
                            const dUser = doc.userId;
                            const dName = dUser?.name || `Dr. ${dUser?.firstName || ''} ${dUser?.lastName || ''}`.trim() || 'Clinician';

                            return (
                              <div
                                key={doc._id}
                                onClick={() => setSelectedDoctorId(doc._id)}
                                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                                  isSelected
                                    ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-500/20 shadow-sm'
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <div className="h-11 w-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-600 font-bold">
                                  {dUser?.profilePicture ? (
                                    <img src={dUser.profilePicture} alt={dName} className="w-full h-full object-cover" />
                                  ) : (
                                    <User size={20} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-extrabold text-slate-900 text-xs truncate">{dName}</h4>
                                    <span className="text-[11px] font-black text-teal-800">₹{doc.consultationFee || 600}</span>
                                  </div>
                                  <p className="text-[11px] font-bold text-teal-700 truncate">{doc.specialization}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {doc.department || 'Medicine'} • {doc.experienceYears || 5} yrs exp.
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 2: Date & Slots */}
                      <div className="clinical-card p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                          <Calendar size={16} className="text-teal-600" />
                          2. Consultation Schedule & Real-Time Slots
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Select Consultation Date</label>
                            <input
                              type="date"
                              required
                              min={new Date().toISOString().split('T')[0]}
                              value={consultationDate}
                              onChange={(e) => setConsultationDate(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-500 bg-slate-50"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Available Video Slots {loadingSlots && '(Loading...)'}
                            </label>
                            {availableSlots.length === 0 ? (
                              <p className="text-xs text-rose-600 py-2">No video slots open on this date. Select another date.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                {availableSlots.map((slot, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                                      selectedSlot === slot
                                        ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Reason, Symptoms & Consent */}
                      <div className="clinical-card p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                          <FileText size={16} className="text-teal-600" />
                          3. Chief Medical Complaint & Symptoms
                        </h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Video Consultation</label>
                            <input
                              type="text"
                              placeholder="e.g. Follow-up on lab report, persistent fever, allergy review"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Current Symptoms (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. Mild headache, dry cough, throat irritation"
                              value={symptoms}
                              onChange={(e) => setSymptoms(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          {/* Telehealth Consent Checkbox */}
                          <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-teal-50/60 border border-teal-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={consentAgreed}
                              onChange={(e) => setConsentAgreed(e.target.checked)}
                              className="mt-0.5 text-teal-700 rounded"
                            />
                            <div className="text-xs">
                              <span className="font-bold text-teal-950 block">Patient Telehealth & Privacy Consent</span>
                              <span className="text-[11px] text-teal-800/80 leading-relaxed block mt-0.5">
                                I consent to receive virtual healthcare services via Kushal Hospitals end-to-end encrypted video technology and understand online consultations do not replace emergency trauma care.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Order Summary & Instant Payment */}
                    <div className="space-y-6">
                      <div className="clinical-card p-6 bg-white rounded-3xl border border-slate-200/80 shadow-md space-y-4">
                        <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide pb-2 border-b border-slate-100">
                          Consultation Summary
                        </h3>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Doctor</span>
                            <span className="font-bold text-slate-800">{doctorName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Specialization</span>
                            <span className="font-semibold text-teal-700">{selectedDoctor?.specialization || 'Clinical'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Consultation Date</span>
                            <span className="font-bold text-slate-800">{consultationDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Selected Slot</span>
                            <span className="font-extrabold text-teal-800">{selectedSlot || 'None chosen'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Mode</span>
                            <span className="font-black text-blue-700 uppercase">ONLINE VIDEO (HD)</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-100">
                            <span className="text-slate-700 font-bold">Consultation Fee</span>
                            <span className="font-extrabold text-base text-slate-900">₹{selectedDoctor?.consultationFee || 600}</span>
                          </div>
                        </div>

                        {/* Payment Selection */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <label className="text-xs font-bold text-slate-700 block">Select Payment Preference</label>

                          <label
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              paymentMode === 'pay_at_hospital'
                                ? 'bg-teal-50/70 border-teal-500'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMode"
                              checked={paymentMode === 'pay_at_hospital'}
                              onChange={() => setPaymentMode('pay_at_hospital')}
                              className="mt-0.5 text-teal-700"
                            />
                            <div className="text-xs">
                              <span className="font-bold text-slate-900 block">Pay at Hospital Counter</span>
                              <span className="text-[11px] text-slate-500">Post-consultation settlement at front desk</span>
                            </div>
                          </label>

                          <label
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              paymentMode === 'online_simulation'
                                ? 'bg-teal-50/70 border-teal-500'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMode"
                              checked={paymentMode === 'online_simulation'}
                              onChange={() => setPaymentMode('online_simulation')}
                              className="mt-0.5 text-teal-700"
                            />
                            <div className="text-xs">
                              <span className="font-bold text-slate-900 block">Instant Online UPI Payment</span>
                              <span className="text-[11px] text-slate-500">Live QR scan via GPay, PhonePe, Paytm</span>
                            </div>
                          </label>

                          {/* Online UPI QR Card */}
                          {paymentMode === 'online_simulation' && (
                            <div className="p-3.5 rounded-2xl bg-teal-50/80 border-2 border-teal-500/50 space-y-3 shadow-sm animate-fadeIn">
                              <div className="flex items-center justify-between pb-1.5 border-b border-teal-200/60">
                                <span className="text-xs font-black text-teal-950 uppercase">UPI QR Code</span>
                                <span className="text-xs font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                                  ₹{selectedDoctor?.consultationFee || 600}
                                </span>
                              </div>

                              <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-teal-100">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                                    `upi://pay?pa=kushalhospitals@icici&pn=Kushal%20Hospitals&am=${
                                      selectedDoctor?.consultationFee || 600
                                    }&cu=INR&tn=Video%20Consultation%20Dr%20${encodeURIComponent(doctorName)}`
                                  )}`}
                                  alt="UPI QR Code"
                                  className="w-32 h-32 object-contain rounded"
                                  onError={(e: any) => {
                                    e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="%230d5c75" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
                                  }}
                                />
                                <span className="text-[10px] text-slate-400 mt-1 font-semibold">Scan with any UPI app</span>
                              </div>

                              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-teal-100 text-xs">
                                <span className="font-mono font-bold text-slate-800 text-[11px]">kushalhospitals@icici</span>
                                <button
                                  type="button"
                                  onClick={handleCopyUpiId}
                                  className="px-2 py-1 rounded bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200"
                                >
                                  {copiedUpi ? 'Copied' : 'Copy'}
                                </button>
                              </div>

                              <div>
                                {isUpiVerified ? (
                                  <div className="p-2 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between">
                                    <span>UPI Payment Verified ✓</span>
                                    <span className="font-mono text-[10px]">{upiTxnId}</span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={verifyingUpi}
                                    onClick={handleSimulateUpiPayment}
                                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow transition"
                                  >
                                    {verifyingUpi ? 'Verifying...' : 'I Have Paid — Verify Instantly'}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={bookingSubmitting}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-700 hover:to-teal-900 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-teal-700/20 transition-all flex items-center justify-center gap-2"
                        >
                          {bookingSubmitting ? (
                            <>
                              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                              <span>Securing Slot...</span>
                            </>
                          ) : (
                            <>
                              <span>Confirm & Book Consultation</span>
                              <ArrowRight size={15} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: CONSULTATION HISTORY & PRESCRIPTIONS */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {pastConsultations.length === 0 ? (
                  <div className="clinical-card p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-2">
                    <Clock size={32} className="mx-auto text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-700">No Past Consultations Logged</h3>
                    <p className="text-xs text-slate-400">Your completed video appointments and doctor prescriptions will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {pastConsultations.map((c) => {
                      const doc = c.doctorId;
                      const docUser = doc?.userId;
                      const dName = docUser?.name || `Dr. ${docUser?.firstName || ''} ${docUser?.lastName || ''}`.trim() || 'Clinician';

                      return (
                        <div key={c._id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50 transition">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                              <Video size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-slate-900 text-sm">{dName}</h4>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    c.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </div>
                              <p className="text-xs text-teal-700 font-semibold">{doc?.specialization || 'Specialist'}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Date: {new Date(c.scheduledDate).toLocaleDateString()} at {c.startTime} • Duration: {Math.round((c.callDurationSeconds || 0) / 60)} mins
                              </p>
                              {c.diagnosis && (
                                <p className="text-xs text-slate-700 mt-1">
                                  <span className="font-bold text-slate-600">Diagnosis: </span>
                                  {c.diagnosis}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-auto">
                            {(c.clinicalNotes || (c.prescriptions && c.prescriptions.length > 0)) && (
                              <button
                                onClick={() => setSelectedConsultationModal(c)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition"
                              >
                                <FileText size={14} /> View Notes & Prescription
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CLINICAL NOTES & PRESCRIPTION MODAL */}
            {selectedConsultationModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-teal-100 overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-5 text-white flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold">Consultation Summary & Prescription</h3>
                      <p className="text-xs text-teal-100/90">
                        {selectedConsultationModal.consultationId} • Dr.{' '}
                        {selectedConsultationModal.doctorId?.userId?.name || 'Physician'}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedConsultationModal(null)}
                      className="text-white/80 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-4 text-xs">
                    {selectedConsultationModal.diagnosis && (
                      <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100">
                        <span className="text-[10px] text-teal-800 font-bold uppercase tracking-wider block">Diagnosis</span>
                        <p className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedConsultationModal.diagnosis}</p>
                      </div>
                    )}

                    {selectedConsultationModal.clinicalNotes && (
                      <div className="space-y-1">
                        <span className="font-bold text-slate-700 block">Doctor's Clinical Notes</span>
                        <p className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed">
                          {selectedConsultationModal.clinicalNotes}
                        </p>
                      </div>
                    )}

                    {selectedConsultationModal.prescriptions && selectedConsultationModal.prescriptions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Pill size={14} className="text-teal-600" /> Prescribed Medications
                        </span>
                        <div className="space-y-2">
                          {selectedConsultationModal.prescriptions.map((m: any, i: number) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                              <p className="font-extrabold text-slate-900 text-xs">{m.medicineName}</p>
                              <p className="text-slate-500 text-[11px] mt-0.5">
                                {m.dosage} • {m.frequency} • Duration: {m.duration}
                              </p>
                              {m.instructions && <p className="text-slate-600 text-[11px] italic mt-0.5">Instructions: {m.instructions}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
