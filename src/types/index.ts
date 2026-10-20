export type UserRole = 'admin' | 'project_manager' | 'collaborator' | 'employee';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  organization?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type?: string;
  address?: string;
  status: 'active' | 'inactive' | 'lead';
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  description: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  startDate?: string;
  targetCompletionDate?: string;
  budget: number;
  progressPercentage: number;
  managerId?: string;
  managerName?: string;
  collaboratorEmails?: string[];
  createdAt: string;
  updatedAt?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: PriorityLevel;
  assignedTo?: string;
  assignedToEmail?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  milestoneId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: MilestoneStatus;
  progress: number;
  createdAt: string;
}

export type DocumentType =
  | 'blueprint'
  | 'contract'
  | 'specification'
  | 'report'
  | 'invoice'
  | 'drive_export'
  | 'other';

export interface ProjectDocument {
  id: string;
  projectId?: string;
  projectName?: string;
  title: string;
  type: DocumentType;
  fileUrl?: string;
  fileSize?: string;
  driveFileId?: string;
  driveLink?: string;
  uploadedBy?: string;
  uploadedByEmail?: string;
  notes?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  hourlyRate: number;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  issuedDate: string;
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  hoursWorked: number;
  hourlyRate: number;
  totalGross: number;
  status: 'pending' | 'approved' | 'paid';
  paidDate?: string;
}

export interface AppNotification {
  id: string;
  recipientEmail: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'milestone_completed' | 'status_update' | 'system';
  projectId?: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'project' | 'task' | 'document' | 'milestone' | 'client';
  action: 'created' | 'updated' | 'status_changed' | 'progress_updated' | 'uploaded';
  title: string;
  description?: string;
  userName?: string;
  userEmail?: string;
  timestamp: string;
  entityId?: string;
}
