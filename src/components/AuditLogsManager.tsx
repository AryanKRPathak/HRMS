import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  FileText, 
  ShieldAlert, 
  CheckCircle, 
  Activity, 
  Clock, 
  MapPin, 
  Compass
} from "lucide-react";

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string; // e.g. "LOGIN", "CREATE", "APPROVE", "UPDATE", "DELETE"
  entity: string; // e.g. "User", "Employee", "Leave Request", "Payroll Run", "Job", "Candidate", "Onboarding", "Exit Request", "Announcement", "Ticket"
  entityId: string;
  ipAddress: string;
}

interface AuditLogsManagerProps {
  currentUser: any;
  auditLogs: AuditLog[];
  onClearLogs?: () => void;
}

export default function AuditLogsManager({ currentUser, auditLogs, onClearLogs }: AuditLogsManagerProps) {
  if (currentUser?.role === "Employee") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-lg mx-auto text-center my-12 shadow-sm animate-fade-in" id="audit-access-denied">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Access Denied</h3>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
          You are not authorized to view the Enterprise system audit logs. This module is restricted to Administrators and Security officers.
        </p>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("All");

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.actor.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.entity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntity = entityFilter === "All" || log.entity === entityFilter;
    return matchesSearch && matchesEntity;
  });

  // Calculate stats based on logs array
  const totalEvents = auditLogs.length;
  const loginEvents = auditLogs.filter(l => l.action.includes("LOGIN")).length;
  const createEvents = auditLogs.filter(l => l.action.toLowerCase().includes("create")).length;
  const modifyEvents = auditLogs.filter(l => 
    l.action.toLowerCase().includes("update") || 
    l.action.toLowerCase().includes("approve") || 
    l.action.toLowerCase().includes("complete") || 
    l.action.toLowerCase().includes("reject")
  ).length;

  return (
    <div className="space-y-6 animate-fade-in" id="audit-logs-portal">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
            Audit Logs
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Complete audit trail of all system actions and user authorizations.
          </p>
        </div>
        {onClearLogs && (
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to flush the sandbox audit trails?")) {
                onClearLogs();
              }
            }}
            className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-150 transition-all cursor-pointer"
          >
            Flush Logs
          </button>
        )}
      </div>

      {/* Audit Stats blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        
        {/* Total Events */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
          <span className="text-[26px] font-bold text-slate-805 leading-none">{totalEvents}</span>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">Total Events</span>
        </div>

        {/* Login Events */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
          <span className="text-[26px] font-bold text-blue-600 leading-none">{loginEvents}</span>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2 font-sans">Login Events</span>
        </div>

        {/* Create Events */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
          <span className="text-[26px] font-bold text-indigo-650 text-indigo-600 leading-none">{createEvents}</span>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">Create Events</span>
        </div>

        {/* Modify Events */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
          <span className="text-[26px] font-bold text-amber-600 leading-none">{modifyEvents}</span>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">Modify Events</span>
        </div>

      </div>

      {/* Table & Filtering section card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        
        {/* Filters control block */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/45 flex flex-col sm:flex-row gap-3 justify-between items-center">
          
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search logs by actor or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-205 focus:outline-none focus:ring-2 focus:ring-blue-105 text-xs text-slate-705 font-medium rounded-lg bg-white"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto self-end sm:self-auto">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 outline-none rounded-lg text-xs font-bold text-slate-600 bg-white w-full sm:w-48"
            >
              <option value="All">All Entity Types</option>
              <option value="User">User</option>
              <option value="Employee">Employee</option>
              <option value="Leave Request">Leave Request</option>
              <option value="Payroll Run">Payroll Run</option>
              <option value="Job">Job</option>
              <option value="Candidate">Candidate</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Exit Request">Exit Request</option>
              <option value="Announcement">Announcement</option>
              <option value="Ticket">Ticket</option>
            </select>
          </div>

        </div>

        {/* Content table block */}
        <div className="p-4 overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 font-medium">No recorded logs match search parameters.</p>
          ) : (
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium pb-2 text-[10.5px] uppercase tracking-wider">
                  <th className="py-3 font-semibold pb-2.5">Timestamp</th>
                  <th className="py-3 font-semibold">Actor</th>
                  <th className="py-3 font-semibold">Action</th>
                  <th className="py-3 font-semibold">Entity</th>
                  <th className="py-3 font-semibold">Entity ID</th>
                  <th className="py-3 font-semibold text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/45 transition-colors">
                    <td className="py-3.5 whitespace-nowrap font-mono text-slate-400 text-[11px]">{log.timestamp}</td>
                    <td className="py-3.5">
                      <div className="font-bold text-slate-805">{log.actor}</div>
                      <div className="text-[10px] text-slate-400 leading-none mt-0.5">Authorized Actor</div>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase font-mono ${
                        log.action.includes("LOGIN") ? "bg-blue-50 text-blue-700 border-blue-105" :
                        log.action.includes("CREATE") ? "bg-indigo-50 text-indigo-705 border-indigo-105" :
                        log.action.includes("APPROVE") ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                        log.action.includes("DELETE") ? "bg-rose-50 text-rose-750 border-rose-150" :
                        "bg-amber-50 text-amber-705 border-amber-105"
                      }`}>
                        {log.action.split(" ")[0]}
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 font-semibold text-slate-550">{log.entity}</td>
                    <td className="py-3.5 pr-2 font-mono text-slate-500 font-bold">{log.entityId}</td>
                    <td className="py-3.5 text-right font-mono text-slate-405">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
