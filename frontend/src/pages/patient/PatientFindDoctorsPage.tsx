import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Stethoscope,
  Star,
  CalendarDays,
  Clock,
  ShieldCheck,
  Award,
  RefreshCw,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI, doctorAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SPECIALIZATIONS = [
  'All Specializations',
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

export default function PatientFindDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('All Specializations');
  const [sortBy, setSortBy] = useState('rating');

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (specialization !== 'All Specializations') {
        params.specialization = specialization;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      params.sortBy = sortBy;

      // Primary call to patient portal doctors
      const res = await patientPortalAPI.getDoctors(params);
      let list = res.data?.data || [];

      // If patient portal returned empty, fallback to public doctors endpoint
      if (list.length === 0 && !search.trim() && specialization === 'All Specializations') {
        const fallback = await doctorAPI.getAll(1, '', 50);
        list = fallback.data?.data || [];
      }

      setDoctors(list);
    } catch (err: any) {
      console.error('Error fetching doctors:', err);
      // Fallback
      try {
        const fallback = await doctorAPI.getAll(1, '', 50);
        setDoctors(fallback.data?.data || []);
      } catch (e) {
        toast.error('Unable to fetch doctors directory');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [specialization, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDoctors();
  };

  const filteredDoctors = doctors.filter((doc) => {
    const userObj = doc.userId || {};
    const name = (userObj.name || `${userObj.firstName || ''} ${userObj.lastName || ''}`).toLowerCase();
    const spec = (doc.specialization || '').toLowerCase();
    const dept = (doc.department || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || spec.includes(q) || dept.includes(q);
  });

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Medical Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl" />
              <div className="pointer-events-none absolute left-1/3 -bottom-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-2xl" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20 text-teal-100 mb-2">
                    <Stethoscope size={14} className="text-teal-300" />
                    Doctor Directory & Specialization Finder
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                    Find Experienced Specialists
                  </h1>
                  <p className="text-sm text-teal-100/90 max-w-2xl mt-1">
                    Book verified outpatient and telemedicine consultations with Kushal Hospitals board-certified physicians.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
                  <div className="text-right">
                    <span className="block text-2xl font-black text-white">{filteredDoctors.length}</span>
                    <span className="text-[11px] text-teal-100 uppercase tracking-wider font-semibold">Active Clinicians</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="clinical-card p-4">
              <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by doctor name, clinical specialty, or symptom..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    {SPECIALIZATIONS.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="rating">Sort: Highest Rated</option>
                    <option value="experience">Sort: Most Experienced</option>
                    <option value="fee_low">Fee: Low to High</option>
                    <option value="fee_high">Fee: High to Low</option>
                  </select>

                  <button
                    type="button"
                    onClick={loadDoctors}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    title="Refresh"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </form>
            </div>

            {/* Doctor Cards Grid */}
            {loading ? (
              <div className="py-20 text-center text-slate-400">Loading specialist clinicians...</div>
            ) : filteredDoctors.length === 0 ? (
              <div className="clinical-card p-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4">
                  <Stethoscope size={30} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Doctors Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  No clinicians matched your filter "{search || specialization}". Try clearing your search parameters.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSpecialization('All Specializations');
                  }}
                  className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doc) => {
                  const userObj = doc.userId || {};
                  const doctorName =
                    userObj.name || `Dr. ${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || 'Attending Doctor';
                  const profilePic = userObj.profilePicture || `/doctor-photos/doctor${(doc._id ? doc._id.charCodeAt(doc._id.length - 1) % 15 : 1) + 1}.png`;
                  const qualifications = (doc.qualification && doc.qualification.length > 0)
                    ? doc.qualification.join(', ')
                    : 'MBBS, MD';
                  const rating = doc.rating || doc.averageRating || 4.8;
                  const reviews = doc.totalReviews || (doc.reviews?.length) || 24;

                  return (
                    <div
                      key={doc._id}
                      className="clinical-card p-6 flex flex-col justify-between hover:border-teal-300 hover:shadow-lg transition-all group"
                    >
                      <div>
                        {/* Doctor Card Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="relative h-18 w-18 h-[72px] w-[72px] rounded-2xl bg-teal-50 border border-teal-100 p-0.5 overflow-hidden shrink-0 shadow-sm">
                            <img
                              src={profilePic}
                              alt={doctorName}
                              className="h-full w-full object-cover rounded-xl"
                              onError={(e: any) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80';
                              }}
                            />
                            <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-amber-500 text-xs font-bold">
                              <Star size={14} className="fill-amber-400 text-amber-400" />
                              <span>{Number(rating).toFixed(1)}</span>
                              <span className="text-slate-400 font-normal">({reviews} reviews)</span>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-teal-900 transition-colors truncate">
                              {doctorName}
                            </h3>
                            <span className="inline-block mt-0.5 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                              {doc.specialization}
                            </span>
                          </div>
                        </div>

                        {/* Qualifications & Experience */}
                        <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <Award size={14} className="text-teal-700 shrink-0" />
                            <span className="truncate">{qualifications} • {doc.department || 'Clinical Medicine'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-teal-700 shrink-0" />
                            <span>{doc.experience || 6}+ Years Clinical Practice</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
                            <span>License: <strong className="font-mono text-slate-700">{doc.licenseNumber || 'KH-DOC-MED'}</strong></span>
                          </div>
                        </div>

                        {/* Bio snippet */}
                        <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                          {doc.bio || `${doctorName} is a senior consultant in ${doc.specialization} with comprehensive expertise in outpatient treatment.`}
                        </p>
                      </div>

                      {/* Card Footer: Fee and Book Action */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Consultation Fee</span>
                          <span className="text-base font-black text-slate-900">₹{doc.consultationFee || 600}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/patient/book-appointment?doctorId=${doc._id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-700/20 transition-all"
                          >
                            <CalendarDays size={14} /> Book Visit
                          </Link>
                        </div>
                      </div>
                    </div>
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
