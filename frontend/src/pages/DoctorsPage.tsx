import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock3, Filter, MapPin, Mail, MessageSquare, Search, Star, Stethoscope } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { doctorAPI, type Doctor, type DoctorReview } from '../services/api';
import { useAuthStore } from '../store/authStore';

const SPECIALIZATION_OPTIONS = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Dermatology',
  'ENT',
  'General Surgery',
  'General Physician',
  'Pediatrics',
  'Gynecology',
  'Psychiatry',
  'Oncology',
  'Radiology',
  'Pathology',
];

const SPECIALIZATION_SERVICES: Record<string, { service: string; clinic: string; tags: string[] }> = {
  Cardiology: { service: 'Heart disease treatment and cardiac consultations', clinic: 'Cardiac Care Clinic', tags: ['ECG', 'Heart health', 'Hypertension'] },
  Neurology: { service: 'Migraine, epilepsy and nerve disorder care', clinic: 'Neuro Care Clinic', tags: ['Migraine', 'Stroke care', 'Nerve health'] },
  Orthopedics: { service: 'Joint, bone and sports injury treatment', clinic: 'Bone & Joint Clinic', tags: ['Joint pain', 'Fracture care', 'Sports injury'] },
  Dermatology: { service: 'Hair loss, acne and skin treatment', clinic: 'Cosmetic Clinic', tags: ['Hair loss', 'Acne care', 'Skin health'] },
  ENT: { service: 'Ear, nose, throat and sinus treatment', clinic: 'ENT & Sinus Clinic', tags: ['Sinus care', 'Hearing', 'Throat care'] },
  'General Surgery': { service: 'Minor surgeries and surgical consultations', clinic: 'General Surgery Clinic', tags: ['Day surgery', 'Wound care', 'Consultation'] },
  'General Physician': { service: 'Fever, infections and complete health checkups', clinic: 'General Medicine Clinic', tags: ['Fever care', 'Checkup', 'Diabetes'] },
  Pediatrics: { service: 'Child health, growth and vaccination care', clinic: 'Child Care Clinic', tags: ['Child health', 'Vaccination', 'Growth care'] },
  Gynecology: { service: 'Women’s health, pregnancy and fertility care', clinic: 'Women’s Health Clinic', tags: ['Pregnancy', 'Fertility', 'Women’s health'] },
  Psychiatry: { service: 'Mental health, anxiety and stress treatment', clinic: 'Mind Care Clinic', tags: ['Anxiety', 'Stress care', 'Counselling'] },
  Oncology: { service: 'Cancer screening and oncology consultations', clinic: 'Cancer Care Clinic', tags: ['Screening', 'Cancer care', 'Second opinion'] },
  Radiology: { service: 'Diagnostic imaging and scan consultations', clinic: 'Diagnostic Imaging Clinic', tags: ['MRI', 'CT scan', 'Imaging'] },
  Pathology: { service: 'Laboratory testing and diagnostic reports', clinic: 'Laboratory Clinic', tags: ['Blood tests', 'Reports', 'Diagnostics'] },
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialization, setSpecialization] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewsByDoctor, setReviewsByDoctor] = useState<Record<string, DoctorReview[]>>({});
  const [loadingReviewsFor, setLoadingReviewsFor] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const getReviewerName = (review: DoctorReview) => {
    return review.userId?.name || `${review.userId?.firstName || ''} ${review.userId?.lastName || ''}`.trim() || 'Anonymous patient';
  };

  const loadDoctorReviews = async (doctorId: string) => {
    if (reviewsByDoctor[doctorId] !== undefined) {
      setReviewsByDoctor((prev) => {
        const { [doctorId]: _removed, ...rest } = prev;
        return rest;
      });
      return;
    }

    try {
      setLoadingReviewsFor(doctorId);
      const res = await doctorAPI.getReviews(doctorId, 1, 3);
      setReviewsByDoctor((prev) => ({ ...prev, [doctorId]: res.data?.reviews || [] }));
    } finally {
      setLoadingReviewsFor(null);
    }
  };

  const getReviewToggleLabel = (doctorId: string) => {
    if (loadingReviewsFor === doctorId) return 'Loading reviews...';
    if (reviewsByDoctor[doctorId] === undefined) return 'View reviews';
    return 'Hide reviews';
  };

  const matchedDoctorsCount = doctors.length;
  const visibleDoctors = doctors.filter((doctor) => {
    const details = SPECIALIZATION_SERVICES[doctor.specialization];
    const doctorName = doctor.userId?.name || `${doctor.userId?.firstName || ''} ${doctor.userId?.lastName || ''}`;
    const searchableText = [
      doctorName,
      doctor.specialization,
      doctor.department,
      doctor.qualification?.join(' '),
      details?.service,
      details?.clinic,
      details?.tags.join(' '),
    ].filter(Boolean).join(' ').toLowerCase();
    return searchableText.includes(searchQuery.trim().toLowerCase());
  });

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await doctorAPI.getAll(1, specialization, 40);
        setDoctors(res.data?.data || []);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    loadDoctors();
  }, [specialization]);

  return (
    <div className="flex h-screen bg-[#edf6ff]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 md:p-6">
          <div className="pointer-events-none absolute -top-16 -right-14 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="pointer-events-none absolute top-44 -left-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />

          <section className="relative z-10 mb-6 rounded-2xl border border-cyan-100 bg-gradient-to-r from-[#0f6ba8] via-[#0a7ebd] to-[#14a3c7] p-6 text-white shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium tracking-wide">
                  <Stethoscope size={14} /> Specialist Directory
                </p>
                <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
                <p className="mt-2 max-w-2xl text-sm text-cyan-50">
                  Discover experienced clinicians across departments, check ratings, and book appointments with confidence.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                  <p className="text-cyan-100">Available Doctors</p>
                  <p className="text-lg font-semibold">{matchedDoctorsCount}</p>
                </div>
                <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                  <p className="text-cyan-100">Selected Filter</p>
                  <p className="text-lg font-semibold">{specialization || 'All'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="relative z-10 mb-6 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 inline-flex items-center gap-2">
                  <Filter size={16} className="text-cyan-700" /> Filter Doctors
                </h2>
                <p className="mt-1 text-sm text-slate-500">Choose a specialization to narrow the doctor list.</p>
              </div>

              <div className="w-full md:w-[28rem]">
                <label htmlFor="specialization" className="sr-only">
                  Filter doctors by specialization
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-700" />
                    <input
                      id="doctor-search"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search doctor, specialty, department..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                    />
                  </div>
                  <select
                    id="specialization"
                    title="Doctor specialization filter"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  >
                    <option value="">All Specializations</option>
                    {SPECIALIZATION_OPTIONS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {loading ? <div className="relative z-10 rounded-2xl border border-sky-100 bg-white p-6 text-slate-600 shadow-sm">Loading doctors...</div> : null}

          {loading ? null : (
            <div className="relative z-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visibleDoctors.map((doctor) => (
                <article key={doctor._id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  {(() => {
                    const doctorName = doctor.userId?.name || `${doctor.userId?.firstName || ''} ${doctor.userId?.lastName || ''}`.trim();
                      const details = SPECIALIZATION_SERVICES[doctor.specialization] || {
                        service: `${doctor.specialization} specialist consultations`,
                        clinic: `${doctor.specialization} Clinic`,
                        tags: ['Specialist care', 'Consultation', 'Health advice'],
                      };
                      const rating = Number(doctor.rating || 0);
                      const ratingPercent = Math.round((rating / 5) * 100);
                      return (
                        <>
                          <div className="flex gap-4 p-5 pb-3">
                        <img
                          src={doctor.userId?.profilePicture || '/doctor-photos/doctor01.png'}
                          alt={`${doctorName} profile`}
                          className="h-28 w-24 shrink-0 rounded-xl border border-slate-200 object-cover shadow-sm"
                        />
                            <div className="min-w-0">
                              <h3 className="text-lg font-bold text-cyan-700">Dr. {doctorName}</h3>
                              <p className="text-sm font-medium text-slate-700">{(doctor.qualification || ['MBBS']).join(', ')} - {doctor.specialization}</p>
                              <p className="mt-1 text-sm text-slate-600">{doctor.experience || 0} years experience</p>
                              <p className="mt-2 text-sm font-medium text-slate-800">{details.service}</p>
                              <p className="text-xs font-semibold text-slate-600">{details.clinic}</p>
                            </div>
                          </div>
                          <div className="border-t border-slate-100 px-5 py-3">
                            <div className="flex flex-wrap gap-2">
                              {details.tags.map((tag) => <span key={tag} className="rounded-md bg-cyan-50 px-2 py-1 text-[11px] font-medium text-cyan-700">{tag}</span>)}
                            </div>
                            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                              <span className="inline-flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-500" /><strong className="text-emerald-600">{ratingPercent}%</strong> ({doctor.totalReviews || 0} reviews)</span>
                              <span className="inline-flex items-center gap-1"><MessageSquare size={14} className="text-cyan-700" /> Recent patient feedback available</span>
                              <span className="inline-flex items-center gap-1"><MapPin size={14} className="text-cyan-700" /> Kushal Hospitals, Bangalore</span>
                              <span className="inline-flex items-center gap-1"><Mail size={14} className="text-cyan-700" /> {doctor.userId?.email}</span>
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-700"><Stethoscope size={14} /> ₹{Number(doctor.consultationFee || 0).toLocaleString('en-IN')} consultation</span>
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><Clock3 size={14} /> Available today</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    <button
                    type="button"
                    className="mx-5 mt-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                    onClick={() => loadDoctorReviews(doctor._id)}
                  >
                    {getReviewToggleLabel(doctor._id)}
                  </button>

                  {reviewsByDoctor[doctor._id] && reviewsByDoctor[doctor._id].length > 0 ? (
                    <div className="mx-5 mt-3 space-y-2 border-t border-slate-200 pt-3">
                      {reviewsByDoctor[doctor._id].map((review) => (
                        <div key={review._id} className="rounded-xl border border-slate-200 bg-white p-2">
                          <p className="text-xs font-medium text-slate-700">{getReviewerName(review)} • {review.rating}/5</p>
                          <p className="text-xs text-slate-600">{review.review || 'No written review.'}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {user?.role === 'patient' ? (
                    <button
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-cyan-700 hover:to-blue-700"
                      onClick={() => navigate(`/appointments?doctorId=${doctor._id}`)}
                    >
                      <CalendarDays size={15} />
                      Book Appointment
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          )}
          {!loading && visibleDoctors.length === 0 ? (
            <div className="relative z-10 rounded-2xl border border-sky-100 bg-white p-8 text-center text-slate-600 shadow-sm">
              No doctors matched “{searchQuery}”. Try a doctor name, department, or specialization.
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
