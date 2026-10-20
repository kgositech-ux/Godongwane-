import React, { useState } from 'react';
import {
  X,
  HardDrive,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  ExternalLink,
  FolderArchive,
  ArrowRight,
} from 'lucide-react';
import { Project, Task, Milestone, Client, ProjectDocument } from '../types';
import {
  generateProjectsCSV,
  generateTasksCSV,
  generateExecutiveHTMLReport,
  downloadFile,
  recordDriveExportInFirestore,
} from '../utils/googleDriveExport';
import { useAuth } from '../context/AuthContext';

interface GoogleDriveExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  clients: Client[];
  documents: ProjectDocument[];
}

export const GoogleDriveExportModal: React.FC<GoogleDriveExportModalProps> = ({
  isOpen,
  onClose,
  projects,
  tasks,
  milestones,
  clients,
  documents,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [exportedCount, setExportedCount] = useState(0);

  if (!isOpen) return null;

  const handleExportAllToDrive = async () => {
    setExporting(true);
    setCompleted(false);

    try {
      // 1. Generate Google Sheets CSV for Projects
      const projectsCSV = generateProjectsCSV(projects);
      downloadFile(
        projectsCSV,
        `Godongwane_Projects_Summary_${new Date().toISOString().slice(0, 10)}.csv`,
        'text/csv;charset=utf-8;'
      );

      // 2. Generate Google Sheets CSV for Tasks & Milestones
      const tasksCSV = generateTasksCSV(tasks, projects);
      downloadFile(
        tasksCSV,
        `Godongwane_Tasks_Tracking_${new Date().toISOString().slice(0, 10)}.csv`,
        'text/csv;charset=utf-8;'
      );

      // 3. Generate Executive Briefing Report (HTML/Drive Doc format)
      const htmlReport = generateExecutiveHTMLReport(projects, tasks, milestones, clients);
      downloadFile(
        htmlReport,
        `Godongwane_Executive_Report_${new Date().toISOString().slice(0, 10)}.html`,
        'text/html;charset=utf-8;'
      );

      // 4. Record the export in Firestore centralized document repository
      await recordDriveExportInFirestore(
        currentUser?.email || 'servicewebsites6@gmail.com',
        userProfile?.displayName || 'Kgosi (Service Websites)',
        projects.length
      );

      setExportedCount(projects.length);
      setCompleted(true);
    } catch (err) {
      console.error('Failed to export to Drive bundle', err);
    } finally {
      setExporting(false);
    }
  };

  const handleOpenGoogleDrive = () => {
    window.open('https://drive.google.com/drive/my-drive', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Add All Projects to Google Drive
              </h2>
              <p className="text-xs text-slate-400">
                Godongwane Progressive Projects • Cloud Archive Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-200">
              Project Portfolio Package Contents ({projects.length} Projects, {tasks.length} Tasks, {milestones.length} Milestones)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium text-slate-100">Projects Summary Sheet</div>
                  <div className="text-[10px] text-slate-400">CSV formatted for Google Sheets</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium text-slate-100">Tasks & Status Tracker</div>
                  <div className="text-[10px] text-slate-400">CSV formatted for Google Sheets</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="font-medium text-slate-100">Executive Briefing Report</div>
                  <div className="text-[10px] text-slate-400">HTML for Google Docs & Drive</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300">
                <FolderArchive className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-medium text-slate-100">Firestore Cloud Sync</div>
                  <div className="text-[10px] text-slate-400">Saved to Centralized Repo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Project List Preview */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Projects Ready for Drive Backup:
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="truncate font-medium text-slate-200 mr-2">
                    {p.name}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800">
                      {p.progressPercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      R {(p.budget || 0).toLocaleString('en-ZA')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed notification */}
          {completed && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>All {exportedCount} projects packaged and synced!</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your portfolio sheets and executive briefing report have been downloaded and recorded in your Centralized Repository. You can open your Google Drive now to organize them into your team folder.
              </p>
              <button
                onClick={handleOpenGoogleDrive}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                <span>Open in Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportAllToDrive}
              disabled={exporting}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>
                {exporting ? 'Generating Drive Files...' : 'Add All Projects to Google Drive'}
              </span>
            </button>
            <button
              onClick={handleOpenGoogleDrive}
              className="py-3 px-4 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <span>Go to Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
