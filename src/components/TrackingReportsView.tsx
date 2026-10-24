import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  TrendingUp,
  DollarSign,
  User,
  AlertTriangle,
  FileSpreadsheet,
  Filter,
  BarChart2,
  ExternalLink,
} from 'lucide-react';
import { Project, Milestone, Task, Employee, TruckVehicle, TruckHireBooking, TimesheetEntry, Client } from '../types';
import { downloadFile } from '../utils/googleDriveExport';
import { useTheme } from '../context/ThemeContext';

interface TrackingReportsViewProps {
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  employees: Employee[];
  vehicles: TruckVehicle[];
  truckBookings: TruckHireBooking[];
  timesheets: TimesheetEntry[];
  clients: Client[];
  onOpenHtmlReport?: () => void;
  onOpenDriveModal?: () => void;
}

type ReportType = 'milestones' | 'truck_hire' | 'timesheets' | 'portfolio';

export const TrackingReportsView: React.FC<TrackingReportsViewProps> = ({
  projects,
  milestones,
  tasks,
  employees,
  vehicles,
  truckBookings,
  timesheets,
  clients,
  onOpenHtmlReport,
}) => {
  const { isDark } = useTheme();
  const [activeReport, setActiveReport] = useState<ReportType>('milestones');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  // 1. Export CSV according to active report
  const handleExportReportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let fileName = `Godongwane_Tracking_Report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeReport === 'milestones') {
      fileName = `Godongwane_Milestone_Schedule_Tracking_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Milestone Title',
        'Project Name',
        'Phase',
        'Planned Due Date',
        'Actual Completion Date',
        'Variance (Days)',
        'Progress (%)',
        'Status',
        'Critical Path',
        'Lead Engineer',
      ];
      rows = milestones
        .filter((m) => projectFilter === 'all' || m.projectId === projectFilter)
        .map((m) => [
          `"${m.title.replace(/"/g, '""')}"`,
          `"${(projectMap.get(m.projectId) || '').replace(/"/g, '""')}"`,
          m.phase || 'N/A',
          m.plannedDueDate || m.dueDate,
          m.actualCompletionDate || 'Pending',
          m.varianceDays || 0,
          `${m.progress}%`,
          m.status,
          m.criticalPath ? 'YES' : 'NO',
          `"${(m.assignedLead || '').replace(/"/g, '""')}"`,
        ]);
    } else if (activeReport === 'truck_hire') {
      fileName = `Godongwane_Truck_Hire_Logistics_Tracking_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Truck / Vehicle',
        'Registration',
        'Client',
        'Destination',
        'Start Date',
        'End Date',
        'Daily Rate (ZAR)',
        'Total Cost (ZAR)',
        'Status',
        'Operator',
      ];
      rows = truckBookings.map((b) => [
        `"${b.truckName.replace(/"/g, '""')}"`,
        vehicles.find((v) => v.id === b.truckId)?.registration || 'N/A',
        `"${b.clientName.replace(/"/g, '""')}"`,
        `"${b.destination.replace(/"/g, '""')}"`,
        b.startDate,
        b.endDate,
        b.agreedRate,
        b.totalEstimatedCost,
        b.status,
        `"${(b.driverAssigned || '').replace(/"/g, '""')}"`,
      ]);
    } else if (activeReport === 'timesheets') {
      fileName = `Godongwane_Employee_Job_Usage_Tracking_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Date',
        'Employee',
        'Project',
        'Category',
        'Regular Hours',
        'Overtime Hours',
        'Total Hours',
        'Hourly Rate (ZAR)',
        'Total Labor Cost (ZAR)',
        'Status',
        'Supervisor Approved',
      ];
      rows = timesheets
        .filter((t) => projectFilter === 'all' || t.projectId === projectFilter)
        .map((t) => [
          t.date,
          `"${t.employeeName.replace(/"/g, '""')}"`,
          `"${t.projectName.replace(/"/g, '""')}"`,
          t.jobCategory,
          t.regularHours,
          t.overtimeHours,
          t.totalHours,
          t.hourlyRate,
          t.totalCost,
          t.status,
          `"${(t.supervisorApprovedBy || '').replace(/"/g, '""')}"`,
        ]);
    } else {
      fileName = `Godongwane_Executive_Portfolio_Tracking_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Project Name', 'Client', 'Budget (ZAR)', 'Progress (%)', 'Status', 'Start Date', 'Target Date'];
      rows = projects.map((p) => [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.clientName.replace(/"/g, '""')}"`,
        p.budget,
        `${p.progressPercentage}%`,
        p.status,
        p.startDate || '',
        p.targetCompletionDate || '',
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
  };

  const handlePrint = () => {
    window.print();
  };

  // Metrics for overview
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const totalHireRevenue = truckBookings.reduce((acc, b) => acc + (b.totalEstimatedCost || 0), 0);
  const totalLaborHours = timesheets.reduce((acc, t) => acc + (t.totalHours || 0), 0);
  const totalLaborCost = timesheets.reduce((acc, t) => acc + (t.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-amber-500" />
              <span>Project & Operations Tracking Reports</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
              Audit & Analytics
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Certified operational audits for project milestones, truck hire logistics, and job usage timesheets
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportReportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-200 dark:text-slate-200 light:text-slate-900 text-xs font-semibold rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Report (CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-200 dark:text-slate-200 light:text-slate-900 text-xs font-semibold rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Print Report</span>
          </button>

          {onOpenHtmlReport && (
            <button
              onClick={onOpenHtmlReport}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Executive Briefing</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider">
            Milestones Delivered
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1 tabular-nums">
            {completedMilestones} / {totalMilestones}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {Math.round((completedMilestones / (totalMilestones || 1)) * 100)}% portfolio milestone completion
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider">
            Truck Hire Revenue
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1 tabular-nums">
            R {totalHireRevenue.toLocaleString('en-ZA')}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            Across {truckBookings.length} heavy haulage contracts
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider">
            Job Hours Logged
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-1 tabular-nums">
            {totalLaborHours} hrs
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total timesheet production time
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider">
            Labor Expenditure
          </div>
          <div className="text-2xl font-bold text-white dark:text-white light:text-slate-900 font-mono mt-1 tabular-nums">
            R {totalLaborCost.toLocaleString('en-ZA')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Audited employee payroll costs
          </div>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveReport('milestones')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeReport === 'milestones'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Milestone Schedule Tracking</span>
          </button>

          <button
            onClick={() => setActiveReport('truck_hire')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeReport === 'truck_hire'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Truck Hire & Logistics</span>
          </button>

          <button
            onClick={() => setActiveReport('timesheets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeReport === 'timesheets'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Job Usage Timesheet</span>
          </button>

          <button
            onClick={() => setActiveReport('portfolio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeReport === 'portfolio'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Executive Portfolio Summary</span>
          </button>
        </div>

        {/* Project Filter */}
        {(activeReport === 'milestones' || activeReport === 'timesheets') && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter Project:</span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-slate-900 dark:bg-slate-900 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-200 dark:text-slate-200 light:text-slate-900 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* REPORT CONTENT 1: MILESTONE SCHEDULE TRACKING */}
      {activeReport === 'milestones' && (
        <div className="rounded-2xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div>
              <h3 className="font-bold text-white dark:text-white light:text-slate-900 text-sm">
                Project Milestone Schedule & Planned vs. Actual Performance
              </h3>
              <p className="text-[11px] text-slate-400">
                Tracking variance between engineering schedule dates and sign-off completion
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-400 font-bold">
              Audit Date: {new Date().toLocaleDateString('en-ZA')}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <th className="p-3">Milestone Gate</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Phase</th>
                  <th className="p-3">Planned Target</th>
                  <th className="p-3">Actual Date</th>
                  <th className="p-3">Schedule Variance</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {milestones
                  .filter((m) => projectFilter === 'all' || m.projectId === projectFilter)
                  .map((m) => {
                    const variance = m.varianceDays || 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-900/40">
                        <td className="p-3 font-medium text-white dark:text-white light:text-slate-900">
                          {m.title}
                          {m.criticalPath && (
                            <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold uppercase">
                              Critical
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-300">{projectMap.get(m.projectId) || 'Project'}</td>
                        <td className="p-3 text-slate-400">{m.phase || 'Execution'}</td>
                        <td className="p-3 font-mono text-slate-200">{m.plannedDueDate || m.dueDate}</td>
                        <td className="p-3 font-mono text-emerald-400">{m.actualCompletionDate || 'Pending'}</td>
                        <td className="p-3 font-mono">
                          {m.actualCompletionDate ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                variance < 0
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : variance === 0
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {variance < 0 ? `${Math.abs(variance)}d early` : variance === 0 ? 'On time' : `+${variance}d delay`}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-400">{m.progress}%</td>
                        <td className="p-3">
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                              m.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : m.status === 'in_progress'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT 2: TRUCK HIRE LOGISTICS TRACKING */}
      {activeReport === 'truck_hire' && (
        <div className="rounded-2xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div>
              <h3 className="font-bold text-white dark:text-white light:text-slate-900 text-sm">
                Truck Hire Fleet Utilization & Dispatch Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                Logistics haulage trips, equipment deployment, and client rental billing
              </p>
            </div>
            <div className="text-xs font-mono text-amber-400 font-bold">
              Total Contracted: R {totalHireRevenue.toLocaleString('en-ZA')}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <th className="p-3">Vehicle & Model</th>
                  <th className="p-3">Client Organization</th>
                  <th className="p-3">Hire Route</th>
                  <th className="p-3">Cargo Spec</th>
                  <th className="p-3">Hire Window</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3">Contract Value</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {truckBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-white dark:text-white light:text-slate-900">
                      {b.truckName}
                    </td>
                    <td className="p-3 text-slate-200">{b.clientName}</td>
                    <td className="p-3 text-slate-300">
                      <div>{b.destination}</div>
                      <div className="text-[10px] text-slate-400">ex {b.pickupLocation}</div>
                    </td>
                    <td className="p-3 text-amber-400 font-mono text-[11px]">{b.material}</td>
                    <td className="p-3 font-mono text-slate-300">
                      {b.startDate} to {b.endDate}
                    </td>
                    <td className="p-3 text-slate-300">{b.driverAssigned || 'Standby'}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      R {b.totalEstimatedCost.toLocaleString('en-ZA')}
                    </td>
                    <td className="p-3">
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT 3: TIMESHEET LABOR REPORT */}
      {activeReport === 'timesheets' && (
        <div className="rounded-2xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div>
              <h3 className="font-bold text-white dark:text-white light:text-slate-900 text-sm">
                Employee Job Usage & Labor Timesheet Audit
              </h3>
              <p className="text-[11px] text-slate-400">
                Detailed breakdown of production hours, overtime multipliers, and accrued labor expenditure
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-400 font-bold">
              Total Labor Cost: R {totalLaborCost.toLocaleString('en-ZA')}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <th className="p-3">Date</th>
                  <th className="p-3">Team Member</th>
                  <th className="p-3">Project / Job</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Regular</th>
                  <th className="p-3">Overtime</th>
                  <th className="p-3">Total Hours</th>
                  <th className="p-3">Labor Cost</th>
                  <th className="p-3">Supervisor Sign-off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {timesheets
                  .filter((t) => projectFilter === 'all' || t.projectId === projectFilter)
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-mono text-slate-300">{t.date}</td>
                      <td className="p-3 font-bold text-white dark:text-white light:text-slate-900">
                        {t.employeeName}
                      </td>
                      <td className="p-3 text-slate-200">
                        <div>{t.projectName}</div>
                        {t.taskTitle && <div className="text-[10px] text-amber-400">{t.taskTitle}</div>}
                      </td>
                      <td className="p-3 text-slate-300 uppercase text-[10px] font-mono">
                        {t.jobCategory.replace('_', ' ')}
                      </td>
                      <td className="p-3 font-mono text-slate-300">{t.regularHours}h</td>
                      <td className="p-3 font-mono text-amber-400">{t.overtimeHours}h</td>
                      <td className="p-3 font-mono font-bold text-white dark:text-white light:text-slate-900">
                        {t.totalHours}h
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        R {t.totalCost.toLocaleString('en-ZA')}
                      </td>
                      <td className="p-3 text-[11px] text-slate-300">
                        {t.supervisorApprovedBy ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t.supervisorApprovedBy}</span>
                          </span>
                        ) : (
                          <span className="text-amber-400">Pending Review</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT 4: EXECUTIVE PORTFOLIO SUMMARY */}
      {activeReport === 'portfolio' && (
        <div className="rounded-2xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div>
              <h3 className="font-bold text-white dark:text-white light:text-slate-900 text-sm">
                Executive Portfolio & Strategic Contracts Overview
              </h3>
              <p className="text-[11px] text-slate-400">
                Heavy fabrication contracts, mining supply agreements, and milestone health
              </p>
            </div>
            <div className="text-xs font-mono text-amber-400 font-bold">
              Total Budget: R {projects.reduce((acc, p) => acc + (p.budget || 0), 0).toLocaleString('en-ZA')}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <th className="p-3">Project Title</th>
                  <th className="p-3">Client Organization</th>
                  <th className="p-3">Contract Value</th>
                  <th className="p-3">Milestone Progress</th>
                  <th className="p-3">Target Completion</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-white dark:text-white light:text-slate-900">{p.name}</td>
                    <td className="p-3 text-slate-300">{p.clientName}</td>
                    <td className="p-3 font-mono font-bold text-white dark:text-white light:text-slate-900">
                      R {(p.budget || 0).toLocaleString('en-ZA')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold">{p.progressPercentage}%</span>
                        <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${p.progressPercentage}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-300">{p.targetCompletionDate || 'Open'}</td>
                    <td className="p-3">
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
