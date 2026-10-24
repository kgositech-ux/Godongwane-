/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import {
  Client,
  Project,
  Task,
  Milestone,
  ProjectDocument,
  Employee,
  Invoice,
  AppNotification,
  ActivityItem,
  TruckVehicle,
  TruckHireBooking,
  TimesheetEntry,
} from './types';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { TasksKanbanView } from './components/TasksKanbanView';
import { MilestonesView } from './components/MilestonesView';
import { TruckHireView } from './components/TruckHireView';
import { TimesheetsView } from './components/TimesheetsView';
import { TrackingReportsView } from './components/TrackingReportsView';
import { ClientsView } from './components/ClientsView';
import { DocumentsView } from './components/DocumentsView';
import { EmployeesView } from './components/EmployeesView';
import { PayrollView } from './components/PayrollView';
import { InvoicesView } from './components/InvoicesView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { GoogleDriveExportModal } from './components/GoogleDriveExportModal';
import { HtmlReportModal } from './components/HtmlReportModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ProfileModal } from './components/ProfileModal';
import {
  seedInitialDatabase,
  initialClients,
  initialProjects,
  initialMilestones,
  initialTasks,
  initialEmployees,
  initialDocuments,
  initialInvoices,
  initialTruckVehicles,
  initialTruckBookings,
  initialTimesheetEntries,
} from './utils/seedData';
import { Shield, Mail, CheckCircle2 } from 'lucide-react';

function MainApp() {
  const { currentUser, loading, sendVerificationEmail, checkEmailVerified } = useAuth();
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [verifyingNotice, setVerifyingNotice] = useState<string | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [htmlModalOpen, setHtmlModalOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Data Collections initialized with initial demo records for smooth immediate view
  const [clients, setClients] = useState<Client[]>(
    initialClients.map((c, i) => ({ ...c, id: `client-${i + 1}` }))
  );
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [documents, setDocuments] = useState<ProjectDocument[]>(initialDocuments);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [vehicles, setVehicles] = useState<TruckVehicle[]>(initialTruckVehicles);
  const [truckBookings, setTruckBookings] = useState<TruckHireBooking[]>(initialTruckBookings);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>(initialTimesheetEntries);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Setup Firestore real-time listeners (CRITICAL: Only attach onSnapshot if auth is ready and user is authenticated)
  useEffect(() => {
    if (loading || !currentUser) {
      return;
    }
    // 1. Clients Listener
    const unsubClients = onSnapshot(
      collection(db, 'clients'),
      (snap) => {
        const list: Client[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setClients(list);
        // Auto-seed if completely empty
        if (snap.empty) {
          seedInitialDatabase(currentUser?.email || 'servicewebsites6@gmail.com');
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'clients')
    );

    // 2. Projects Listener
    const unsubProjects = onSnapshot(
      collection(db, 'projects'),
      (snap) => {
        const list: Project[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setProjects(list);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'projects')
    );

    // 3. Tasks Listener
    const unsubTasks = onSnapshot(
      collection(db, 'tasks'),
      (snap) => {
        const list: Task[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setTasks(list);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'tasks')
    );

    // 4. Milestones Listener
    const unsubMilestones = onSnapshot(
      collection(db, 'milestones'),
      (snap) => {
        const list: Milestone[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setMilestones(list);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'milestones')
    );

    // 5. Documents Listener
    const unsubDocuments = onSnapshot(
      collection(db, 'documents'),
      (snap) => {
        const list: ProjectDocument[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setDocuments(list);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'documents')
    );

    // 6. Employees Listener
    const unsubEmployees = onSnapshot(
      collection(db, 'employees'),
      (snap) => {
        const list: Employee[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setEmployees(list);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'employees')
    );

    // 7. Invoices Listener
    const unsubInvoices = onSnapshot(
      collection(db, 'invoices'),
      (snap) => {
        const list: Invoice[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setInvoices(list);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'invoices')
    );

    // 8. Notifications Listener
    const unsubNotifications = onSnapshot(
      collection(db, 'notifications'),
      (snap) => {
        const list: AppNotification[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setNotifications(list);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'notifications')
    );

    // 9. Activities Listener
    const unsubActivities = onSnapshot(
      collection(db, 'activities'),
      (snap) => {
        const list: ActivityItem[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setActivities(list);
      },
      (error) => {
        console.warn('Activities listener warning:', error);
      }
    );

    // 10. Truck Vehicles Listener
    const unsubVehicles = onSnapshot(
      collection(db, 'truck_vehicles'),
      (snap) => {
        if (!snap.empty) {
          const list: TruckVehicle[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
          setVehicles(list);
        }
      },
      (error) => console.warn('Vehicles listener warning:', error)
    );

    // 11. Truck Bookings Listener
    const unsubBookings = onSnapshot(
      collection(db, 'truck_hire_bookings'),
      (snap) => {
        if (!snap.empty) {
          const list: TruckHireBooking[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
          setTruckBookings(list);
        }
      },
      (error) => console.warn('Truck bookings listener warning:', error)
    );

    // 12. Timesheets Listener
    const unsubTimesheets = onSnapshot(
      collection(db, 'timesheets'),
      (snap) => {
        if (!snap.empty) {
          const list: TimesheetEntry[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
          setTimesheets(list);
        }
      },
      (error) => console.warn('Timesheets listener warning:', error)
    );

    return () => {
      unsubClients();
      unsubProjects();
      unsubTasks();
      unsubMilestones();
      unsubDocuments();
      unsubEmployees();
      unsubInvoices();
      unsubNotifications();
      unsubActivities();
      unsubVehicles();
      unsubBookings();
      unsubTimesheets();
    };
  }, [currentUser, loading]);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'projects':
        return 'Projects';
      case 'tasks':
        return 'Jobs & Work Orders';
      case 'milestones':
        return 'Milestones (Gantt)';
      case 'truck_hire':
        return 'Truck Hire & Plant Fleet';
      case 'timesheets':
        return 'Job Usage Timesheets';
      case 'reports':
        return 'Tracking & Audit Reports';
      case 'clients':
        return 'Client Database';
      case 'documents':
        return 'Documents Repo';
      case 'employees':
        return 'Employees';
      case 'payroll':
        return 'Payroll';
      case 'invoices':
        return 'Invoices';
      case 'settings':
        return 'Settings & Theme';
      default:
        return 'Portal';
    }
  };

  return (
    <div className={`min-h-screen ${
      isDark ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'
    } flex flex-col antialiased selection:bg-amber-500 selection:text-slate-950 font-sans transition-colors duration-200`}>
      {/* Sidebar Navigation: Full screen on mobile */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenDriveExport={() => setDriveModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Content Pane */}
      <div className="lg:pl-72 flex flex-col flex-1">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenDriveModal={() => setDriveModalOpen(true)}
          onOpenHtmlModal={() => setHtmlModalOpen(true)}
          onOpenNotifications={() => setNotifModalOpen(true)}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenProfile={() => setProfileModalOpen(true)}
          unreadCount={unreadNotifsCount}
          currentTitle={getTabTitle(activeTab)}
        />

        {/* Demo notification banner when not signed in */}
        {!currentUser && !loading && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20 px-4 py-2 sm:px-8 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Offline Preview:</strong> Sign in with Google or Email to unlock cloud synchronization and full administrator access.
              </span>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 shadow-xs ml-2"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Unverified Email Alert Banner */}
        {currentUser && !currentUser.emailVerified && currentUser.providerData.some((p) => p.providerId === 'password') && (
          <div className="bg-gradient-to-r from-blue-900/40 via-amber-900/30 to-blue-950/40 border-b border-amber-500/30 px-4 py-2 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Action Required:</strong> A verification link was sent to <span className="font-mono text-white underline">{currentUser.email}</span>. Please confirm to verify your account.
                {verifyingNotice && <span className="ml-2 text-emerald-300 font-semibold">{verifyingNotice}</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await sendVerificationEmail();
                    setVerifyingNotice('Verification email resent!');
                    setTimeout(() => setVerifyingNotice(null), 4000);
                  } catch (e: any) {
                    setVerifyingNotice(e.message || 'Error sending email');
                  }
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
              >
                Resend Link
              </button>
              <button
                onClick={async () => {
                  const verified = await checkEmailVerified();
                  if (verified) {
                    setVerifyingNotice('Verified successfully!');
                  } else {
                    setVerifyingNotice('Not yet verified in inbox.');
                  }
                  setTimeout(() => setVerifyingNotice(null), 4000);
                }}
                className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
              >
                I've Confirmed
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              projects={projects}
              tasks={tasks}
              milestones={milestones}
              clients={clients}
              documents={documents}
              activities={activities}
              onOpenNewProject={() => setNewProjectModalOpen(true)}
              onOpenNewTask={() => setNewTaskModalOpen(true)}
              onOpenDriveModal={() => setDriveModalOpen(true)}
              onNavigateToTab={(t) => setActiveTab(t)}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              clients={clients}
              tasks={tasks}
              documents={documents}
              employees={employees}
              onOpenDriveModal={() => setDriveModalOpen(true)}
              onOpenHtmlModal={() => setHtmlModalOpen(true)}
              isAddModalOpen={newProjectModalOpen}
              onCloseAddModal={() => setNewProjectModalOpen(false)}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksKanbanView
              tasks={tasks}
              projects={projects}
              employees={employees}
              isAddModalOpen={newTaskModalOpen}
              onCloseAddModal={() => setNewTaskModalOpen(false)}
            />
          )}

          {activeTab === 'milestones' && (
            <MilestonesView milestones={milestones} projects={projects} />
          )}

          {activeTab === 'truck_hire' && (
            <TruckHireView
              vehicles={vehicles}
              bookings={truckBookings}
              clients={clients}
              projects={projects}
            />
          )}

          {activeTab === 'timesheets' && (
            <TimesheetsView
              timesheets={timesheets}
              employees={employees}
              projects={projects}
              tasks={tasks}
            />
          )}

          {activeTab === 'reports' && (
            <TrackingReportsView
              projects={projects}
              milestones={milestones}
              tasks={tasks}
              employees={employees}
              vehicles={vehicles}
              truckBookings={truckBookings}
              timesheets={timesheets}
              clients={clients}
              onOpenDriveModal={() => setDriveModalOpen(true)}
              onOpenHtmlReport={() => setHtmlModalOpen(true)}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView
              clients={clients}
              projects={projects}
              onSelectProjectClient={(cid) => {
                setActiveTab('projects');
              }}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              documents={documents}
              projects={projects}
              onOpenDriveModal={() => setDriveModalOpen(true)}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeesView employees={employees} tasks={tasks} />
          )}

          {activeTab === 'payroll' && (
            <PayrollView employees={employees} tasks={tasks} />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              clients={clients}
              projects={projects}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onOpenDriveModal={() => setDriveModalOpen(true)}
              onOpenAuthModal={() => setAuthModalOpen(true)}
              onOpenProfileModal={() => setProfileModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      <GoogleDriveExportModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        projects={projects}
        tasks={tasks}
        milestones={milestones}
        clients={clients}
        documents={documents}
        onOpenHtmlModal={() => setHtmlModalOpen(true)}
      />

      <HtmlReportModal
        isOpen={htmlModalOpen}
        onClose={() => setHtmlModalOpen(false)}
        projects={projects}
        tasks={tasks}
        milestones={milestones}
        clients={clients}
      />

      <NotificationsModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        notifications={notifications}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
