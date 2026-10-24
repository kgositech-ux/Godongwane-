import React from 'react';
import {
  Menu,
  Bell,
  HardDrive,
  Database,
  Shield,
  User as UserIcon,
  LogIn,
  CheckCircle2,
  FileCode,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { seedInitialDatabase } from '../utils/seedData';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenDriveModal: () => void;
  onOpenHtmlModal?: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  unreadCount: number;
  currentTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenDriveModal,
  onOpenHtmlModal,
  onOpenNotifications,
  onOpenAuth,
  onOpenProfile,
  unreadCount,
  currentTitle,
}) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [seeding, setSeeding] = React.useState(false);
  const [seededSuccess, setSeededSuccess] = React.useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedInitialDatabase(currentUser?.email || 'mthethwapraisegodcebolenkosi@gmail.com');
      setSeededSuccess(true);
      setTimeout(() => setSeededSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className={`sticky top-0 z-30 ${
      isDark ? 'bg-[#0d131f]/90 border-slate-800/80' : 'bg-white/90 border-slate-200'
    } backdrop-blur-md border-b px-4 py-3 lg:px-8 transition-colors`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className={`p-2 -ml-2 rounded-xl ${
              isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            } lg:hidden`}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <span>{currentTitle}</span>
              <span className={`hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600 border border-slate-200'
              } font-normal`}>
                Godongwane Portal
              </span>
            </h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} hidden sm:block`}>
              Godongwane Progressive Projects • Enterprise PM &amp; Client CRM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Quick Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all duration-200 ${
              isDark
                ? 'bg-slate-800/80 border-slate-700/60 text-amber-300 hover:bg-slate-700 hover:text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle color theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Seed demo data button for instant verification */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            } transition-colors border`}
            title="Populate initial demo data"
          >
            <Database className="w-3.5 h-3.5 text-amber-500" />
            <span>{seeding ? 'Seeding...' : seededSuccess ? 'Data Loaded!' : 'Seed Demo Data'}</span>
          </button>

          {/* Drive Export Action */}
          <button
            onClick={onOpenDriveModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/40 hover:to-indigo-600/40 text-blue-200 border border-blue-500/40 transition-all hover:scale-105 shrink-0"
            title="Export and Add all projects to Google Drive"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Add All to Drive</span>
            <span className="sm:hidden">Drive</span>
          </button>

          {/* Replaced HTML badge with prominent Signup / Login button (Requested by User) */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenProfile}
                className={`text-[11px] sm:text-xs px-2.5 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all ${
                  isAdmin
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 shadow-xs'
                    : isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                }`}
                title="Manage User Profile"
              >
                <UserIcon className="w-3.5 h-3.5 text-amber-500" />
                <span className="max-w-[85px] sm:max-w-[140px] truncate font-medium">
                  {userProfile?.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Profile')}
                </span>
                {isAdmin && (
                  <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 transition-all shadow-sm shadow-amber-500/30 hover:scale-105 cursor-pointer shrink-0"
              title="Sign In or Sign Up"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-950" />
              <span>
                Sign In <span className="hidden xs:inline">/ Sign Up</span>
              </span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className={`relative p-2 rounded-xl ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            } transition-colors`}
            title="Automated Progress Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-[#0d131f] animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
