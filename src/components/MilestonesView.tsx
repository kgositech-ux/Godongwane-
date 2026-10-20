import React, { useState } from 'react';
import {
  Milestone as MilestoneIcon,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  X,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Milestone, Project, MilestoneStatus } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface MilestonesViewProps {
  milestones: Milestone[];
  projects: Project[];
}

export const MilestonesView: React.FC<MilestonesViewProps> = ({
  milestones,
  projects,
}) => {
  const { isAdmin } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects.length > 0 ? projects[0].id : '');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<MilestoneStatus>('in_progress');
  const [progress, setProgress] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingMilestone(null);
    setTitle('');
    setProjectId(projects.length > 0 ? projects[0].id : '');
    setDescription('');
    setDueDate(new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10));
    setStatus('in_progress');
    setProgress(25);
    setIsModalOpen(true);
  };

  const openEditModal = (m: Milestone) => {
    setEditingMilestone(m);
    setTitle(m.title);
    setProjectId(m.projectId);
    setDescription(m.description || '');
    setDueDate(m.dueDate);
    setStatus(m.status);
    setProgress(m.progress);
    setIsModalOpen(true);
  };

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    setSubmitting(true);

    try {
      if (editingMilestone) {
        await updateDoc(doc(db, 'milestones', editingMilestone.id), {
          title: title.trim(),
          projectId,
          description: description.trim() || undefined,
          dueDate,
          status,
          progress: Number(progress),
        });
      } else {
        const newM: Omit<Milestone, 'id'> = {
          title: title.trim(),
          projectId,
          description: description.trim() || undefined,
          dueDate,
          status,
          progress: Number(progress),
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'milestones'), newM);
      }
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(
        err,
        editingMilestone ? OperationType.UPDATE : OperationType.CREATE,
        editingMilestone ? `milestones/${editingMilestone.id}` : 'milestones'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgress = async (milestoneId: string, newProgress: number) => {
    try {
      const newStatus: MilestoneStatus =
        newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'pending';
      await updateDoc(doc(db, 'milestones', milestoneId), {
        progress: newProgress,
        status: newStatus,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `milestones/${milestoneId}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this milestone?')) return;
    try {
      await deleteDoc(doc(db, 'milestones', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `milestones/${id}`);
    }
  };

  const filtered = milestones.filter(
    (m) => selectedProjectId === 'all' || m.projectId === selectedProjectId
  );

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const inProgressCount = milestones.filter((m) => m.status === 'in_progress').length;
  const pendingCount = milestones.filter((m) => m.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Milestone Visualization Dashboard</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              {milestones.length} Strategic Gates
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Deliverable deadlines, QA inspection hold points, and engineering approvals
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Milestone</span>
        </button>
      </div>

      {/* Progress Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#111927] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Achieved Milestones</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
              {completedCount}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">In Active Execution</div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
              {inProgressCount}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Pending Gates</div>
            <div className="text-xl font-bold text-slate-300 font-mono mt-0.5">
              {pendingCount}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter by Project */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#111927] border border-slate-800">
        <span className="text-xs text-slate-400 font-medium">Filter by Project:</span>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Projects ({projects.length})</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Visual Roadmap / Timeline Cards */}
      <div className="space-y-4">
        {filtered.map((m, idx) => {
          const isDone = m.status === 'completed';
          const isInProgress = m.status === 'in_progress';

          return (
            <div
              key={m.id}
              className={`p-5 rounded-2xl border transition-all shadow-lg ${
                isDone
                  ? 'bg-[#111927]/90 border-emerald-800/40'
                  : isInProgress
                  ? 'bg-[#111927] border-amber-500/30 ring-1 ring-amber-500/10'
                  : 'bg-[#111927]/60 border-slate-800'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      #{idx + 1}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      {m.title}
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : isInProgress
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-amber-400/90 font-medium">
                    {projectMap.get(m.projectId) || 'Godongwane Progressive Project'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">Target Delivery</div>
                    <div className="text-xs font-mono text-slate-200 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                    <button
                      onClick={() => openEditModal(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {m.description && (
                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                  {m.description}
                </p>
              )}

              {/* Visual Progress Bar & Interactive Slider */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Verification Gate Progress:</span>
                  <span className="font-mono font-bold text-amber-400">{m.progress}%</span>
                </div>

                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'
                    }`}
                    style={{ width: `${m.progress}%` }}
                  />
                </div>

                {/* Quick Slider Adjustment */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500">Quick set:</span>
                    {[0, 25, 50, 75, 100].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleUpdateProgress(m.id, val)}
                        className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                          m.progress === val
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>

                  {m.progress < 100 && (
                    <button
                      onClick={() => handleUpdateProgress(m.id, 100)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sign Off Milestone</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Milestone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {editingMilestone ? 'Edit Milestone Gate' : 'Add Strategic Milestone'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Milestone Deliverable Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Non-Destructive Weld Testing & Grade 316 Passivation"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Target Project *</label>
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Compliance requirements, testing protocols, inspector criteria..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Gate Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Progress Percentage ({progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  {submitting ? 'Saving...' : editingMilestone ? 'Update Milestone' : 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
