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
  Sun,
  Moon,
  Truck,
  Sparkles,
  Palette,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ADMIN_EMAILS } from '../firebase';
import { seedInitialDatabase } from '../utils/seedData';

interface SettingsViewProps {
  onOpenDriveModal: () => void;
  onOpenAuthModal: () => void;
  onOpenProfileModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenDriveModal,
  onOpenAuthModal,
  onOpenProfileModal,
}) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const { theme, setTheme, toggleTheme, isDark } = useTheme();
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
      theme,
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
      alert('Godongwane projects, fleet, and timesheets successfully reloaded!');
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
        <h2 className={`text-xl sm:text-2xl font-serif font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'} tracking-tight`}>
          Settings &amp; Preferences
        </h2>
        <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
          Godongwane Progressive Projects • Enterprise Portal Configuration
        </p>
      </div>

      {/* 1. Appearance & Theme Settings Card (Requested by User) */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-[#141c2c] border-slate-800' : 'bg-white border-slate-200'} border shadow-xl space-y-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <Palette className="w-4 h-4 text-amber-500" />
              <span>Appearance &amp; Theme</span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
              Switch between Dark Theme and Light Mode. Your selection is automatically persisted in local storage.
            </p>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
            isDark ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {isDark ? 'Dark Theme Active' : 'Light Mode Active'}
          </span>
        </div>

        {/* Theme Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Dark Theme Option */}
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
              isDark
                ? 'bg-slate-900/90 border-amber-500/60 ring-2 ring-amber-500/20 shadow-md'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Dark Theme</div>
                  <div className="text-[11px] text-slate-400">Deep Navy &amp; Amber</div>
                </div>
              </div>
              {isDark && (
                <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div className="mt-3 p-2 rounded-lg bg-[#090d16] border border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Header: #0d131f</span>
              <span className="text-amber-400">Accent: #f59e0b</span>
            </div>
          </button>

          {/* Light Mode Option */}
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
              !isDark
                ? 'bg-amber-50/60 border-amber-500/60 ring-2 ring-amber-500/20 shadow-md'
                : 'bg-slate-100/10 border-slate-800 hover:border-slate-700 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Light Mode</div>
                  <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Clean Executive White</div>
                </div>
              </div>
              {!isDark && (
                <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div className="mt-3 p-2 rounded-lg bg-white border border-slate-200 text-[10px] text-slate-600 font-mono flex items-center justify-between shadow-xs">
              <span>Card: #ffffff</span>
              <span className="text-amber-600">Accent: #d97706</span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Godongwane Official Services Showcase including Truck Hire */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-[#141c2c] border-slate-800' : 'bg-white border-slate-200'} border shadow-xl space-y-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <Truck className="w-4 h-4 text-amber-500" />
              <span>Official Company Services</span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
              Godongwane Progressive Projects core engineering and logistics capabilities.
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 font-semibold uppercase">
            Active Fleet
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1.5`}>
            <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs">
              <Truck className="w-4 h-4" />
              <span>Truck Hire &amp; Plant</span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
              Heavy transport fleet: 34-ton side tippers, flatbeds, lowbeds, and 12-ton mobile crane trucks for on-site mobilization.
            </p>
            <div className="text-[10px] text-emerald-500 font-mono font-medium pt-1">
              • 6 Commercial Vehicles
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1.5`}>
            <div className="flex items-center gap-2 text-blue-500 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Steel Fabrication</span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
              Architectural and industrial structural steelwork, pipe rack trusses, heavy gantries, and precision welding.
            </p>
            <div className="text-[10px] text-blue-500 font-mono font-medium pt-1">
              • ISO 3834 Compliant
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1.5`}>
            <div className="flex items-center gap-2 text-purple-500 font-semibold text-xs">
              <Database className="w-4 h-4" />
              <span>Turnkey Construction</span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
              End-to-end commercial infrastructure, civil earthworks, plant commissioning, and project management oversight.
            </p>
            <div className="text-[10px] text-purple-500 font-mono font-medium pt-1">
              • Multi-Million Portfolio
            </div>
          </div>
        </div>
      </div>

      {/* Account Card */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-[#141c2c] border-slate-800' : 'bg-white border-slate-200'} border shadow-xl space-y-4`}>
        <div>
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Account &amp; Security</h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            Manage privacy, connected accounts, and your session.
          </p>
        </div>

        {/* Current User Pill */}
        <div className={`p-3.5 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-between`}>
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

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              className={`w-full py-2.5 px-4 rounded-xl ${
                isDark
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              } text-xs font-semibold border flex items-center justify-between transition-colors`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Edit User Profile &amp; Department</span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-500/60" />
            </button>
          )}

          <button
            onClick={() => setPrivacyModal(true)}
            className={`w-full py-2.5 px-4 rounded-xl ${
              isDark
                ? 'bg-slate-900/90 hover:bg-slate-900 text-slate-200 border-slate-800'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            } text-xs font-semibold border flex items-center justify-between transition-colors`}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Privacy Preferences</span>
            </div>
            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </button>

          <button
            onClick={onOpenAuthModal}
            className={`w-full py-2.5 px-4 rounded-xl ${
              isDark
                ? 'bg-slate-900/90 hover:bg-slate-900 text-slate-200 border-slate-800'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            } text-xs font-semibold border flex items-center justify-between transition-colors`}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-500" />
              <span>Add account / Switch user</span>
            </div>
            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </button>

          <button
            onClick={() => logout()}
            className={`w-full py-2.5 px-4 rounded-xl ${
              isDark
                ? 'bg-slate-900/90 hover:bg-slate-900 text-slate-200 border-slate-800'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            } text-xs font-semibold border flex items-center justify-between transition-colors`}
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Log out</span>
            </div>
            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </button>
        </div>
      </div>

      {/* Data Card matching Screenshot 2 with upgraded Cloud Firestore & Google Drive Sync */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-[#141c2c] border-slate-800' : 'bg-white border-slate-200'} border shadow-xl space-y-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <span>Data &amp; Cloud Synchronization</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-normal">
                Online
              </span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
              Persistent cloud storage enabled with Firebase Firestore and Google Drive integration.
            </p>
          </div>
          <Cloud className="w-5 h-5 text-emerald-500" />
        </div>

        <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'} border text-xs leading-relaxed space-y-2`}>
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
              className={`py-2 px-3 rounded-lg ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              } font-semibold text-xs flex items-center justify-center gap-1.5 border transition-colors`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied Diagnostic Report!' : 'Copy Diagnostic Report'}</span>
            </button>

            <button
              onClick={handleResetData}
              disabled={reloading}
              className={`py-2 px-3 rounded-lg ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              } font-semibold text-xs flex items-center justify-center gap-1.5 border transition-colors`}
              title="Reset initial dataset"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} />
              <span>{reloading ? 'Reloading...' : 'Reload Demo Data'}</span>
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
