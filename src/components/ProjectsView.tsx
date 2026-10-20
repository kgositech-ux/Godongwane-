import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  DollarSign,
  User,
  Tag,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { Project, Client, PriorityLevel, ProjectStatus } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../utils/activityLogger';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  onOpenDriveModal: () => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  clients,
  onOpenDriveModal,
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(isAddModalOpen);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [budget, setBudget] = useState(150000);
  const [progress, setProgress] = useState(25);
  const [managerName, setManagerName] = useState('Kgosi (Service Websites)');
  const [submitting, setSubmitting] = useState(false);

  // Sync prop changes
  React.useEffect(() => {
    if (isAddModalOpen) {
      openAddModal();
    }
  }, [isAddModalOpen]);

  const openAddModal = () => {
    setEditingProject(null);
    setName('');
    const godongwane = clients.find((c) => c.name.includes('Godongwane'));
    setClientId(godongwane?.id || (clients.length > 0 ? clients[0].id : ''));
    setDescription('');
    setStatus('in_progress');
    setPriority('high');
    setStartDate(new Date().toISOString().slice(0, 10));
    setTargetDate('');
    setBudget(250000);
    setProgress(10);
    setManagerName('Kgosi (Service Websites)');
    setModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setClientId(p.clientId);
    setDescription(p.description);
    setStatus(p.status);
    setPriority(p.priority);
    setStartDate(p.startDate || '');
    setTargetDate(p.targetCompletionDate || '');
    setBudget(p.budget || 0);
    setProgress(p.progressPercentage || 0);
    setManagerName(p.managerName || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      const selectedClient = clients.find((c) => c.id === clientId);
      const clientName = selectedClient ? selectedClient.name : 'Godongwane Progressive Projects';

      if (editingProject) {
        await updateDoc(doc(db, 'projects', editingProject.id), {
          name: name.trim(),
          clientId: clientId || undefined,
          clientName,
          description: description.trim(),
          status,
          priority,
          startDate: startDate || undefined,
          targetCompletionDate: targetDate || undefined,
          budget: Number(budget),
          progressPercentage: Number(progress),
          managerName: managerName.trim() || undefined,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const newProj: Omit<Project, 'id'> = {
          name: name.trim(),
          clientId: clientId || 'godongwane-default',
          clientName,
          description: description.trim(),
          status,
          priority,
          startDate: startDate || undefined,
          targetCompletionDate: targetDate || undefined,
          budget: Number(budget),
          progressPercentage: Number(progress),
          managerName: managerName.trim() || undefined,
          collaboratorEmails: ['servicewebsites6@gmail.com', 'mthethwapraisegodcebolenkosi@gmail.com'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'projects'), newProj);
      }

      logActivity({
        type: 'project',
        action: editingProject ? 'updated' : 'created',
        title: name.trim(),
        description: editingProject
          ? `Project "${name.trim()}" milestones and specifications updated.`
          : `New project "${name.trim()}" initiated for ${clientName}.`,
        userName: currentUser?.displayName || currentUser?.email || 'Kgosi',
        userEmail: currentUser?.email || 'servicewebsites6@gmail.com',
        entityId: editingProject ? editingProject.id : 'new-project',
      });

      closeModal();
    } catch (err) {
      handleFirestoreError(
        err,
        editingProject ? OperationType.UPDATE : OperationType.CREATE,
        editingProject ? `projects/${editingProject.id}` : 'projects'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (projId: string) => {
    if (!window.confirm('Delete this project and associated metrics?')) return;
    try {
      await deleteDoc(doc(db, 'projects', projId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${projId}`);
    }
  };

  const handleUpdateProgressQuick = async (projId: string, current: number, delta: number) => {
    const next = Math.min(100, Math.max(0, current + delta));
    try {
      await updateDoc(doc(db, 'projects', projId), {
        progressPercentage: next,
        status: next === 100 ? 'completed' : 'in_progress',
        updatedAt: new Date().toISOString(),
      });

      const proj = projects.find((p) => p.id === projId);
      logActivity({
        type: 'project',
        action: 'progress_updated',
        title: proj ? proj.name : 'Project Progress',
        description: `Progress updated to ${next}% by ${currentUser?.displayName || 'Kgosi'}.`,
        userName: currentUser?.displayName || currentUser?.email || 'Kgosi',
        userEmail: currentUser?.email || 'servicewebsites6@gmail.com',
        entityId: projId,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${projId}`);
    }
  };

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Project Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              {projects.length} Total
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Heavy steel fabrication, conveyor systems, and architectural structural contracts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDriveModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-all shadow-xs"
          >
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Add All to Drive</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Project</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects, client specs, materials..."
            className="w-full bg-[#131c2d] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
          {['all', 'in_progress', 'planning', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors font-medium ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-2xl bg-[#111927] border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    p.priority === 'urgent'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : p.priority === 'high'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {p.priority}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    title="Edit Project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-100 line-clamp-1">{p.name}</h3>
                <div className="text-[11px] text-amber-400 mt-0.5 font-medium">
                  {p.clientName}
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {p.description}
              </p>
            </div>

            {/* Bottom Meta & Progress Controls */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <div className="text-slate-400">
                  Target: <span className="text-slate-200">{p.targetCompletionDate || 'Open'}</span>
                </div>
                <div className="font-mono font-bold text-white">
                  R {(p.budget || 0).toLocaleString('en-ZA')}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 text-[11px]">Milestone Completion</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {p.progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${p.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Quick increment buttons */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-slate-500">Quick progress:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUpdateProgressQuick(p.id, p.progressPercentage, -10)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                  >
                    -10%
                  </button>
                  <button
                    onClick={() => handleUpdateProgressQuick(p.id, p.progressPercentage, +10)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono"
                  >
                    +10%
                  </button>
                  <button
                    onClick={() => handleUpdateProgressQuick(p.id, p.progressPercentage, 100 - p.progressPercentage)}
                    className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 font-mono"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {editingProject ? 'Edit Project Details' : 'New Project Initiation'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Stainless Steel Hopper & Conveyor Chute Assembly"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Client Organization *
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="godongwane-custom">Godongwane Progressive Projects</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Project Scope & Technical Specifications
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Materials (e.g. Grade 316 Stainless), tolerances, delivery requirements..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Project Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Budget (ZAR)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Target Completion</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Lead Manager</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. Kgosi (Service Websites)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  {submitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
