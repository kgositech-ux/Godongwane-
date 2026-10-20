import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  ArrowRight,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { Task, Project, Employee, TaskStatus, PriorityLevel } from '../types';
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

interface TasksKanbanViewProps {
  tasks: Task[];
  projects: Project[];
  employees: Employee[];
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const TasksKanbanView: React.FC<TasksKanbanViewProps> = ({
  tasks,
  projects,
  employees,
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(isAddModalOpen);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Task form fields
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [assignedTo, setAssignedTo] = useState('Kgosi');
  const [assignedToEmail, setAssignedToEmail] = useState('servicewebsites6@gmail.com');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [actualHours, setActualHours] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (isAddModalOpen) {
      openAddModal();
    }
  }, [isAddModalOpen]);

  const openAddModal = () => {
    setEditingTask(null);
    setTitle('');
    setProjectId(projects.length > 0 ? projects[0].id : '');
    setDescription('');
    setStatus('todo');
    setPriority('medium');
    setAssignedTo('Kgosi');
    setAssignedToEmail('servicewebsites6@gmail.com');
    setDueDate(new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10));
    setEstimatedHours(12);
    setActualHours(0);
    setModalOpen(true);
  };

  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setTitle(t.title);
    setProjectId(t.projectId);
    setDescription(t.description);
    setStatus(t.status);
    setPriority(t.priority);
    setAssignedTo(t.assignedTo || '');
    setAssignedToEmail(t.assignedToEmail || '');
    setDueDate(t.dueDate || '');
    setEstimatedHours(t.estimatedHours || 0);
    setActualHours(t.actualHours || 0);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    setSubmitting(true);

    try {
      if (editingTask) {
        await updateDoc(doc(db, 'tasks', editingTask.id), {
          title: title.trim(),
          projectId,
          description: description.trim(),
          status,
          priority,
          assignedTo: assignedTo.trim() || undefined,
          assignedToEmail: assignedToEmail.trim() || undefined,
          dueDate: dueDate || undefined,
          estimatedHours: Number(estimatedHours),
          actualHours: Number(actualHours),
          updatedAt: new Date().toISOString(),
        });
      } else {
        const newTask: Omit<Task, 'id'> = {
          title: title.trim(),
          projectId,
          description: description.trim(),
          status,
          priority,
          assignedTo: assignedTo.trim() || undefined,
          assignedToEmail: assignedToEmail.trim() || undefined,
          dueDate: dueDate || undefined,
          estimatedHours: Number(estimatedHours),
          actualHours: Number(actualHours),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'tasks'), newTask);
      }

      logActivity({
        type: 'task',
        action: editingTask ? 'updated' : 'created',
        title: title.trim(),
        description: editingTask
          ? `Task "${title.trim()}" specifications updated (${status.toUpperCase()}).`
          : `New task "${title.trim()}" assigned to ${assignedTo.trim() || 'team'}.`,
        userName: currentUser?.displayName || currentUser?.email || 'Kgosi',
        userEmail: currentUser?.email || 'servicewebsites6@gmail.com',
        entityId: editingTask ? editingTask.id : 'new-task',
      });

      closeModal();
    } catch (err) {
      handleFirestoreError(
        err,
        editingTask ? OperationType.UPDATE : OperationType.CREATE,
        editingTask ? `tasks/${editingTask.id}` : 'tasks'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      const task = tasks.find((t) => t.id === taskId);
      logActivity({
        type: 'task',
        action: 'status_changed',
        title: task ? task.title : 'Task',
        description: `Stage shifted to ${newStatus.toUpperCase()} by ${currentUser?.displayName || 'Kgosi'}.`,
        userName: currentUser?.displayName || currentUser?.email || 'Kgosi',
        userEmail: currentUser?.email || 'servicewebsites6@gmail.com',
        entityId: taskId,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do / Planned', color: 'border-slate-700' },
    { id: 'in_progress', label: 'In Fabrication', color: 'border-amber-500/50' },
    { id: 'review', label: 'QA / Inspection', color: 'border-purple-500/50' },
    { id: 'done', label: 'Completed / Delivered', color: 'border-emerald-500/50' },
  ];

  const filteredTasks = tasks.filter((t) => {
    const matchProj = selectedProjectId === 'all' || t.projectId === selectedProjectId;
    const matchSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.assignedTo && t.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchProj && matchSearch;
  });

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Jobs & Task Tracking</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              {tasks.length} Total Jobs
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time workflow execution, fabrication stages, and team dispatch
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Task</span>
        </button>
      </div>

      {/* Filter and Project Selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks, welder, material..."
            className="w-full bg-[#131c2d] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Filter Project:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-[#131c2d] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Godongwane Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl bg-[#111927] border ${col.color} p-4 shadow-lg min-h-[500px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <span className="font-bold text-xs uppercase text-slate-200 tracking-wider">
                  {col.label}
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="text-center py-10 text-slate-600 text-xs border border-dashed border-slate-800/80 rounded-xl">
                    No tasks in this stage
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            t.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : t.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {t.priority}
                        </span>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteTask(t.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-xs text-slate-100 leading-snug">
                          {t.title}
                        </h4>
                        <div className="text-[10px] text-amber-400/90 font-medium truncate mt-0.5">
                          {projectMap.get(t.projectId) || 'Godongwane Project'}
                        </div>
                      </div>

                      {t.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1 text-slate-300">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[90px]">{t.assignedTo || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{t.actualHours || 0}/{t.estimatedHours || 0}h</span>
                        </div>
                      </div>

                      {/* Quick Column Shifter */}
                      <div className="pt-1 flex items-center justify-between gap-1 text-[10px]">
                        {col.id !== 'todo' ? (
                          <button
                            onClick={() => {
                              const order: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
                              const prev = order[order.indexOf(col.id) - 1];
                              handleMoveStatus(t.id, prev);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-0.5"
                            title="Move back"
                          >
                            <ArrowLeft className="w-2.5 h-2.5" />
                            <span>Prev</span>
                          </button>
                        ) : <div />}

                        {col.id !== 'done' && (
                          <button
                            onClick={() => {
                              const order: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
                              const next = order[order.indexOf(col.id) + 1];
                              handleMoveStatus(t.id, next);
                            }}
                            className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 flex items-center gap-0.5 font-medium"
                            title="Advance stage"
                          >
                            <span>Next</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {editingTask ? 'Edit Task Item' : 'Create Fabrication Task'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fit-up and TIG weld hopper discharge flange"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Target Project *
                </label>
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.clientName})
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
                  placeholder="Work instructions, weld type, plate thicknesses, inspection hold points..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Stage</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Fabrication</option>
                    <option value="review">QA / Inspection</option>
                    <option value="done">Completed / Delivered</option>
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
                  <label className="block font-medium text-slate-300 mb-1">Assigned Collaborator</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="e.g. Praise-God Cebolenkosi"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Collaborator Email</label>
                  <input
                    type="email"
                    value={assignedToEmail}
                    onChange={(e) => setAssignedToEmail(e.target.value)}
                    placeholder="e.g. servicewebsites6@gmail.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Actual Hours</label>
                  <input
                    type="number"
                    value={actualHours}
                    onChange={(e) => setActualHours(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
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
                  {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
