import React, { useState, useMemo } from 'react';
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
  BarChart2,
  List,
  GitCommit,
  Check,
  ChevronRight,
  Filter,
  Download,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
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
import { useTheme } from '../context/ThemeContext';

interface MilestonesViewProps {
  milestones: Milestone[];
  projects: Project[];
}

type ViewMode = 'gantt' | 'timeline' | 'table';

export const MilestonesView: React.FC<MilestonesViewProps> = ({
  milestones,
  projects,
}) => {
  const { isAdmin } = useAuth();
  const { isDark } = useTheme();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects.length > 0 ? projects[0].id : '');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [plannedDueDate, setPlannedDueDate] = useState('');
  const [actualCompletionDate, setActualCompletionDate] = useState('');
  const [status, setStatus] = useState<MilestoneStatus>('in_progress');
  const [progress, setProgress] = useState(50);
  const [phase, setPhase] = useState('Phase 2: Fabrication & Machining');
  const [criticalPath, setCriticalPath] = useState(false);
  const [assignedLead, setAssignedLead] = useState('Praise-God Cebolenkosi Mthethwa');
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingMilestone(null);
    setTitle('');
    setProjectId(projects.length > 0 ? projects[0].id : '');
    setDescription('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setPlannedDueDate(new Date(Date.now() + 86400000 * 21).toISOString().slice(0, 10));
    setActualCompletionDate('');
    setStatus('in_progress');
    setProgress(20);
    setPhase('Phase 2: Fabrication & Machining');
    setCriticalPath(false);
    setAssignedLead('Praise-God Cebolenkosi Mthethwa');
    setIsModalOpen(true);
  };

  const openEditModal = (m: Milestone) => {
    setEditingMilestone(m);
    setTitle(m.title);
    setProjectId(m.projectId);
    setDescription(m.description || '');
    setStartDate(m.startDate || new Date().toISOString().slice(0, 10));
    setPlannedDueDate(m.plannedDueDate || m.dueDate);
    setActualCompletionDate(m.actualCompletionDate || '');
    setStatus(m.status);
    setProgress(m.progress);
    setPhase(m.phase || 'Phase 2: Fabrication & Machining');
    setCriticalPath(Boolean(m.criticalPath));
    setAssignedLead(m.assignedLead || 'Praise-God Cebolenkosi Mthethwa');
    setIsModalOpen(true);
  };

  const calculateVariance = (planned: string, actual?: string): number => {
    if (!planned || !actual) return 0;
    const pDate = new Date(planned).getTime();
    const aDate = new Date(actual).getTime();
    return Math.round((aDate - pDate) / (1000 * 60 * 60 * 24));
  };

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    setSubmitting(true);

    try {
      const variance = actualCompletionDate
        ? calculateVariance(plannedDueDate, actualCompletionDate)
        : 0;

      const updatedData: Partial<Milestone> = {
        title: title.trim(),
        projectId,
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        dueDate: plannedDueDate,
        plannedDueDate,
        actualCompletionDate: actualCompletionDate || undefined,
        status,
        progress: Number(progress),
        phase,
        criticalPath,
        assignedLead: assignedLead.trim() || undefined,
        varianceDays: variance,
      };

      if (editingMilestone) {
        await updateDoc(doc(db, 'milestones', editingMilestone.id), updatedData);
      } else {
        const newM: Omit<Milestone, 'id'> = {
          ...(updatedData as any),
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

  const handleQuickComplete = async (m: Milestone) => {
    const today = new Date().toISOString().slice(0, 10);
    const planned = m.plannedDueDate || m.dueDate;
    const variance = calculateVariance(planned, today);

    try {
      await updateDoc(doc(db, 'milestones', m.id), {
        status: 'completed',
        progress: 100,
        actualCompletionDate: today,
        varianceDays: variance,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `milestones/${m.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this milestone from project schedule?')) return;
    try {
      await deleteDoc(doc(db, 'milestones', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `milestones/${id}`);
    }
  };

  const filtered = useMemo(() => {
    return milestones.filter((m) => {
      const matchProj = selectedProjectId === 'all' || m.projectId === selectedProjectId;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchProj && matchStatus;
    });
  }, [milestones, selectedProjectId, statusFilter]);

  const projectMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p.name]));
  }, [projects]);

  // Executive KPI metrics
  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const inProgressCount = milestones.filter((m) => m.status === 'in_progress').length;
  const criticalPathCount = milestones.filter((m) => m.criticalPath).length;
  const avgProgress = milestones.length
    ? Math.round(milestones.reduce((acc, m) => acc + (m.progress || 0), 0) / milestones.length)
    : 0;

  // On-time percentage calculation
  const completedWithDates = milestones.filter(
    (m) => m.status === 'completed' && m.actualCompletionDate && (m.plannedDueDate || m.dueDate)
  );
  const onTimeCount = completedWithDates.filter((m) => {
    const variance = calculateVariance(m.plannedDueDate || m.dueDate, m.actualCompletionDate);
    return variance <= 0;
  }).length;
  const onTimePercentage = completedWithDates.length
    ? Math.round((onTimeCount / completedWithDates.length) * 100)
    : 100;

  // Timeline / Gantt range calculations (August 2026 to February 2027)
  const timelineMonths = [
    { name: 'Aug 2026', start: new Date('2026-08-01'), end: new Date('2026-08-31') },
    { name: 'Sep 2026', start: new Date('2026-09-01'), end: new Date('2026-09-30') },
    { name: 'Oct 2026', start: new Date('2026-10-01'), end: new Date('2026-10-31') },
    { name: 'Nov 2026', start: new Date('2026-11-01'), end: new Date('2026-11-30') },
    { name: 'Dec 2026', start: new Date('2026-12-01'), end: new Date('2026-12-31') },
    { name: 'Jan 2027', start: new Date('2027-01-01'), end: new Date('2027-01-31') },
  ];

  const timelineStart = new Date('2026-08-01').getTime();
  const timelineEnd = new Date('2027-01-31').getTime();
  const totalDuration = timelineEnd - timelineStart;

  const getPositionPercent = (dateStr?: string) => {
    if (!dateStr) return 0;
    const time = new Date(dateStr).getTime();
    const clamped = Math.max(timelineStart, Math.min(timelineEnd, time));
    return ((clamped - timelineStart) / totalDuration) * 100;
  };

  const getBarWidthPercent = (startStr?: string, dueStr?: string) => {
    const s = getPositionPercent(startStr || '2026-09-01');
    const e = getPositionPercent(dueStr || '2026-10-30');
    return Math.max(4, e - s);
  };

  // Today indicator
  const todayTime = new Date('2026-10-24').getTime();
  const todayPercent = ((todayTime - timelineStart) / totalDuration) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-amber-500" />
              <span>Milestone Visualization Dashboard</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              PM Suite
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Planned vs. actual completion dates, schedule variance tracking, and Gantt roadmap visualization
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-900 dark:bg-slate-900 light:bg-slate-200 p-1 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs">
            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'gantt'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 dark:text-slate-400 light:text-slate-700 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Gantt Chart</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 dark:text-slate-400 light:text-slate-700 hover:text-white'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Roadmap</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 dark:text-slate-400 light:text-slate-700 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Variance Matrix</span>
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Milestone</span>
          </button>
        </div>
      </div>

      {/* Project Manager KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
          <div className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium uppercase tracking-wider">
            Overall Progress
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1 tabular-nums">
            {avgProgress}%
          </div>
          <div className="w-full bg-slate-800 dark:bg-slate-800 light:bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
          <div className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium uppercase tracking-wider">
            Achieved Gates
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1 tabular-nums flex items-baseline gap-2">
            <span>{completedCount}</span>
            <span className="text-xs text-slate-400 font-normal">/ {milestones.length}</span>
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{onTimePercentage}% Delivered on/ahead of schedule</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
          <div className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium uppercase tracking-wider">
            In Active Execution
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-1 tabular-nums">
            {inProgressCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>Active work fronts across projects</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
          <div className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium uppercase tracking-wider">
            Critical Path Gates
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1 tabular-nums">
            {criticalPathCount}
          </div>
          <div className="text-[11px] text-rose-400/90 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Key hold points requiring PM signoff</span>
          </div>
        </div>
      </div>

      {/* Filter and Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-200 dark:text-slate-200 light:text-slate-900 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-200 dark:text-slate-200 light:text-slate-900 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <strong>{filtered.length}</strong> of {milestones.length} milestones
        </div>
      </div>

      {/* VIEW 1: GANTT CHART VIEW */}
      {viewMode === 'gantt' && (
        <div className="p-5 rounded-2xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
                <span>Interactive Schedule & Gantt Timeline</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                  Aug 2026 – Jan 2027
                </span>
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5">
                Horizontal bars represent scheduled milestone duration. Red vertical line marks today's date.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 dark:text-slate-300 light:text-slate-700">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 dark:text-slate-300 light:text-slate-700">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 dark:text-slate-300 light:text-slate-700">
                <span className="w-3 h-3 rounded bg-slate-700 inline-block" />
                <span>Pending</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              {/* Gantt Header: Months */}
              <div className="grid grid-cols-12 border-b border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs pb-2 mb-2 font-mono text-slate-400">
                <div className="col-span-4 font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 pl-2">
                  Project Milestone & Phase
                </div>
                <div className="col-span-8 grid grid-cols-6 text-center">
                  {timelineMonths.map((m) => (
                    <div key={m.name} className="border-l border-slate-800/80 px-1 font-medium">
                      {m.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gantt Rows */}
              <div className="relative space-y-3 pt-2">
                {/* Today vertical line */}
                <div
                  className="absolute top-0 bottom-0 z-10 pointer-events-none flex flex-col items-center"
                  style={{ left: `calc(33.33% + (66.66% * ${todayPercent / 100}))` }}
                >
                  <div className="w-0.5 h-full bg-rose-500/70" />
                  <span className="absolute -top-4 text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold whitespace-nowrap">
                    TODAY
                  </span>
                </div>

                {filtered.map((m) => {
                  const isDone = m.status === 'completed';
                  const isInProgress = m.status === 'in_progress';
                  const variance = m.actualCompletionDate
                    ? calculateVariance(m.plannedDueDate || m.dueDate, m.actualCompletionDate)
                    : 0;

                  const barLeft = getPositionPercent(m.startDate || '2026-09-01');
                  const barWidth = getBarWidthPercent(m.startDate || '2026-09-01', m.plannedDueDate || m.dueDate);

                  return (
                    <div
                      key={m.id}
                      className="grid grid-cols-12 items-center p-2 rounded-xl bg-slate-900/50 dark:bg-slate-900/50 light:bg-slate-50 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 hover:border-slate-700 transition-colors"
                    >
                      {/* Left: Milestone Info */}
                      <div className="col-span-4 pr-3 truncate">
                        <div className="flex items-center gap-2">
                          {m.criticalPath && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold uppercase shrink-0">
                              CP
                            </span>
                          )}
                          <span className="font-bold text-xs text-white dark:text-white light:text-slate-900 truncate" title={m.title}>
                            {m.title}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 truncate mt-0.5">
                          {projectMap.get(m.projectId) || 'Project'} • {m.phase || 'Execution'}
                        </div>
                      </div>

                      {/* Right: Gantt Bar Container */}
                      <div className="col-span-8 relative h-9 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100 rounded-lg overflow-hidden border border-slate-800/60 dark:border-slate-800/60 light:border-slate-300 flex items-center px-1">
                        {/* Month grid lines */}
                        <div className="absolute inset-0 grid grid-cols-6 pointer-events-none">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="border-r border-slate-800/40" />
                          ))}
                        </div>

                        {/* Visual Task Bar */}
                        <div
                          className={`absolute h-6 rounded-md shadow-sm transition-all flex items-center justify-between px-2 cursor-pointer ${
                            isDone
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white'
                              : isInProgress
                              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                          style={{
                            left: `${barLeft}%`,
                            width: `${barWidth}%`,
                          }}
                          onClick={() => openEditModal(m)}
                          title={`${m.title}\nPlanned: ${m.plannedDueDate || m.dueDate}\nActual: ${m.actualCompletionDate || 'Pending'}\nProgress: ${m.progress}%`}
                        >
                          <span className="text-[10px] font-mono truncate mr-1">
                            {m.progress}%
                          </span>
                          {isDone ? (
                            <Check className="w-3 h-3 shrink-0" />
                          ) : (
                            <span className="text-[9px] font-mono font-medium truncate">
                              {m.dueDate.slice(5)}
                            </span>
                          )}
                        </div>

                        {/* Actual Completion Marker (if completed) */}
                        {m.actualCompletionDate && (
                          <div
                            className="absolute top-1 bottom-1 w-1 bg-white ring-2 ring-emerald-400 rounded-full z-20 pointer-events-none"
                            style={{ left: `${getPositionPercent(m.actualCompletionDate)}%` }}
                            title={`Actual Completed: ${m.actualCompletionDate}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ROADMAP TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          {filtered.map((m, idx) => {
            const isDone = m.status === 'completed';
            const isInProgress = m.status === 'in_progress';
            const variance = m.actualCompletionDate
              ? calculateVariance(m.plannedDueDate || m.dueDate, m.actualCompletionDate)
              : 0;

            return (
              <div
                key={m.id}
                className={`p-5 rounded-2xl border transition-all shadow-lg ${
                  isDone
                    ? 'bg-[#111927]/90 dark:bg-[#111927]/90 light:bg-white border-emerald-800/40'
                    : isInProgress
                    ? 'bg-[#111927] dark:bg-[#111927] light:bg-white border-amber-500/30 ring-1 ring-amber-500/10'
                    : 'bg-[#111927]/60 dark:bg-[#111927]/60 light:bg-white border-slate-800 dark:border-slate-800 light:border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        GATE #{idx + 1}
                      </span>
                      {m.phase && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">
                          {m.phase}
                        </span>
                      )}
                      {m.criticalPath && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Critical Path
                        </span>
                      )}
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

                    <h3 className="font-bold text-base text-white dark:text-white light:text-slate-900">
                      {m.title}
                    </h3>
                    <div className="text-xs text-amber-400 font-medium">
                      Project: {projectMap.get(m.projectId) || 'Godongwane Contract'}
                    </div>

                    {m.description && (
                      <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed mt-1">
                        {m.description}
                      </p>
                    )}
                  </div>

                  {/* Planned vs Actual Date Comparison Box */}
                  <div className="p-3 rounded-xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Planned Delivery
                      </div>
                      <div className="font-mono font-bold text-slate-200 dark:text-slate-200 light:text-slate-900 text-xs flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span>{m.plannedDueDate || m.dueDate}</span>
                      </div>
                    </div>

                    <div className="border-t sm:border-t-0 sm:border-l border-slate-800 dark:border-slate-800 light:border-slate-300 pt-2 sm:pt-0 sm:pl-4">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Actual Completion
                      </div>
                      {m.actualCompletionDate ? (
                        <div className="font-mono font-bold text-emerald-400 text-xs flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{m.actualCompletionDate}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-400/80 italic mt-0.5">
                          Pending completion
                        </div>
                      )}
                    </div>

                    <div className="border-t sm:border-t-0 sm:border-l border-slate-800 dark:border-slate-800 light:border-slate-300 pt-2 sm:pt-0 sm:pl-4">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Schedule Variance
                      </div>
                      {m.actualCompletionDate ? (
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded inline-block mt-0.5 ${
                            variance < 0
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : variance === 0
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {variance < 0
                            ? `${Math.abs(variance)} days early`
                            : variance === 0
                            ? 'On Schedule'
                            : `+${variance} days delayed`}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 mt-0.5 inline-block">
                          Tracked live
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isDone && (
                      <button
                        onClick={() => handleQuickComplete(m)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        title="Mark complete and record today as actual completion date"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Sign-off</span>
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(m)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Milestone"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Slider */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Milestone Deliverable Progress</span>
                    <span className="font-mono font-bold text-amber-400">{m.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 dark:bg-slate-800 light:bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDone ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: PLANNED VS ACTUAL VARIANCE MATRIX TABLE */}
      {viewMode === 'table' && (
        <div className="rounded-2xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border-b border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="p-3.5">Milestone & Deliverable</th>
                  <th className="p-3.5">Project</th>
                  <th className="p-3.5">Phase</th>
                  <th className="p-3.5">Planned Date</th>
                  <th className="p-3.5">Actual Date</th>
                  <th className="p-3.5">Variance</th>
                  <th className="p-3.5">Progress</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200">
                {filtered.map((m) => {
                  const variance = m.actualCompletionDate
                    ? calculateVariance(m.plannedDueDate || m.dueDate, m.actualCompletionDate)
                    : 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-900/40 dark:hover:bg-slate-900/40 light:hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-medium text-white dark:text-white light:text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {m.criticalPath && (
                            <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 font-bold uppercase">
                              CP
                            </span>
                          )}
                          <span>{m.title}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-300 dark:text-slate-300 light:text-slate-700">
                        {projectMap.get(m.projectId) || 'Project'}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {m.phase || 'Phase 1'}
                      </td>
                      <td className="p-3.5 font-mono text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {m.plannedDueDate || m.dueDate}
                      </td>
                      <td className="p-3.5 font-mono">
                        {m.actualCompletionDate ? (
                          <span className="text-emerald-400 font-semibold">{m.actualCompletionDate}</span>
                        ) : (
                          <span className="text-slate-500 italic">In progress</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono">
                        {m.actualCompletionDate ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              variance < 0
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : variance === 0
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {variance < 0 ? `${Math.abs(variance)}d early` : variance === 0 ? 'On time' : `+${variance}d`}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-amber-400">
                        {m.progress}%
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            m.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : m.status === 'in_progress'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {m.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(m)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Milestone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] dark:bg-[#111827] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white dark:text-white light:text-slate-900 text-base">
                  {editingMilestone ? 'Edit Project Milestone' : 'Define New Project Milestone'}
                </h3>
                <p className="text-xs text-slate-400">
                  Set planned delivery target, actual completion date, and phase tracking.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="p-5 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Milestone Deliverable Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Non-Destructive Testing (NDT) & Plate Passivation"
                  className="w-full bg-slate-900 dark:bg-slate-900 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-slate-200 dark:text-slate-200 light:text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Associated Project *
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-slate-900 dark:bg-slate-900 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-slate-200 dark:text-slate-200 light:text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Project Phase
                  </label>
                  <select
                    value={phase}
                    onChange={(e) => setPhase(e.target.value)}
                    className="w-full bg-slate-900 dark:bg-slate-900 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-slate-200 dark:text-slate-200 light:text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Phase 1: Material Procurement">Phase 1: Material Procurement</option>
                    <option value="Phase 2: Fabrication & Machining">Phase 2: Fabrication & Machining</option>
                    <option value="Phase 3: Welding & Quality NDT">Phase 3: Welding & Quality NDT</option>
                    <option value="Phase 4: Surface Treatment & Coating">Phase 4: Surface Treatment & Coating</option>
                    <option value="Phase 5: Logistics & Commissioning">Phase 5: Logistics & Commissioning</option>
                  </select>
                </div>
              </div>

              {/* Planned vs Actual Completion Dates */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 space-y-3">
                <div className="font-semibold text-white dark:text-white light:text-slate-900 text-xs">
                  Schedule & Dates Management
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-200 dark:text-slate-200 light:text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Planned Due Date *</label>
                    <input
                      type="date"
                      required
                      value={plannedDueDate}
                      onChange={(e) => setPlannedDueDate(e.target.value)}
                      className="w-full bg-slate-950 dark:bg-slate-950 light:bg-white border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Actual Completion Date</label>
                    <input
                      type="date"
                      value={actualCompletionDate}
                      onChange={(e) => setActualCompletionDate(e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className="w-full bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Status</label>
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

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Completion Progress: {progress}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full accent-amber-500 mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="criticalPathCheck"
                  checked={criticalPath}
                  onChange={(e) => setCriticalPath(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                />
                <label htmlFor="criticalPathCheck" className="text-slate-300 font-medium cursor-pointer">
                  Critical Path Gate (Schedule hold point requiring PM audit)
                </label>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Scope & Deliverable Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Technical criteria for milestone sign-off..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
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
