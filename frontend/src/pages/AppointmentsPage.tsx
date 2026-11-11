import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BellRing, CalendarDays, CheckCircle2, Clock3, Mail, MessageSquare, ShieldCheck, Star, Stethoscope, Video } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { appointmentAPI, doctorAPI, notificationAPI, patientAPI, type Doctor, type NotificationItem } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Slot {
  startTime: string;
  endTime: string;
}

interface Appointment {
  _id: string;
  appointmentDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  status: string;
  consultationType?: 'in-person' | 'telemedicine';
  rating?: number | null;
  review?: string;
  videoSession?: {
    joinUrl?: string;
    provider?: string;
  };
  doctorId?: {
    _id?: string;
    specialization?: string;
    userId?: {
      name?: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

interface ReviewDraft {
  rating: number;
  review: string;
}

type PaymentMethodOption = 'Online Payment' | 'Pay at Hospital' | '';

interface PaymentAssistantState {
  patientName: string;
  doctorName: string;
  dateTime: string;
  selectedOption: PaymentMethodOption;
  paymentStatus: 'Pending' | 'Completed';
  finalMessage: string;
  amount?: number;
}

interface AppointmentConfirmation {
  patientName: string;
  doctorName: string;
  specialization?: string;
  dateTime: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
}

interface PaymentAssistantPanelProps {
  paymentAssistant: PaymentAssistantState;
  onSelectMethod: (method: Exclude<PaymentMethodOption, ''>) => void;
  onPaymentSubmitted: () => void;
  onClose: () => void;
}

const getStatusBadgeClass = (status?: string) => {
  if (!status) return 'bg-slate-100 text-slate-700';
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'cancelled') return 'bg-rose-100 text-rose-700';
  if (status === 'confirmed' || status === 'scheduled') return 'bg-sky-100 text-sky-700';
  return 'bg-amber-100 text-amber-700';
};

function PaymentAssistantPanel({
  paymentAssistant,
  onSelectMethod,
  onPaymentSubmitted,
  onClose,
}: Readonly<PaymentAssistantPanelProps>) {
  return (
    <section className="relative z-10 mb-6 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Payment Assistant</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xl leading-none text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          aria-label="Close payment assistant"
          title="Close payment assistant"
        >
          ×
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-800">Appointment Details:</p>
        <p className="mt-2">- Name: {paymentAssistant.patientName}</p>
        <p>- Doctor: {paymentAssistant.doctorName}</p>
        <p>- Date &amp; Time: {paymentAssistant.dateTime}</p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-800">Payment Method:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectMethod('Online Payment')}
            className={`rounded-lg px-3 py-2 font-medium transition ${paymentAssistant.selectedOption === 'Online Payment' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'}`}
          >
            Online Payment
          </button>
          <button
            type="button"
            onClick={() => onSelectMethod('Pay at Hospital')}
            className={`rounded-lg px-3 py-2 font-medium transition ${paymentAssistant.selectedOption === 'Pay at Hospital' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'}`}
          >
            Pay at Hospital
          </button>
        </div>
        <p className="mt-3">- Selected Option: {paymentAssistant.selectedOption || 'Not selected yet'}</p>
      </div>

      {paymentAssistant.selectedOption === 'Online Payment' ? (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
          <p className="font-semibold">Scan to pay online</p>
          <p className="mt-1">Use any UPI scanner app to scan this hospital payment QR.</p>
          <div className="mt-3 inline-flex rounded-lg border border-indigo-200 bg-white p-3">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=kushalhospitals@upi&pn=Kushal%20Hospitals&am=${paymentAssistant.amount || 0}&cu=INR`)}`}
              alt="Hospital UPI payment QR code"
              className="h-52 w-52"
            />
          </div>
          <p className="mt-3">Amount: <strong>₹{Number(paymentAssistant.amount || 0).toLocaleString('en-IN')}</strong></p>
          <p className="mt-1 text-xs text-indigo-700">UPI ID: kushalhospitals@upi. Payment remains pending until hospital staff verifies the transaction.</p>
          <button
            type="button"
            onClick={onPaymentSubmitted}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Confirm Payment
          </button>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-800">Payment Status:</p>
        <p className="mt-2">- {paymentAssistant.paymentStatus}</p>
      </div>

      <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
        <p className="font-semibold">Final Message:</p>
        <p className="mt-2">{paymentAssistant.finalMessage}</p>
      </div>
    </section>
  );
}

export default function AppointmentsPage() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const todayDate = new Date().toISOString().slice(0, 10);

  const [patientId, setPatientId] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotLoadFailed, setSlotLoadFailed] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [paymentAssistant, setPaymentAssistant] = useState<PaymentAssistantState | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [appointmentConfirmation, setAppointmentConfirmation] = useState<AppointmentConfirmation | null>(null);
  const [bookingConfirmationOpen, setBookingConfirmationOpen] = useState(false);

  const [form, setForm] = useState({
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    reason: '',
    paymentMethod: 'pay_at_hospital' as 'online' | 'pay_at_hospital',
    consultationType: 'in-person' as 'in-person' | 'telemedicine',
    reminderLeadMinutes: 60,
    reminderChannels: {
      email: true,
      sms: true,
      inApp: true,
    },
  });

  useEffect(() => {
    const queryDoctorId = new URLSearchParams(location.search).get('doctorId') || '';
    if (queryDoctorId) {
      setForm((prev) => ({ ...prev, doctorId: queryDoctorId }));
    }
  }, [location.search]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const res = await notificationAPI.getAll(10);
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {
      // Non-blocking: appointments page should still work if notifications fail.
    }
  }, [user]);

  const fetchAppointments = useCallback(async (roleData?: { patientId?: string; doctorId?: string }) => {
    if (!user) return;

    if (user.role === 'patient' && roleData?.patientId) {
      const res = await appointmentAPI.getAll({ patientId: roleData.patientId });
      setAppointments(res.data?.data || []);
      return;
    }

    if (user.role === 'doctor' && roleData?.doctorId) {
      const res = await appointmentAPI.getAll({ doctorId: roleData.doctorId });
      setAppointments(res.data?.data || []);
      return;
    }

    const res = await appointmentAPI.getAll();
    setAppointments(res.data?.data || []);
  }, [user]);

  useEffect(() => {
    const loadPage = async () => {
      if (!user) return;

      try {
        const doctorsRes = await doctorAPI.getAll(1, '', 40);
        setDoctors(doctorsRes.data?.data || []);

        if (user.role === 'patient') {
          let currentPatientId = '';
          try {
            const patientRes = await patientAPI.getByUserId(user.id);
            currentPatientId = patientRes.data?.data?._id || '';
          } catch {
            currentPatientId = '';
          }

          if (!currentPatientId) {
            const createRes = await patientAPI.create({ userId: user.id });
            currentPatientId = createRes.data?.data?._id || '';
          }

          setPatientId(currentPatientId);
          await fetchAppointments({ patientId: currentPatientId });
        } else if (user.role === 'doctor') {
          const doctorRes = await doctorAPI.getByUserId(user.id);
          const currentDoctorId = doctorRes.data?.doctor?._id || '';
          await fetchAppointments({ doctorId: currentDoctorId });
        } else {
          await fetchAppointments();
        }

        await fetchNotifications();
      } catch {
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [fetchAppointments, fetchNotifications, user]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, startTime: '', endTime: '' }));

    const loadSlots = async () => {
      if (!form.doctorId || !form.appointmentDate) {
        setSlots([]);
        setSlotLoadFailed(false);
        return;
      }

      const generate24h = () => {
        const list: Array<{ startTime: string; endTime: string }> = [];
        for (let t = 0; t + 30 <= 1440; t += 30) {
          const sh = Math.floor(t / 60);
          const sm = t % 60;
          const eh = Math.floor((t + 30) / 60);
          const em = (t + 30) % 60;
          list.push({
            startTime: `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`,
            endTime: `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`,
          });
        }
        return list;
      };

      try {
        const res = await appointmentAPI.getDoctorAvailability(form.doctorId, form.appointmentDate);
        let loaded = res.data?.availableSlots || [];
        if (!loaded || loaded.length === 0) {
          loaded = generate24h();
        }
        setSlots(loaded);
        if (loaded.length > 0) {
          setForm((prev) => ({ ...prev, startTime: loaded[0].startTime, endTime: loaded[0].endTime }));
        }
        setSlotLoadFailed(false);
      } catch {
        const fallback = generate24h();
        setSlots(fallback);
        if (fallback.length > 0) {
          setForm((prev) => ({ ...prev, startTime: fallback[0].startTime, endTime: fallback[0].endTime }));
        }
        setSlotLoadFailed(false);
      }
    };

    loadSlots();
  }, [form.doctorId, form.appointmentDate]);

  const selectedDoctorName = useMemo(() => {
    const selected = doctors.find((d) => d._id === form.doctorId);
    return selected?.userId?.name || `${selected?.userId?.firstName || ''} ${selected?.userId?.lastName || ''}`.trim();
  }, [doctors, form.doctorId]);

  const isDoctorAvailableOnSelectedDate = useMemo(() => {
    if (!form.doctorId || !form.appointmentDate) return true;

    const selectedDoctor = doctors.find((d) => d._id === form.doctorId);
    if (!selectedDoctor) return false;
    const [year, month, day] = form.appointmentDate.split('-').map(Number);
    const selectedDay = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: 'UTC',
    });
    const configuredDays = selectedDoctor.availableDays || selectedDoctor.availability?.map((item) => item.day) || [];
    return configuredDays.length === 0 || configuredDays.includes(selectedDay);
  }, [doctors, form.appointmentDate, form.doctorId]);

  useEffect(() => {
    if (!form.doctorId || !form.appointmentDate || isDoctorAvailableOnSelectedDate) return;

    const selectedDoctor = doctors.find((doctor) => doctor._id === form.doctorId);
    const configuredDays = selectedDoctor?.availableDays || selectedDoctor?.availability?.map((item) => item.day) || [];
    if (configuredDays.length === 0) return;

    const nextDate = new Date(`${form.appointmentDate}T00:00:00`);
    for (let offset = 1; offset <= 7; offset += 1) {
      nextDate.setDate(nextDate.getDate() + 1);
      const dayName = nextDate.toLocaleDateString('en-US', { weekday: 'long' });
      if (configuredDays.includes(dayName)) {
        const nextDateValue = [
          nextDate.getFullYear(),
          String(nextDate.getMonth() + 1).padStart(2, '0'),
          String(nextDate.getDate()).padStart(2, '0'),
        ].join('-');
        setForm((previous) => ({
          ...previous,
          appointmentDate: nextDateValue,
          startTime: '',
          endTime: '',
        }));
        toast(`Selected date is outside this doctor's schedule. Showing the next available date: ${nextDateValue}.`);
        break;
      }
    }
  }, [doctors, form.appointmentDate, form.doctorId, isDoctorAvailableOnSelectedDate]);

  const visibleSlots = useMemo(() => {
    if (slots.length > 0) {
      return slots;
    }

    return [];
  }, [slots]);

  const initializeReviewDraft = (appointmentId: string, existingRating?: number | null, existingReview?: string) => {
    setReviewDrafts((prev) => {
      if (prev[appointmentId]) return prev;

      return {
        ...prev,
        [appointmentId]: {
          rating: existingRating && existingRating > 0 ? existingRating : 5,
          review: existingReview || '',
        },
      };
    });
  };

  const updateReviewDraft = (appointmentId: string, patch: Partial<ReviewDraft>) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [appointmentId]: {
        rating: prev[appointmentId]?.rating || 5,
        review: prev[appointmentId]?.review || '',
        ...patch,
      },
    }));
  };

  const handleSubmitReview = async (appointmentId: string) => {
    const draft = reviewDrafts[appointmentId];
    if (!draft) {
      toast.error('Please select a rating');
      return;
    }

    try {
      await appointmentAPI.submitReview(appointmentId, {
        rating: draft.rating,
        review: draft.review,
      });

      toast.success('Review submitted successfully');

      if (user?.role === 'patient' && patientId) {
        await fetchAppointments({ patientId });
      } else {
        await fetchAppointments();
      }
    } catch {
      toast.error('Failed to submit review');
    }
  };

  const handleJoinVideo = async (appointment: Appointment) => {
    try {
      const res = await appointmentAPI.createVideoSession(appointment._id, { provider: 'webrtc' });
      const joinUrl = res.data?.session?.joinUrl;

      if (!joinUrl) {
        toast.error('Video link unavailable');
        return;
      }

      globalThis.open(joinUrl, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Failed to create video session');
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markRead(notificationId);
      setNotifications((prev) => prev.map((item) => (item._id === notificationId ? { ...item, isRead: true } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();

    let activeStart = form.startTime;
    let activeEnd = form.endTime;
    if (!activeStart && slots.length > 0) {
      activeStart = slots[0].startTime;
      activeEnd = slots[0].endTime;
      setForm((prev) => ({ ...prev, startTime: activeStart, endTime: activeEnd }));
    }
    if (!activeEnd && activeStart) {
      const [sh, sm] = activeStart.split(':').map(Number);
      const endTot = ((sh || 0) * 60 + (sm || 0) + 30) % 1440;
      activeEnd = `${String(Math.floor(endTot / 60)).padStart(2, '0')}:${String(endTot % 60).padStart(2, '0')}`;
      setForm((prev) => ({ ...prev, endTime: activeEnd }));
    }

    if (!form.doctorId) {
      toast.error('Please select an attending clinician');
      return;
    }
    if (!form.appointmentDate) {
      toast.error('Please choose an appointment date');
      return;
    }
    if (!activeStart) {
      toast.error('Please choose an available consultation time slot');
      return;
    }

    try {
      if (!patientId) {
        const createdProfile = await patientAPI.create({ userId: user?.id });
        const nextPatientId = createdProfile.data?.data?._id || '';
        setPatientId(nextPatientId);
        if (!nextPatientId) {
          toast.error('Patient profile could not be created');
          return;
        }
      }
    } catch {
      toast.error('Unable to create patient profile for booking');
      return;
    }

    setBookingConfirmationOpen(true);
  };

  const handleConfirmBooking = async () => {
    setBookingConfirmationOpen(false);

    try {
      const selDoc = doctors.find((d) => d._id === form.doctorId);
      const doctorNameForBooking = selectedDoctorName || 'Doctor';
      const doctorSpecialization = selDoc?.specialization || 'Clinical Specialist';
      const patientNameForBooking = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Patient';
      const activeStart = form.startTime || (slots[0]?.startTime || '10:00');
      let activeEnd = form.endTime || (slots[0]?.endTime || '');
      if (!activeEnd) {
        const [sh, sm] = activeStart.split(':').map(Number);
        const endTot = ((sh || 0) * 60 + (sm || 0) + 30) % 1440;
        activeEnd = `${String(Math.floor(endTot / 60)).padStart(2, '0')}:${String(endTot % 60).padStart(2, '0')}`;
      }
      const dateTimeForBooking = `${form.appointmentDate} at ${activeStart} - ${activeEnd}`;

      const response = await appointmentAPI.book({
        patientId,
        doctorId: form.doctorId,
        appointmentDate: form.appointmentDate,
        startTime: activeStart,
        endTime: activeEnd,
        reason: form.reason || 'General Clinical Consultation',
        consultationType: form.consultationType,
        reminderLeadMinutes: form.reminderLeadMinutes,
        reminderChannels: form.reminderChannels,
        status: 'pending',
        paymentMethod: form.paymentMethod,
      });

      const isCash = form.paymentMethod === 'pay_at_hospital';
      toast.success(isCash ? 'Appointment confirmed. Pay at hospital.' : 'Appointment created. Online payment is pending verification.');
      setPaymentAssistant({
        patientName: patientNameForBooking,
        doctorName: doctorNameForBooking,
        dateTime: dateTimeForBooking,
        selectedOption: isCash ? 'Pay at Hospital' : 'Online Payment',
        paymentStatus: 'Pending',
        finalMessage: isCash
          ? `Your appointment is confirmed. Please pay the consultation fee of ₹${Number(response.data?.billing?.summary?.totalAmount || 0).toLocaleString('en-IN')} at the hospital reception.`
          : 'Scan the QR code below to pay online. Your payment will remain pending until hospital staff verifies the transaction.',
        amount: Number(response.data?.billing?.summary?.totalAmount || 0),
      });

      setAppointmentConfirmation({
        patientName: patientNameForBooking,
        doctorName: doctorNameForBooking,
        specialization: doctorSpecialization,
        dateTime: dateTimeForBooking,
        paymentMethod: isCash ? 'Pay at Hospital Counter' : 'Online Payment',
        paymentStatus: 'Confirmed ✓',
        amount: Number(response.data?.billing?.summary?.totalAmount || 0),
      });

      setPaymentModalOpen(!isCash);
      if (!isCash && response.data?.billing?._id) {
        toast.success('Scan the QR code to complete online payment.');
      }
      setForm({
        doctorId: form.doctorId,
        appointmentDate: '',
        startTime: '',
        endTime: '',
        reason: '',
        paymentMethod: 'pay_at_hospital',
        consultationType: form.consultationType,
        reminderLeadMinutes: form.reminderLeadMinutes,
        reminderChannels: form.reminderChannels,
      });
      setSlots([]);
      await fetchAppointments({ patientId });
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Booking failed');
    }
  };

  const handleSelectPaymentMethod = (method: Exclude<PaymentMethodOption, ''>) => {
    setPaymentAssistant((current) => {
      if (!current) return current;

      if (method === 'Pay at Hospital') {
        return {
          ...current,
          selectedOption: method,
          paymentStatus: 'Pending',
          finalMessage: 'Your appointment is confirmed. Please pay at the hospital during your visit.',
        };
      }

      return {
        ...current,
        selectedOption: method,
        paymentStatus: 'Pending',
        finalMessage: 'Scan the QR code below, then submit the payment for hospital verification.',
      };

    });
  };

  const handlePaymentSubmitted = () => {
    if (!paymentAssistant) return;
    setPaymentAssistant((current) => current ? {
      ...current,
      paymentStatus: 'Pending',
      finalMessage: 'Payment submitted for verification. The appointment will be confirmed after hospital staff verifies the transaction.',
    } : current);
    setAppointmentConfirmation({
      patientName: paymentAssistant.patientName,
      doctorName: paymentAssistant.doctorName,
      dateTime: paymentAssistant.dateTime,
      paymentMethod: 'Online Payment',
      paymentStatus: 'Pending verification',
      amount: paymentAssistant.amount || 0,
    });
    setPaymentModalOpen(false);
    toast('Payment is pending hospital verification.');
  };

  const closePaymentAssistant = () => {
    setPaymentModalOpen(false);
    setPaymentAssistant(null);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-teal-200/20 blur-3xl" />
          <div className="pointer-events-none absolute top-44 -left-20 h-72 w-72 rounded-full bg-cyan-200/20 blur-3xl" />

          <section className="relative z-10 mb-6 rounded-3xl border border-teal-800/30 bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-2.5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20 text-teal-100">
                  <ShieldCheck size={14} className="text-teal-300" /> Patient Care Scheduler
                </p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Appointments</h1>
                <p className="mt-2 max-w-xl text-sm text-teal-100/90 leading-relaxed">
                  Manage bookings, receive timely clinical reminders, and join secure telemedicine consultations in one place.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-md border border-white/20 text-center min-w-[120px]">
                  <p className="text-xs text-teal-200 font-semibold uppercase tracking-wider">Total Visits</p>
                  <p className="text-xl font-bold text-white mt-0.5">{appointments.length}</p>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-md border border-white/20 text-center min-w-[120px]">
                  <p className="text-xs text-teal-200 font-semibold uppercase tracking-wider">Unread Alerts</p>
                  <p className="text-xl font-bold text-white mt-0.5">{unreadCount}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="relative z-10 rounded-2xl border border-slate-200/80 bg-white shadow-clinical p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-slate-800 inline-flex items-center gap-2">
                <BellRing size={18} className="text-cyan-700" /> Notifications
              </h2>
              <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-sm font-medium">
                {unreadCount} unread
              </span>
            </div>

            {notifications.length === 0 ? <p className="text-slate-500">No notifications yet</p> : null}

            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div key={notification._id} className={`rounded-xl border p-3 ${notification.isRead ? 'border-slate-200 bg-white' : 'border-cyan-200 bg-cyan-50/80'}`}>
                    <p className="font-medium text-slate-800">{notification.title}</p>
                    <p className="text-sm text-slate-600">{notification.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                      {notification.isRead ? null : (
                        <button
                          type="button"
                          className="text-xs font-medium text-cyan-700 hover:text-cyan-900"
                          onClick={() => markNotificationAsRead(notification._id)}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {user?.role === 'patient' ? (
            <form onSubmit={handleBook} className="relative z-10 mb-6 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <Stethoscope size={18} className="text-cyan-700" />
                <h2 className="text-xl font-semibold text-slate-800">Book New Appointment</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="doctorId" className="mb-2 block text-sm font-medium text-slate-700">Doctor</label>
                <select
                  id="doctorId"
                  title="Doctor"
                  value={form.doctorId}
                  onChange={(e) => setForm((prev) => ({ ...prev, doctorId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  required
                >
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.userId?.name || `${doctor.userId?.firstName || ''} ${doctor.userId?.lastName || ''}`.trim()} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="appointmentDate" className="mb-2 block text-sm font-medium text-slate-700">Date</label>
                <input
                  id="appointmentDate"
                  type="date"
                  title="Date"
                  value={form.appointmentDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, appointmentDate: e.target.value }))}
                  min={todayDate}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="startTime" className="mb-2 block text-sm font-medium text-slate-700">Available Slots</label>
                <select
                  id="startTime"
                  title="Available Slots"
                  value={form.startTime}
                  onChange={(e) => {
                    const slot = visibleSlots.find((s) => s.startTime === e.target.value);
                    setForm((prev) => ({ ...prev, startTime: e.target.value, endTime: slot?.endTime || '' }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  required
                >
                  <option value="">Select slot</option>
                  {visibleSlots.map((slot) => (
                    <option key={slot.startTime} value={slot.startTime}>
                      {slot.startTime} - {slot.endTime}
                    </option>
                  ))}
                </select>
                {slotLoadFailed ? (
                  <p className="mt-2 text-xs text-rose-600 inline-flex items-center gap-1"><Clock3 size={12} /> Unable to load live availability. Please retry.</p>
                ) : null}
                {!slotLoadFailed && form.doctorId && form.appointmentDate && slots.length === 0 ? (
                  <p className="mt-2 text-xs text-amber-600 inline-flex items-center gap-1"><Clock3 size={12} /> No available slots for this date.</p>
                ) : null}
                {isDoctorAvailableOnSelectedDate ? null : (
                  <p className="mt-2 text-xs text-rose-600">Selected doctor is not available on this day. Please choose another date.</p>
                )}
              </div>

              <div>
                <label htmlFor="reason" className="mb-2 block text-sm font-medium text-slate-700">Reason</label>
                <input
                  id="reason"
                  type="text"
                  title="Reason"
                  value={form.reason}
                  onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  placeholder="Consultation reason"
                  required
                />
              </div>

              <div>
                <label htmlFor="consultationType" className="mb-2 block text-sm font-medium text-slate-700">Consultation Type</label>
                <select
                  id="consultationType"
                  value={form.consultationType}
                  onChange={(e) => setForm((prev) => ({ ...prev, consultationType: e.target.value as 'in-person' | 'telemedicine' }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="in-person">In-person</option>
                  <option value="telemedicine">Video consultation (WebRTC)</option>
                </select>
              </div>

              <div>
                <label htmlFor="reminderLeadMinutes" className="mb-2 block text-sm font-medium text-slate-700">Reminder Before Appointment</label>
                <select
                  id="reminderLeadMinutes"
                  value={form.reminderLeadMinutes}
                  onChange={(e) => setForm((prev) => ({ ...prev, reminderLeadMinutes: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={1440}>1 day</option>
                </select>
              </div>

              <div className="md:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="mb-3 text-sm font-medium text-slate-700">Choose payment method</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className={`cursor-pointer rounded-xl border p-3 ${form.paymentMethod === 'online' ? 'border-indigo-500 bg-white ring-2 ring-indigo-100' : 'border-slate-200 bg-white'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={form.paymentMethod === 'online'}
                      onChange={() => setForm((prev) => ({ ...prev, paymentMethod: 'online' }))}
                      className="mr-2"
                    />
                    <span className="font-semibold text-slate-800">Pay Online</span>
                    <p className="mt-1 text-xs text-slate-500">UPI, cards, and net banking through the configured gateway.</p>
                  </label>
                  <label className={`cursor-pointer rounded-xl border p-3 ${form.paymentMethod === 'pay_at_hospital' ? 'border-emerald-500 bg-white ring-2 ring-emerald-100' : 'border-slate-200 bg-white'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pay_at_hospital"
                      checked={form.paymentMethod === 'pay_at_hospital'}
                      onChange={() => setForm((prev) => ({ ...prev, paymentMethod: 'pay_at_hospital' }))}
                      className="mr-2"
                    />
                    <span className="font-semibold text-slate-800">Pay at Hospital</span>
                    <p className="mt-1 text-xs text-slate-500">Confirm now and pay cash at reception during your visit.</p>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
                <p className="mb-3 block text-sm font-medium text-slate-700 inline-flex items-center gap-2"><BellRing size={14} /> Reminder Channels</p>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.reminderChannels.email}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        reminderChannels: { ...prev.reminderChannels, email: e.target.checked },
                      }))}
                    />
                    <Mail size={14} className="text-cyan-700" />
                    <span>Email</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.reminderChannels.sms}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        reminderChannels: { ...prev.reminderChannels, sms: e.target.checked },
                      }))}
                    />
                    <MessageSquare size={14} className="text-cyan-700" />
                    <span>SMS</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.reminderChannels.inApp}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        reminderChannels: { ...prev.reminderChannels, inApp: e.target.checked },
                      }))}
                    />
                    <BellRing size={14} className="text-cyan-700" />
                    <span>In-app Notification</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-md transition hover:from-cyan-700 hover:to-blue-700">
                  Book Appointment with {selectedDoctorName || 'Doctor'}
                </button>
              </div>
              </div>
            </form>
          ) : null}

          {bookingConfirmationOpen ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-slate-900">Confirm Appointment</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Are you sure you want to book an appointment with {selectedDoctorName || 'the selected doctor'} on {form.appointmentDate} from {form.startTime} to {form.endTime}?
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingConfirmationOpen(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    No, Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
                  >
                    Yes, Book Appointment
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {paymentAssistant ? (
            <PaymentAssistantPanel
              paymentAssistant={paymentAssistant}
              onSelectMethod={handleSelectPaymentMethod}
              onPaymentSubmitted={handlePaymentSubmitted}
              onClose={closePaymentAssistant}
            />
          ) : null}

          {paymentModalOpen && paymentAssistant ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
              <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="absolute right-4 top-4 z-10 rounded-full border border-slate-200 bg-white px-3 py-1 text-lg text-slate-500 shadow-sm hover:bg-slate-50"
                  aria-label="Close payment scanner"
                >
                  ×
                </button>
                <PaymentAssistantPanel
                  paymentAssistant={paymentAssistant}
                  onSelectMethod={handleSelectPaymentMethod}
                  onPaymentSubmitted={handlePaymentSubmitted}
                  onClose={closePaymentAssistant}
                />
              </div>
            </div>
          ) : null}

          {appointmentConfirmation ? (
            <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
              <section className="w-full max-w-xl rounded-3xl border-2 border-emerald-400/50 bg-white p-6 sm:p-8 text-center shadow-2xl">
                {/* Big Green Animated Tick Mark */}
                <div className="relative mx-auto h-20 w-20 mb-4">
                  <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-25 animate-ping" />
                  <div className="relative h-20 w-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 size={48} className="stroke-[2.5]" />
                  </div>
                </div>

                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-200">
                  Appointment Confirmed
                </span>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Appointment Successfully Booked!</h2>
                <p className="mt-1 text-xs text-slate-500">Your consultation is registered with Kushal Hospitals.</p>

                <div className="mx-auto mt-5 space-y-2.5 rounded-2xl bg-gradient-to-b from-slate-50 to-teal-50/40 p-5 text-left text-xs border border-slate-200 shadow-inner">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold uppercase text-[11px]">Doctor Name:</span>
                    <strong className="text-sm font-black text-teal-950">Dr. {appointmentConfirmation.doctorName}</strong>
                  </div>
                  {appointmentConfirmation.specialization && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-semibold uppercase text-[11px]">Specialization:</span>
                      <strong className="text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200 font-bold">
                        {appointmentConfirmation.specialization}
                      </strong>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold uppercase text-[11px]">Date & Time:</span>
                    <strong className="text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200 font-bold">
                      {appointmentConfirmation.dateTime}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold uppercase text-[11px]">Patient:</span>
                    <strong className="text-slate-800">{appointmentConfirmation.patientName}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-semibold uppercase text-[11px]">Consultation Fee:</span>
                    <strong className="text-slate-900 font-extrabold">₹{appointmentConfirmation.amount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-semibold uppercase text-[11px]">Booking Status:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Confirmed ✓
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAppointmentConfirmation(null)}
                  className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-8 py-3 text-xs font-bold text-white shadow-md shadow-teal-700/20 transition-all"
                >
                  <CalendarDays size={15} />
                  Done / View Appointments
                </button>
              </section>
            </div>
          ) : null}

          <div className="relative z-10 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-semibold text-slate-800">
              <CalendarDays size={18} className="text-cyan-700" /> Appointment History
            </h2>
            {loading ? <p className="text-slate-500">Loading...</p> : null}

            {!loading && appointments.length === 0 ? <p className="text-slate-500">No appointments found</p> : null}

            {!loading && appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment._id} className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-cyan-50/40 p-4 shadow-sm transition hover:shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {appointment.doctorId?.userId?.name || `${appointment.doctorId?.userId?.firstName || ''} ${appointment.doctorId?.userId?.lastName || ''}`.trim()}
                      </p>
                      <p className="text-sm text-slate-600 inline-flex items-center gap-1">
                        <Clock3 size={14} className="text-cyan-700" />
                        {(appointment.appointmentDate || appointment.date || '').toString().slice(0, 10)} {appointment.startTime} - {appointment.endTime}
                      </p>
                      <p className="text-sm text-slate-500">{appointment.reason}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-700 capitalize">
                        {appointment.consultationType === 'telemedicine' ? <Video size={12} /> : <Stethoscope size={12} />}
                        {appointment.consultationType || 'in-person'}
                      </p>

                      {appointment.rating ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700"><Star size={12} className="fill-amber-400 text-amber-500" /> Your rating: {appointment.rating}/5</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusBadgeClass(appointment.status)}`}>
                        {appointment.status}
                      </span>

                      {appointment.consultationType === 'telemedicine' ? (
                        <button
                          type="button"
                          onClick={() => handleJoinVideo(appointment)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-sm text-white transition hover:bg-indigo-700"
                        >
                          <Video size={14} />
                          Join Video
                        </button>
                      ) : null}

                      {user?.role === 'patient' && appointment.status === 'completed' ? (
                        <div className="w-full md:w-72 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                          <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><Star size={12} /> Rate this doctor</p>
                          <select
                            title="Appointment rating"
                            className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-sm"
                            value={reviewDrafts[appointment._id]?.rating || appointment.rating || 5}
                            onChange={(e) => {
                              initializeReviewDraft(appointment._id, appointment.rating, appointment.review);
                              updateReviewDraft(appointment._id, { rating: Number(e.target.value) });
                            }}
                          >
                            <option value={5}>5 - Excellent</option>
                            <option value={4}>4 - Very good</option>
                            <option value={3}>3 - Good</option>
                            <option value={2}>2 - Fair</option>
                            <option value={1}>1 - Poor</option>
                          </select>
                          <textarea
                            className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-sm"
                            rows={2}
                            placeholder="Write a short review"
                            value={reviewDrafts[appointment._id]?.review ?? appointment.review ?? ''}
                            onChange={(e) => {
                              initializeReviewDraft(appointment._id, appointment.rating, appointment.review);
                              updateReviewDraft(appointment._id, { review: e.target.value });
                            }}
                          />
                          <button
                            type="button"
                            className="mt-2 w-full rounded-lg bg-emerald-600 px-2 py-1 text-sm text-white transition hover:bg-emerald-700"
                            onClick={() => handleSubmitReview(appointment._id)}
                          >
                            Submit Review
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
