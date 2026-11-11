import { useEffect, useState } from 'react';
import {
  Sparkles,
  Search,
  ChevronRight,
  Clock,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { patientPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PatientHealthTipsPage() {
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [readingTip, setReadingTip] = useState<any>(null);

  const loadTips = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getHealthTips(selectedCategory !== 'all' ? selectedCategory : undefined);
      setTips(res.data?.data || []);
    } catch (err: any) {
      toast.error('Failed to load health tips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTips();
  }, [selectedCategory]);

  const filteredTips = tips.filter((tip) => {
    const q = search.toLowerCase();
    const title = (tip.title || '').toLowerCase();
    const body = (tip.content || tip.summary || '').toLowerCase();
    return title.includes(q) || body.includes(q);
  });

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
                    <Sparkles size={14} className="text-teal-300" />
                    Preventive Healthcare & Medical Advisory
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Health Tips & Wellness Library</h1>
                  <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                    Clinically vetted articles, diet recommendations, cardiovascular guidance, and disease prevention strategies.
                  </p>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="clinical-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                {[
                  { id: 'all', label: 'All Articles' },
                  { id: 'Cardiology', label: 'Heart & Vascular' },
                  { id: 'Nutrition', label: 'Nutrition & Diet' },
                  { id: 'Diabetes', label: 'Diabetes Care' },
                  { id: 'Preventive', label: 'Preventive Health' },
                  { id: 'Mental Health', label: 'Stress & Mental Wellness' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedCategory === tab.id ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-600 bg-slate-50 w-52"
                />
              </div>
            </div>

            {/* Tips Grid */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading health guides...</div>
            ) : filteredTips.length === 0 ? (
              <div className="clinical-card p-12 text-center text-slate-400 text-xs">
                No health articles found matching your criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="clinical-card p-6 flex flex-col justify-between hover:border-teal-300 hover:shadow-lg transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                          {tip.category || 'Clinical Guidance'}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <Clock size={12} /> {tip.readTime || '3 min read'}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-teal-900 transition-colors leading-snug">
                        {tip.title}
                      </h3>

                      <p className="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                        {tip.content || tip.summary}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Verified by Kushal Medical Board
                      </span>
                      <button
                        onClick={() => setReadingTip(tip)}
                        className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                      >
                        Read Article <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Full Article Modal */}
            {readingTip && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                      {readingTip.category}
                    </span>
                    <button
                      onClick={() => setReadingTip(null)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>

                  <h2 className="text-xl font-black text-slate-900">{readingTip.title}</h2>
                  <div className="text-xs text-slate-400">
                    Published by Kushal Hospitals Department of {readingTip.department || 'Preventive Medicine'} •{' '}
                    {readingTip.readTime || '3 min read'}
                  </div>

                  <div className="text-xs text-slate-700 leading-relaxed space-y-3 pt-2">
                    <p className="whitespace-pre-wrap">{readingTip.content || readingTip.summary}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setReadingTip(null)}
                      className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold"
                    >
                      Close Guide
                    </button>
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
