import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Stethoscope,
  CheckCircle2,
  FileText,
  ArrowRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI, doctorAPI } from '../../services/api';
import { formatDoctorShift, generateDoctor24HourSlots } from '../../utils/doctorAvailability';
import toast from 'react-hot-toast';

export default function PatientBookAppointmentPage() {
  const [searchParams] = useSearchParams();
  const preselectedDoctorId = searchParams.get('doctorId') || '';
  const isFollowUp = searchParams.get('followUp') === 'true';

  const [doctors, setDoctors] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState(preselectedDoctorId);
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [consultationType, setConsultationType] = useState(isFollowUp ? 'follow-up' : 'in-person');
  const [reason, setReason] = useState(isFollowUp ? 'Follow-up consultation following clinical guidance' : '');
  const [symptomsInput, setSymptomsInput] = useState('');
  const [symptomsList, setSymptomsList] = useState<string[]>([]);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [familyMemberId, setFamilyMemberId] = useState('');
  const [paymentMode, setPaymentMode] = useState<'pay_at_hospital' | 'online_simulation'>('pay_at_hospital');

  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [slotFilter, setSlotFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'night'>('all');

  // Load doctors & family members
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingDoctors(true);
        const [docsRes, famRes] = await Promise.all([
          doctorAPI.getAll(1, '', 50),
          patientPortalAPI.getFamilyMembers().catch(() => ({ data: { data: [] } })),
        ]);
        const docs = docsRes.data?.data || [];
        setDoctors(docs);
        setFamilyMembers(famRes.data?.data || []);

        if (preselectedDoctorId && docs.some((d: any) => d._id === preselectedDoctorId)) {
          setSelectedDoctorId(preselectedDoctorId);
        } else if (docs.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(docs[0]._id);
        }
      } catch (err: any) {
        toast.error('Failed to load clinic clinicians');
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchInitialData();
  }, [preselectedDoctorId]);

  // Load available slots whenever selected doctor or date changes (24-hour round-the-clock availability)
  useEffect(() => {
    if (!selectedDoctorId || !appointmentDate) return;

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        const res = await patientPortalAPI.getDoctorSlots(selectedDoctorId, appointmentDate);
        const resData: any = res.data;
        let slots = resData?.slots || resData?.data?.slots || resData?.availableSlots || [];
        if (!slots || slots.length === 0) {
          slots = generateDoctor24HourSlots(30);
        }
        setAvailableSlots(slots);
        if (slots.length > 0) {
          setTimeSlot((prev) => (prev && slots.includes(prev) ? prev : slots[0]));
        }
      } catch (err: any) {
        const fallbackSlots = generateDoctor24HourSlots(30);
        setAvailableSlots(fallbackSlots);
        setTimeSlot((prev) => (prev && fallbackSlots.includes(prev) ? prev : fallbackSlots[0]));
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, appointmentDate, doctors]);

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);
  const doctorUser = selectedDoctor?.userId || {};
  const doctorName = doctorUser.name || `Dr. ${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() || 'Selected Clinician';

  const handleAddSymptom = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && symptomsInput.trim()) {
      e.preventDefault();
      if (!symptomsList.includes(symptomsInput.trim())) {
        setSymptomsList([...symptomsList, symptomsInput.trim()]);
      }
      setSymptomsInput('');
    }
  };

  const handleRemoveSymptom = (sym: string) => {
    setSymptomsList(symptomsList.filter((s) => s !== sym));
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      toast.error('Please select an attending clinician');
      return;
    }
    if (!appointmentDate) {
      toast.error('Please select an appointment date');
      return;
    }
    if (!timeSlot && availableSlots.length > 0) {
      setTimeSlot(availableSlots[0]);
    }
    // Open reconfirmation modal before booking
    setShowConfirmationModal(true);
  };

  const executeBooking = async () => {
    try {
      setSubmitting(true);
      const activeSlot = timeSlot || availableSlots[0] || '10:00 AM';
      const activeReason = reason.trim() || 'General Clinical Consultation';
      const payload: any = {
        doctorId: selectedDoctorId,
        appointmentDate,
        startTime: activeSlot,
        timeSlot: activeSlot,
        type: consultationType,
        consultationType,
        consultationFee: selectedDoctor?.consultationFee || 500,
        reason: activeReason,
        symptoms: symptomsList,
        medicalHistoryNotes: medicalNotes.trim(),
        paymentMode,
        paymentMethod: paymentMode === 'online_simulation' ? 'upi' : 'pay_at_hospital',
      };
      if (familyMemberId) {
        payload.familyMemberId = familyMemberId;
      }

      const res = await patientPortalAPI.bookAppointment(payload);
      toast.success('Appointment successfully booked!');
      setShowConfirmationModal(false);
      setBookingSuccess({
        ...payload,
        ...(res.data?.data || {}),
        doctorName,
        specialization: selectedDoctor?.specialization,
        department: selectedDoctor?.department,
        timeSlot: activeSlot,
        date: appointmentDate,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book consultation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Top Stepper Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20 text-teal-100 mb-2">
                    <Calendar size={14} className="text-teal-300" />
                    Appointment Booking Desk
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Schedule Your Consultation</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Select your preferred physician, date, time slot, and consultation mode in real-time.
                  </p>
                </div>
                <Link
                  to="/patient/appointments"
                  className="self-start md:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white backdrop-blur-md transition-all"
                >
                  <ChevronLeft size={14} /> My Scheduled Appointments
                </Link>
              </div>
            </div>

            {bookingSuccess ? (
              /* Success Confirmation Small Page */
              <div className="clinical-card p-8 sm:p-10 text-center max-w-xl mx-auto space-y-6 animate-fadeIn border-2 border-emerald-400/50 shadow-xl shadow-emerald-950/10 bg-white rounded-3xl">
                {/* Big Green Animated Tick Mark */}
                <div className="relative mx-auto h-24 w-24">
                  <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-25 animate-ping" />
                  <div className="relative h-24 w-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 size={56} className="stroke-[2.5]" />
                  </div>
                </div>

                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-200">
                    Appointment Confirmed
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                    Appointment Successfully Booked!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Your appointment has been confirmed in the Kushal Hospitals healthcare system.
                  </p>
                </div>

                {/* Prominent Details Summary Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-teal-50/40 border border-slate-200 text-left space-y-3 text-xs shadow-inner">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wide">Doctor Name</span>
                    <span className="font-black text-teal-950 text-sm">
                      Dr. {bookingSuccess.doctorName || doctorName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wide">Specialization</span>
                    <span className="font-extrabold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                      {bookingSuccess.specialization || selectedDoctor?.specialization || 'Clinical Specialist'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wide">Appointment Date</span>
                    <span className="font-extrabold text-slate-900">
                      {new Date(bookingSuccess.date || bookingSuccess.appointmentDate || appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wide">Appointment Time</span>
                    <span className="font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 text-xs">
                      {bookingSuccess.timeSlot || bookingSuccess.startTime || timeSlot}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wide">Department</span>
                    <span className="font-semibold text-slate-700">
                      {bookingSuccess.department || selectedDoctor?.department || 'Clinical Medicine'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wide">Appointment ID</span>
                    <span className="font-mono font-bold text-slate-800">
                      {bookingSuccess.appointmentId || bookingSuccess._id || 'KH-APT-CONFIRMED'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wide">Status</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Confirmed ✓
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    to="/patient/appointments"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-700/20 transition-all"
                  >
                    <Calendar size={15} />
                    View My Appointments
                  </Link>
                  <button
                    onClick={() => {
                      setBookingSuccess(null);
                      setReason('');
                      setSymptomsList([]);
                      setShowConfirmationModal(false);
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
                  >
                    Book Another Appointment
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Inputs */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Step 1: Doctor Selection */}
                  <div className="clinical-card p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <Stethoscope size={18} className="text-teal-700" />
                      <h3 className="text-sm font-bold text-slate-900">1. Select Attending Doctor</h3>
                    </div>

                    {loadingDoctors ? (
                      <div className="text-xs text-slate-400 py-4 text-center">Loading clinicians...</div>
                    ) : (
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-2">Physician / Specialist</label>
                        <select
                          value={selectedDoctorId}
                          onChange={(e) => setSelectedDoctorId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
                        >
                          {doctors.map((doc) => {
                            const u = doc.userId || {};
                            const name = u.name || `Dr. ${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Clinician';
                            return (
                              <option key={doc._id} value={doc._id}>
                                {name} — {doc.specialization} ({doc.department || 'Medicine'}) • ₹{doc.consultationFee}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    {/* Dependent Selection */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-2 flex items-center justify-between">
                        <span>Book for Self or Family Member</span>
                        <Link to="/patient/family" className="text-teal-700 font-normal hover:underline text-[11px]">
                          + Manage Dependents
                        </Link>
                      </label>
                      <select
                        value={familyMemberId}
                        onChange={(e) => setFamilyMemberId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
                      >
                        <option value="">Self (Account Holder)</option>
                        {familyMembers.map((fam) => (
                          <option key={fam._id} value={fam._id}>
                            {fam.fullName} ({fam.relationship})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Step 2: Date & Slot Selection */}
                  <div className="clinical-card p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <Clock size={18} className="text-teal-700" />
                      <h3 className="text-sm font-bold text-slate-900">2. Consultation Schedule & Real-Time Slots</h3>
                    </div>

                    {selectedDoctor && (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="font-bold text-emerald-900">Available: Monday to Sunday (7 Days)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-semibold text-teal-800 bg-white/90 px-2.5 py-1 rounded-lg border border-teal-100 shadow-xs">
                            <Clock size={12} className="text-teal-700" />
                            12h Duty: <strong>{formatDoctorShift(selectedDoctor).shiftRange}</strong> ({formatDoctorShift(selectedDoctor).shiftTag})
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1.5">Consultation Date</label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1.5">Consultation Mode</label>
                        <select
                          value={consultationType}
                          onChange={(e) => setConsultationType(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
                        >
                          <option value="in-person">Hospital Outpatient Visit (In-Person)</option>
                          <option value="video">Telemedicine Video Consult</option>
                          <option value="follow-up">Follow-up Clinical Review</option>
                          <option value="emergency">Urgent Priority Consultation</option>
                        </select>
                      </div>
                    </div>

                    {/* Time Slots Selection */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Available Consultation Time Slots (24/7 Round-the-Clock)
                        </label>
                        {/* Time Period Filter Tabs */}
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                          {(['all', 'morning', 'afternoon', 'evening', 'night'] as const).map((period) => (
                            <button
                              key={period}
                              type="button"
                              onClick={() => setSlotFilter(period)}
                              className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                                slotFilter === period
                                  ? 'bg-white text-teal-800 shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {period === 'all' ? 'All (24h)' : period}
                            </button>
                          ))}
                        </div>
                      </div>

                      {loadingSlots ? (
                        <div className="py-6 text-center text-xs text-slate-400">Verifying 24/7 clinician availability...</div>
                      ) : (
                        (() => {
                          const displaySlots = availableSlots.filter((slot) => {
                            if (slotFilter === 'all') return true;
                            const [timePart, period] = slot.split(' ');
                            let [h] = timePart.split(':').map(Number);
                            if (period === 'PM' && h < 12) h += 12;
                            if (period === 'AM' && h === 12) h = 0;
                            if (slotFilter === 'morning') return h >= 6 && h < 12;
                            if (slotFilter === 'afternoon') return h >= 12 && h < 17;
                            if (slotFilter === 'evening') return h >= 17 && h < 21;
                            if (slotFilter === 'night') return h >= 21 || h < 6;
                            return true;
                          });

                          return displaySlots.length === 0 ? (
                            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-teal-800 flex items-center justify-between">
                              <span>No specific slots in this time period. You can choose any 24h slot:</span>
                              <button
                                type="button"
                                onClick={() => setSlotFilter('all')}
                                className="px-2.5 py-1 bg-teal-700 text-white rounded-lg font-bold text-[10px]"
                              >
                                View All 24h Slots
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
                              {displaySlots.map((slot) => (
                                <button
                                  type="button"
                                  key={slot}
                                  onClick={() => setTimeSlot(slot)}
                                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center border ${
                                    timeSlot === slot
                                      ? 'bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-600/30'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300'
                                  }`}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          );
                        })()
                      )}

                      {/* Selected Slot indicator */}
                      {timeSlot && (
                        <div className="mt-2.5 flex items-center justify-between text-xs p-2 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-900 font-semibold">
                          <span>Selected Consultation Time:</span>
                          <span className="font-extrabold text-teal-800 bg-white px-2.5 py-0.5 rounded-lg border border-teal-200 shadow-xs">
                            {timeSlot}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Clinical Reasons & Symptoms */}
                  <div className="clinical-card p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <FileText size={18} className="text-teal-700" />
                      <h3 className="text-sm font-bold text-slate-900">3. Medical Reason & Symptoms</h3>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Chief Complaint / Reason for Visit *</label>
                      <input
                        type="text"
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Persistent chest tightness, chronic migraines, routine wellness review"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">
                        Symptoms (Type and press Enter)
                      </label>
                      <input
                        type="text"
                        value={symptomsInput}
                        onChange={(e) => setSymptomsInput(e.target.value)}
                        onKeyDown={handleAddSymptom}
                        placeholder="e.g. Fever, Fatigue, Dizziness (Press Enter to add)"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      />
                      {symptomsList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {symptomsList.map((sym) => (
                            <span
                              key={sym}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium"
                            >
                              {sym}
                              <button
                                type="button"
                                onClick={() => handleRemoveSymptom(sym)}
                                className="text-teal-600 hover:text-rose-600 font-bold ml-1"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">
                        Previous Medical History / Doctor Notes (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={medicalNotes}
                        onChange={(e) => setMedicalNotes(e.target.value)}
                        placeholder="Mention any existing medications, prior surgeries or specific queries..."
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Col: Summary & Payment Choice */}
                <div className="space-y-6">
                  {/* Selected Doctor Summary Card */}
                  <div className="clinical-card p-5 space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Consultation Summary</h3>

                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-100 overflow-hidden shrink-0">
                        <img
                          src={doctorUser.profilePicture || `/doctor-photos/doctor1.png`}
                          alt={doctorName}
                          className="h-full w-full object-cover"
                          onError={(e: any) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{doctorName}</h4>
                        <p className="text-xs text-teal-700 font-semibold">{selectedDoctor?.specialization || 'Specialist'}</p>
                        <p className="text-[11px] text-slate-500">{selectedDoctor?.department || 'Department of Medicine'}</p>
                      </div>
                    </div>

                    <div className="py-3 border-y border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date</span>
                        <span className="font-semibold text-slate-800">{new Date(appointmentDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Time Slot</span>
                        <span className="font-semibold text-teal-800">{timeSlot || 'Not chosen'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mode</span>
                        <span className="font-semibold uppercase text-slate-800">{consultationType}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-100">
                        <span className="text-slate-700 font-bold">Consultation Fee</span>
                        <span className="font-extrabold text-base text-slate-900">₹{selectedDoctor?.consultationFee || 600}</span>
                      </div>
                    </div>

                    {/* Payment Mode Selection */}
                    <div className="space-y-2">
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
                          <span className="text-[11px] text-slate-500">Cash, UPI or Card at reception registration desk</span>
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
                          <span className="font-bold text-slate-900 block">Instant Online Payment</span>
                          <span className="text-[11px] text-slate-500">UPI QR / NetBanking / Debit Card checkout</span>
                        </div>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-700 hover:to-teal-900 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-teal-700/20 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Book Appointment</span>
                      <ArrowRight size={15} />
                    </button>

                    <p className="text-[10px] text-center text-slate-400">
                      Free cancellation up to 2 hours prior to scheduled consultation.
                    </p>
                  </div>
                </div>
              </form>
            )}
          </div>
        </main>

        {/* Reconfirmation Modal */}
        {showConfirmationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-teal-100 overflow-hidden animate-scaleUp">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                      <Calendar className="h-5 w-5 text-teal-200" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold">Confirm Appointment Booking</h3>
                      <p className="text-xs text-teal-100/90">Please review your consultation details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConfirmationModal(false)}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-teal-200 hover:text-white transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100/80 space-y-2.5">
                  <div className="flex justify-between items-center py-1.5 border-b border-teal-100/80">
                    <span className="text-slate-500 font-semibold uppercase text-[11px]">Attending Doctor</span>
                    <span className="font-extrabold text-teal-950 text-sm">Dr. {doctorName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-teal-100/80">
                    <span className="text-slate-500 font-semibold uppercase text-[11px]">Specialization</span>
                    <span className="font-bold text-teal-800 bg-white px-2 py-0.5 rounded-md border border-teal-100">
                      {selectedDoctor?.specialization || 'Specialist'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-teal-100/80">
                    <span className="text-slate-500 font-semibold uppercase text-[11px]">Department</span>
                    <span className="font-semibold text-slate-700">{selectedDoctor?.department || 'Clinical Medicine'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-teal-100/80">
                    <span className="text-slate-500 font-semibold uppercase text-[11px]">Consultation Date</span>
                    <span className="font-extrabold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-teal-100 shadow-xs">
                      {new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-teal-100/80">
                    <span className="text-slate-500 font-semibold uppercase text-[11px]">Consultation Time</span>
                    <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-xs">
                      {timeSlot || availableSlots[0] || '10:00 AM'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-teal-100/80">
                    <span className="text-slate-500 font-semibold uppercase text-[11px]">Consultation Mode</span>
                    <span className="font-bold text-slate-800 uppercase">{consultationType}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-semibold uppercase text-[11px]">Consultation Fee</span>
                    <span className="font-black text-slate-900 text-sm">₹{selectedDoctor?.consultationFee || 500}</span>
                  </div>
                </div>

                {reason.trim() && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-700">Reason / Chief Complaint:</p>
                    <p className="text-slate-600 mt-0.5">{reason.trim()}</p>
                  </div>
                )}

                {/* Modal Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmationModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition text-xs"
                  >
                    Review & Edit
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={executeBooking}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-800 text-white font-extrabold hover:from-teal-700 hover:to-teal-900 shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 text-xs"
                  >
                    {submitting ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                        <span>Confirming Booking...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Confirm & Book Appointment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
