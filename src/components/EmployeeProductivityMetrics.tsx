import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Employee, Task } from '../types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  TrendingUp,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface EmployeeProductivityMetricsProps {
  employees: Employee[];
  tasks: Task[];
}

export const EmployeeProductivityMetrics: React.FC<EmployeeProductivityMetricsProps> = ({
  employees,
  tasks,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Compute metrics per employee
  const employeeStats = employees.map((emp) => {
    // Match task by assignedTo name or email
    const assignedTasks = tasks.filter(
      (t) =>
        t.assignedTo === emp.name ||
        t.assignedTo === emp.email ||
        (t.assignedTo && emp.name.toLowerCase().includes(t.assignedTo.toLowerCase()))
    );

    const completed = assignedTasks.filter((t) => t.status === 'done').length;
    const inProgress = assignedTasks.filter(
      (t) => t.status === 'in_progress' || t.status === 'review' || t.status === 'todo'
    ).length;
    const overdue = assignedTasks.filter(
      (t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr
    ).length;

    const total = assignedTasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: emp.id,
      name: emp.name.split(' ')[0] + ' ' + (emp.name.split(' ')[1] ? emp.name.split(' ')[1][0] + '.' : ''),
      fullName: emp.name,
      department: emp.department,
      role: emp.role,
      total,
      completed,
      inProgress,
      overdue,
      completionRate,
    };
  });

  // Aggregates
  const totalTasksAssigned = employeeStats.reduce((sum, e) => sum + e.total, 0);
  const totalCompleted = employeeStats.reduce((sum, e) => sum + e.completed, 0);
  const totalOverdue = employeeStats.reduce((sum, e) => sum + e.overdue, 0);
  const avgCompletionRate =
    totalTasksAssigned > 0
      ? Math.round((totalCompleted / totalTasksAssigned) * 100)
      : 0;

  // Chart data for Bar Chart (showing employees who have tasks or are key staff)
  const chartData = employeeStats.map((e) => ({
    name: e.name,
    Completed: e.completed,
    'In Progress': e.inProgress,
    Overdue: e.overdue,
    rate: e.completionRate,
  }));

  // Pie chart data
  const pieData = [
    { name: 'Completed', value: totalCompleted, color: '#10B981' },
    {
      name: 'In Progress',
      value: Math.max(0, totalTasksAssigned - totalCompleted - totalOverdue),
      color: '#3B82F6',
    },
    { name: 'Overdue', value: totalOverdue, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <div className="font-bold text-white mb-1.5 border-b border-slate-800 pb-1">
            {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-slate-100">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#111927] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Avg Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {avgCompletionRate}%
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Across team assignments</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111927] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Overdue Assignments</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {totalOverdue}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-rose-400" />
            <span>Past deadline date</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111927] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Completed Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalCompleted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Out of {totalTasksAssigned} total tasks
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111927] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Top Lead</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-amber-300 truncate">
            {employeeStats.length > 0
              ? [...employeeStats].sort((a, b) => b.completed - a.completed)[0]?.fullName || 'Kgosi'
              : 'Kgosi'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Highest completion volume
          </div>
        </div>
      </div>

      {/* Visual Charts Grid using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Productivity Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#111927] border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Employee Productivity & Task Completion</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed vs active vs overdue tasks breakdown per fabricator
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Live Recharts
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
                  iconSize={10}
                />
                <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="In Progress" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Overdue" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status Donut Distribution */}
        <div className="p-5 rounded-2xl bg-[#111927] border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Task Status Distribution</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Portfolio execution balance
            </p>
          </div>

          <div className="h-48 w-full my-auto flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No task data available</div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-emerald-400 font-bold font-mono">{totalCompleted}</div>
              <div className="text-[10px] text-slate-400">Done</div>
            </div>
            <div>
              <div className="text-blue-400 font-bold font-mono">
                {Math.max(0, totalTasksAssigned - totalCompleted - totalOverdue)}
              </div>
              <div className="text-[10px] text-slate-400">Active</div>
            </div>
            <div>
              <div className="text-rose-400 font-bold font-mono">{totalOverdue}</div>
              <div className="text-[10px] text-slate-400">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Rates Table / Cards */}
      <div className="p-4 rounded-2xl bg-[#111927] border border-slate-800 shadow-lg space-y-3">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Individual Fabricator Metrics Summary</span>
          <span className="text-[11px] text-slate-400 normal-case font-normal">
            Updated in real-time
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {employeeStats.map((e) => (
            <div
              key={e.id}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-200">{e.fullName}</div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    e.overdue > 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : e.completionRate >= 50
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {e.overdue > 0 ? `${e.overdue} Overdue` : `${e.completionRate}% Done`}
                </span>
              </div>

              <div className="text-[11px] text-slate-400">{e.role}</div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Task Completion</span>
                  <span className="font-mono text-slate-200">
                    {e.completed}/{e.total}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      e.overdue > 0
                        ? 'bg-gradient-to-r from-emerald-500 to-rose-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, e.completionRate)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
