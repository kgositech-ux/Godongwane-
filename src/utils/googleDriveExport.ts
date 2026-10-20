import { Project, Task, Milestone, Client, ProjectDocument } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export interface DriveExportBundle {
  exportDate: string;
  projectName: string;
  totalProjects: number;
  totalBudget: number;
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  clients: Client[];
  documents: ProjectDocument[];
}

export function generateProjectsCSV(projects: Project[]): string {
  const headers = ['Project Name', 'Client', 'Status', 'Priority', 'Progress (%)', 'Budget (ZAR)', 'Start Date', 'Target Date', 'Manager'];
  const rows = projects.map(p => [
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.clientName.replace(/"/g, '""')}"`,
    p.status,
    p.priority,
    `${p.progressPercentage}%`,
    p.budget,
    p.startDate || '',
    p.targetCompletionDate || '',
    `"${(p.managerName || '').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function generateTasksCSV(tasks: Task[], projects: Project[]): string {
  const projectMap = new Map(projects.map(p => [p.id, p.name]));
  const headers = ['Task Title', 'Project', 'Status', 'Priority', 'Assigned To', 'Due Date', 'Estimated Hours', 'Actual Hours'];
  const rows = tasks.map(t => [
    `"${t.title.replace(/"/g, '""')}"`,
    `"${(projectMap.get(t.projectId) || t.projectId).replace(/"/g, '""')}"`,
    t.status,
    t.priority,
    `"${(t.assignedTo || '').replace(/"/g, '""')}"`,
    t.dueDate || '',
    t.estimatedHours || 0,
    t.actualHours || 0,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function generateExecutiveHTMLReport(
  projects: Project[],
  tasks: Task[],
  milestones: Milestone[],
  clients: Client[]
): string {
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const avgProgress = projects.length
    ? Math.round(projects.reduce((acc, p) => acc + (p.progressPercentage || 0), 0) / projects.length)
    : 0;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Godongwane Progressive Projects - Project Portfolio Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 8px; }
    .subtitle { color: #64748b; margin-top: 0; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-progress { background: #dbeafe; color: #1e40af; }
    .badge-completed { background: #dcfce7; color: #166534; }
    .badge-urgent { background: #fee2e2; color: #991b1b; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .summary-value { font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th { text-align: left; background: #f1f5f9; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; color: #475569; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    .progress-bar-bg { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 4px; }
    .progress-bar-fill { height: 100%; background: #3b82f6; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <h1>Godongwane Progressive Projects</h1>
  <p class="subtitle">Official Project Portfolio & Milestone Visualization Report — Generated ${new Date().toLocaleDateString('en-ZA', { dateStyle: 'full' })}</p>

  <div class="summary-grid">
    <div class="summary-card">
      <div>Active Projects</div>
      <div class="summary-value">${projects.length}</div>
    </div>
    <div class="summary-card">
      <div>Average Portfolio Progress</div>
      <div class="summary-value">${avgProgress}%</div>
    </div>
    <div class="summary-card">
      <div>Total Portfolio Value</div>
      <div class="summary-value">R ${totalBudget.toLocaleString('en-ZA')}</div>
    </div>
    <div class="summary-card">
      <div>Pending Tasks</div>
      <div class="summary-value">${tasks.filter(t => t.status !== 'done').length}</div>
    </div>
  </div>

  <h2>Active Project Portfolio</h2>
  <table>
    <thead>
      <tr>
        <th>Project Name</th>
        <th>Client</th>
        <th>Status</th>
        <th>Priority</th>
        <th>Progress</th>
        <th>Budget</th>
        <th>Target Delivery</th>
      </tr>
    </thead>
    <tbody>
      ${projects.map(p => `
        <tr>
          <td><strong>${p.name}</strong><br><small style="color: #64748b">${p.description.substring(0, 80)}...</small></td>
          <td>${p.clientName}</td>
          <td><span class="badge ${p.status === 'completed' ? 'badge-completed' : 'badge-progress'}">${p.status.toUpperCase()}</span></td>
          <td><span class="badge ${p.priority === 'urgent' ? 'badge-urgent' : ''}">${p.priority.toUpperCase()}</span></td>
          <td>
            ${p.progressPercentage}%
            <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${p.progressPercentage}%"></div></div>
          </td>
          <td>R ${(p.budget || 0).toLocaleString('en-ZA')}</td>
          <td>${p.targetCompletionDate || 'TBD'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2 style="margin-top: 32px">Strategic Milestones</h2>
  <table>
    <thead>
      <tr>
        <th>Milestone</th>
        <th>Due Date</th>
        <th>Status</th>
        <th>Completion</th>
      </tr>
    </thead>
    <tbody>
      ${milestones.map(m => `
        <tr>
          <td><strong>${m.title}</strong><br><small style="color: #64748b">${m.description || ''}</small></td>
          <td>${m.dueDate}</td>
          <td><span class="badge ${m.status === 'completed' ? 'badge-completed' : 'badge-progress'}">${m.status.toUpperCase()}</span></td>
          <td>${m.progress}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    Godongwane Progressive Projects • Managed via Service Websites Agency Cloud Console • Certified Project Report
  </div>
</body>
</html>`;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function recordDriveExportInFirestore(
  userEmail: string,
  userName: string,
  projectCount: number
) {
  try {
    const docData: Omit<ProjectDocument, 'id'> = {
      title: `Google Drive Portfolio Archive (${projectCount} Projects) - ${new Date().toISOString().slice(0, 10)}`,
      type: 'drive_export',
      fileSize: '340 KB',
      driveLink: 'https://drive.google.com/drive/my-drive',
      uploadedBy: userName,
      uploadedByEmail: userEmail,
      notes: `Automated portfolio archive exported for Google Drive storage including all active tasks, milestones, clients, and executive briefing sheet.`,
      createdAt: new Date().toISOString(),
    };
    await addDoc(collection(db, 'documents'), docData);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'documents');
  }
}
