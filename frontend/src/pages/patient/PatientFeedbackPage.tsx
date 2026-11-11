import { useEffect, useState } from 'react';
import {
  Star,
  Building2,
  Stethoscope,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI, doctorAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Doctor Review Form
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorRating, setDoctorRating] = useState(5);
  const [doctorComment, setDoctorComment] = useState('');
  const [submittingDocReview, setSubmittingDocReview] = useState(false);

  // Hospital Feedback Form
  const [hospitalRating, setHospitalRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [complaintType, setComplaintType] = useState('Service Quality');
  const [hospitalFeedbackText, setHospitalFeedbackText] = useState('');
  const [submittingHospitalFeedback, setSubmittingHospitalFeedback] = useState(false);

  const loadFeedbackData = async () => {
    try {
      setLoading(true);
      const [feedRes, docsRes] = await Promise.all([
        patientPortalAPI.getFeedback(),
        doctorAPI.getAll(1, '', 50).catch(() => ({ data: { data: [] } })),
      ]);
      setFeedbacks(feedRes.data?.data || []);
      const docList = docsRes.data?.data || [];
      setDoctors(docList);
      if (docList.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docList[0]._id);
      }
    } catch (err: any) {
      toast.error('Failed to load patient reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbackData();
  }, []);

  const handleSubmitDoctorReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      toast.error('Please choose a clinician');
      return;
    }
    try {
      setSubmittingDocReview(true);
      await patientPortalAPI.submitDoctorReview({
        doctorId: selectedDoctorId,
        rating: doctorRating,
        comment: doctorComment.trim(),
      });
      toast.success('Doctor review submitted successfully!');
      setDoctorComment('');
      loadFeedbackData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit doctor review');
    } finally {
      setSubmittingDocReview(false);
    }
  };

  const handleSubmitHospitalFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalFeedbackText.trim()) {
      toast.error('Please provide details for your feedback');
      return;
    }
    try {
      setSubmittingHospitalFeedback(true);
      await patientPortalAPI.submitHospitalFeedback({
        hospitalRating,
        facilityCleanlinessRating: cleanlinessRating,
        complaintType,
        feedbackText: hospitalFeedbackText.trim(),
      });
      toast.success('Hospital feedback and grievance submitted');
      setHospitalFeedbackText('');
      loadFeedbackData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit hospital feedback');
    } finally {
      setSubmittingHospitalFeedback(false);
    }
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
                    <Star size={14} className="text-teal-300" />
                    Patient Experience & Quality Assurance
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Feedback & Clinician Reviews</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Rate your doctor consultations, grade hospital cleanliness, and track administrative grievance responses.
                  </p>
                </div>
              </div>
            </div>

            {/* Split Form: Doctor Review (Left), Hospital Feedback (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Doctor Review Box */}
              <div className="clinical-card p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Stethoscope size={18} className="text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">Review Your Clinician</h3>
                </div>

                <form onSubmit={handleSubmitDoctorReview} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Select Physician</label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-600"
                    >
                      {doctors.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.userId?.name || `Dr. ${d.userId?.firstName || ''} ${d.userId?.lastName || ''}`.trim() || 'Clinician'} (
                          {d.specialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Star Rating Picker */}
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Doctor Rating (1 to 5 Stars)</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setDoctorRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            size={24}
                            className={star <= doctorRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                          />
                        </button>
                      ))}
                      <span className="ml-2 font-bold text-slate-700 text-sm">{doctorRating} / 5 Stars</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Your Consultation Experience</label>
                    <textarea
                      rows={3}
                      value={doctorComment}
                      onChange={(e) => setDoctorComment(e.target.value)}
                      placeholder="Comment on doctor attentiveness, explanation of diagnosis, and treatment care..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingDocReview}
                    className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold shadow-md shadow-teal-700/20"
                  >
                    {submittingDocReview ? 'Submitting...' : 'Post Clinician Review'}
                  </button>
                </form>
              </div>

              {/* Hospital Feedback & Cleanliness Box */}
              <div className="clinical-card p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Building2 size={18} className="text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">Hospital Facility & Cleanliness Rating</h3>
                </div>

                <form onSubmit={handleSubmitHospitalFeedback} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Overall Facility Rating</label>
                      <select
                        value={hospitalRating}
                        onChange={(e) => setHospitalRating(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value={5}>5 - Excellent</option>
                        <option value={4}>4 - Good</option>
                        <option value={3}>3 - Average</option>
                        <option value={2}>2 - Needs Improvement</option>
                        <option value={1}>1 - Unsatisfactory</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Hygiene & Cleanliness</label>
                      <select
                        value={cleanlinessRating}
                        onChange={(e) => setCleanlinessRating(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value={5}>5 - Spotless</option>
                        <option value={4}>4 - Very Clean</option>
                        <option value={3}>3 - Acceptable</option>
                        <option value={2}>2 - Needs Attention</option>
                        <option value={1}>1 - Poor Cleanliness</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Category / Topic</label>
                    <select
                      value={complaintType}
                      onChange={(e) => setComplaintType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Service Quality">Staff & Service Quality</option>
                      <option value="Billing & Payments">Billing & Transparency</option>
                      <option value="Wait Times">Appointment Wait Times</option>
                      <option value="Pharmacy & Labs">Pharmacy / Diagnostic Labs</option>
                      <option value="Facility Hygiene">Hospital Cleanliness & Facilities</option>
                      <option value="General Suggestion">General Appreciation / Suggestion</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Feedback / Suggestions *</label>
                    <textarea
                      required
                      rows={3}
                      value={hospitalFeedbackText}
                      onChange={(e) => setHospitalFeedbackText(e.target.value)}
                      placeholder="Share your experience or report an issue to hospital administration..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingHospitalFeedback}
                    className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold shadow-md shadow-teal-700/20"
                  >
                    {submittingHospitalFeedback ? 'Submitting...' : 'Submit Feedback to Management'}
                  </button>
                </form>
              </div>
            </div>

            {/* Submitted Feedback History & Administrative Responses */}
            <div className="clinical-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Your Submitted Feedback & Responses</h3>
                <span className="text-xs font-semibold text-slate-500">{feedbacks.length} Submissions</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading feedback history...</div>
              ) : feedbacks.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  You have not submitted any reviews or feedback yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((item) => (
                    <div key={item._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {item.feedbackType === 'doctor_review' ? 'Doctor Review' : `Hospital Feedback: ${item.complaintType || 'General'}`}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              item.status === 'resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status || 'Pending Review'}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span>{item.rating || item.hospitalRating || 5} Stars</span>
                      </div>

                      <p className="text-slate-600 leading-relaxed italic">
                        "{item.comment || item.feedbackText}"
                      </p>

                      {item.hospitalResponse && (
                        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 mt-2 space-y-1">
                          <span className="font-bold text-teal-900 block text-[11px]">
                            Hospital Management Response:
                          </span>
                          <p className="text-teal-800">{item.hospitalResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
