import {
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Client, Project, Task, Milestone, ProjectDocument, Employee, Invoice } from '../types';

export const initialClients: Omit<Client, 'id'>[] = [
  {
    name: 'Godongwane Progressive Projects',
    email: 'info@godongwaneprojects.co.za',
    phone: '+27 (0) 11 849 2034',
    type: 'Stainless Steel Fabrication & Structural Steel',
    address: 'Unit 4, Progressive Industrial Park, Wadeville, Germiston, Gauteng',
    status: 'active',
    notes: 'Primary enterprise client. Major projects in mining chutes, conveyor hoppers, architectural stainless balustrades.',
    createdAt: new Date('2026-01-15').toISOString(),
  },
  {
    name: 'FUTAZ Thatch Construction, Gardening & Landscaping',
    email: 'contact@futazconstruction.co.za',
    phone: '+27 (0) 82 443 9102',
    type: 'Thatch Construction, Gardening & Landscaping',
    address: 'Plot 12, Swartkop Eco-Estate, Muldersdrift',
    status: 'active',
    notes: 'Specialist lodge roofing, timber trusses, landscaping installations.',
    createdAt: new Date('2026-02-01').toISOString(),
  },
  {
    name: 'Genesis Co. Renovation & Roofing',
    email: 'projects@genesisroofing.co.za',
    phone: '+27 (0) 12 654 8831',
    type: 'Renovation & Roofing',
    address: '88 Industrial Crescent, Silverton, Pretoria',
    status: 'active',
    notes: 'Commercial roof restoration, corrugated cladding, industrial waterproofing.',
    createdAt: new Date('2026-02-18').toISOString(),
  },
];

export const initialProjects: Project[] = [
  {
    id: 'proj-hopper-assembly',
    name: 'Stainless Steel Hopper & Conveyor Chute Assembly',
    clientId: 'client-1',
    clientName: 'Godongwane Progressive Projects',
    description: 'Precision fabrication of Grade 316 stainless steel feeding hoppers, heavy-duty wear liners, and laser-cut chute transition boxes for industrial processing plant.',
    status: 'in_progress',
    priority: 'urgent',
    startDate: '2026-09-01',
    targetCompletionDate: '2026-11-30',
    budget: 345000,
    progressPercentage: 68,
    managerName: 'Praise-God Cebolenkosi Mthethwa',
    collaboratorEmails: ['mthethwapraisegodcebolenkosi@gmail.com'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj-balustrades-commercial',
    name: 'Commercial Balustrades & Stainless Steel Handrails',
    clientId: 'client-1',
    clientName: 'Godongwane Progressive Projects',
    description: 'Architectural Grade 304 satin-brushed tubular balustrades with tempered glass infill panels across 4 office floor levels.',
    status: 'in_progress',
    priority: 'high',
    startDate: '2026-08-15',
    targetCompletionDate: '2026-12-15',
    budget: 185000,
    progressPercentage: 42,
    managerName: 'Praise-God Cebolenkosi Mthethwa',
    collaboratorEmails: ['mthethwapraisegodcebolenkosi@gmail.com'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj-structural-canopy',
    name: 'Structural Steel Canopy & Entrance Portal',
    clientId: 'client-1',
    clientName: 'Godongwane Progressive Projects',
    description: 'Heavy structural I-beam portal frame, hot-dip galvanized purlins, and polycarbonate canopy roof covering with stormwater guttering.',
    status: 'planning',
    priority: 'medium',
    startDate: '2026-10-01',
    targetCompletionDate: '2027-01-20',
    budget: 220000,
    progressPercentage: 15,
    managerName: 'Praise-God Cebolenkosi Mthethwa',
    collaboratorEmails: ['mthethwapraisegodcebolenkosi@gmail.com'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const initialMilestones: Milestone[] = [
  {
    id: 'ms-hopper-1',
    projectId: 'proj-hopper-assembly',
    title: 'Material Sourcing & Grade 316 Certification',
    description: 'Mill test certificates verified for 8mm & 12mm 316L plates.',
    dueDate: '2026-09-15',
    status: 'completed',
    progress: 100,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ms-hopper-2',
    projectId: 'proj-hopper-assembly',
    title: 'CNC Plasma Cutting & Hydraulic Press Braking',
    description: 'Chute segment beveling and plate curving to mechanical drawing specs.',
    dueDate: '2026-10-10',
    status: 'completed',
    progress: 100,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ms-hopper-3',
    projectId: 'proj-hopper-assembly',
    title: 'TIG Welding & Flange Fit-up Inspection',
    description: 'Full penetration seams and dye-penetrant testing on structural joints.',
    dueDate: '2026-10-28',
    status: 'in_progress',
    progress: 75,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ms-hopper-4',
    projectId: 'proj-hopper-assembly',
    title: 'Acid Passivation, Pickling & Site Delivery',
    description: 'Surface decontamination, quality QA signoff, transport to plant.',
    dueDate: '2026-11-20',
    status: 'pending',
    progress: 0,
    createdAt: new Date().toISOString(),
  },
];

export const initialTasks: Task[] = [
  {
    id: 'task-101',
    projectId: 'proj-hopper-assembly',
    title: 'Verify Weld Penetration & Non-Destructive Testing',
    description: 'Coordinate with third-party QA inspector for dye-penetrant testing on hopper conical seams.',
    status: 'in_progress',
    priority: 'urgent',
    assignedTo: 'Praise-God Cebolenkosi Mthethwa',
    assignedToEmail: 'mthethwapraisegodcebolenkosi@gmail.com',
    dueDate: '2026-10-25',
    estimatedHours: 16,
    actualHours: 12,
    milestoneId: 'ms-hopper-3',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-102',
    projectId: 'proj-hopper-assembly',
    title: 'Mount Reinforcing Stiffener Ribs',
    description: 'Tack weld and finalize 50x10mm stiffener bars along hopper walls.',
    status: 'in_progress',
    priority: 'high',
    assignedTo: 'Praise-God Cebolenkosi Mthethwa',
    assignedToEmail: 'mthethwapraisegodcebolenkosi@gmail.com',
    dueDate: '2026-10-27',
    estimatedHours: 24,
    actualHours: 18,
    milestoneId: 'ms-hopper-3',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-103',
    projectId: 'proj-hopper-assembly',
    title: 'Order Pickling Paste & Passivation Chemical Drums',
    description: 'Procure industrial grade pickling acid bath agents for post-weld surface treatment.',
    status: 'todo',
    priority: 'medium',
    assignedTo: 'Praise-God Cebolenkosi Mthethwa',
    assignedToEmail: 'mthethwapraisegodcebolenkosi@gmail.com',
    dueDate: '2026-11-02',
    estimatedHours: 6,
    actualHours: 0,
    milestoneId: 'ms-hopper-4',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-104',
    projectId: 'proj-balustrades-commercial',
    title: 'Site Laser Measurement - Floors 1 to 4 Staircases',
    description: 'Digital 3D level checks for core drill balustrade mounting holes.',
    status: 'done',
    priority: 'high',
    assignedTo: 'Praise-God Cebolenkosi Mthethwa',
    assignedToEmail: 'mthethwapraisegodcebolenkosi@gmail.com',
    dueDate: '2026-09-30',
    estimatedHours: 14,
    actualHours: 14,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-105',
    projectId: 'proj-balustrades-commercial',
    title: 'Fabricate 50mm Stainless Handrail Mandrel Bends',
    description: 'Form continuous handrail curved sections on CNC pipe bender.',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: 'Praise-God Cebolenkosi Mthethwa',
    assignedToEmail: 'mthethwapraisegodcebolenkosi@gmail.com',
    dueDate: '2026-11-05',
    estimatedHours: 32,
    actualHours: 20,
    createdAt: new Date().toISOString(),
  },
];

export const initialEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Praise-God Cebolenkosi Mthethwa',
    email: 'mthethwapraisegodcebolenkosi@gmail.com',
    role: 'Lead Project Director & Managing Executive',
    department: 'Executive Management & Operations',
    hourlyRate: 650,
    phone: '+27 (0) 83 987 6543',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-2',
    name: 'Sipho Zulu',
    email: 's.zulu@godongwaneprojects.co.za',
    role: 'Senior Workshop Fabrication Supervisor',
    department: 'Stainless Steel Workshop',
    hourlyRate: 480,
    phone: '+27 (0) 84 555 1209',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-3',
    name: 'Lindiwe Ndlovu',
    email: 'l.ndlovu@godongwaneprojects.co.za',
    role: 'Quality Assurance & Safety Officer',
    department: 'HSE & Compliance',
    hourlyRate: 420,
    phone: '+27 (0) 72 334 9901',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-4',
    name: 'Themba Khumalo',
    email: 't.khumalo@godongwaneprojects.co.za',
    role: 'Precision Welder & Rigging Specialist',
    department: 'Structural Engineering',
    hourlyRate: 390,
    phone: '+27 (0) 71 889 0041',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const initialDocuments: ProjectDocument[] = [
  {
    id: 'doc-101',
    projectId: 'proj-hopper-assembly',
    projectName: 'Stainless Steel Hopper & Conveyor Chute Assembly',
    title: 'Hopper Assembly General Arrangement CAD Drawing (REV-D)',
    type: 'blueprint',
    fileSize: '4.8 MB',
    driveLink: 'https://drive.google.com/drive/my-drive',
    uploadedBy: 'Praise-God Cebolenkosi Mthethwa',
    uploadedByEmail: 'mthethwapraisegodcebolenkosi@gmail.com',
    notes: 'Approved by structural engineering consultant for 316L fabrication.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'doc-102',
    projectId: 'proj-hopper-assembly',
    projectName: 'Stainless Steel Hopper & Conveyor Chute Assembly',
    title: '316L Stainless Steel Mill Test Certificate (MTC-8924)',
    type: 'specification',
    fileSize: '1.2 MB',
    driveLink: 'https://drive.google.com/drive/my-drive',
    uploadedBy: 'Praise-God Cebolenkosi Mthethwa',
    uploadedByEmail: 'mthethwapraisegodcebolenkosi@gmail.com',
    notes: 'Chemical composition & tensile strength laboratory batch sheet.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'doc-103',
    projectId: 'proj-balustrades-commercial',
    projectName: 'Commercial Balustrades & Stainless Steel Handrails',
    title: 'Building Safety Code Balustrade Impact Test Sign-off',
    type: 'report',
    fileSize: '2.1 MB',
    driveLink: 'https://drive.google.com/drive/my-drive',
    uploadedBy: 'Praise-God Cebolenkosi Mthethwa',
    uploadedByEmail: 'mthethwapraisegodcebolenkosi@gmail.com',
    notes: 'SANS 10400 compliance report signed off by civil inspector.',
    createdAt: new Date().toISOString(),
  },
];

export const initialInvoices: Invoice[] = [
  {
    id: 'inv-GPP-089',
    invoiceNumber: 'INV-2026-089',
    clientId: 'client-1',
    clientName: 'Godongwane Progressive Projects',
    projectId: 'proj-hopper-assembly',
    projectName: 'Stainless Steel Hopper & Conveyor Chute Assembly',
    amount: 115000,
    currency: 'ZAR',
    status: 'paid',
    issuedDate: '2026-09-16',
    dueDate: '2026-10-16',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-GPP-090',
    invoiceNumber: 'INV-2026-090',
    clientId: 'client-1',
    clientName: 'Godongwane Progressive Projects',
    projectId: 'proj-hopper-assembly',
    projectName: 'Stainless Steel Hopper & Conveyor Chute Assembly',
    amount: 120000,
    currency: 'ZAR',
    status: 'sent',
    issuedDate: '2026-10-12',
    dueDate: '2026-11-12',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-GPP-091',
    invoiceNumber: 'INV-2026-091',
    clientId: 'client-1',
    clientName: 'Godongwane Progressive Projects',
    projectId: 'proj-balustrades-commercial',
    projectName: 'Commercial Balustrades & Stainless Steel Handrails',
    amount: 75000,
    currency: 'ZAR',
    status: 'draft',
    issuedDate: '2026-10-18',
    dueDate: '2026-11-18',
    createdAt: new Date().toISOString(),
  },
];

export async function seedInitialDatabase(adminEmail: string) {
  try {
    const clientsRef = collection(db, 'clients');
    const existingSnap = await getDocs(clientsRef);
    if (!existingSnap.empty) {
      console.log('Database already has client records.');
      return;
    }

    const batch = writeBatch(db);

    initialClients.forEach((c, i) => {
      const id = `client-${i + 1}`;
      batch.set(doc(db, 'clients', id), { ...c, id, createdBy: adminEmail });
    });

    initialProjects.forEach((p) => batch.set(doc(db, 'projects', p.id), p));
    initialMilestones.forEach((m) => batch.set(doc(db, 'milestones', m.id), m));
    initialTasks.forEach((t) => batch.set(doc(db, 'tasks', t.id), t));
    initialEmployees.forEach((e) => batch.set(doc(db, 'employees', e.id), e));
    initialDocuments.forEach((d) => batch.set(doc(db, 'documents', d.id), d));
    initialInvoices.forEach((inv) => batch.set(doc(db, 'invoices', inv.id), inv));

    await batch.commit();
    console.log('Successfully seeded initial Godongwane database records.');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seedInitialDatabase');
  }
}
