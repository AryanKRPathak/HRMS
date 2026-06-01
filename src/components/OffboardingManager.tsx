import React, { useState, useEffect } from "react";
import { 
  Users, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  LogOut,
  Plus
} from "lucide-react";

interface ExitRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDept: string;
  exitType: "Resignation" | "Retirement" | "Termination";
  requestDate: string;
  lastWorkingDay: string;
  noticePeriod: number;
  reason: string;
  status: "Pending" | "Approved" | "Completed";
  checklist: {
    assetsReturned: boolean;
    accessRevoked: boolean;
    clearanceLetterIssued: boolean;
  };
}

interface OffboardingManagerProps {
  currentUser: any;
  employees: any[];
  onNavigate: (tabId: string) => void;
  onAddAuditLog: (action: string, entity: string, entityId: string) => void;
}

export default function OffboardingManager({ currentUser, employees, onNavigate, onAddAuditLog }: OffboardingManagerProps) {
  if (currentUser?.role === "Employee") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-lg mx-auto text-center my-12 shadow-sm animate-fade-in" id="offboarding-access-denied">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Access Denied</h3>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
          You are not authorized to view this administrative management section. This module is restricted to HR Professionals and Administrators.
        </p>
        <button
          onClick={() => onNavigate("dashboard")}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const [exits, setExits] = useState<ExitRequest[]>(() => {
    const saved = localStorage.getItem("hrms_exits");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "EXT-001",
        employeeId: "EMP-150", // Suresh Iyer
        employeeName: "Suresh Iyer",
        employeeDept: "Engineering",
        exitType: "Resignation",
        requestDate: "01 May 2025",
        lastWorkingDay: "30 Jun 2025",
        noticePeriod: 60,
        reason: "Personal exploration and academic interests.",
        status: "Approved",
        checklist: {
          assetsReturned: false,
          accessRevoked: false,
          clearanceLetterIssued: true
        }
      },
      {
        id: "EXT-002",
        employeeId: "EMP-151", // Meera Pillai
        employeeName: "Meera Pillai",
        employeeDept: "Executive Office",
        exitType: "Resignation",
        requestDate: "01 Dec 2024",
        lastWorkingDay: "31 Dec 2024",
        noticePeriod: 30,
        reason: "Family relocation to another state.",
        status: "Completed",
        checklist: {
          assetsReturned: true,
          accessRevoked: true,
          clearanceLetterIssued: true
        }
      }
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    employeeId: employees[0]?.id || "",
    exitType: "Resignation" as const,
    requestDate: "2026-06-01",
    lastWorkingDay: "2026-07-01",
    noticePeriod: 30,
    reason: ""
  });

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("hrms_exits", JSON.stringify(exits));
  }, [exits]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateExitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedEmployee = employees.find(emp => emp.id === newRequest.employeeId);
    if (!matchedEmployee) {
      triggerToast("Invalid active employee chosen.");
      return;
    }

    const newExit: ExitRequest = {
      id: `EXT-00${Math.floor(Math.random() * 900) + 100}`,
      employeeId: matchedEmployee.id,
      employeeName: matchedEmployee.name,
      employeeDept: matchedEmployee.department,
      exitType: newRequest.exitType,
      requestDate: new Date(newRequest.requestDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      lastWorkingDay: new Date(newRequest.lastWorkingDay).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      noticePeriod: Number(newRequest.noticePeriod),
      reason: newRequest.reason,
      status: "Pending",
      checklist: {
        assetsReturned: false,
        accessRevoked: false,
        clearanceLetterIssued: false
      }
    };

    setExits(prev => [newExit, ...prev]);
    onAddAuditLog(`CREATE exit_request for ${newExit.employeeName}`, "Exit Request", newExit.id);
    setIsModalOpen(false);
    triggerToast("Exit request logged successfully.");
    setNewRequest({
      employeeId: employees[0]?.id || "",
      exitType: "Resignation",
      requestDate: "2026-06-01",
      lastWorkingDay: "2026-07-01",
      noticePeriod: 30,
      reason: ""
    });
  };

  const toggleChecklistItem = (exitId: string, flag: "assetsReturned" | "accessRevoked" | "clearanceLetterIssued") => {
    setExits(prev => prev.map(ex => {
      if (ex.id === exitId) {
        const nextChecklist = { ...ex.checklist, [flag]: !ex.checklist[flag] };
        const allDone = nextChecklist.assetsReturned && nextChecklist.accessRevoked && nextChecklist.clearanceLetterIssued;
        const nextStatus = allDone ? "Completed" as const : "Approved" as const;
        return { ...ex, checklist: nextChecklist, status: nextStatus };
      }
      return ex;
    }));
    onAddAuditLog(`UPDATE exit checklist ${flag} on exit ${exitId}`, "Exit Request", exitId);
    triggerToast("Checklist parameter updated.");
  };

  const handleUpdateStatus = (exitId: string, nextStatus: any) => {
    setExits(prev => prev.map(ex => {
      if (ex.id === exitId) {
        let checklist = { ...ex.checklist };
        if (nextStatus === "Completed") {
          checklist = { assetsReturned: true, accessRevoked: true, clearanceLetterIssued: true };
        }

        return { ...ex, status: nextStatus, checklist };
      }
      return ex;
    }));
    onAddAuditLog(`UPDATE exit_status of ${exitId} to ${nextStatus}`, "Exit Request", exitId);
    triggerToast(`Status changed to ${nextStatus}`);
  };

  // Stats calculation
  const pendingCount = exits.filter(ex => ex.status === "Pending").length;
  const approvedCount = exits.filter(ex => ex.status === "Approved").length;
  const completedCount = exits.filter(ex => ex.status === "Completed").length;

  return (
    <div className="space-y-6 animate-fade-in" id="offboarding-panel">
      {toast && (
        <div className="fixed top-5 right-5 z-55 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-750 flex items-center gap-2 animate-fade-in no-print">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {toast}
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
            Offboarding
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Manage employee exit and offboarding process.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-lg text-xs cursor-pointer shadow-md shadow-blue-900/10 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New Exit Request
        </button>
      </div>

      {/* Stats grids matching designs */}
      <div className="grid grid-cols-3 gap-5">
        
        {/* Pending */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
          <span className={`text-[26px] font-bold leading-none ${pendingCount > 0 ? "text-rose-500 font-black animate-pulse" : "text-slate-805"}`}>{pendingCount}</span>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">Pending</span>
        </div>

        {/* Approved/In-Progress */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
          <span className="text-[26px] font-bold text-blue-600 leading-none">{approvedCount}</span>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">Approved/In Progress</span>
        </div>

        {/* Completed */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
          <span className="text-[26px] font-bold text-emerald-600 leading-none">{completedCount}</span>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">Completed</span>
        </div>

      </div>

      {/* Table Content Card matched explicitly */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/20">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Active Separation Registry</span>
        </div>
        
        <div className="p-4 overflow-x-auto">
          {exits.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 font-medium">No exit requests recorded.</p>
          ) : (
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium pb-2 text-[10.5px] uppercase tracking-wider">
                  <th className="py-3 font-semibold pb-2.5">Employee</th>
                  <th className="py-3 font-semibold">Exit Type</th>
                  <th className="py-3 font-semibold">Request Date</th>
                  <th className="py-3 font-semibold">Last Working Day</th>
                  <th className="py-3 font-semibold">Checklist Items</th>
                  <th className="py-3 font-semibold">Status</th>
                  <th className="py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {exits.map(ex => (
                  <tr key={ex.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 pr-2">
                      <div className="font-bold text-slate-805">{ex.employeeName}</div>
                      <div className="text-[10px] text-slate-400 leading-none mt-0.5">{ex.employeeDept}</div>
                    </td>
                    <td className="py-3.5 font-bold text-slate-700">{ex.exitType}</td>
                    <td className="py-3.5 font-mono text-slate-400">{ex.requestDate}</td>
                    <td className="py-3.5 font-mono text-slate-600 font-bold">{ex.lastWorkingDay}</td>
                    <td className="py-3.5">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => toggleChecklistItem(ex.id, "assetsReturned")}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer border ${
                            ex.checklist.assetsReturned 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-150" 
                              : "bg-slate-50 text-slate-400 border-slate-200"
                          }`}
                        >
                          Assets
                        </button>
                        <button
                          onClick={() => toggleChecklistItem(ex.id, "accessRevoked")}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer border ${
                            ex.checklist.accessRevoked 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-150" 
                              : "bg-slate-50 text-slate-400 border-slate-200"
                          }`}
                        >
                          Access
                        </button>
                        <button
                          onClick={() => toggleChecklistItem(ex.id, "clearanceLetterIssued")}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer border ${
                            ex.checklist.clearanceLetterIssued 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-150" 
                              : "bg-slate-50 text-slate-400 border-slate-200"
                          }`}
                        >
                          Letter
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        ex.status === "Completed" ? "bg-green-50 text-green-700 border-green-150" :
                        ex.status === "Approved" ? "bg-blue-50 text-blue-700 border-blue-150" :
                        "bg-amber-50 text-amber-700 border-amber-150"
                      }`}>
                        {ex.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-sans">
                      {ex.status === "Pending" ? (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleUpdateStatus(ex.id, "Approved")}
                            className="px-2 py-1 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-all text-[10.5px] cursor-pointer"
                          >
                            Approve
                          </button>
                        </div>
                      ) : ex.status === "Approved" ? (
                        <button
                          onClick={() => handleUpdateStatus(ex.id, "Completed")}
                          className="px-2 py-1 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 transition-all text-[10.5px] cursor-pointer"
                        >
                          Complete Exit
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Finalized</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Submit Exit Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-xs z-55 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-50 animate-fade-in relative font-sans">
            <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Submit Exit Request</h3>
            <p className="text-xs text-slate-400 mt-0.5">Publish an organization detachment or retirement record.</p>
            
            <form onSubmit={handleCreateExitRequest} className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Employee *</label>
                <select
                  value={newRequest.employeeId}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full px-2 py-2 border border-slate-200 outline-none rounded-lg text-xs text-slate-650 bg-white"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Exit Type</label>
                  <select
                    value={newRequest.exitType}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, exitType: e.target.value as any }))}
                    className="w-full px-2 py-2 border border-slate-200 outline-none rounded-lg text-xs text-slate-650 bg-white"
                  >
                    <option value="Resignation">Resignation</option>
                    <option value="Retirement">Retirement</option>
                    <option value="Termination">Termination</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notice Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 60"
                    value={newRequest.noticePeriod}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, noticePeriod: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Request Date</label>
                  <input
                    type="date"
                    required
                    value={newRequest.requestDate}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, requestDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Last Working Day</label>
                  <input
                    type="date"
                    required
                    value={newRequest.lastWorkingDay}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, lastWorkingDay: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reason for Detachment *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Insert official explanation notes..."
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-normal resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Submit Request
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
