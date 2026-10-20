import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Download,
  DollarSign,
  AlertCircle,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Invoice, Client, Project } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface InvoicesViewProps {
  invoices: Invoice[];
  clients: Client[];
  projects: Project[];
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  clients,
  projects,
}) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [clientId, setClientId] = useState(clients.length > 0 ? clients[0].id : '');
  const [projectId, setProjectId] = useState(projects.length > 0 ? projects[0].id : '');
  const [amount, setAmount] = useState(95000);
  const [status, setStatus] = useState<Invoice['status']>('sent');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = () => {
    setInvoiceNumber(`INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`);
    setClientId(clients.length > 0 ? clients[0].id : '');
    setProjectId(projects.length > 0 ? projects[0].id : '');
    setAmount(85000);
    setStatus('sent');
    setDueDate(new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) return;
    setSubmitting(true);

    try {
      const selectedClient = clients.find((c) => c.id === clientId);
      const selectedProject = projects.find((p) => p.id === projectId);

      const newInv: Omit<Invoice, 'id'> = {
        invoiceNumber: invoiceNumber.trim(),
        clientId: clientId || 'godongwane-client',
        clientName: selectedClient ? selectedClient.name : 'Godongwane Progressive Projects',
        projectId: projectId || undefined,
        projectName: selectedProject ? selectedProject.name : 'General Fabrication & Supply',
        amount: Number(amount),
        currency: 'ZAR',
        status,
        dueDate,
        issuedDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'invoices'), newInv);
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'invoices');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Invoice['status']) => {
    try {
      await updateDoc(doc(db, 'invoices', id), { status: newStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await deleteDoc(doc(db, 'invoices', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `invoices/${id}`);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.projectName && inv.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.amount, 0);
  const paidTotal = invoices.filter((i) => i.status === 'paid').reduce((acc, inv) => acc + inv.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Invoices & Billing</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              {invoices.length} Invoices
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Client billing, progress payment drawdowns, and accounts receivable
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Generate Invoice</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#111927] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Total Billed</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">
              R {totalInvoiced.toLocaleString('en-ZA')}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Total Received / Paid</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
              R {paidTotal.toLocaleString('en-ZA')}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Outstanding Receivable</div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
              R {(totalInvoiced - paidTotal).toLocaleString('en-ZA')}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111927] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-[#162133] text-slate-400 uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-4 sm:px-6">INVOICE #</th>
                <th className="py-3 px-4 sm:px-6">CLIENT / PROJECT</th>
                <th className="py-3 px-4 sm:px-6">AMOUNT</th>
                <th className="py-3 px-4 sm:px-6">DUE DATE</th>
                <th className="py-3 px-4 sm:px-6">STATUS</th>
                <th className="py-3 px-4 sm:px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-4 sm:px-6 font-mono font-bold text-slate-100">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    <div className="font-semibold text-slate-100">{inv.clientName}</div>
                    <div className="text-[11px] text-amber-400/90">{inv.projectName || 'Steel Works Supply'}</div>
                  </td>
                  <td className="py-4 px-4 sm:px-6 font-mono font-bold text-white text-sm">
                    R {inv.amount.toLocaleString('en-ZA')}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-slate-400 font-mono">
                    {inv.dueDate}
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        inv.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : inv.status === 'sent'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => handleStatusChange(inv.id, 'paid')}
                          className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium"
                        >
                          Mark Paid
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Generate Client Invoice</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Invoice Number *</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Client *</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Associated Project</label>
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
                  <label className="block font-medium text-slate-300 mb-1">Amount (ZAR) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
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
                  {submitting ? 'Generating...' : 'Save & Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
