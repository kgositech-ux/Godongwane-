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
  AlertCircle,
  Loader2,
  FolderCheck,
  Folder,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Project, Task, Milestone, Client, ProjectDocument } from '../types';
import {
  generateProjectsCSV,
  generateTasksCSV,
  generateExecutiveHTMLReport,
  downloadFile,
} from '../utils/googleDriveExport';
import {
  syncAllProjectsToGoogleDrive,
  DriveUploadResult,
} from '../utils/googleDriveService';
import { useAuth } from '../context/AuthContext';

interface GoogleDriveExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  clients: Client[];
  documents: ProjectDocument[];
  onOpenHtmlModal?: () => void;
}

export const GoogleDriveExportModal: React.FC<GoogleDriveExportModalProps> = ({
  isOpen,
  onClose,
  projects,
  tasks,
  milestones,
  clients,
  documents,
  onOpenHtmlModal,
}) => {
  const { currentUser, userProfile, accessToken, connectGoogleDrive } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [driveResult, setDriveResult] = useState<DriveUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'folders' | 'files'>('folders');

  if (!isOpen) return null;

  // Direct sync to Google Drive using the Workspace Drive API
  const executeDriveSync = async (token: string) => {
    setSyncing(true);
    setError(null);
    setProgressMsg('Initializing Google Drive sync...');
    setProgressPct(5);

    try {
      const result = await syncAllProjectsToGoogleDrive({
        projects,
        tasks,
        milestones,
        clients,
        documents,
        accessToken: token,
        userEmail: currentUser?.email || 'mthethwapraisegodcebolenkosi@gmail.com',
        userName: userProfile?.displayName || currentUser?.displayName || 'Praise-God Cebolenkosi Mthethwa',
        onProgress: (msg, pct) => {
          setProgressMsg(msg);
          setProgressPct(pct);
        },
      });

      setDriveResult(result);
      setShowConfirm(false);
    } catch (err: any) {
      console.error('Drive upload failed:', err);
      setError(
        err.message ||
          'Failed to upload directly to Google Drive. You can still download the backup package locally.'
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleStartDriveUpload = async () => {
    setError(null);
    // If we have token, show confirmation modal first as required by Workspace guidelines
    if (accessToken) {
      setShowConfirm(true);
      return;
    }

    // Otherwise connect first
    try {
      setSyncing(true);
      setProgressMsg('Connecting to Google Drive...');
      const token = await connectGoogleDrive();
      setSyncing(false);
      if (token) {
        setShowConfirm(true);
      }
    } catch (err: any) {
      setSyncing(false);
      setError(
        err.message ||
          'Could not connect to Google Drive. Please ensure popup permissions are allowed.'
      );
    }
  };

  const handleConfirmSync = async () => {
    if (!accessToken) {
      try {
        const token = await connectGoogleDrive();
        await executeDriveSync(token);
      } catch (err: any) {
        setError(err.message || 'Authorization failed');
      }
      return;
    }
    await executeDriveSync(accessToken);
  };

  // Local file download fallback
  const handleDownloadAllLocally = () => {
    const projectsCSV = generateProjectsCSV(projects);
    downloadFile(
      projectsCSV,
      `Godongwane_Projects_Master_${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;'
    );

    const tasksCSV = generateTasksCSV(tasks, projects);
    downloadFile(
      tasksCSV,
      `Godongwane_Tasks_Tracker_${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;'
    );

    const htmlReport = generateExecutiveHTMLReport(projects, tasks, milestones, clients);
    downloadFile(
      htmlReport,
      `Godongwane_Executive_Report_${new Date().toISOString().slice(0, 10)}.html`,
      'text/html;charset=utf-8;'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-950/60 via-slate-900 to-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shadow-inner">
              <HardDrive className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Add All Projects to Google Drive</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  {projects.length} Projects
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Godongwane Progressive Projects • Complete Portfolio Cloud Storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Confirmation Dialog as mandated by Workspace Integration guideline */}
          {showConfirm && !syncing && !driveResult && (
            <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-4">
              <div className="flex items-start gap-3">
                <FolderArchive className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Confirm Google Drive Synchronization
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    This will organize and add all <strong className="text-white">{projects.length}</strong> Godongwane projects into your Google Drive under the root folder:
                  </p>
                  <div className="mt-2 inline-block px-2.5 py-1 rounded-md bg-blue-900/60 text-blue-200 font-mono text-xs border border-blue-700/50">
                    Google Drive &gt; Godongwane Progressive Projects /
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3.5 text-xs space-y-2 border border-slate-800 text-slate-300">
                <div className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider">
                  Structure being created in your Google Drive:
                </div>
                <div className="space-y-1.5 pl-1 font-mono text-[11px]">
                  <div className="flex items-center gap-2 text-blue-300 font-bold">
                    <Folder className="w-3.5 h-3.5" />
                    <span>00_Executive_Portfolio/</span>
                  </div>
                  <div className="pl-5 text-slate-400 text-[10px]">
                    • Godongwane_Master_Projects_Portfolio.csv<br />
                    • Godongwane_Master_Tasks_Tracker.csv<br />
                    • Godongwane_Executive_Briefing_Report.html
                  </div>
                  {projects.map((p, idx) => (
                    <div key={p.id} className="pt-1">
                      <div className="flex items-center gap-2 text-emerald-300">
                        <Folder className="w-3.5 h-3.5" />
                        <span>{idx + 1}. {p.name.slice(0, 32)}/</span>
                      </div>
                      <div className="pl-5 text-slate-400 text-[10px]">
                        • Project_Brief.txt &amp; Tasks_{idx + 1}.csv
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSync}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/25 flex items-center gap-2"
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Confirm &amp; Add All to Google Drive</span>
                </button>
              </div>
            </div>
          )}

          {/* Sync In Progress */}
          {syncing && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-blue-500/30 space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center animate-spin">
                <Loader2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Adding Projects to Google Drive...
                </h4>
                <p className="text-xs text-blue-300 mt-1 font-medium">{progressMsg}</p>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 px-1">
                <span>Creating dedicated project folders and tracking files</span>
                <span className="font-mono text-blue-400 font-bold">{progressPct}%</span>
              </div>
            </div>
          )}

          {/* Success State */}
          {driveResult && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <FolderCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-emerald-300">
                      All Projects Successfully Added to Google Drive!
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                      Complete
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Created <strong className="text-white">"{driveResult.folderName}"</strong> in your Google Drive with {driveResult.totalProjectsSynced} individual project folders and {driveResult.uploadedFiles.length} generated documents.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  href={driveResult.folderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Folder in Google Drive</span>
                </a>
                {onOpenHtmlModal && (
                  <button
                    onClick={onOpenHtmlModal}
                    className="py-3 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View / Download HTML</span>
                  </button>
                )}
                <button
                  onClick={handleDownloadAllLocally}
                  className="py-3 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup Archive</span>
                </button>
              </div>

              {/* Tab Selector between Project Folders and Master Files */}
              <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold pt-2">
                <button
                  onClick={() => setSelectedTab('folders')}
                  className={`pb-2 transition-colors ${
                    selectedTab === 'folders'
                      ? 'border-b-2 border-emerald-400 text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Project Folders ({driveResult.projectFolders.length})
                </button>
                <button
                  onClick={() => setSelectedTab('files')}
                  className={`pb-2 transition-colors ${
                    selectedTab === 'files'
                      ? 'border-b-2 border-emerald-400 text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Master Files &amp; Executive Portfolio ({driveResult.masterFiles.length})
                </button>
              </div>

              {/* Project Folders List */}
              {selectedTab === 'folders' && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {driveResult.projectFolders.map((pf, idx) => (
                    <div
                      key={pf.projectId}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="truncate">
                          <div className="font-semibold text-white text-xs truncate">
                            {idx + 1}. {pf.projectName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {pf.files.length} documents uploaded (Brief &amp; Tasks)
                          </div>
                        </div>
                      </div>
                      <a
                        href={pf.folderLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[11px] font-semibold inline-flex items-center gap-1 shrink-0"
                      >
                        <span>Open Folder</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Master Files List */}
              {selectedTab === 'files' && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {driveResult.masterFiles.map((mf) => (
                    <div
                      key={mf.id}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-mono text-slate-200 text-[11px] truncate">
                          {mf.name}
                        </span>
                      </div>
                      {mf.webViewLink && (
                        <a
                          href={mf.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-[11px] inline-flex items-center gap-1 shrink-0 font-medium"
                        >
                          <span>Open File</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-rose-200">Notice</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* Overview Package Card (shown when not yet confirmed or finished) */}
          {!showConfirm && !driveResult && (
            <>
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Portfolio Synchronization Structure</span>
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono">
                    {projects.length} Projects • {tasks.length} Tasks
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300">
                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-100">Individual Project Folders</div>
                      <div className="text-[10px] text-slate-400">Folder for each of the {projects.length} projects</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-100">Tasks &amp; Status Sheets</div>
                      <div className="text-[10px] text-slate-400">CSV formatted for Google Sheets</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-100">Executive Briefing Report</div>
                      <div className="text-[10px] text-slate-400">HTML for Google Docs &amp; Drive</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300">
                    <FolderArchive className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-100">Project Specification Briefs</div>
                      <div className="text-[10px] text-slate-400">Detailed specs, budgets &amp; milestones</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects Preview */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Projects to be Added ({projects.length})</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Total Value: R {projects.reduce((acc, p) => acc + (p.budget || 0), 0).toLocaleString('en-ZA')}
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {projects.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate font-medium text-slate-200">
                          {p.name}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Client: {p.clientName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800">
                          {p.progressPercentage}%
                        </span>
                        <span className="text-[10px] text-slate-300 font-mono font-medium">
                          R {(p.budget || 0).toLocaleString('en-ZA')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleStartDriveUpload}
                  disabled={syncing}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-600 hover:from-blue-500 hover:to-amber-500 text-white transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <HardDrive className="w-4 h-4 text-blue-200" />
                  <span>
                    {accessToken
                      ? 'Add All Projects to Google Drive'
                      : 'Connect Google Drive & Add All Projects'}
                  </span>
                </button>
                {onOpenHtmlModal && (
                  <button
                    onClick={onOpenHtmlModal}
                    className="py-3 px-4 rounded-xl font-semibold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 font-bold"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View / Download HTML</span>
                  </button>
                )}
                <button
                  onClick={handleDownloadAllLocally}
                  className="py-3 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
