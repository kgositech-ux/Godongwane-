import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ActivityItem, Project, Task, ProjectDocument, Milestone } from '../types';

export async function logActivity(
  activity: Omit<ActivityItem, 'id' | 'timestamp'>
) {
  try {
    const newActivity: Omit<ActivityItem, 'id'> = {
      ...activity,
      timestamp: new Date().toISOString(),
    };
    await addDoc(collection(db, 'activities'), newActivity);
  } catch (err) {
    console.warn('Activity logging error:', err);
    // Non-fatal, do not crash UI
  }
}

/**
 * Combines explicit Firestore activities with synthesized events from
 * existing Projects, Tasks, and Documents to ensure a rich, always-up-to-date feed.
 */
export function getUnifiedActivityFeed(
  storedActivities: ActivityItem[],
  projects: Project[],
  tasks: Task[],
  documents: ProjectDocument[],
  milestones: Milestone[]
): ActivityItem[] {
  const dynamicActivities: ActivityItem[] = [];

  // 1. Projects activities
  projects.forEach((p) => {
    dynamicActivities.push({
      id: `act-proj-${p.id}`,
      type: 'project',
      action: p.progressPercentage === 100 ? 'status_changed' : 'progress_updated',
      title: p.name,
      description: `Project milestone progress is currently at ${p.progressPercentage}% (${p.status.replace('_', ' ')}). Target completion: ${p.targetCompletionDate || 'Ongoing'}.`,
      userName: p.managerName || 'Kgosi (Service Websites)',
      userEmail: 'servicewebsites6@gmail.com',
      timestamp: p.updatedAt || p.createdAt || new Date().toISOString(),
      entityId: p.id,
    });
  });

  // 2. Tasks activities
  tasks.forEach((t) => {
    dynamicActivities.push({
      id: `act-task-${t.id}`,
      type: 'task',
      action: t.status === 'done' ? 'status_changed' : 'updated',
      title: t.title,
      description: `Task status: ${t.status.toUpperCase()} • Priority: ${t.priority.toUpperCase()} • Assigned to ${t.assignedTo || 'Unassigned'} (${t.actualHours || 0}/${t.estimatedHours || 0} hrs logged).`,
      userName: t.assignedTo || 'Fabrication Team',
      userEmail: t.assignedToEmail || 'servicewebsites6@gmail.com',
      timestamp: t.updatedAt || t.createdAt || new Date().toISOString(),
      entityId: t.id,
    });
  });

  // 3. Documents activities
  documents.forEach((d) => {
    dynamicActivities.push({
      id: `act-doc-${d.id}`,
      type: 'document',
      action: 'uploaded',
      title: d.title,
      description: `Centralized document registered (${d.type.toUpperCase()}) for ${d.projectName || 'Godongwane Progressive Projects'}. File size: ${d.fileSize || 'Standard'}.`,
      userName: d.uploadedBy || 'Kgosi',
      userEmail: d.uploadedByEmail || 'servicewebsites6@gmail.com',
      timestamp: d.createdAt || new Date().toISOString(),
      entityId: d.id,
    });
  });

  // 4. Milestones activities
  milestones.forEach((m) => {
    if (m.progress > 0) {
      dynamicActivities.push({
        id: `act-ms-${m.id}`,
        type: 'milestone',
        action: m.status === 'completed' ? 'status_changed' : 'progress_updated',
        title: m.title,
        description: `Strategic gate verified at ${m.progress}% • Due date: ${m.dueDate} • Status: ${m.status.toUpperCase()}.`,
        userName: 'Praise-God Cebolenkosi Mthethwa',
        userEmail: 'mthethwapraisegodcebolenkosi@gmail.com',
        timestamp: m.createdAt || new Date().toISOString(),
        entityId: m.id,
      });
    }
  });

  // Merge stored activities with dynamic activities, removing duplicates by entityId & action
  const combined = [...storedActivities, ...dynamicActivities];

  // Sort descending by timestamp
  return combined.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
