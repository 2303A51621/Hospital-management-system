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
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI, doctorAPI } from '../../services/api';
import { formatDoctorShift, generateDoctor12HourSlots } from '../../utils/doctorAvailability';
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

  // Load available slots whenever selected doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !appointmentDate) return;

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        const res = await patientPortalAPI.getDoctorSlots(selectedDoctorId, appointmentDate);
        const resData: any = res.data;
        const slots = resData?.slots || resData?.data?.slots || resData?.availableSlots || [];
        if (slots.length > 0) {
          setAvailableSlots(slots);
          setTimeSlot(slots[0]);
        } else {
          const doc = doctors.find((d) => d._id === selectedDoctorId);
          const fallbackSlots = generateDoctor12HourSlots(doc?.availableSlots?.startTime, doc?.availableSlots?.endTime);
          setAvailableSlots(fallbackSlots);
          setTimeSlot(fallbackSlots[0] || '');
        }
      } catch (err: any) {
        const doc = doctors.find((d) => d._id === selectedDoctorId);
        const fallbackSlots = generateDoctor12HourSlots(doc?.availableSlots?.startTime, doc?.availableSlots?.endTime);
        setAvailableSlots(fallbackSlots);
        setTimeSlot(fallbackSlots[0] || '');
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

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      toast.error('Please select an attending clinician');
      return;
    }
    if (!appointmentDate) {
      toast.error('Please select an appointment date');
      return;
    }
    if (!timeSlot) {
      toast.error('Please choose an available consultation time slot');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please provide a reason or chief complaint for your visit');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        doctorId: selectedDoctorId,
        appointmentDate,
        timeSlot,
        type: consultationType,
        reason: reason.trim(),
        symptoms: symptomsList,
        medicalHistoryNotes: medicalNotes.trim(),
        paymentMode,
      };
      if (familyMemberId) {
        payload.familyMemberId = familyMemberId;
      }

      const res = await patientPortalAPI.bookAppointment(payload);
      toast.success(res.data?.message || 'Appointment confirmed successfully!');
      setBookingSuccess(res.data?.data);
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
              /* Success Confirmation Card */
              <div className="clinical-card p-8 text-center max-w-2xl mx-auto space-y-6 animate-fadeIn">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Booking Confirmed</span>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">Appointment Registered</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your consultation with {doctorName} has been recorded in the Kushal Hospitals EMR system.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Appointment ID</span>
                    <span className="font-mono font-bold text-slate-800">{bookingSuccess.appointmentId || bookingSuccess._id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Clinician</span>
                    <span className="font-bold text-teal-800">{doctorName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Date & Slot</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(bookingSuccess.appointmentDate || appointmentDate).toLocaleDateString()} at {bookingSuccess.timeSlot || timeSlot}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Consultation Mode</span>
                    <span className="font-semibold uppercase text-slate-800">{bookingSuccess.type || consultationType}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Payment Status</span>
                    <span className="font-bold text-emerald-700">
                      {bookingSuccess.paymentStatus === 'paid' ? 'Paid Online' : 'Pay at Reception Counter'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link
                    to="/patient/appointments"
                    className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-700/20"
                  >
                    View in My Appointments
                  </Link>
                  <button
                    onClick={() => {
                      setBookingSuccess(null);
                      setReason('');
                      setSymptomsList([]);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700"
                  >
                    Book Another Visit
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

                    {/* Time Slots Chips */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-2">Available Time Slots for Selected Date</label>
                      {loadingSlots ? (
                        <div className="py-4 text-center text-xs text-slate-400">Verifying clinician availability...</div>
                      ) : availableSlots.length === 0 ? (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                          No open slots on this date. The clinician may be off-duty or fully booked. Please choose another date.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              type="button"
                              key={slot}
                              onClick={() => setTimeSlot(slot)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center border ${
                                timeSlot === slot
                                  ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-300'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
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
                      disabled={submitting || !timeSlot}
                      className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white text-xs font-bold shadow-lg shadow-teal-700/20 transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Confirming with Hospital EMR...' : 'Confirm Appointment'}
                      <ArrowRight size={14} />
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
      </div>
    </div>
  );
}
