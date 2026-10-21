import React, { useState } from 'react';
import {
  Lock,
  UserPlus,
  LogOut,
  ChevronRight,
  Database,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Download,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAILS } from '../firebase';
import { seedInitialDatabase } from '../utils/seedData';

interface SettingsViewProps {
  onOpenDriveModal: () => void;
  onOpenAuthModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenDriveModal,
  onOpenAuthModal,
}) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);

  const displayEmail =
    currentUser?.email && currentUser.email !== 'servicewebsites6@gmail.com'
      ? currentUser.email
      : 'mthethwapraisegodcebolenkosi@gmail.com';

  const displayName =
    userProfile?.displayName && userProfile.displayName !== 'Kgosi'
      ? userProfile.displayName
      : currentUser?.displayName && currentUser.displayName !== 'Kgosi'
      ? currentUser.displayName
      : 'mthethwapraisegodcebolenkosi';

  const handleCopyDiagnostics = () => {
    const report = {
      agency: 'Godongwane Progressive Projects',
      platform: 'Godongwane Progressive Projects Management Software',
      authMethod: currentUser?.providerData[0]?.providerId || 'password',
      email: displayEmail,
      isAdmin,
      role: userProfile?.role || 'admin',
      firestoreDatabase: 'ai-studio-godongwaneprojec-b6fc9153-bf16-4eba-afc3-c2d65192ccdf',
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetData = async () => {
    if (!window.confirm('Reload initial Godongwane Progressive Projects demo dataset?')) return;
    setReloading(true);
    try {
      await seedInitialDatabase(displayEmail);
      alert('Godongwane projects and clients successfully reloaded!');
    } catch (e) {
      console.error(e);
    } finally {
      setReloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Title Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 tracking-tight">
          Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Godongwane Progressive Projects
        </p>
      </div>

      {/* Account Card */}
      <div className="p-6 rounded-2xl bg-[#141c2c] border border-slate-800 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Account</h3>
          <p className="text-xs text-slate-400 mt-1">
            Manage privacy, connected accounts, and your session.
          </p>
        </div>

        {/* Current User Pill */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-sm shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{displayName}</span>
                {isAdmin && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Administrator
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {displayEmail}
              </div>
            </div>
          </div>

          <div className="text-right text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Session</span>
          </div>
        </div>

        {/* Action Buttons matching Screenshot 2 */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => setPrivacyModal(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-slate-200 text-xs font-semibold border border-slate-800 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Privacy Preferences</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            onClick={onOpenAuthModal}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-slate-200 text-xs font-semibold border border-slate-800 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span>Add account / Switch user</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            onClick={() => logout()}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-slate-200 text-xs font-semibold border border-slate-800 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Log out</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Data Card matching Screenshot 2 with upgraded Cloud Firestore & Google Drive Sync */}
      <div className="p-6 rounded-2xl bg-[#141c2c] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Data & Cloud Synchronization</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                Online
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Persistent cloud storage enabled with Firebase Firestore and Google Drive integration.
            </p>
          </div>
          <Cloud className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
          <p>
            All Godongwane Progressive Projects records, tasks, milestones, clients, and technical documents are automatically synced in real time to your cloud Firestore database.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={onOpenDriveModal}
              className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Add All Projects to Google Drive</span>
            </button>

            <button
              onClick={handleCopyDiagnostics}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied Diagnostic Report!' : 'Copy Diagnostic Report'}</span>
            </button>
          </div>
        </div>

        {/* Collaborative Administrators */}
        <div className="pt-2 space-y-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Designated Full Administrators</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {ADMIN_EMAILS.map((email) => (
              <div
                key={email}
                className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between"
              >
                <span className="font-mono text-slate-300 truncate">{email}</span>
                <span className="text-[10px] text-amber-400 font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/10">
                  Full Admin
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy Modal */}
      {privacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Privacy & Access Controls</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Godongwane Progressive Projects uses role-based access control (RBAC) backed by zero-trust Firestore security rules. Client records and technical drawings are restricted to authenticated enterprise team members only.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPrivacyModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
