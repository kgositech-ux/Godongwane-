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
} from './types';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { TasksKanbanView } from './components/TasksKanbanView';
import { MilestonesView } from './components/MilestonesView';
import { ClientsView } from './components/ClientsView';
import { DocumentsView } from './components/DocumentsView';
import { EmployeesView } from './components/EmployeesView';
import { PayrollView } from './components/PayrollView';
import { InvoicesView } from './components/InvoicesView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { GoogleDriveExportModal } from './components/GoogleDriveExportModal';
import { NotificationsModal } from './components/NotificationsModal';
import { seedInitialDatabase } from './utils/seedData';

function MainApp() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);

  // Data Collections
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Setup Firestore real-time listeners
  useEffect(() => {
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
    };
  }, [currentUser]);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'projects':
        return 'Projects';
      case 'tasks':
        return 'Jobs';
      case 'milestones':
        return 'Milestones';
      case 'clients':
        return 'Client Database';
      case 'documents':
        return 'Documents';
      case 'employees':
        return 'Employees';
      case 'payroll':
        return 'Payroll';
      case 'invoices':
        return 'Invoices';
      case 'settings':
        return 'Settings';
      default:
        return 'Portal';
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenDriveExport={() => setDriveModalOpen(true)}
      />

      {/* Main Content Pane */}
      <div className="lg:pl-72 flex flex-col flex-1">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenDriveModal={() => setDriveModalOpen(true)}
          onOpenNotifications={() => setNotifModalOpen(true)}
          onOpenAuth={() => setAuthModalOpen(true)}
          unreadCount={unreadNotifsCount}
          currentTitle={getTabTitle(activeTab)}
        />

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
              onOpenDriveModal={() => setDriveModalOpen(true)}
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
            <EmployeesView employees={employees} />
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
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <GoogleDriveExportModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        projects={projects}
        tasks={tasks}
        milestones={milestones}
        clients={clients}
        documents={documents}
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
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
