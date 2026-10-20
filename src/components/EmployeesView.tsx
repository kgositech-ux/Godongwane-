import React, { useState } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Edit2,
  Trash2,
  X,
  CheckCircle,
} from 'lucide-react';
import { Employee } from '../types';
import { db, handleFirestoreError, OperationType, checkIsAdmin } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface EmployeesViewProps {
  employees: Employee[];
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ employees }) => {
  const { currentUser, isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Senior Project Manager');
  const [department, setDepartment] = useState('Fabrication & Engineering');
  const [hourlyRate, setHourlyRate] = useState(550);
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingEmployee(null);
    setName('');
    setEmail('');
    setRole('Fabrication Engineer');
    setDepartment('Stainless Steel Workshop');
    setHourlyRate(450);
    setPhone('');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (e: Employee) => {
    setEditingEmployee(e);
    setName(e.name);
    setEmail(e.email);
    setRole(e.role);
    setDepartment(e.department);
    setHourlyRate(e.hourlyRate || 0);
    setPhone(e.phone || '');
    setActive(e.active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);

    try {
      if (editingEmployee) {
        await updateDoc(doc(db, 'employees', editingEmployee.id), {
          name: name.trim(),
          email: email.trim(),
          role: role.trim(),
          department: department.trim(),
          hourlyRate: Number(hourlyRate),
          phone: phone.trim() || undefined,
          active,
        });
      } else {
        const newEmp: Omit<Employee, 'id'> = {
          name: name.trim(),
          email: email.trim(),
          role: role.trim(),
          department: department.trim(),
          hourlyRate: Number(hourlyRate),
          phone: phone.trim() || undefined,
          active,
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'employees'), newEmp);
      }
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(
        err,
        editingEmployee ? OperationType.UPDATE : OperationType.CREATE,
        editingEmployee ? `employees/${editingEmployee.id}` : 'employees'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this team member record?')) return;
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `employees/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Employees & Team Roster</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              {employees.length} Staff
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Role-based access control, fabrication leads, and designated administrators
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Employee</span>
        </button>
      </div>

      {/* Admin Notice Banner matching user prompt */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold text-amber-300">
            Platform Full Administrative Collaborators Configured
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            As configured, <strong className="text-white font-mono">servicewebsites6@gmail.com</strong> (Kgosi) and <strong className="text-white font-mono">mthethwapraisegodcebolenkosi@gmail.com</strong> (Praise-God Cebolenkosi Mthethwa) have full administrative control to manage projects, employees, clients, and approve payroll.
          </p>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => {
          const isSpecialAdmin = checkIsAdmin(emp.email);

          return (
            <div
              key={emp.id}
              className={`p-5 rounded-2xl border transition-all shadow-lg flex flex-col justify-between space-y-4 ${
                isSpecialAdmin
                  ? 'bg-gradient-to-b from-[#111927] to-[#141e30] border-amber-500/40 ring-1 ring-amber-500/20'
                  : 'bg-[#111927] border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-400/90 text-slate-950 font-bold flex items-center justify-center text-sm shadow-inner">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>{emp.name}</span>
                        {isSpecialAdmin && (
                          <span title="Full Platform Admin">
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                          </span>
                        )}
                      </h3>
                      <div className="text-xs text-slate-400">{emp.role}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(emp)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && !isSpecialAdmin && (
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono text-slate-300 truncate">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-slate-300">{emp.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>{emp.department}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Rate: <strong className="text-white font-mono">R {emp.hourlyRate}/hr</strong>
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    emp.active
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {emp.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {editingEmployee ? 'Edit Team Member' : 'Add Employee to Roster'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sipho Zulu"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. s.zulu@godongwaneprojects.co.za"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Role Title</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Lead TIG Fabricator"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Stainless Steel Workshop"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Hourly Rate (ZAR)</label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +27 84 555 1209"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
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
                  {submitting ? 'Saving...' : editingEmployee ? 'Update Record' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
