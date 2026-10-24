import { Project, Task, Milestone, Client, ProjectDocument } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import {
  generateProjectsCSV,
  generateTasksCSV,
  generateExecutiveHTMLReport,
} from './googleDriveExport';

export interface DriveProjectFolderResult {
  projectId: string;
  projectName: string;
  folderId: string;
  folderLink: string;
  files: {
    id: string;
    name: string;
    webViewLink: string;
  }[];
}

export interface DriveUploadResult {
  success: boolean;
  folderId: string;
  folderName: string;
  folderLink: string;
  totalProjectsSynced: number;
  projectFolders: DriveProjectFolderResult[];
  masterFiles: {
    id: string;
    name: string;
    webViewLink: string;
  }[];
  uploadedFiles: {
    id: string;
    name: string;
    webViewLink: string;
  }[];
  timestamp: string;
}

/**
 * Searches for an existing folder or creates a new one in the user's Google Drive.
 */
export async function createOrGetDriveFolder(
  folderName: string,
  accessToken: string,
  parentFolderId?: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  let query = `name='${folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  // 1. Check if folder already exists
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&pageSize=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0];
      }
    }
  } catch (e) {
    console.warn('Folder search check error, proceeding to create:', e);
  }

  // 2. Create the folder if not found
  const meta: { name: string; mimeType: string; parents?: string[] } = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) {
    meta.parents = [parentFolderId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meta),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Drive folder: ${errText}`);
  }

  return await createRes.json();
}

/**
 * Uploads a text or binary file to Google Drive using the multipart upload endpoint.
 */
export async function uploadMultipartFile(
  fileName: string,
  mimeType: string,
  content: string,
  parentFolderId: string,
  accessToken: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    parents: [parentFolderId],
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Failed to upload ${fileName} to Google Drive: ${err}`);
  }

  return await uploadRes.json();
}

/**
 * Generates an executive project manifest in text format for an individual project.
 */
function generateProjectSummaryText(project: Project, tasks: Task[], milestones: Milestone[]): string {
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const projectMilestones = milestones.filter((m) => m.projectId === project.id);

  return `======================================================
GODONGWANE PROGRESSIVE PROJECTS
Project Specification & Status Brief
======================================================
Project Title:        ${project.name}
Client Name:          ${project.clientName}
Current Status:       ${project.status.toUpperCase()}
Priority Level:       ${project.priority.toUpperCase()}
Milestone Progress:   ${project.progressPercentage}%
Project Budget:       R ${(project.budget || 0).toLocaleString('en-ZA')}
Start Date:           ${project.startDate || 'N/A'}
Target Delivery:      ${project.targetCompletionDate || 'TBD'}
Assigned Manager:     ${project.managerName || 'Praise-God Cebolenkosi Mthethwa'}

PROJECT SCOPE & TECHNICAL SPECIFICATION:
------------------------------------------------------
${project.description}

WORK BREAKDOWN & TASKS (${projectTasks.length} Total):
------------------------------------------------------
${projectTasks.length === 0 ? 'No tasks defined yet.' : projectTasks.map((t, idx) => `${idx + 1}. [${t.status.toUpperCase()}] ${t.title}
   - Priority: ${t.priority.toUpperCase()}
   - Assigned To: ${t.assignedTo || 'Unassigned'}
   - Due Date: ${t.dueDate || 'TBD'}
   - Est. Hours: ${t.estimatedHours || 0}h | Actual: ${t.actualHours || 0}h`).join('\n')}

PROJECT MILESTONES (${projectMilestones.length} Total):
------------------------------------------------------
${projectMilestones.length === 0 ? 'No milestones scheduled yet.' : projectMilestones.map((m, idx) => `${idx + 1}. [${m.status.toUpperCase()} - ${m.progress}%] ${m.title}
   - Target Deadline: ${m.dueDate}
   - Description: ${m.description || 'N/A'}`).join('\n')}

======================================================
Godongwane Progressive Projects
Lead Administrator: mthethwapraisegodcebolenkosi@gmail.com
Backup Administrator: servicewebsites6@gmail.com
Generated Date: ${new Date().toLocaleString('en-ZA')}
======================================================
`;
}

/**
 * Generates a dedicated project task CSV file for an individual project.
 */
function generateSingleProjectTasksCSV(project: Project, tasks: Task[]): string {
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const headers = ['Task Title', 'Status', 'Priority', 'Assigned To', 'Due Date', 'Estimated Hours', 'Actual Hours', 'Notes'];
  const rows = projectTasks.map((t) => [
    `"${t.title.replace(/"/g, '""')}"`,
    t.status,
    t.priority,
    `"${(t.assignedTo || 'Unassigned').replace(/"/g, '""')}"`,
    t.dueDate || '',
    t.estimatedHours || 0,
    t.actualHours || 0,
    `"${(t.description || '').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Executes full upload of all projects, tasks, milestones, and reports directly to Google Drive.
 * Creates:
 * 1. Root Folder: "Godongwane Progressive Projects"
 * 2. Master Portfolio Folder: "00_Executive_Portfolio"
 *    - Master Portfolio CSV
 *    - Master Tasks Tracker CSV
 *    - Executive Briefing HTML Report
 * 3. Dedicated Folder for EACH project:
 *    - Project Overview Brief
 *    - Project Tasks CSV
 */
export async function syncAllProjectsToGoogleDrive(params: {
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  clients: Client[];
  documents: ProjectDocument[];
  accessToken: string;
  userEmail: string;
  userName: string;
  onProgress?: (message: string, percentage: number) => void;
}): Promise<DriveUploadResult> {
  const {
    projects,
    tasks,
    milestones,
    clients,
    accessToken,
    userEmail,
    userName,
    onProgress,
  } = params;

  onProgress?.('Accessing Google Drive storage...', 5);

  // 1. Create or locate Root Folder: "Godongwane Progressive Projects"
  const rootFolder = await createOrGetDriveFolder(
    'Godongwane Progressive Projects',
    accessToken
  );

  onProgress?.(`Found or created root folder: "${rootFolder.name}"`, 12);

  const dateStr = new Date().toISOString().slice(0, 10);
  const allUploadedFiles: { id: string; name: string; webViewLink: string }[] = [];
  const masterFiles: { id: string; name: string; webViewLink: string }[] = [];
  const projectFolders: DriveProjectFolderResult[] = [];

  // 2. Create Master Overview Folder: "00_Executive_Portfolio"
  onProgress?.('Setting up Executive Portfolio folder...', 18);
  const portfolioFolder = await createOrGetDriveFolder(
    '00_Executive_Portfolio',
    accessToken,
    rootFolder.id
  );

  // 2a. Master Projects CSV
  onProgress?.('Uploading Master Projects Portfolio Sheet...', 24);
  const projectsCSV = generateProjectsCSV(projects);
  const projMasterFile = await uploadMultipartFile(
    `Godongwane_Master_Projects_Portfolio_${dateStr}.csv`,
    'text/csv;charset=utf-8',
    projectsCSV,
    portfolioFolder.id,
    accessToken
  );
  masterFiles.push(projMasterFile);
  allUploadedFiles.push(projMasterFile);

  // 2b. Master Tasks CSV
  onProgress?.('Uploading Master Tasks & Workflows Tracker...', 30);
  const tasksCSV = generateTasksCSV(tasks, projects);
  const taskMasterFile = await uploadMultipartFile(
    `Godongwane_Master_Tasks_Tracker_${dateStr}.csv`,
    'text/csv;charset=utf-8',
    tasksCSV,
    portfolioFolder.id,
    accessToken
  );
  masterFiles.push(taskMasterFile);
  allUploadedFiles.push(taskMasterFile);

  // 2c. Executive Briefing HTML Report
  onProgress?.('Uploading Executive Briefing Dashboard Report...', 38);
  const executiveHtml = generateExecutiveHTMLReport(projects, tasks, milestones, clients);
  const reportMasterFile = await uploadMultipartFile(
    `Godongwane_Executive_Briefing_Report_${dateStr}.html`,
    'text/html;charset=utf-8',
    executiveHtml,
    portfolioFolder.id,
    accessToken
  );
  masterFiles.push(reportMasterFile);
  allUploadedFiles.push(reportMasterFile);

  // 3. Create a dedicated folder for EVERY project in the portfolio!
  const totalProjects = projects.length;
  for (let i = 0; i < totalProjects; i++) {
    const project = projects[i];
    const progressStart = 40 + Math.round((i / totalProjects) * 45);
    onProgress?.(
      `Creating Google Drive folder for: "${project.name}" (${i + 1}/${totalProjects})...`,
      progressStart
    );

    // Sanitize folder name
    const sanitizedName = project.name.replace(/[/\\?%*:|"<>]/g, '-').trim();
    const folderTitle = `${i + 1}. ${sanitizedName}`;

    // Create subfolder under rootFolder
    const projectFolder = await createOrGetDriveFolder(
      folderTitle,
      accessToken,
      rootFolder.id
    );

    const projectFiles: { id: string; name: string; webViewLink: string }[] = [];

    // Upload Project Specification Brief
    const briefText = generateProjectSummaryText(project, tasks, milestones);
    const briefFile = await uploadMultipartFile(
      `Project_Brief_${sanitizedName}.txt`,
      'text/plain;charset=utf-8',
      briefText,
      projectFolder.id,
      accessToken
    );
    projectFiles.push(briefFile);
    allUploadedFiles.push(briefFile);

    // Upload Dedicated Project Tasks CSV
    const singleProjTasksCSV = generateSingleProjectTasksCSV(project, tasks);
    const projTasksFile = await uploadMultipartFile(
      `Tasks_${sanitizedName}.csv`,
      'text/csv;charset=utf-8',
      singleProjTasksCSV,
      projectFolder.id,
      accessToken
    );
    projectFiles.push(projTasksFile);
    allUploadedFiles.push(projTasksFile);

    projectFolders.push({
      projectId: project.id,
      projectName: project.name,
      folderId: projectFolder.id,
      folderLink: projectFolder.webViewLink || `https://drive.google.com/drive/folders/${projectFolder.id}`,
      files: projectFiles,
    });
  }

  // 4. Record created Drive documents in Firestore for central access
  onProgress?.('Finalizing records and synchronizing database...', 90);
  try {
    const docRecord: Omit<ProjectDocument, 'id'> = {
      title: `Google Drive Portfolio Archive (${projects.length} Projects) - ${dateStr}`,
      type: 'drive_export',
      fileSize: `${Math.round((projectsCSV.length + tasksCSV.length + executiveHtml.length + (projects.length * 3000)) / 1024)} KB`,
      driveLink: rootFolder.webViewLink || `https://drive.google.com/drive/folders/${rootFolder.id}`,
      uploadedBy: userName || 'Praise-God Cebolenkosi Mthethwa',
      uploadedByEmail: userEmail || 'mthethwapraisegodcebolenkosi@gmail.com',
      notes: `Direct Google Drive synchronization with ${projectFolders.length} project folders and ${allUploadedFiles.length} files stored in folder "${rootFolder.name}".`,
      createdAt: new Date().toISOString(),
    };
    await addDoc(collection(db, 'documents'), docRecord);

    // Activity entry
    await addDoc(collection(db, 'activities'), {
      entityType: 'document',
      entityId: rootFolder.id,
      action: 'create',
      title: 'All Projects Added to Google Drive',
      description: `Successfully added all ${projects.length} projects, dedicated folders, task trackers, and executive reports to Google Drive folder "${rootFolder.name}".`,
      timestamp: new Date().toISOString(),
      user: userName || 'Admin',
      userEmail: userEmail || 'mthethwapraisegodcebolenkosi@gmail.com',
    });

    // Notification entry
    await addDoc(collection(db, 'notifications'), {
      title: 'Google Drive Sync Complete',
      message: `All ${projects.length} projects have been added to your Google Drive folder "${rootFolder.name}".`,
      type: 'info',
      read: false,
      recipientEmail: userEmail || 'mthethwapraisegodcebolenkosi@gmail.com',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not record Drive sync in Firestore:', err);
  }

  onProgress?.('All projects successfully added to Google Drive!', 100);

  return {
    success: true,
    folderId: rootFolder.id,
    folderName: rootFolder.name,
    folderLink: rootFolder.webViewLink || `https://drive.google.com/drive/folders/${rootFolder.id}`,
    totalProjectsSynced: projects.length,
    projectFolders,
    masterFiles,
    uploadedFiles: allUploadedFiles,
    timestamp: new Date().toISOString(),
  };
}
