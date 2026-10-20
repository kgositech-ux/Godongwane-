import React, { useState } from 'react';
import {
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  FolderKanban,
} from 'lucide-react';
import { Client, Project } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface ClientsViewProps {
  clients: Client[];
  projects: Project[];
  onSelectProjectClient?: (clientId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  projects,
  onSelectProjectClient,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('Stainless Steel Fabrication & Structural Steel');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<Client['status']>('active');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.type && c.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddModal = () => {
    setEditingClient(null);
    setName('');
    setEmail('');
    setPhone('');
    setType('Stainless Steel Fabrication & Structural Steel');
    setAddress('');
    setStatus('active');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Client) => {
    setEditingClient(c);
    setName(c.name);
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setType(c.type || 'Stainless Steel Fabrication & Structural Steel');
    setAddress(c.address || '');
    setStatus(c.status);
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      if (editingClient) {
        await updateDoc(doc(db, 'clients', editingClient.id), {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          type: type.trim(),
          address: address.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
        });
      } else {
        const newClient: Omit<Client, 'id'> = {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          type: type.trim(),
          address: address.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.email || 'admin',
        };
        await addDoc(collection(db, 'clients'), newClient);
      }
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(
        err,
        editingClient ? OperationType.UPDATE : OperationType.CREATE,
        editingClient ? `clients/${editingClient.id}` : 'clients'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Are you sure you want to delete this client? Linked projects will remain.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'clients', clientId));
      if (selectedClient?.id === clientId) setSelectedClient(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `clients/${clientId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner exactly mirroring Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 tracking-tight">
            Client Database
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Service Websites Agency
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#E5A93C] hover:bg-[#d89c31] text-slate-950 font-semibold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Client</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients by company name, industry type..."
            className="w-full bg-[#131c2d] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono">
            Total: {clients.length} Clients
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {clients.filter((c) => c.status === 'active').length} Active
          </span>
        </div>
      </div>

      {/* Client Table matching Screenshot 1 Layout */}
      <div className="bg-[#111927] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-[#162133] text-slate-400 uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-4 sm:px-6">NAME</th>
                <th className="py-3 px-4 sm:px-6">EMAIL</th>
                <th className="py-3 px-4 sm:px-6">PHONE</th>
                <th className="py-3 px-4 sm:px-6">TYPE</th>
                <th className="py-3 px-4 sm:px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    No clients found. Click "+ Add Client" or "Seed Demo Data" to load initial records.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const clientProjects = projects.filter((p) => p.clientId === client.id);
                  const isPrimary = client.name.includes('Godongwane');

                  return (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        selectedClient?.id === client.id ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="py-4 px-4 sm:px-6 font-medium text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">
                            {client.name}
                          </span>
                          {isPrimary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                              Primary Enterprise
                            </span>
                          )}
                        </div>
                        {clientProjects.length > 0 && (
                          <div className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
                            <FolderKanban className="w-3 h-3" />
                            <span>{clientProjects.length} Active Projects</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-400 font-mono text-xs">
                        {client.email || '—'}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-400 font-mono text-xs">
                        {client.phone || '—'}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-300">
                        <span className="line-clamp-2 max-w-xs">{client.type || 'Standard'}</span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(client)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Client"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Client"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Client Details Drawer / Card */}
      {selectedClient && (
        <div className="p-5 rounded-2xl bg-[#111927] border border-amber-500/30 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{selectedClient.name}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium capitalize">
                  {selectedClient.status}
                </span>
              </div>
              <p className="text-xs text-amber-400 mt-0.5 font-medium">{selectedClient.type}</p>
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Email Contact</div>
                <div className="text-slate-200 font-mono mt-0.5">{selectedClient.email || 'Not configured'}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Phone Line</div>
                <div className="text-slate-200 font-mono mt-0.5">{selectedClient.phone || 'Not configured'}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Site / Works Address</div>
                <div className="text-slate-200 mt-0.5">{selectedClient.address || 'Gauteng, South Africa'}</div>
              </div>
            </div>
          </div>

          {selectedClient.notes && (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300">
              <span className="font-semibold text-slate-400 mr-1.5">Project Scope Notes:</span>
              {selectedClient.notes}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {editingClient ? 'Edit Client Record' : 'Add New Client to Database'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Client / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Godongwane Progressive Projects"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. info@client.co.za"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +27 11 849 2034"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Industry Type / Specialization</label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g. Stainless Steel Fabrication & Structural Steel"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Site / Works Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Progressive Industrial Park, Wadeville, Germiston"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Account Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="lead">Lead / Proposal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Technical Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Machining specs, project requirements, delivery criteria..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  {submitting ? 'Saving...' : editingClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
