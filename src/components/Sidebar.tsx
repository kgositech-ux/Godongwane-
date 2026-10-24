import React from 'react';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Banknote,
  Receipt,
  FolderOpen,
  Milestone as MilestoneIcon,
  Truck,
  Clock,
  BarChart3,
  Settings,
  HardDrive,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  LogIn,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export type ActiveTab =
  | 'dashboard'
  | 'projects'
  | 'tasks'
  | 'milestones'
  | 'truck_hire'
  | 'timesheets'
  | 'reports'
  | 'clients'
  | 'documents'
  | 'employees'
  | 'payroll'
  | 'invoices'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenDriveExport: () => void;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  onOpenDriveExport,
  onOpenProfile,
  onOpenAuth,
}) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'projects' as ActiveTab, label: 'Projects', icon: FolderKanban, badge: 'GPP' },
    { id: 'tasks' as ActiveTab, label: 'Jobs / Tasks', icon: CheckSquare, badge: null },
    { id: 'milestones' as ActiveTab, label: 'Milestones (Gantt)', icon: MilestoneIcon, badge: 'Gantt' },
    { id: 'truck_hire' as ActiveTab, label: 'Truck Hire', icon: Truck, badge: 'Fleet' },
    { id: 'timesheets' as ActiveTab, label: 'Job Timesheets', icon: Clock, badge: 'Hours' },
    { id: 'reports' as ActiveTab, label: 'Tracking Reports', icon: BarChart3, badge: 'Audit' },
    { id: 'clients' as ActiveTab, label: 'Clients', icon: FolderOpen, badge: null },
    { id: 'documents' as ActiveTab, label: 'Documents Repo', icon: FolderOpen, badge: 'Cloud' },
    { id: 'employees' as ActiveTab, label: 'Employees', icon: Users, badge: null },
    { id: 'payroll' as ActiveTab, label: 'Payroll', icon: Banknote, badge: null },
    { id: 'invoices' as ActiveTab, label: 'Invoices', icon: Receipt, badge: null },
    { id: 'settings' as ActiveTab, label: 'Settings & Theme', icon: Settings, badge: null },
  ];

  // User requested: Replace username and service website email with mthethwapraisegodcebolenkosi@gmail.com
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

  const userInitial = displayName.charAt(0).toUpperCase();

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar: Fits 100% full screen on mobile devices, docked w-72 on large screens */}
      <aside
        className={`fixed top-0 bottom-0 left-0 right-0 w-full lg:w-72 lg:right-auto ${
          isDark ? 'bg-[#0d131f] border-slate-800' : 'bg-white border-slate-200'
        } border-r flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header: Godongwane Progressive Projects */}
        <div className={`p-4 sm:p-5 border-b ${isDark ? 'border-slate-800/80 bg-[#0a0e17]' : 'border-slate-200 bg-slate-50/80'} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-amber-500/20">
              G
            </div>
            <div>
              <div className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'} text-sm leading-tight flex items-center gap-1.5`}>
                Godongwane
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/20 font-semibold uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Progressive Projects</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick theme toggle in mobile header */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
              } lg:hidden transition-colors`}
              title="Toggle Theme"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Close button for full screen mobile menu */}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
              } lg:hidden transition-colors flex items-center justify-center`}
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Quick Sign In / Sign Up banner if not authenticated */}
        {!currentUser && (
          <div className="p-3 border-b border-amber-500/20 bg-amber-500/10 lg:hidden">
            <button
              onClick={() => {
                onClose();
                onOpenAuth?.();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Sign Up</span>
            </button>
          </div>
        )}

        {/* Agency Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-6 scrollbar-thin">
          <div>
            <div className={`px-3 mb-2 text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} tracking-wider uppercase`}>
              Agency & Operations
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? isDark
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                          : 'bg-amber-500/10 text-amber-800 border border-amber-500/30 shadow-xs font-semibold'
                        : isDark
                        ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive
                            ? isDark ? 'text-amber-400' : 'text-amber-600'
                            : isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Drive Integration Action */}
          <div className="px-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-900/40">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                Google Drive Sync
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                Backup all Godongwane projects, milestones, and reports directly to Google Drive.
              </p>
              <button
                onClick={onOpenDriveExport}
                className="w-full py-1.5 px-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-blue-900/30"
              >
                <span>Add Projects to Drive</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div>
            <div className="px-3 mb-1 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Godongwane Progressive
            </div>
            <div className="px-3 py-2 text-xs text-slate-400 bg-slate-900/50 rounded-lg border border-slate-800/60">
              <div className="text-slate-200 font-medium">Progressive Projects</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Heavy Fabrication & Construction</div>
            </div>
          </div>
        </div>

        {/* User Card at Bottom: click to manage profile */}
        <div className={`p-3 border-t ${isDark ? 'border-slate-800/80 bg-[#0a0e17]' : 'border-slate-200 bg-slate-50'}`}>
          <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-900/90 border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'} border flex items-center justify-between`}>
            <div
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group/user flex-1"
              title="Click to manage user profile"
            >
              <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-inner group-hover/user:scale-105 transition-transform">
                {userInitial}
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-semibold ${isDark ? 'text-slate-100 group-hover/user:text-amber-400' : 'text-slate-800 group-hover/user:text-amber-600'} truncate flex items-center gap-1 transition-colors`}>
                  <span>{displayName}</span>
                  {isAdmin && (
                    <span title="Full Administrator">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    </span>
                  )}
                </div>
                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate font-mono`}>
                  {displayEmail}
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className={`p-1.5 ${isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'} rounded-lg transition-colors shrink-0`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
