import React, { useState } from 'react';
import {
  Activity,
  FolderKanban,
  CheckSquare,
  FileText,
  Milestone as MilestoneIcon,
  Clock,
  User,
  Filter,
  Search,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ActivityItem } from '../types';

interface RecentActivityFeedProps {
  activities: ActivityItem[];
  onNavigateToTab: (tab: any) => void;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  onNavigateToTab,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expanded, setExpanded] = useState<boolean>(false);

  const filtered = activities.filter((act) => {
    const matchType = filterType === 'all' || act.type === filterType;
    const matchSearch =
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.description && act.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (act.userName && act.userName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  const displayed = expanded ? filtered : filtered.slice(0, 6);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'project':
        return <FolderKanban className="w-4 h-4 text-amber-400" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-blue-400" />;
      case 'document':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'milestone':
        return <MilestoneIcon className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionBadgeColor = (action: ActivityItem['action']) => {
    switch (action) {
      case 'created':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'status_changed':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'progress_updated':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'uploaded':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recently';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  };

  const handleActionClick = (type: ActivityItem['type']) => {
    switch (type) {
      case 'project':
        onNavigateToTab('projects');
        break;
      case 'task':
        onNavigateToTab('tasks');
        break;
      case 'document':
        onNavigateToTab('documents');
        break;
      case 'milestone':
        onNavigateToTab('milestones');
        break;
      default:
        onNavigateToTab('dashboard');
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#111927] border border-slate-800 shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Recent Activity Feed</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Audit trail of changes across projects, fabrication tasks, and documents
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'project', label: 'Projects' },
            { id: 'task', label: 'Tasks' },
            { id: 'document', label: 'Documents' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === item.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline Items */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            <Activity className="w-7 h-7 mx-auto mb-2 opacity-40 text-slate-400" />
            <p>No activity records match the selected filter.</p>
          </div>
        ) : (
          displayed.map((act) => (
            <div
              key={act.id}
              onClick={() => handleActionClick(act.type)}
              className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/95 transition-all shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5 group-hover:border-slate-700 transition-colors">
                  {getActivityIcon(act.type)}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-xs sm:text-sm text-slate-100 group-hover:text-amber-300 transition-colors">
                      {act.title}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getActionBadgeColor(
                        act.action
                      )}`}
                    >
                      {act.action.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono capitalize">
                      ({act.type})
                    </span>
                  </div>

                  {act.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {act.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-slate-300">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[140px]">{act.userName || 'System'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formatTimeAgo(act.timestamp)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:self-center shrink-0 flex items-center gap-1 text-xs text-slate-400 group-hover:text-amber-400 font-medium transition-colors">
                <span>View {act.type}</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Expand / Collapse Button */}
      {filtered.length > 6 && (
        <div className="pt-1 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors inline-flex items-center gap-1.5"
          >
            <span>{expanded ? 'Show Less' : `Show All ${filtered.length} Activities`}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
};
