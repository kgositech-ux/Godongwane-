import React, { useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  Clock,
  User,
  DollarSign,
  Download,
  Calendar,
} from 'lucide-react';
import { Employee, Task } from '../types';
import { useAuth } from '../context/AuthContext';

interface PayrollViewProps {
  employees: Employee[];
  tasks: Task[];
}

export const PayrollView: React.FC<PayrollViewProps> = ({ employees, tasks }) => {
  const { isAdmin } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

  // Compute total logged hours from tasks
  const employeeHoursMap = new Map<string, number>();
  tasks.forEach((t) => {
    if (t.assignedTo) {
      const current = employeeHoursMap.get(t.assignedTo) || 0;
      employeeHoursMap.set(t.assignedTo, current + (t.actualHours || t.estimatedHours || 0));
    }
  });

  const payrollItems = employees.map((emp) => {
    // Check by name or default hours
    const hours = employeeHoursMap.get(emp.name) || (emp.role.includes('Admin') ? 160 : 120);
    const gross = hours * (emp.hourlyRate || 400);
    return {
      ...emp,
      hoursWorked: hours,
      grossPay: gross,
      status: 'approved' as const,
    };
  });

  const totalPayroll = payrollItems.reduce((acc, p) => acc + p.grossPay, 0);
  const totalHours = payrollItems.reduce((acc, p) => acc + p.hoursWorked, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Agency & Workshop Payroll</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              {selectedMonth}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Fabrication hours logged, rates, and wage disbursement calculations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Paysheets</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#111927] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Total Monthly Disbursement</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">
              R {totalPayroll.toLocaleString('en-ZA')}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Total Hours Billed</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
              {totalHours} hrs
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111927] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Active Staff Paid</div>
            <div className="text-xl font-bold text-blue-400 font-mono mt-0.5">
              {payrollItems.length} Team Members
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-[#111927] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-[#162133] text-slate-400 uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-4 sm:px-6">EMPLOYEE / COLLABORATOR</th>
                <th className="py-3 px-4 sm:px-6">DEPARTMENT</th>
                <th className="py-3 px-4 sm:px-6">HOURLY RATE</th>
                <th className="py-3 px-4 sm:px-6">HOURS LOGGED</th>
                <th className="py-3 px-4 sm:px-6">GROSS PAYABLE</th>
                <th className="py-3 px-4 sm:px-6 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {payrollItems.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-4 sm:px-6 font-medium text-slate-100">
                    <div>{p.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{p.email}</div>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-slate-300">{p.department}</td>
                  <td className="py-4 px-4 sm:px-6 text-slate-300 font-mono">
                    R {p.hourlyRate}/hr
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-slate-200 font-mono font-bold">
                    {p.hoursWorked} hrs
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-white font-mono font-bold text-sm">
                    R {p.grossPay.toLocaleString('en-ZA')}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Approved</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
