import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  Check,
  X,
  FileSpreadsheet,
  Download,
  ChevronRight,
  TrendingUp,
  Tag,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { TimesheetEntry, Employee, Project, Task, JobCategory, TimesheetStatus } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { logActivity } from '../utils/activityLogger';

interface TimesheetsViewProps {
  timesheets: TimesheetEntry[];
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
}

export const TimesheetsView: React.FC<TimesheetsViewProps> = ({
  timesheets,
  employees,
  projects,
  tasks,
}) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [empId, setEmpId] = useState(employees.length > 0 ? employees[0].id : '');
  const [projId, setProjId] = useState(projects.length > 0 ? projects[0].id : '');
  const [taskId, setTaskId] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [regularHours, setRegularHours] = useState(8);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(340);
  const [jobCategory, setJobCategory] = useState<JobCategory>('welding');
  const [workDescription, setWorkDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openLogModal = () => {
    const defaultEmp = employees.find((e) => e.email === currentUser?.email) || (employees.length > 0 ? employees[0] : null);
    if (defaultEmp) {
      setEmpId(defaultEmp.id);
      setHourlyRate(defaultEmp.hourlyRate || 340);
    }
    setProjId(projects.length > 0 ? projects[0].id : '');
    setTaskId('');
    setEntryDate(new Date().toISOString().slice(0, 10));
    setRegularHours(8);
    setOvertimeHours(0);
    setJobCategory('welding');
    setWorkDescription('');
    setIsModalOpen(true);
  };

  const handleEmployeeChange = (employeeId: string) => {
    setEmpId(employeeId);
    const emp = employees.find((e) => e.id === employeeId);
    if (emp) {
      setHourlyRate(emp.hourlyRate);
    }
  };

  const handleSaveTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId || !projId) return;
    setSubmitting(true);

    try {
      const selectedEmp = employees.find((e) => e.id === empId);
      const selectedProj = projects.find((p) => p.id === projId);
      const selectedTask = tasks.find((t) => t.id === taskId);

      const totalH = Number(regularHours) + Number(overtimeHours);
      // Overtime 1.5x standard rate
      const totalLaborCost =
        Number(regularHours) * Number(hourlyRate) +
        Number(overtimeHours) * (Number(hourlyRate) * 1.5);

      const newEntry: Omit<TimesheetEntry, 'id'> = {
        employeeId: empId,
        employeeName: selectedEmp ? selectedEmp.name : 'Godongwane Employee',
        projectId: projId,
        projectName: selectedProj ? selectedProj.name : 'Godongwane Project',
        taskId: taskId || undefined,
        taskTitle: selectedTask ? selectedTask.title : undefined,
        date: entryDate,
        regularHours: Number(regularHours),
        overtimeHours: Number(overtimeHours),
        totalHours: totalH,
        hourlyRate: Number(hourlyRate),
        totalCost: Math.round(totalLaborCost),
        jobCategory,
        workDescription: workDescription.trim(),
        status: isAdmin ? 'approved' : 'submitted',
        supervisorApprovedBy: isAdmin ? (currentUser?.displayName || 'Lead PM') : undefined,
        approvedAt: isAdmin ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'timesheets'), newEntry);

      logActivity({
        type: 'timesheet',
        action: 'created',
        title: `Job Timesheet: ${selectedEmp?.name || 'Employee'}`,
        description: `Logged ${totalH} hours on "${selectedProj?.name}" (${jobCategory}).`,
        userName: currentUser?.displayName || 'Admin',
        userEmail: currentUser?.email || 'mthethwapraisegodcebolenkosi@gmail.com',
      });

      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'timesheets');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'timesheets', id), {
        status: 'approved',
        supervisorApprovedBy: currentUser?.displayName || 'Praise-God Cebolenkosi Mthethwa',
        approvedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `timesheets/${id}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDoc(doc(db, 'timesheets', id), {
        status: 'rejected',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `timesheets/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this job timesheet entry?')) return;
    try {
      await deleteDoc(doc(db, 'timesheets', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `timesheets/${id}`);
    }
  };

  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((t) => {
      const matchEmp = selectedEmployeeId === 'all' || t.employeeId === selectedEmployeeId;
      const matchProj = selectedProjectId === 'all' || t.projectId === selectedProjectId;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchEmp && matchProj && matchStatus;
    });
  }, [timesheets, selectedEmployeeId, selectedProjectId, statusFilter]);

  // Summary Metrics
  const totalHoursLogged = useMemo(() => {
    return timesheets.reduce((acc, t) => acc + (t.totalHours || 0), 0);
  }, [timesheets]);

  const totalOvertimeLogged = useMemo(() => {
    return timesheets.reduce((acc, t) => acc + (t.overtimeHours || 0), 0);
  }, [timesheets]);

  const totalLaborCostAccrued = useMemo(() => {
    return timesheets.reduce((acc, t) => acc + (t.totalCost || 0), 0);
  }, [timesheets]);

  const pendingApprovalCount = useMemo(() => {
    return timesheets.filter((t) => t.status === 'submitted').length;
  }, [timesheets]);

  const handleDownloadCSV = () => {
    const headers = [
      'Date',
      'Employee',
      'Project',
      'Task',
      'Job Category',
      'Regular Hours',
      'Overtime Hours',
      'Total Hours',
      'Hourly Rate (ZAR)',
      'Total Labor Cost (ZAR)',
      'Status',
      'Supervisor Approved By',
      'Description',
    ];

    const rows = filteredTimesheets.map((t) => [
      t.date,
      `"${t.employeeName.replace(/"/g, '""')}"`,
      `"${t.projectName.replace(/"/g, '""')}"`,
      `"${(t.taskTitle || '').replace(/"/g, '""')}"`,
      t.jobCategory,
      t.regularHours,
      t.overtimeHours,
      t.totalHours,
      t.hourlyRate,
      t.totalCost,
      t.status,
      `"${(t.supervisorApprovedBy || '').replace(/"/g, '""')}"`,
      `"${(t.workDescription || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Godongwane_Job_Timesheets_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-500" />
              <span>Employees Job Usage Timesheet</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              Labor Tracking
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Log labor hours against specific projects, tasks, fabrication jobs, and heavy truck operations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-200 dark:text-slate-200 light:text-slate-900 text-xs font-semibold rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export Timesheets (CSV)</span>
          </button>

          <button
            onClick={openLogModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Job Hours</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider">
            Total Hours Logged
          </div>
          <div className="text-2xl font-bold text-white dark:text-white light:text-slate-900 font-mono mt-1 tabular-nums">
            {totalHoursLogged} hrs
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {projects.length} project work fronts
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider">
            Overtime Hours
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1 tabular-nums">
            {totalOvertimeLogged} hrs
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            Urgent chute & weekend shifts
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider">
            Total Labor Accrued
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1 tabular-nums">
            R {totalLaborCostAccrued.toLocaleString('en-ZA')}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            Billable project labor cost
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider">
            Pending PM Approvals
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-1 tabular-nums">
            {pendingApprovalCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {pendingApprovalCount === 0 ? 'All timesheets verified' : 'Awaiting PM review'}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Employee:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="bg-slate-900 dark:bg-slate-900 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 dark:text-slate-200 light:text-slate-900 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Team Members ({employees.length})</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-900 dark:bg-slate-900 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 dark:text-slate-200 light:text-slate-900 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 dark:bg-slate-900 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 dark:text-slate-200 light:text-slate-900 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="submitted">Pending Approval</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <strong>{filteredTimesheets.length}</strong> entries
        </div>
      </div>

      {/* Timesheet Entries Table */}
      <div className="rounded-2xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border-b border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-400 uppercase font-mono text-[11px]">
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Project & Scope</th>
                <th className="p-3.5">Job Category</th>
                <th className="p-3.5">Regular / OT</th>
                <th className="p-3.5">Total Hours</th>
                <th className="p-3.5">Labor Cost</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200">
              {filteredTimesheets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No timesheet entries found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredTimesheets.map((entry) => {
                  const isApproved = entry.status === 'approved';
                  const isPending = entry.status === 'submitted';

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-900/40 dark:hover:bg-slate-900/40 light:hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3.5 font-mono text-slate-300 dark:text-slate-300 light:text-slate-700 whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white dark:text-white light:text-slate-900">
                          {entry.employeeName}
                        </div>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="font-medium text-slate-200 dark:text-slate-200 light:text-slate-800 truncate">
                          {entry.projectName}
                        </div>
                        {entry.taskTitle && (
                          <div className="text-[10px] text-amber-400 truncate mt-0.5">
                            Task: {entry.taskTitle}
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 truncate mt-0.5" title={entry.workDescription}>
                          {entry.workDescription}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {entry.jobCategory.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300 dark:text-slate-300 light:text-slate-700">
                        {entry.regularHours}h {entry.overtimeHours > 0 && <span className="text-amber-400 font-semibold">(+{entry.overtimeHours}h OT)</span>}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-white dark:text-white light:text-slate-900 text-sm">
                        {entry.totalHours}h
                      </td>
                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-emerald-400">
                          R {entry.totalCost.toLocaleString('en-ZA')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          @ R {entry.hourlyRate}/h
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isPending
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isPending && isAdmin && (
                            <>
                              <button
                                onClick={() => handleApprove(entry.id)}
                                className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-colors"
                                title="Approve Timesheet"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleReject(entry.id)}
                                className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors"
                                title="Reject Timesheet"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal: Log Job Hours */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] dark:bg-[#111827] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white dark:text-white light:text-slate-900 text-base">
                  Log Employee Job Hours
                </h3>
                <p className="text-xs text-slate-400">
                  Record daily labor against projects and specialized work categories
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTimesheet} className="p-5 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Employee *</label>
                  <select
                    required
                    value={empId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Job Date *</label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Project *</label>
                  <select
                    required
                    value={projId}
                    onChange={(e) => setProjId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Job Work Category</label>
                  <select
                    value={jobCategory}
                    onChange={(e) => setJobCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="welding">Boiler Making & TIG/MIG Welding</option>
                    <option value="fabrication">CNC Plasma & Heavy Fabrication</option>
                    <option value="site_assembly">Site Rigging & Crane Erection</option>
                    <option value="truck_operation">Heavy Truck / Tipper Operation</option>
                    <option value="qa_inspection">Non-Destructive QA Inspection</option>
                    <option value="project_management">Project Management & Detailing</option>
                    <option value="logistics">Depot Yard & Equipment Logistics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Associated Task (Optional)</label>
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="">General Project Work</option>
                  {tasks
                    .filter((t) => !projId || t.projectId === projId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Regular Hours *</label>
                  <input
                    type="number"
                    min="0"
                    max="16"
                    step="0.5"
                    required
                    value={regularHours}
                    onChange={(e) => setRegularHours(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Overtime (1.5x)</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    step="0.5"
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Hourly Rate (ZAR)</label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400">Calculated Labor Cost:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  R{' '}
                  {(
                    Number(regularHours) * Number(hourlyRate) +
                    Number(overtimeHours) * (Number(hourlyRate) * 1.5)
                  ).toLocaleString('en-ZA')}
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Work Done & Job Notes *</label>
                <textarea
                  rows={2}
                  required
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="Specify welds performed, tons transported, drawing numbers worked on..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
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
                  {submitting ? 'Recording...' : 'Submit Timesheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
