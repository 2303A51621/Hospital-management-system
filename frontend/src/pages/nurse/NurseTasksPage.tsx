import { useEffect, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  RefreshCw,
  X,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { nursePortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NurseTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Create Task Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    patientId: '',
    title: '',
    description: '',
    category: 'General Patient Care',
    priority: 'medium',
    dueDate: '',
  });

  // Completion modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [targetTask, setTargetTask] = useState<any | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, pRes] = await Promise.all([
        nursePortalAPI.getTasks({
          category: categoryFilter,
          status: statusFilter,
          priority: priorityFilter,
        }),
        nursePortalAPI.getPatients(),
      ]);
      setTasks(tRes.data.data || []);
      setPatients(pRes.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load nursing care tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter, priorityFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.patientId || !newTask.title.trim()) {
      toast.error('Please select a patient and enter a task title');
      return;
    }

    try {
      setSubmitting(true);
      const res = await nursePortalAPI.createTask({
        patientId: newTask.patientId,
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        priority: newTask.priority,
        dueDate: newTask.dueDate || undefined,
      });

      toast.success(res.data.message || 'Task scheduled successfully');
      setCreateModalOpen(false);
      setNewTask({
        patientId: '',
        title: '',
        description: '',
        category: 'General Patient Care',
        priority: 'medium',
        dueDate: '',
      });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (task: any, newStatus: string) => {
    if (newStatus === 'completed') {
      setTargetTask(task);
      setCompletionNotes('');
      setCompleteModalOpen(true);
      return;
    }

    try {
      await nursePortalAPI.updateTaskStatus(task._id, { status: newStatus });
      toast.success(`Task marked as ${newStatus}`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update task status');
    }
  };

  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTask) return;

    try {
      setSubmitting(true);
      await nursePortalAPI.updateTaskStatus(targetTask._id, {
        status: 'completed',
        completionNotes,
      });
      toast.success('Task marked as completed!');
      setCompleteModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Failed to complete task');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const q = search.toLowerCase();
    const title = (t.title || '').toLowerCase();
    const pName = (t.patientId?.userId?.name || '').toLowerCase();
    return title.includes(q) || pName.includes(q);
  });

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-200 mb-1">
                  <ClipboardList size={14} className="text-teal-600" />
                  Clinical Workflow Task Management
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Nursing Care Tasks
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Schedule, prioritize, and track patient monitoring, wound dressing, catheter/IV care, and hygiene.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20"
                >
                  <Plus size={15} /> Create Care Task
                </button>
                <button
                  onClick={loadData}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                  title="Refresh"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="clinical-card p-4 bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search task title or patient..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
                >
                  <option value="all">All Care Categories</option>
                  <option value="Patient Monitoring">Patient Monitoring</option>
                  <option value="Medication Administration">Medication Administration</option>
                  <option value="Wound Dressing">Wound Dressing</option>
                  <option value="Injection Administration">Injection Administration</option>
                  <option value="Blood Sample Collection">Blood Sample Collection</option>
                  <option value="Patient Hygiene">Patient Hygiene</option>
                  <option value="Patient Mobility Assistance">Patient Mobility Assistance</option>
                  <option value="IV Monitoring">IV Monitoring</option>
                  <option value="Postoperative Care">Postoperative Care</option>
                  <option value="General Patient Care">General Patient Care</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Tasks List */}
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">Loading nursing tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="clinical-card p-12 text-center text-slate-400 text-xs">
                No nursing care tasks found for this filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.map((t) => {
                  const isCompleted = t.status === 'completed';
                  const isUrgent = t.priority === 'urgent';
                  const isHigh = t.priority === 'high';

                  return (
                    <div
                      key={t._id}
                      className={`clinical-card p-5 bg-white border flex flex-col justify-between transition-all ${
                        isCompleted
                          ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                          : isUrgent
                          ? 'border-rose-300 ring-1 ring-rose-200'
                          : isHigh
                          ? 'border-amber-300'
                          : 'border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {t.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                              isUrgent
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isHigh
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <div>
                          <h3 className={`text-sm font-extrabold ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {t.title}
                          </h3>
                          {t.description && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t.description}</p>
                          )}
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                          <div>Patient: <strong>{t.patientId?.userId?.name || 'Inpatient'}</strong></div>
                          <div>
                            Due:{' '}
                            <strong className="text-slate-900">
                              {new Date(t.dueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </strong>
                          </div>
                        </div>

                        {t.completionNotes && (
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px]">
                            <strong>Completion Note:</strong> {t.completionNotes}
                          </div>
                        )}
                      </div>

                      {/* Footer Status Controls */}
                      <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.status}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {t.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(t, 'in_progress')}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] border border-blue-200"
                            >
                              Start
                            </button>
                          )}
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(t, 'completed')}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} /> Done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CREATE NURSING TASK MODAL */}
            {createModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <form
                  onSubmit={handleCreateTask}
                  className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-4 border border-slate-200"
                >
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-white">
                    <div className="flex items-center gap-2">
                      <ClipboardList size={18} className="text-teal-700" />
                      <h3 className="font-extrabold text-slate-900 text-base">Create Nursing Care Task</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreateModalOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-6 space-y-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Inpatient *</label>
                      <select
                        required
                        value={newTask.patientId}
                        onChange={(e) => setNewTask({ ...newTask, patientId: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50"
                      >
                        <option value="">-- Choose Inpatient --</option>
                        {patients.map((a) => (
                          <option key={a.patientId?._id} value={a.patientId?._id}>
                            {a.patientId?.userId?.name || 'Patient'} ({a.roomNumber || 'Room'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Task Title *</label>
                      <input
                        type="text"
                        required
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="e.g. Sterile wound dressing change, Foley catheter flush"
                        className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Category</label>
                        <select
                          value={newTask.category}
                          onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                        >
                          <option value="Patient Monitoring">Patient Monitoring</option>
                          <option value="Medication Administration">Medication Administration</option>
                          <option value="Wound Dressing">Wound Dressing</option>
                          <option value="Injection Administration">Injection Administration</option>
                          <option value="Blood Sample Collection">Blood Sample Collection</option>
                          <option value="Patient Hygiene">Patient Hygiene</option>
                          <option value="Patient Mobility Assistance">Patient Mobility Assistance</option>
                          <option value="IV Monitoring">IV Monitoring</option>
                          <option value="Postoperative Care">Postoperative Care</option>
                          <option value="General Patient Care">General Patient Care</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Priority</label>
                        <select
                          value={newTask.priority}
                          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                          className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Due Date & Time</label>
                      <input
                        type="datetime-local"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Description / Clinical Directives</label>
                      <textarea
                        rows={2}
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="Clinical instructions or specific observation directives..."
                        className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                      />
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs"
                    >
                      {submitting ? 'Creating...' : 'Schedule Task'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* COMPLETION MODAL */}
            {completeModalOpen && targetTask && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <form
                  onSubmit={handleConfirmCompletion}
                  className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-900 text-base">Complete Nursing Task</h3>
                    <button type="button" onClick={() => setCompleteModalOpen(false)} className="text-slate-400">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="text-xs text-slate-700">
                    Task: <strong className="text-slate-900">{targetTask.title}</strong>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                      Completion Notes / Clinical Findings
                    </label>
                    <textarea
                      rows={3}
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      placeholder="e.g. Incision clean and dry, replaced sterile gauze. Patient tolerated dressing without pain."
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCompleteModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      {submitting ? 'Saving...' : 'Confirm Completion'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
