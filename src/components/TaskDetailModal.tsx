import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Send,
  MessageSquare,
  Trash2,
  Tag,
  ShieldCheck,
  Edit2,
  Check,
  Plus,
  Flame,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Task, Project, Employee, TaskComment, TaskStatus, PriorityLevel } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../utils/activityLogger';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  employees: Employee[];
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  projects,
  employees,
}) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentTag, setCommentTag] = useState<'general' | 'qa_update' | 'blocker' | 'status_change'>('general');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Quick edit states
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [assignedToEmail, setAssignedToEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [actualHours, setActualHours] = useState(0);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    if (task) {
      setStatus(task.status);
      setPriority(task.priority);
      setAssignedTo(task.assignedTo || '');
      setAssignedToEmail(task.assignedToEmail || '');
      setDueDate(task.dueDate || '');
      setActualHours(task.actualHours || 0);
      setDescription(task.description || '');
    }
  }, [task]);

  // Subscribe to real-time comments for this task
  useEffect(() => {
    if (!task || !isOpen) {
      setComments([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'taskComments'),
        where('taskId', '==', task.id)
      );

      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const list: TaskComment[] = [];
          snap.forEach((d) => {
            list.push({ id: d.id, ...(d.data() as any) });
          });
          // Sort client-side by createdAt asc
          list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setComments(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'taskComments');
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error attaching task comments listener', err);
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const project = projects.find((p) => p.id === task.projectId);

  // Status badge styling
  const statusConfig: Record<TaskStatus, { label: string; bg: string; text: string }> = {
    todo: { label: 'To Do', bg: 'bg-slate-800', text: 'text-slate-300' },
    in_progress: { label: 'In Progress', bg: 'bg-amber-500/20', text: 'text-amber-300' },
    review: { label: 'In Review', bg: 'bg-blue-500/20', text: 'text-blue-300' },
    done: { label: 'Done', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  };

  const priorityConfig: Record<PriorityLevel, { label: string; color: string }> = {
    low: { label: 'Low', color: 'text-slate-400 bg-slate-800' },
    medium: { label: 'Medium', color: 'text-blue-400 bg-blue-500/10' },
    high: { label: 'High', color: 'text-amber-400 bg-amber-500/10' },
    urgent: { label: 'Urgent', color: 'text-rose-400 bg-rose-500/10 border border-rose-500/20' },
  };

  // Due date countdown
  const getDueBadge = (due?: string) => {
    if (!due) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateObj = new Date(due);
    dueDateObj.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          Overdue by {Math.abs(diffDays)}d
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
          <Clock className="w-3 h-3 text-amber-400" />
          Due Today
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
          <Calendar className="w-3 h-3 text-slate-400" />
          Due in {diffDays}d
        </span>
      );
    }
  };

  const handleUpdateTaskField = async (field: Partial<Task>) => {
    setSavingTask(true);
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        ...field,
        updatedAt: new Date().toISOString(),
      });

      if (field.status && field.status !== task.status) {
        logActivity({
          type: 'task',
          action: 'status_changed',
          title: task.title,
          description: `Status changed from ${task.status.toUpperCase()} to ${field.status.toUpperCase()}`,
          userName: userProfile?.displayName || currentUser?.email || 'Admin',
          userEmail: currentUser?.email || 'servicewebsites6@gmail.com',
          entityId: task.id,
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
    } finally {
      setSavingTask(false);
    }
  };

  const handleQuickAddHours = async (hours: number) => {
    const updated = (actualHours || 0) + hours;
    setActualHours(updated);
    await handleUpdateTaskField({ actualHours: updated });
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    const authorName =
      userProfile?.displayName ||
      currentUser?.displayName ||
      (currentUser?.email ? currentUser.email.split('@')[0] : 'Praise-God Cebolenkosi Mthethwa');
    const authorEmail = currentUser?.email || 'mthethwapraisegodcebolenkosi@gmail.com';
    const authorRole = userProfile?.role ? userProfile.role.replace('_', ' ') : 'Team Member';

    try {
      const commentData = {
        taskId: task.id,
        authorId: currentUser?.uid || 'anon',
        authorName,
        authorEmail,
        authorRole,
        content: newComment.trim(),
        tag: commentTag,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'taskComments'), commentData);

      logActivity({
        type: 'task',
        action: 'updated',
        title: task.title,
        description: `New comment posted on "${task.title}": "${newComment.trim().slice(0, 60)}..."`,
        userName: authorName,
        userEmail: authorEmail,
        entityId: task.id,
      });

      setNewComment('');
      setCommentTag('general');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'taskComments');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'taskComments', commentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `taskComments/${commentId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#101726] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-[#0d131f] flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                {project ? project.name : 'Godongwane Project'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${priorityConfig[priority].color}`}>
                {priorityConfig[priority].label} Priority
              </span>
              {getDueBadge(dueDate)}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close task details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two column layout on desktop */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
          {/* Left Column: Task Details & Properties (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 space-y-5 bg-[#0e1422]/60">
            {/* Status & Assignment Controls */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Task Configuration
              </h3>

              {/* Status Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Workflow Status
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['todo', 'in_progress', 'review', 'done'] as TaskStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setStatus(st);
                        handleUpdateTaskField({ status: st });
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all flex items-center justify-between border ${
                        status === st
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{statusConfig[st].label}</span>
                      {status === st && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Urgency / Priority
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['low', 'medium', 'high', 'urgent'] as PriorityLevel[]).map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => {
                        setPriority(pr);
                        handleUpdateTaskField({ priority: pr });
                      }}
                      className={`py-1 px-1.5 text-[11px] rounded font-semibold capitalize text-center transition-all border ${
                        priority === pr
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignee Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Assigned Team Member
                </label>
                <select
                  value={assignedToEmail}
                  onChange={(e) => {
                    const sel = employees.find((emp) => emp.email === e.target.value);
                    const newEmail = e.target.value;
                    const newName = sel ? sel.name : e.target.value;
                    setAssignedTo(newName);
                    setAssignedToEmail(newEmail);
                    handleUpdateTaskField({ assignedTo: newName, assignedToEmail: newEmail });
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.email}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date & Hours */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      handleUpdateTaskField({ dueDate: e.target.value });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Logged Hours
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      value={actualHours}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setActualHours(val);
                        handleUpdateTaskField({ actualHours: val });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuickAddHours(1)}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 shrink-0"
                      title="Add 1 hour logged"
                    >
                      +1h
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Description & Specifications
                </span>
                <button
                  onClick={() => setIsEditingDescription(!isEditingDescription)}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isEditingDescription ? 'Done' : 'Edit'}</span>
                </button>
              </div>

              {isEditingDescription ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Technical specifications, fabrication notes, QA checklist..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      handleUpdateTaskField({ description });
                      setIsEditingDescription(false);
                    }}
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Save Description
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 whitespace-pre-wrap">
                  {description || 'No description provided. Click edit to add fabrication notes.'}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Collaboration Discussions & Comments Feed (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-[#111827]">
            {/* Discussions Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Collaboration & Discussions
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                  {comments.length}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Real-time team updates & QA logs
              </span>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-[260px] max-h-[380px] scrollbar-thin scrollbar-thumb-slate-800">
              {comments.length === 0 ? (
                <div className="text-center py-12 space-y-2 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No comments on this task yet</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Start a discussion, report blockers, or leave fabrication QA updates for your team.
                  </p>
                </div>
              ) : (
                comments.map((c) => {
                  const isAuthor =
                    c.authorEmail === currentUser?.email ||
                    c.authorName === userProfile?.displayName;
                  const tagStyles: Record<string, string> = {
                    general: 'bg-slate-800 text-slate-400',
                    qa_update: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
                    blocker: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
                    status_change: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
                  };

                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm space-y-2 group hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                            {c.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{c.authorName}</span>
                              {c.authorRole && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                                  {c.authorRole}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {new Date(c.createdAt).toLocaleDateString()} at{' '}
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {c.tag && c.tag !== 'general' && (
                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${tagStyles[c.tag]}`}>
                              {c.tag.replace('_', ' ')}
                            </span>
                          )}
                          {(isAuthor || isAdmin) && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap pl-9">
                        {c.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900/80 space-y-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                <span className="text-slate-400 font-medium shrink-0">Category:</span>
                {(
                  [
                    { id: 'general', label: 'General' },
                    { id: 'qa_update', label: 'QA / Inspection' },
                    { id: 'blocker', label: 'Blocker / Issue' },
                    { id: 'status_change', label: 'Status Update' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCommentTag(t.id)}
                    className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                      commentTag === t.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share an update, QA notes, or collaborate with the team..."
                  className="flex-1 bg-[#131c2d] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 shrink-0"
                >
                  <span>{submittingComment ? 'Sending...' : 'Post'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
