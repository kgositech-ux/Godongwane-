import React from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  HardDrive,
  Users,
  Milestone as MilestoneIcon,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import { Project, Task, Milestone, Client, ProjectDocument, ActivityItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { RecentActivityFeed } from './RecentActivityFeed';
import { getUnifiedActivityFeed } from '../utils/activityLogger';

interface DashboardViewProps {
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  clients: Client[];
  documents: ProjectDocument[];
  activities?: ActivityItem[];
  onOpenNewProject: () => void;
  onOpenNewTask: () => void;
  onOpenDriveModal: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  tasks,
  milestones,
  clients,
  documents,
  activities = [],
  onOpenNewProject,
  onOpenNewTask,
  onOpenDriveModal,
  onNavigateToTab,
}) => {
  const { userProfile, isAdmin } = useAuth();

  const unifiedActivities = getUnifiedActivityFeed(
    activities,
    projects,
    tasks,
    documents,
    milestones
  );

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const avgProgress = projects.length
    ? Math.round(projects.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / projects.length)
    : 0;
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done');
  const completedTasks = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="space-y-6">
      {/* Top Welcome / Status Reporting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#111927] via-[#162133] to-[#0f172a] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real-Time Status Reporting Active
            </span>
            <span className="text-xs text-slate-400">
              Godongwane Progressive Projects
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Project Management & Milestone Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Heavy steel fabrication, conveyor hoppers, and architectural structural engineering oversight.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenDriveModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <HardDrive className="w-4 h-4" />
            <span>Add All to Google Drive</span>
          </button>

          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#111927] border border-slate-800/90 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Portfolio Capital</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            R {totalBudget.toLocaleString('en-ZA')}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span>{projects.length} Active Contracts</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111927] border border-slate-800/90 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Overall Progress</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            {avgProgress}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111927] border border-slate-800/90 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Milestones Met</span>
            <MilestoneIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            {completedMilestones} / {milestones.length}
          </div>
          <div className="text-[11px] text-amber-400 mt-1">
            {milestones.length - completedMilestones} in pipeline
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111927] border border-slate-800/90 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Task Execution</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            {completedTasks} / {tasks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            {urgentTasks.length > 0 && (
              <span className="text-rose-400 font-medium flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> {urgentTasks.length} Urgent
              </span>
            )}
            <span>• {tasks.filter(t => t.status === 'in_progress').length} In Progress</span>
          </div>
        </div>
      </div>

      {/* Milestone Visualization Dashboard */}
      <div className="p-5 rounded-2xl bg-[#111927] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <MilestoneIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Milestone Visualization Dashboard
              </h3>
              <p className="text-xs text-slate-400">
                Critical path tracking & delivery schedules for Godongwane projects
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('milestones')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
          >
            <span>View Full Timeline</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {milestones.slice(0, 4).map((m) => {
            const isDone = m.status === 'completed';
            const isInProgress = m.status === 'in_progress';
            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : isInProgress
                    ? 'bg-amber-950/20 border-amber-800/40'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : isInProgress
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m.status.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Due: {m.dueDate}
                  </span>
                </div>

                <div className="font-semibold text-xs text-slate-100 line-clamp-1">
                  {m.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {m.description}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Milestone Progress</span>
                    <span className="font-mono text-slate-200 font-bold">{m.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
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
      </div>

      {/* Recent Activity Feed - Tracking Changes across Projects, Tasks, and Documents */}
      <RecentActivityFeed
        activities={unifiedActivities}
        onNavigateToTab={onNavigateToTab}
      />

      {/* 2-Column Split: Active Godongwane Projects & Live Task Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Projects List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-[#111927] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Active Godongwane Projects</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('projects')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
              >
                <span>All Projects</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">
                          {project.name}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                            project.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : project.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {project.priority}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Client: <strong className="text-slate-200">{project.clientName}</strong> • Managed by: {project.managerName || 'Admin'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-white font-mono">
                        R {(project.budget || 0).toLocaleString('en-ZA')}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Target: {project.targetCompletionDate || 'Ongoing'}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">
                    {project.description}
                  </p>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Milestone Execution</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {project.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${project.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Centralized Repository & Status Updates */}
        <div className="space-y-6">
          {/* Centralized Document Repository Preview */}
          <div className="p-5 rounded-2xl bg-[#111927] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Centralized Repository</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('documents')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <span>Browse All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {documents.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1 hover:border-slate-700 transition-colors"
                >
                  <div className="font-medium text-slate-200 line-clamp-1">
                    {doc.title}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="capitalize text-amber-400/90">{doc.type}</span>
                    <span>{doc.fileSize || 'Cloud File'}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onOpenDriveModal}
              className="w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Sync Repo to Google Drive</span>
            </button>
          </div>

          {/* Quick Task Dispatcher */}
          <div className="p-5 rounded-2xl bg-[#111927] border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Immediate Action Items</h3>
              <button
                onClick={onOpenNewTask}
                className="text-xs font-medium text-amber-400 hover:underline"
              >
                + Add Task
              </button>
            </div>
            <div className="space-y-2">
              {tasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 mr-2">
                    <div className="font-medium text-slate-200 truncate">{t.title}</div>
                    <div className="text-[10px] text-slate-400">
                      Assigned to: {t.assignedTo || 'Unassigned'}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 uppercase ${
                      t.status === 'done'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
