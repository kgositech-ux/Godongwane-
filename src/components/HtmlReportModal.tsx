import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Eye,
  Code2,
  Printer,
  ExternalLink,
  FileCode,
} from 'lucide-react';
import { Project, Task, Milestone, Client } from '../types';
import { generateExecutiveHTMLReport, downloadFile } from '../utils/googleDriveExport';

interface HtmlReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  clients: Client[];
}

export const HtmlReportModal: React.FC<HtmlReportModalProps> = ({
  isOpen,
  onClose,
  projects,
  tasks,
  milestones,
  clients,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const htmlContent = generateExecutiveHTMLReport(projects, tasks, milestones, clients);
  const fileName = `Godongwane_Executive_Report_${new Date().toISOString().slice(0, 10)}.html`;

  const handleDownload = () => {
    downloadFile(htmlContent, fileName, 'text/html;charset=utf-8;');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-950/60 via-slate-900 to-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shadow-inner">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Executive Briefing HTML Report
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  Ready to Download
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Godongwane Progressive Projects • Self-contained, responsive HTML file
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .html</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Tabs */}
        <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Interactive Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>HTML Source Code</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700/60"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied HTML!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700/60"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 overflow-hidden bg-slate-950 relative">
          {activeTab === 'preview' ? (
            <div className="w-full h-full p-2 sm:p-4 bg-slate-900/40">
              <iframe
                title="Executive Report Preview"
                srcDoc={htmlContent}
                className="w-full h-full rounded-xl bg-white shadow-lg border border-slate-700/50"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="w-full h-full p-4 overflow-auto">
              <pre className="text-[12px] font-mono text-emerald-300 leading-relaxed whitespace-pre-wrap select-all">
                {htmlContent}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#0d131f] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 text-center sm:text-left">
            <span>File size: ~{Math.round(htmlContent.length / 1024 * 10) / 10} KB • Standard HTML5 with embedded CSS styling</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download HTML Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
