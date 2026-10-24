import React, { useState, useRef } from 'react';
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
  Share2,
  Copy,
  Check,
  Eye,
  Tag,
  Shield,
  Layers,
  FileSpreadsheet,
  FileType,
} from 'lucide-react';
import { ProjectDocument, Project, DocumentType } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
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
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sharing Modal
  const [sharingDoc, setSharingDoc] = useState<ProjectDocument | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Preview / Inspect Modal
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects.length > 0 ? projects[0].id : '');
  const [docType, setDocType] = useState<DocumentType>('blueprint');
  const [fileSize, setFileSize] = useState('2.4 MB');
  const [driveLink, setDriveLink] = useState('https://drive.google.com/drive/my-drive');
  const [notes, setNotes] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAddModal = () => {
    setTitle('');
    setProjectId(projects.length > 0 ? projects[0].id : '');
    setDocType('blueprint');
    setFileSize('2.5 MB');
    setDriveLink('https://drive.google.com/drive/my-drive');
    setNotes('');
    setSelectedFileName(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      // Calculate human readable size
      const bytes = file.size;
      const sizeStr =
        bytes > 1024 * 1024
          ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(bytes / 1024)} KB`;
      setFileSize(sizeStr);

      // Guess type
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.dxf') || lower.endsWith('.dwg') || lower.includes('cad') || lower.includes('draw')) {
        setDocType('blueprint');
      } else if (lower.endsWith('.xlsx') || lower.endsWith('.csv')) {
        setDocType('specification');
      } else if (lower.includes('test') || lower.includes('qa') || lower.includes('cert')) {
        setDocType('report');
      } else if (lower.includes('contract') || lower.includes('sla')) {
        setDocType('contract');
      }
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      const selectedProject = projects.find((p) => p.id === projectId);
      const uploaderName =
        userProfile?.displayName ||
        currentUser?.displayName ||
        (currentUser?.email === 'servicewebsites6@gmail.com'
          ? 'mthethwapraisegodcebolenkosi'
          : currentUser?.email?.split('@')[0] || 'Praise-God Cebolenkosi Mthethwa');
      const uploaderEmail =
        currentUser?.email && currentUser.email !== 'servicewebsites6@gmail.com'
          ? currentUser.email
          : 'mthethwapraisegodcebolenkosi@gmail.com';

      const shareableId = `doc-${Date.now().toString(36)}`;

      const newDoc: Omit<ProjectDocument, 'id'> = {
        title: title.trim(),
        projectId: projectId || undefined,
        projectName: selectedProject ? selectedProject.name : 'Godongwane Progressive Projects',
        type: docType,
        fileSize,
        driveLink: driveLink.trim() || 'https://drive.google.com/drive/my-drive',
        uploadedBy: uploaderName,
        uploadedByEmail: uploaderEmail,
        notes: notes.trim() || undefined,
        shareableId,
        downloadCount: 0,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'documents'), newDoc);

      logActivity({
        type: 'document',
        action: 'uploaded',
        title: title.trim(),
        description: `New project document "${title.trim()}" (${docType.toUpperCase()}) added to repository.`,
        userName: uploaderName,
        userEmail: uploaderEmail,
        entityId: shareableId,
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

  const getShareUrl = (d: ProjectDocument) => {
    return `${window.location.origin}?doc=${d.shareableId || d.id}`;
  };

  const handleCopyShareLink = (d: ProjectDocument) => {
    const url = getShareUrl(d);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filtered = documents.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.projectName && d.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.notes && d.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.uploadedBy && d.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchType = typeFilter === 'all' || d.type === typeFilter;
    const matchProject = projectFilter === 'all' || d.projectId === projectFilter;
    return matchSearch && matchType && matchProject;
  });

  const getDocIcon = (type: DocumentType) => {
    switch (type) {
      case 'blueprint':
        return <FileCode className="w-5 h-5 text-amber-400" />;
      case 'specification':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'report':
        return <FileCheck className="w-5 h-5 text-emerald-400" />;
      case 'contract':
        return <FileType className="w-5 h-5 text-purple-400" />;
      case 'invoice':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'drive_export':
        return <HardDrive className="w-5 h-5 text-cyan-400" />;
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
            Technical drawings, engineering specifications, contracts, and cloud file sharing
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDriveModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/40 hover:to-indigo-600/40 text-blue-200 border border-blue-500/40 transition-all shadow-xs"
          >
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Add All to Google Drive</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search drawings, specs, certificates, contracts..."
              className="w-full bg-[#131c2d] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap hidden sm:inline">Project:</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-[#131c2d] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'blueprint', label: 'Blueprints & CAD' },
            { id: 'specification', label: 'Specifications (MTC)' },
            { id: 'report', label: 'QA / Inspection' },
            { id: 'contract', label: 'Contracts & Legal' },
            { id: 'drive_export', label: 'Drive Cloud Sync' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl capitalize whitespace-nowrap transition-colors font-medium ${
                typeFilter === t.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 space-y-3">
            <FolderOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">No documents matched your search filter</p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload First Document</span>
            </button>
          </div>
        ) : (
          filtered.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-2xl bg-[#111927] border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => setPreviewDoc(d)}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-amber-500/50 transition-colors"
                  >
                    {getDocIcon(d.type)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {d.type.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => setSharingDoc(d)}
                      className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                      title="Share Document Link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3
                    onClick={() => setPreviewDoc(d)}
                    className="font-bold text-sm text-slate-100 line-clamp-2 hover:text-amber-400 cursor-pointer transition-colors"
                  >
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
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-mono text-[11px] block">
                    {d.fileSize || '2.5 MB'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    By {d.uploadedBy || 'Team'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSharingDoc(d)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    title="Share Document"
                  >
                    <Share2 className="w-3 h-3 text-amber-400" />
                    <span>Share</span>
                  </button>

                  <a
                    href={d.driveLink || 'https://drive.google.com/drive/my-drive'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3 h-3 text-blue-400" />
                    <span>Get File</span>
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#0d131f]">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  Upload to Centralized Repository
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="p-5 space-y-3.5 text-xs">
              {/* File Dropzone / Picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 rounded-2xl border-2 border-dashed border-slate-800 hover:border-amber-500/60 bg-slate-900/50 text-center cursor-pointer transition-all space-y-2 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv"
                />
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {selectedFileName ? (
                      <span className="text-amber-400">{selectedFileName}</span>
                    ) : (
                      'Choose a file or drag & drop here'
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    CAD (.dwg, .dxf), PDF blueprints, SANS mill certificates, contracts
                  </p>
                </div>
              </div>

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
                  <option value="">General Enterprise Repository</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Document Category</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="blueprint">Technical Blueprint (CAD/Drawing)</option>
                    <option value="specification">Material Specification (MTC)</option>
                    <option value="report">Inspection / QA Report</option>
                    <option value="contract">Legal Contract & SLA</option>
                    <option value="invoice">Invoice & Commercial</option>
                    <option value="other">General Documentation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">File Size</label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="e.g. 4.8 MB"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Google Drive or Cloud Link (Optional)
                </label>
                <input
                  type="url"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Revision Notes & Approvals
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Approved by structural consultant for Grade 316L fabrication..."
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
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95"
                >
                  {submitting ? 'Uploading...' : 'Upload & Register Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Document Modal */}
      {sharingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Share Document</h3>
              </div>
              <button
                onClick={() => setSharingDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="font-semibold text-slate-200 text-sm">{sharingDoc.title}</h4>
              <p className="text-xs text-amber-400 font-medium mt-0.5">
                {sharingDoc.projectName || 'Godongwane Progressive Projects'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <label className="block text-[11px] font-semibold text-slate-400">
                Centralized Repository Share Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl(sharingDoc)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono truncate focus:outline-none"
                />
                <button
                  onClick={() => handleCopyShareLink(sharingDoc)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Enterprise Permissions</span>
              </div>
              <p className="text-[11px] text-blue-200/80 leading-relaxed">
                Recipients with this link can view specifications and blueprints. Modifying and deleting files requires Godongwane administrative credentials.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSharingDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview / Inspect Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  {getDocIcon(previewDoc.type)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-snug">{previewDoc.title}</h3>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {previewDoc.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-slate-500 block">Project:</span>
                <span className="text-slate-200 font-medium">{previewDoc.projectName || 'Godongwane Enterprise'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">File Size:</span>
                <span className="text-slate-200 font-mono font-medium">{previewDoc.fileSize || '2.5 MB'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Uploaded By:</span>
                <span className="text-slate-200 font-medium">{previewDoc.uploadedBy || 'Team'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Uploaded Date:</span>
                <span className="text-slate-200 font-medium">
                  {new Date(previewDoc.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {previewDoc.notes && (
              <div className="text-xs space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Specifications & Revision Notes
                </span>
                <p className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 leading-relaxed">
                  {previewDoc.notes}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  setSharingDoc(previewDoc);
                  setPreviewDoc(null);
                }}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                >
                  Close
                </button>
                <a
                  href={previewDoc.driveLink || 'https://drive.google.com/drive/my-drive'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / Open</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
