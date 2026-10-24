export type UserRole = 'admin' | 'project_manager' | 'collaborator' | 'employee';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  organization?: string;
  department?: string;
  phone?: string;
  bio?: string;
  statusText?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole?: string;
  content: string;
  tag?: 'general' | 'qa_update' | 'blocker' | 'status_change';
  createdAt: string;
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

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  startDate?: string;
  dueDate: string; // Planned completion date
  plannedDueDate?: string; // Explicit planned date
  actualCompletionDate?: string; // Recorded actual completion date
  status: MilestoneStatus;
  progress: number;
  phase?: string; // e.g. 'Phase 1: Procurement', 'Phase 2: Fabrication', 'Phase 3: Testing'
  criticalPath?: boolean;
  assignedLead?: string;
  varianceDays?: number; // Days ahead (-) or delayed (+)
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
  tags?: string[];
  shareableId?: string;
  downloadCount?: number;
  fileData?: string;
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
  type: 'project' | 'task' | 'document' | 'milestone' | 'client' | 'truck_hire' | 'timesheet';
  action: 'created' | 'updated' | 'status_changed' | 'progress_updated' | 'uploaded' | 'dispatched' | 'approved';
  title: string;
  description?: string;
  userName?: string;
  userEmail?: string;
  timestamp: string;
  entityId?: string;
}

/* =========================================================
 * Truck Hire & Heavy Logistics Types
 * ========================================================= */
export type TruckCategory =
  | 'tipper'
  | 'flatbed'
  | 'lowbed'
  | 'crane_truck'
  | 'water_tanker'
  | 'rigid_truck';

export type TruckStatus = 'available' | 'on_hire' | 'maintenance' | 'dispatched';

export interface TruckVehicle {
  id: string;
  name: string;
  model: string;
  registration: string;
  category: TruckCategory;
  capacity: string;
  dailyRate: number; // in ZAR
  hourlyRate: number; // in ZAR
  status: TruckStatus;
  driverAssigned?: string;
  currentProject?: string;
  location: string;
  fuelEfficiency?: string;
  lastInspectionDate?: string;
  description?: string;
  createdAt: string;
}

export interface TruckHireBooking {
  id: string;
  truckId: string;
  truckName: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  startDate: string;
  endDate: string;
  rateType: 'daily' | 'hourly' | 'monthly' | 'tonnage';
  agreedRate: number;
  totalEstimatedCost: number;
  status: 'active' | 'scheduled' | 'completed' | 'cancelled';
  driverAssigned?: string;
  pickupLocation: string;
  destination: string;
  material?: string;
  notes?: string;
  createdAt: string;
}

/* =========================================================
 * Employee Job Usage Timesheet Types
 * ========================================================= */
export type JobCategory =
  | 'fabrication'
  | 'welding'
  | 'site_assembly'
  | 'truck_operation'
  | 'qa_inspection'
  | 'project_management'
  | 'logistics';

export type TimesheetStatus = 'submitted' | 'approved' | 'rejected';

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskTitle?: string;
  date: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  hourlyRate: number;
  totalCost: number;
  jobCategory: JobCategory;
  workDescription: string;
  status: TimesheetStatus;
  supervisorApprovedBy?: string;
  approvedAt?: string;
  createdAt: string;
}
