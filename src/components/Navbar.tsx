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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { seedInitialDatabase } from '../utils/seedData';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenDriveModal: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  unreadCount: number;
  currentTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenDriveModal,
  onOpenNotifications,
  onOpenAuth,
  unreadCount,
  currentTitle,
}) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
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
    <header className="sticky top-0 z-30 bg-[#0d131f]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{currentTitle}</span>
              <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                Godongwane Portal
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Godongwane Progressive Projects • Enterprise PM & Client CRM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Seed demo data button for instant verification */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            title="Populate initial demo data matching screenshot"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>{seeding ? 'Seeding...' : seededSuccess ? 'Data Loaded!' : 'Seed Demo Data'}</span>
          </button>

          {/* Drive Export Action */}
          <button
            onClick={onOpenDriveModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-all hover:scale-105"
            title="Export and Add all projects to Google Drive"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Drive Export</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Automated Progress Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-[#0d131f] animate-pulse" />
            )}
          </button>

          {/* User Status / Login */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                  isAdmin
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isAdmin ? (
                  <>
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span>Admin</span>
                  </>
                ) : (
                  <span>{userProfile?.role || 'Staff'}</span>
                )}
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
