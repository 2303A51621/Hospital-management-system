import { useEffect, useState } from 'react';
import {
  BedDouble,
  Users,
  CheckCircle2,
  RefreshCw,
  User,
  Activity,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { nursePortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NurseWardsPage() {
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWardFilter, setSelectedWardFilter] = useState('all');

  const fetchWards = async () => {
    try {
      setLoading(true);
      const res = await nursePortalAPI.getWardsAndBeds();
      setWards(res.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load wards and bed allocation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  // Compute aggregate stats
  const totalBeds = wards.reduce((sum, w) => sum + (w.totalBeds || (w.beds?.length || 0)), 0);
  const occupiedBeds = wards.reduce((sum, w) => sum + (w.occupiedBeds || 0), 0);
  const availableBeds = wards.reduce((sum, w) => sum + (w.availableBeds || 0), 0);
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const filteredWards = wards.filter((w) => {
    if (selectedWardFilter !== 'all' && w.wardName !== selectedWardFilter && w.wardType !== selectedWardFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
                  <BedDouble size={14} />
                  <span>Clinical Infrastructure</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wards & Bed Census</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time inpatient occupancy, bed allocation matrix, and facility monitoring across hospital units.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchWards}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin text-teal-600' : ''} />
                  <span>Refresh Wards</span>
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Total Operational Beds</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <BedDouble size={18} />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-slate-900">{totalBeds}</div>
                <div className="mt-1 text-xs text-slate-500">Across {wards.length} clinical wards</div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700">Occupied Inpatient Beds</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Users size={18} />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-amber-900">{occupiedBeds}</div>
                <div className="mt-1 text-xs text-amber-600 font-medium">Currently receiving active care</div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">Available Vacant Beds</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-emerald-900">{availableBeds}</div>
                <div className="mt-1 text-xs text-emerald-600 font-medium">Sanitized & admission ready</div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Facility Occupancy Rate</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                    <Activity size={18} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{occupancyRate}%</span>
                  <span className="text-xs font-semibold text-slate-500">Capacity</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      occupancyRate > 85 ? 'bg-rose-500' : occupancyRate > 65 ? 'bg-amber-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.min(100, occupancyRate)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ward Filter:</span>
                <button
                  type="button"
                  onClick={() => setSelectedWardFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    selectedWardFilter === 'all'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All Wards
                </button>
                {wards.map((w, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedWardFilter(w.wardName)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      selectedWardFilter === w.wardName
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {w.wardName}
                  </button>
                ))}
              </div>

              {/* Status legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Vacant Bed
                </span>
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Occupied Bed
                </span>
              </div>
            </div>

            {/* Wards & Bed Grid */}
            {loading ? (
              <div className="flex h-56 items-center justify-center rounded-2xl bg-white border border-slate-200/80">
                <RefreshCw size={24} className="animate-spin text-teal-600" />
              </div>
            ) : filteredWards.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <BedDouble size={28} className="mx-auto text-slate-400" />
                <h3 className="mt-3 text-sm font-bold text-slate-800">No ward data found</h3>
                <p className="mt-1 text-xs text-slate-500">No inpatient units match the selected criteria.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredWards.map((ward, widx) => {
                  const wardBeds = ward.beds || [];
                  const wOccupancy =
                    ward.totalBeds > 0 ? Math.round(((ward.occupiedBeds || 0) / ward.totalBeds) * 100) : 0;

                  return (
                    <div
                      key={widx}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
                    >
                      {/* Ward Header */}
                      <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-extrabold text-slate-900">{ward.wardName}</h2>
                            <span className="px-2 py-0.5 rounded-md bg-teal-100/70 text-teal-800 text-[10px] font-bold uppercase">
                              {ward.wardType || 'Inpatient Unit'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Floor {ward.floorNumber || 2} • Assigned Inpatient Unit • Standard Clinical Protocols
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold">
                          <div className="text-right">
                            <span className="text-slate-500">Occupancy: </span>
                            <span className="font-bold text-slate-900">
                              {ward.occupiedBeds || 0} / {ward.totalBeds || wardBeds.length} Beds ({wOccupancy}%)
                            </span>
                          </div>
                          <div className="h-2 w-28 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                wOccupancy > 85 ? 'bg-rose-500' : wOccupancy > 60 ? 'bg-amber-500' : 'bg-teal-500'
                              }`}
                              style={{ width: `${Math.min(100, wOccupancy)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bed Layout Matrix */}
                      <div className="p-5">
                        {wardBeds.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            No discrete beds recorded for this ward yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                            {wardBeds.map((bed: any, bidx: number) => {
                              const isOccupied = bed.isOccupied || bed.status === 'occupied';

                              return (
                                <div
                                  key={bidx}
                                  className={`rounded-xl border p-3.5 transition ${
                                    isOccupied
                                      ? 'bg-amber-50/40 border-amber-200/90 shadow-2xs'
                                      : 'bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <BedDouble
                                        size={15}
                                        className={isOccupied ? 'text-amber-600' : 'text-emerald-600'}
                                      />
                                      <span className="font-bold text-xs text-slate-900">
                                        Bed {bed.bedNumber || `${bidx + 1}`}
                                      </span>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isOccupied
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {isOccupied ? 'Occupied' : 'Vacant'}
                                    </span>
                                  </div>

                                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-xs">
                                    {isOccupied ? (
                                      <div className="space-y-1">
                                        <div className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                                          <User size={12} className="text-teal-600 shrink-0" />
                                          <span className="truncate">
                                            {bed.patient?.name || bed.patientName || 'Inpatient'}
                                          </span>
                                        </div>
                                        {bed.patient?.patientId && (
                                          <div className="text-[11px] font-mono text-slate-500">
                                            ID: {bed.patient.patientId}
                                          </div>
                                        )}
                                        {bed.admissionDate && (
                                          <div className="text-[10px] text-slate-400">
                                            Admitted: {new Date(bed.admissionDate).toLocaleDateString()}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="py-2 text-center text-[11px] text-emerald-700 font-medium">
                                        Ready for New Admission
                                      </div>
                                    )}
                                  </div>

                                  {bed.features && bed.features.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {bed.features.map((f: string, fidx: number) => (
                                        <span
                                          key={fidx}
                                          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-medium"
                                        >
                                          {f}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
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
