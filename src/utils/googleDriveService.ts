import { Project, Task, Milestone, Client, ProjectDocument } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import {
  generateProjectsCSV,
  generateTasksCSV,
  generateExecutiveHTMLReport,
} from './googleDriveExport';

export interface DriveUploadResult {
  success: boolean;
  folderId: string;
  folderName: string;
  folderLink: string;
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
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`,
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
Completion:           ${project.progressPercentage}%
Project Budget:       R ${(project.budget || 0).toLocaleString('en-ZA')}
Start Date:           ${project.startDate || 'N/A'}
Target Delivery:      ${project.targetCompletionDate || 'TBD'}
Assigned Manager:     ${project.managerName || 'Kgosi (Lead PM)'}

PROJECT DESCRIPTION:
------------------------------------------------------
${project.description}

ASSOCIATED TASKS (${projectTasks.length} Total):
------------------------------------------------------
${projectTasks.map((t, idx) => `${idx + 1}. [${t.status.toUpperCase()}] ${t.title} (Priority: ${t.priority}, Assigned: ${t.assignedTo || 'Unassigned'}, Due: ${t.dueDate || 'TBD'})`).join('\n')}

PROJECT MILESTONES (${projectMilestones.length} Total):
------------------------------------------------------
${projectMilestones.map((m, idx) => `${idx + 1}. [${m.status.toUpperCase()} - ${m.progress}%] ${m.title} (Target: ${m.dueDate})`).join('\n')}

======================================================
Generated via Godongwane Progressive Projects Management Cloud
Date: ${new Date().toLocaleString('en-ZA')}
======================================================
`;
}

/**
 * Executes full upload of all projects, tasks, milestones, and reports directly to Google Drive.
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

  onProgress?.('Accessing Google Drive storage...', 10);

  // 1. Create or locate Root Folder: "Godongwane Progressive Projects"
  const rootFolder = await createOrGetDriveFolder(
    'Godongwane Progressive Projects',
    accessToken
  );

  onProgress?.(`Found or created root folder: ${rootFolder.name}`, 25);

  const dateStr = new Date().toISOString().slice(0, 10);
  const uploadedFiles: { id: string; name: string; webViewLink: string }[] = [];

  // 2. Generate and upload Projects Summary CSV (Google Sheets compatible)
  onProgress?.('Uploading Projects Portfolio Sheet...', 40);
  const projectsCSV = generateProjectsCSV(projects);
  const projFile = await uploadMultipartFile(
    `Godongwane_Projects_Portfolio_${dateStr}.csv`,
    'text/csv;charset=utf-8',
    projectsCSV,
    rootFolder.id,
    accessToken
  );
  uploadedFiles.push(projFile);

  // 3. Generate and upload Tasks & Milestones Tracker CSV
  onProgress?.('Uploading Tasks & Workflows Tracker...', 55);
  const tasksCSV = generateTasksCSV(tasks, projects);
  const taskFile = await uploadMultipartFile(
    `Godongwane_Tasks_Tracker_${dateStr}.csv`,
    'text/csv;charset=utf-8',
    tasksCSV,
    rootFolder.id,
    accessToken
  );
  uploadedFiles.push(taskFile);

  // 4. Generate and upload Executive Briefing Report (HTML/Doc)
  onProgress?.('Uploading Executive Briefing Report...', 70);
  const executiveHtml = generateExecutiveHTMLReport(projects, tasks, milestones, clients);
  const reportFile = await uploadMultipartFile(
    `Godongwane_Executive_Briefing_${dateStr}.html`,
    'text/html;charset=utf-8',
    executiveHtml,
    rootFolder.id,
    accessToken
  );
  uploadedFiles.push(reportFile);

  // 5. Upload individual project summary sheets for the active projects
  onProgress?.('Uploading individual project briefs...', 85);
  for (const project of projects.slice(0, 5)) {
    const briefText = generateProjectSummaryText(project, tasks, milestones);
    const safeName = project.name.replace(/[/\\?%*:|"<>]/g, '_');
    const briefFile = await uploadMultipartFile(
      `Project_Brief_${safeName}.txt`,
      'text/plain;charset=utf-8',
      briefText,
      rootFolder.id,
      accessToken
    );
    uploadedFiles.push(briefFile);
  }

  // 6. Record created Drive documents in Firestore for central access
  try {
    const docRecord: Omit<ProjectDocument, 'id'> = {
      title: `Google Drive Portfolio Sync (${projects.length} Projects) - ${dateStr}`,
      type: 'drive_export',
      fileSize: `${Math.round((projectsCSV.length + tasksCSV.length + executiveHtml.length) / 1024)} KB`,
      driveLink: rootFolder.webViewLink || `https://drive.google.com/drive/folders/${rootFolder.id}`,
      uploadedBy: userName || 'Kgosi',
      uploadedByEmail: userEmail || 'servicewebsites6@gmail.com',
      notes: `Direct Google Drive synchronization with ${uploadedFiles.length} files stored in folder "${rootFolder.name}".`,
      createdAt: new Date().toISOString(),
    };
    await addDoc(collection(db, 'documents'), docRecord);

    // 7. Record an activity entry
    await addDoc(collection(db, 'activities'), {
      entityType: 'document',
      entityId: rootFolder.id,
      action: 'create',
      title: 'Google Drive Sync Completed',
      description: `Added all ${projects.length} projects and ${uploadedFiles.length} documents directly to Google Drive folder "${rootFolder.name}".`,
      timestamp: new Date().toISOString(),
      user: userName || 'Admin',
      userEmail: userEmail || 'servicewebsites6@gmail.com',
    });

    // 8. Add a system notification
    await addDoc(collection(db, 'notifications'), {
      title: 'Google Drive Backup Complete',
      message: `All ${projects.length} projects and tracking sheets have been successfully added to your Google Drive folder.`,
      type: 'info',
      read: false,
      recipientEmail: userEmail || 'servicewebsites6@gmail.com',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not record Drive sync in Firestore:', err);
  }

  onProgress?.('All projects added to Google Drive successfully!', 100);

  return {
    success: true,
    folderId: rootFolder.id,
    folderName: rootFolder.name,
    folderLink: rootFolder.webViewLink || `https://drive.google.com/drive/folders/${rootFolder.id}`,
    uploadedFiles,
    timestamp: new Date().toISOString(),
  };
}
