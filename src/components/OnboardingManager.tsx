import React, { useState, useEffect } from "react";
import { 
  Users, 
  Layers, 
  Plus, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Calendar, 
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";

interface SubTask {
  id: string;
  label: string;
  category: "documentation" | "it setup" | "training" | "compliance" | "introduction";
  completed: boolean;
}

interface OnboardingTask {
  id: string;
  employeeName: string;
  email: string;
  status: "In Progress" | "Completed";
  startDate: string;
  targetDate: string;
  subTasks: SubTask[];
}

interface OnboardingManagerProps {
  currentUser: any;
  employees: any[];
  onNavigate: (tabId: string) => void;
  onAddAuditLog: (action: string, entity: string, entityId: string) => void;
}

export default function OnboardingManager({ currentUser, employees, onNavigate, onAddAuditLog }: OnboardingManagerProps) {
  if (currentUser?.role === "Employee") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-lg mx-auto text-center my-12 shadow-sm animate-fade-in" id="onboarding-access-denied">
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

  const [onboards, setOnboards] = useState<OnboardingTask[]>(() => {
    const saved = localStorage.getItem("hrms_onboards");
    if (saved) return JSON.parse(saved);

    const standardTasks: SubTask[] = [
      { id: "st-1", label: "Collect joining-documents", category: "documentation", completed: true },
      { id: "st-2", label: "Submit PAN and Aadhaar copies", category: "documentation", completed: true },
      { id: "st-3", label: "Complete bank-account details form", category: "documentation", completed: true },
      { id: "st-4", label: "Setup laptop and IT equipment", category: "it setup", completed: true },
      { id: "st-5", label: "Create company email account", category: "it setup", completed: true },
      { id: "st-6", label: "Grant software access and credentials", category: "it setup", completed: true },
      { id: "st-7", label: "Complete HR-policy orientation", category: "training", completed: false },
      { id: "st-8", label: "Sign NDA and employment contract", category: "compliance", completed: true },
      { id: "st-9", label: "Team introduction and Buddy assignment", category: "introduction", completed: false },
      { id: "st-10", label: "Complete mandatory compliance training", category: "compliance", completed: false }
    ];

    return [
      {
        id: "ONB-101",
        employeeName: "Deepak Kumar",
        email: "deepak.k@enterprise.io",
        status: "In Progress",
        startDate: "2026-05-15",
        targetDate: "2026-05-30",
        subTasks: standardTasks.map((t, idx) => ({
          ...t,
          id: `onb-1-${idx}`,
          // Set 8 out of 10 tasks completed for Deepak Kumar matching video precisely
          completed: idx !== 6 && idx !== 8 // exclude policy orientation & buddy session
        }))
      },
      {
        id: "ONB-102",
        employeeName: "Amit Joshi",
        email: "amit.joshi@enterprise.io",
        status: "Completed",
        startDate: "2026-05-01",
        targetDate: "2026-05-14",
        subTasks: standardTasks.map((t, idx) => ({
          ...t,
          id: `onb-2-${idx}`,
          completed: true
        }))
      },
      {
        id: "ONB-103",
        employeeName: "Pooja Bhatt",
        email: "pooja.b@enterprise.io",
        status: "Completed",
        startDate: "2026-05-10",
        targetDate: "2026-05-24",
        subTasks: standardTasks.map((t, idx) => ({
          ...t,
          id: `onb-3-${idx}`,
          completed: true
        }))
      }
    ];
  });

  const [expandedId, setExpandedId] = useState<string | null>("ONB-101");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOnboard, setNewOnboard] = useState({
    employeeName: "",
    email: "",
    startDate: "2026-06-02",
    targetDate: "2026-06-15"
  });

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("hrms_onboards", JSON.stringify(onboards));
  }, [onboards]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleSubtask = (onboardId: string, taskId: string) => {
    const matchedOnboard = onboards.find(o => o.id === onboardId);
    const matchedSubtask = matchedOnboard?.subTasks.find(t => t.id === taskId);
    if (matchedSubtask) {
      const nextCompleted = !matchedSubtask.completed;
      onAddAuditLog(
        `${nextCompleted ? 'COMPLETE' : 'INCOMPLETE'} task "${matchedSubtask.label}" on onboarding ${onboardId}`, 
        "Onboarding", 
        onboardId
      );
    }

    setOnboards(prev => prev.map(o => {
      if (o.id === onboardId) {
        const updatedSubtasks = o.subTasks.map(t => {
          if (t.id === taskId) {
            return { ...t, completed: !t.completed };
          }
          return t;
        });

        // Determine if total status changes
        const allDone = updatedSubtasks.every(t => t.completed);
        const nextStatus = allDone ? "Completed" as const : "In Progress" as const;

        return { ...o, subTasks: updatedSubtasks, status: nextStatus };
      }
      return o;
    }));
  };

  const handleCreateOnboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOnboard.employeeName || !newOnboard.email) {
      triggerToast("Please populate all required fields.");
      return;
    }

    const defaultSubTasks: SubTask[] = [
      { id: "nst-1", label: "Collect joining-documents", category: "documentation", completed: false },
      { id: "nst-2", label: "Submit PAN and Aadhaar copies", category: "documentation", completed: false },
      { id: "nst-3", label: "Complete bank-account details form", category: "documentation", completed: false },
      { id: "nst-4", label: "Setup laptop and IT equipment", category: "it setup", completed: false },
      { id: "nst-5", label: "Create company email account", category: "it setup", completed: false },
      { id: "nst-6", label: "Grant software access and credentials", category: "it setup", completed: false },
      { id: "nst-7", label: "Complete HR-policy orientation", category: "training", completed: false },
      { id: "nst-8", label: "Sign NDA and employment contract", category: "compliance", completed: false },
      { id: "nst-9", label: "Team introduction and Buddy assignment", category: "introduction", completed: false },
      { id: "nst-10", label: "Complete mandatory compliance training", category: "compliance", completed: false }
    ];

    const newID = `ONB-${Math.floor(Math.random() * 900) + 100}`;
    const task: OnboardingTask = {
      id: newID,
      employeeName: newOnboard.employeeName,
      email: newOnboard.email,
      status: "In Progress",
      startDate: newOnboard.startDate,
      targetDate: newOnboard.targetDate,
      subTasks: defaultSubTasks.map((t, idx) => ({ ...t, id: `onb-${newID}-${idx}` }))
    };

    setOnboards(prev => [task, ...prev]);
    onAddAuditLog(`CREATE Onboarding checklist for ${task.employeeName}`, "Onboarding", newID);
    setIsModalOpen(false);
    setExpandedId(newID);
    triggerToast(`Created Onboarding for ${task.employeeName}`);
    setNewOnboard({
      employeeName: "",
      email: "",
      startDate: "2026-06-02",
      targetDate: "2026-06-15"
    });
  };

  // Stats calculation
  const totalOnb = onboards.length;
  const completedOnb = onboards.filter(o => o.status === "Completed").length;
  const inProgressOnb = onboards.filter(o => o.status === "In Progress").length;

  return (
    <div className="space-y-6 animate-fade-in" id="onboarding-panel">
      {toast && (
        <div className="fixed top-5 right-5 z-55 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-750 flex items-center gap-2 animate-fade-in no-print">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {toast}
        </div>
      )}

      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
            Onboarding
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Monitor and coordinate corporate onboarding progress.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-lg text-xs cursor-pointer shadow-md shadow-blue-900/10 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Start Onboarding
        </button>
      </div>

      {/* KPI blocks matching designs */}
      <div className="grid grid-cols-3 gap-5">
        
        {/* In Progress */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
          <span className="text-[26px] font-bold text-blue-600 leading-none">{inProgressOnb}</span>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">In Progress</span>
        </div>

        {/* Completed */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
          <span className="text-[26px] font-bold text-emerald-605 text-emerald-605 text-emerald-600 leading-none">{completedOnb}</span>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">Completed</span>
        </div>

        {/* Total */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
          <span className="text-[26px] font-bold text-slate-800 leading-none">{totalOnb}</span>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">Total</span>
        </div>

      </div>

      {/* List content section with toggle layout */}
      <div className="space-y-4">
        {onboards.map(o => {
          const completedCount = o.subTasks.filter(t => t.completed).length;
          const totalTasks = o.subTasks.length;
          const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 100;
          const isExpanded = expandedId === o.id;

          return (
            <div key={o.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all">
              
              {/* Header metrics card clickable */}
              <div 
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : o.id)}
              >
                
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-805 flex items-center gap-2">
                    <span>{o.employeeName}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      o.status === "Completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-blue-50 text-blue-700 border border-blue-105"
                    }`}>
                      {o.status}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium font-mono">{o.email} • {o.id}</p>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto">
                  
                  {/* Join dates */}
                  <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-450 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-350" />
                    <span>Start: {o.startDate}</span>
                    <span className="mx-1">•</span>
                    <span>Target: {o.targetDate}</span>
                  </div>

                  {/* Progress bar structure precisely mirroring screenshot */}
                  <div className="flex-1 md:w-44 lg:w-52 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
                      <div 
                        className={`h-full transition-all ${o.status === "Completed" ? "bg-emerald-500" : "bg-blue-500"}`}
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 shrink-0 font-mono w-14 text-right">
                      <span>{completionPercentage}%</span>
                      <span className="text-[9.5px] text-slate-400 font-medium block">{completedCount}/{totalTasks} tasks</span>
                    </div>
                  </div>

                  <span className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>

                </div>

              </div>

              {/* Collapsed view checklist layout */}
              {isExpanded && (
                <div className="mt-6 pt-5 border-t border-slate-100 animate-slide-up">
                  <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3.5">Standard Integration Checklist</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    {o.subTasks.map(t => (
                      <div 
                        key={t.id} 
                        onClick={() => handleToggleSubtask(o.id, t.id)}
                        className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50/50 ${
                          t.completed 
                            ? "border-emerald-100 bg-emerald-50/5 text-slate-700" 
                            : "border-slate-150 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={t.completed}
                            onChange={() => {}} // toggled on card click
                            className="rounded text-blue-600 focus:ring-blue-105"
                          />
                          <span className={`text-xs font-semibold leading-none ${t.completed ? "line-through text-slate-400" : ""}`}>
                            {t.label}
                          </span>
                        </div>
                        <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold uppercase font-mono ${
                          t.category === "documentation" ? "bg-blue-50 text-blue-600" :
                          t.category === "it setup" ? "bg-indigo-50 text-indigo-600" :
                          t.category === "training" ? "bg-amber-50 text-amber-600" :
                          t.category === "compliance" ? "bg-purple-50 text-purple-600" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {t.category}
                        </span>
                      </div>
                    ))}
                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Start Onboarding Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-xs z-55 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-50 animate-fade-in relative font-sans">
            <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Start Onboarding</h3>
            <p className="text-xs text-slate-400 mt-0.5">Publish an integration and onboarding workflow checklist.</p>
            
            <form onSubmit={handleCreateOnboard} className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Hire Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kavita Nair"
                  value={newOnboard.employeeName}
                  onChange={(e) => setNewOnboard(prev => ({ ...prev, employeeName: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kavita.n@enterprise.io"
                  value={newOnboard.email}
                  onChange={(e) => setNewOnboard(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Onboarding Start</label>
                  <input
                    type="date"
                    required
                    value={newOnboard.startDate}
                    onChange={(e) => setNewOnboard(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Completion</label>
                  <input
                    type="date"
                    required
                    value={newOnboard.targetDate}
                    onChange={(e) => setNewOnboard(prev => ({ ...prev, targetDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                  />
                </div>
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
                  Launch SLA Setup
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
