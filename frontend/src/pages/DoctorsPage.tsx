import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Filter,
  MapPin,
  Search,
  Star,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
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
  Cardiology: { service: 'Heart disease care, ECG & echocardiogram consultations', clinic: 'Cardiology Care Clinic', tags: ['ECG', 'Hypertension', 'Lipid Panel'] },
  Neurology: { service: 'Migraine, stroke evaluation & nerve disorder management', clinic: 'Neuro Care Clinic', tags: ['Migraine', 'EEG', 'Nerve Health'] },
  Orthopedics: { service: 'Joint, bone & musculoskeletal trauma surgery', clinic: 'Bone & Joint Clinic', tags: ['Joint Pain', 'Fractures', 'Arthritis'] },
  Dermatology: { service: 'Clinical skin therapy, acne & dermatologic screening', clinic: 'Dermatology & Skin Clinic', tags: ['Acne', 'Skin Health', 'Allergies'] },
  ENT: { service: 'Sinus, hearing & otolaryngology care', clinic: 'ENT Care Clinic', tags: ['Sinus Care', 'Hearing', 'Throat'] },
  'General Surgery': { service: 'Laparoscopic surgery & wound care management', clinic: 'Surgical Consult Clinic', tags: ['Day Surgery', 'Wound Care', 'Consult'] },
  'General Physician': { service: 'Internal medicine, fever, diabetes & preventative care', clinic: 'General Medicine Clinic', tags: ['Fever', 'Diabetes', 'Checkup'] },
  Pediatrics: { service: 'Neonatal & pediatric growth, immunization & wellness', clinic: 'Pediatric Care Clinic', tags: ['Child Health', 'Vaccines', 'Wellness'] },
  Gynecology: { service: 'Women’s reproductive health, prenatal & maternal care', clinic: 'Women’s Health Center', tags: ['Prenatal', 'Maternal', 'Fertility'] },
  Psychiatry: { service: 'Mental health assessment, counseling & stress therapy', clinic: 'Behavioral Health Clinic', tags: ['Counseling', 'Anxiety', 'Wellness'] },
  Oncology: { service: 'Cancer screening, staging & clinical oncologic review', clinic: 'Oncology Care Clinic', tags: ['Screening', 'Biopsy', 'Tumor Board'] },
  Radiology: { service: 'Diagnostic imaging, MRI, CT & ultrasound review', clinic: 'Diagnostic Imaging Suite', tags: ['MRI', 'CT Scan', 'Ultrasound'] },
  Pathology: { service: 'Clinical pathology, hematology & diagnostic lab reports', clinic: 'Diagnostic Pathology Lab', tags: ['Blood Tests', 'Biochemistry', 'Cultures'] },
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
    return review.userId?.name || `${review.userId?.firstName || ''} ${review.userId?.lastName || ''}`.trim() || 'Verified patient';
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
    if (reviewsByDoctor[doctorId] === undefined) return 'Read patient reviews';
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
    let isMounted = true;
    const loadDoctors = async () => {
      try {
        const res = await doctorAPI.getAll(1, specialization, 50);
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : (res.data as any)?.doctors || [];
        if (isMounted) {
          setDoctors(list);
        }
      } catch (err: any) {
        console.error('Error fetching doctors:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    loadDoctors();
    return () => {
      isMounted = false;
    };
  }, [specialization]);

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Medical Hero Banner */}
            <section className="relative z-10 rounded-3xl border border-teal-800/30 bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10 overflow-hidden">
              <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl" />
              <div className="pointer-events-none absolute left-1/3 -bottom-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-2xl" />

              <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2.5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20 text-teal-100">
                    <Stethoscope size={14} className="text-teal-300" />
                    NABH Accredited Clinician Directory
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                    Doctors & Specialists
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm sm:text-base text-teal-100/90 leading-relaxed">
                    Consult renowned physicians, senior surgeons, and specialists across Kushal Hospitals departments.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-md border border-white/20 text-center min-w-[120px]">
                    <p className="text-xs text-teal-200 font-semibold uppercase tracking-wider">Active Doctors</p>
                    <p className="text-2xl font-black text-white mt-0.5">{matchedDoctorsCount}</p>
                  </div>
                  <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-md border border-white/20 text-center min-w-[120px]">
                    <p className="text-xs text-teal-200 font-semibold uppercase tracking-wider">Specialty</p>
                    <p className="text-base font-bold text-teal-100 mt-1 truncate max-w-[130px]">
                      {specialization || 'All Fields'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Filter & Search Bar */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-clinical">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 inline-flex items-center gap-2">
                    <Filter size={17} className="text-teal-600" />
                    Filter Specialists
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Search by doctor name, specialty, condition, or clinical interest
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-[32rem]">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="doctor-search"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search doctor, specialty, department..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-800 transition focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <select
                    id="specialization"
                    title="Doctor specialization filter"
                    className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 transition focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  >
                    <option value="">All Specializations</option>
                    {SPECIALIZATION_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Doctor Cards Grid */}
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-clinical">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-r-transparent mb-3" />
                <p className="text-sm font-semibold text-slate-600">Loading specialist directory...</p>
              </div>
            ) : visibleDoctors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-clinical">
                <Stethoscope size={42} className="mx-auto mb-3 text-slate-300" />
                <h3 className="text-base font-bold text-slate-800">No doctors matched your criteria</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Try adjusting your search query or selecting "All Specializations" to view all available clinicians.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSpecialization('');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleDoctors.map((doctor) => {
                  const doctorName =
                    doctor.userId?.name ||
                    `${doctor.userId?.firstName || ''} ${doctor.userId?.lastName || ''}`.trim() ||
                    (doctor as any).name ||
                    'Senior Physician';

                  const details = SPECIALIZATION_SERVICES[doctor.specialization] || {
                    service: `${doctor.specialization} specialist care`,
                    clinic: `${doctor.specialization} Clinic`,
                    tags: ['Consultation', 'Specialist', 'Health'],
                  };

                  const rating = Number(doctor.rating || 4.9);
                  const fee = Number(doctor.consultationFee || 500);

                  return (
                    <article
                      key={doctor._id}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-clinical hover:shadow-clinical-hover hover:border-teal-200 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                    >
                      <div className="p-5 space-y-4">
                        {/* Doctor Profile Header */}
                        <div className="flex gap-4 items-start">
                          <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white font-extrabold flex items-center justify-center text-2xl shadow-md shadow-teal-600/20">
                              {doctorName[0] || 'D'}
                            </div>
                            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-xs text-teal-700 font-bold mb-0.5">
                              <ShieldCheck size={14} className="text-teal-600" />
                              <span>Verified Specialist</span>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-teal-700 transition truncate">
                              Dr. {doctorName}
                            </h3>
                            <p className="text-xs font-semibold text-teal-800">
                              {doctor.specialization}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {(doctor.qualification || ['MBBS', 'MD']).join(', ')} • {doctor.experience || 5} yrs exp
                            </p>
                          </div>
                        </div>

                        {/* Service & Clinic Summary */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                          <p className="font-bold text-slate-800">{details.service}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin size={12} className="text-teal-600" />
                            {details.clinic} • Kushal Main Campus
                          </p>
                        </div>

                        {/* Specialization Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {details.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-lg bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 border border-teal-100"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Ratings & Tariffs bar */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                            <Star size={14} className="fill-amber-400 text-amber-400" />
                            <span className="text-slate-800 font-extrabold">{rating}</span>
                            <span className="text-slate-400 text-[11px] font-normal">
                              ({doctor.totalReviews || 12} reviews)
                            </span>
                          </span>

                          <span className="inline-flex items-center gap-1 font-bold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/60">
                            <Stethoscope size={13} className="text-teal-700" />
                            ₹{fee.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Review toggle */}
                        <button
                          type="button"
                          className="w-full text-center text-xs font-semibold text-slate-500 hover:text-teal-700 transition pt-1"
                          onClick={() => loadDoctorReviews(doctor._id)}
                        >
                          {getReviewToggleLabel(doctor._id)}
                        </button>

                        {reviewsByDoctor[doctor._id] && reviewsByDoctor[doctor._id].length > 0 && (
                          <div className="space-y-2 border-t border-slate-100 pt-2 text-xs">
                            {reviewsByDoctor[doctor._id].map((review) => (
                              <div key={review._id} className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-left">
                                <p className="font-bold text-slate-700 text-[11px]">
                                  {getReviewerName(review)} • ★ {review.rating}/5
                                </p>
                                <p className="text-[11px] text-slate-600 mt-0.5">{review.review || 'Excellent clinical consultation.'}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Button: Book Appointment */}
                      {user?.role === 'patient' && (
                        <div className="p-4 pt-0">
                          <button
                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 px-4 py-3 text-xs font-bold text-white shadow-md shadow-teal-700/20 transition-all hover:from-teal-700 hover:to-cyan-800 active:scale-[0.98]"
                            onClick={() => navigate(`/appointments?doctorId=${doctor._id}`)}
                          >
                            <CalendarDays size={15} />
                            Book Appointment
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
