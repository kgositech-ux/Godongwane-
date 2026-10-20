import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  HardDrive,
  FileText,
  FileCheck,
  FileCode,
  Download,
  ExternalLink,
  Trash2,
  X,
  UploadCloud,
  Layers,
} from 'lucide-react';
import { ProjectDocument, Project, DocumentType } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../utils/activityLogger';

interface DocumentsViewProps {
  documents: ProjectDocument[];
  projects: Project[];
  onOpenDriveModal: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  projects,
  onOpenDriveModal,
}) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects.length > 0 ? projects[0].id : '');
  const [docType, setDocType] = useState<DocumentType>('blueprint');
  const [fileSize, setFileSize] = useState('3.2 MB');
  const [driveLink, setDriveLink] = useState('https://drive.google.com/drive/my-drive');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = () => {
    setTitle('');
    setProjectId(projects.length > 0 ? projects[0].id : '');
    setDocType('blueprint');
    setFileSize('2.5 MB');
    setDriveLink('https://drive.google.com/drive/my-drive');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      const selectedProject = projects.find((p) => p.id === projectId);
      const newDoc: Omit<ProjectDocument, 'id'> = {
        title: title.trim(),
        projectId: projectId || undefined,
        projectName: selectedProject ? selectedProject.name : 'Godongwane Progressive Projects',
        type: docType,
        fileSize,
        driveLink: driveLink.trim() || 'https://drive.google.com/drive/my-drive',
        uploadedBy: userProfile?.displayName || currentUser?.email || 'Kgosi',
        uploadedByEmail: currentUser?.email || 'servicewebsites6@gmail.com',
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'documents'), newDoc);

      logActivity({
        type: 'document',
        action: 'uploaded',
        title: title.trim(),
        description: `Document registered (${docType.toUpperCase()}) for ${selectedProject ? selectedProject.name : 'Godongwane Progressive Projects'}.`,
        userName: userProfile?.displayName || currentUser?.email || 'Kgosi',
        userEmail: currentUser?.email || 'servicewebsites6@gmail.com',
        entityId: 'new-doc',
      });

      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'documents');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document from the centralized repository?')) return;
    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `documents/${id}`);
    }
  };

  const filtered = documents.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.projectName && d.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.notes && d.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    return matchSearch && matchType;
  });

  const getDocIcon = (type: DocumentType) => {
    switch (type) {
      case 'blueprint':
        return <FileCode className="w-5 h-5 text-amber-400" />;
      case 'specification':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'report':
        return <FileCheck className="w-5 h-5 text-emerald-400" />;
      case 'drive_export':
        return <HardDrive className="w-5 h-5 text-purple-400" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Centralized Document Repository</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
              {documents.length} Files
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Specifications, CAD drawings, QA certificates, and Google Drive cloud storage
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDriveModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-all shadow-xs"
          >
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Add All to Google Drive</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Document</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search blueprints, reports, test certificates..."
            className="w-full bg-[#131c2d] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          {['all', 'blueprint', 'specification', 'report', 'drive_export'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-colors font-medium ${
                typeFilter === t
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <div
            key={d.id}
            className="p-5 rounded-2xl bg-[#111927] border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  {getDocIcon(d.type)}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {d.type.replace('_', ' ')}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-100 line-clamp-2">
                  {d.title}
                </h3>
                <div className="text-[11px] text-amber-400 mt-1 font-medium truncate">
                  {d.projectName || 'Godongwane Progressive Projects'}
                </div>
              </div>

              {d.notes && (
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {d.notes}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[11px]">
                {d.fileSize || '3.5 MB'}
              </span>

              <a
                href={d.driveLink || 'https://drive.google.com/drive/my-drive'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors"
              >
                <HardDrive className="w-3 h-3 text-blue-400" />
                <span>Open in Drive</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                Upload to Centralized Repository
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hopper Feed Chute Fabrication Assembly Drawing"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Target Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="blueprint">Technical Blueprint</option>
                    <option value="specification">Material Specification (MTC)</option>
                    <option value="report">Inspection / QA Report</option>
                    <option value="contract">Commercial Contract</option>
                    <option value="drive_export">Google Drive Package</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Estimated Size</label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="e.g. 4.2 MB"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Google Drive / Cloud Link
                </label>
                <input
                  type="url"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Weld inspection hold points, engineer approval initials..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  {submitting ? 'Saving...' : 'Register Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
