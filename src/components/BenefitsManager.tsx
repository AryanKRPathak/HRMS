import React, { useState } from "react";
import { 
  Heart, 
  Calendar, 
  Check, 
  X, 
  ShieldAlert, 
  Plus, 
  FileText, 
  CheckCircle, 
  Building,
  PlaneTakeoff,
  User,
  Activity,
  TrendingUp,
  TrendingDown,
  Calculator
} from "lucide-react";
import { BenefitPlan, LeaveRequest, Employee, LeaveStatus, LeaveType, BenefitType, EmployeeStatus } from "../types";

interface BenefitsManagerProps {
  benefitPlans: BenefitPlan[];
  leaveRequests: LeaveRequest[];
  employees: Employee[];
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
  onAddLeaveRequest: (req: LeaveRequest) => void;
  currentUser: any;
}

export default function BenefitsManager({ 
  benefitPlans, 
  leaveRequests, 
  employees,
  onApproveLeave, 
  onRejectLeave,
  onAddLeaveRequest,
  currentUser
}: BenefitsManagerProps) {
  const isAdmin = currentUser.role === "Admin";
  const isHRHead = currentUser.role === "HR Head";
  const isHRAssociate = currentUser.role === "HR Associate";
  const isEmployee = currentUser.role === "Employee";

  const isHR = isAdmin || isHRHead || isHRAssociate;
  const isVP = false;

  // Submit new leave request states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    employeeId: "",
    type: LeaveType.ANNUAL,
    startDate: "",
    endDate: "",
    reason: ""
  });
  const [formError, setFormError] = useState("");

  const activeEmployees = employees.filter(e => e.status !== EmployeeStatus.TERMINATED);

  // Leave projection modeling and tab states
  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => {
    if (!isHR && !isVP) {
      return currentUser.id;
    }
    return activeEmployees[0]?.id || "";
  });
  const [projectionMonths, setProjectionMonths] = useState<number>(3);
  const [rightPanelTab, setRightPanelTab] = useState<"pools" | "projection">("projection");

  // Reusable projection calculation engine based on 2026-05-20 as "today"
  const calculateEmployeeProjection = (emp: Employee, months: number) => {
    const currentBalance = emp.leavesTotal - emp.leavesUsed;
    const accrualRate = emp.leavesTotal / 12;
    const projectedAccrued = accrualRate * months;

    const endWindowDate = new Date("2026-05-20");
    endWindowDate.setMonth(endWindowDate.getMonth() + months);
    const endWindowStr = endWindowDate.toISOString().split("T")[0];

    // Approved leaves in projection period (starting on or after 2026-05-20, ending on or before projection window end)
    const upcomingApproved = leaveRequests.filter(r => 
      r.employeeId === emp.id && 
      r.status === LeaveStatus.APPROVED &&
      r.startDate >= "2026-05-20" &&
      r.startDate <= endWindowStr
    );
    const approvedDays = upcomingApproved.reduce((sum, r) => sum + r.totalDays, 0);

    // Pending leaves in projection period
    const upcomingPending = leaveRequests.filter(r => 
      r.employeeId === emp.id && 
      r.status === LeaveStatus.PENDING &&
      r.startDate >= "2026-05-20" &&
      r.startDate <= endWindowStr
    );
    const pendingDays = upcomingPending.reduce((sum, r) => sum + r.totalDays, 0);

    const projectedBalance = Number((currentBalance + projectedAccrued - approvedDays).toFixed(2));
    const projectedBalanceWithPending = Number((projectedBalance - pendingDays).toFixed(2));

    return {
      currentBalance,
      accrualRate: Number(accrualRate.toFixed(2)),
      projectedAccrued: Number(projectedAccrued.toFixed(1)),
      approvedDays,
      pendingDays,
      projectedBalance,
      projectedBalanceWithPending,
      upcomingApproved,
      upcomingPending,
      endDateLabel: endWindowDate.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })
    };
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newRequest.employeeId || !newRequest.startDate || !newRequest.endDate || !newRequest.reason.trim()) {
      setFormError("All information fields must be populated to schedule a leave request.");
      return;
    }

    const employeeSelected = employees.find(emp => emp.id === newRequest.employeeId);
    if (!employeeSelected) {
      setFormError("Selected employee not found in corporate directories.");
      return;
    }

    // Days calculation
    const start = new Date(newRequest.startDate);
    const end = new Date(newRequest.endDate);
    if (end < start) {
      setFormError("End date cannot precede the start date.");
      return;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const remainingLeaves = employeeSelected.leavesTotal - employeeSelected.leavesUsed;
    if (newRequest.type !== LeaveType.UNPAID && diffDays > remainingLeaves) {
      setFormError(`Insufficient leave balance. ${employeeSelected.name} has only ${remainingLeaves} days remaining.`);
      return;
    }

    const entry: LeaveRequest = {
      id: `LRQ-${Math.floor(Math.random() * 9000) + 1000}`,
      employeeId: employeeSelected.id,
      employeeName: employeeSelected.name,
      employeeDept: employeeSelected.department,
      type: newRequest.type,
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      totalDays: diffDays,
      status: LeaveStatus.PENDING,
      reason: newRequest.reason.trim(),
      submittedDate: new Date().toISOString().split("T")[0]
    };

    onAddLeaveRequest(entry);
    setIsFormOpen(false);
    // Reset fields
    setNewRequest({
      employeeId: "",
      type: LeaveType.ANNUAL,
      startDate: "",
      endDate: "",
      reason: ""
    });
  };

  return (
    <div className="space-y-8 animate-fade-in" id="hrms-benefits-manager">
      
      {/* Tab Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Corp Benefits & leaves</h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure premium wellness plans, company pension rates, and authorize employee time-off request tracks.
          </p>
        </div>
        
        <button
          onClick={() => {
            setNewRequest(prev => ({ ...prev, employeeId: currentUser.id }));
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium text-sm transition-all hover:translate-y-[-1px] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {isHR || isVP ? "Schedule Time-Off Run" : "Request Time-Off"}
        </button>
      </div>

      {/* Grid of active Benefit Programs */}
      <div className="space-y-4">
        <div className="border-b border-slate-150 pb-2 flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
            <Heart className="w-5 h-5 text-indigo-600" />
            Corporate Coverage Options
          </h3>
          <span className="text-xs text-slate-500 font-medium">All options are standard and pre-vetted</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {benefitPlans.map((plan) => {
            const subscribersCount = employees.filter(e => e.benefitPlan === plan.name).length;

            return (
              <div 
                key={plan.id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-indigo-450 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-1 pb-3 border-b border-slate-150">
                    <span className="text-[10px] font-mono tracking-wider bg-slate-100 uppercase text-slate-500 font-bold px-2 py-0.5 rounded-md">
                      {plan.type}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold uppercase">{plan.id}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mt-3">{plan.name}</h4>
                  <p className="text-xs text-slate-500 leading-normal mt-2 line-clamp-3">{plan.description}</p>
                  
                  {/* Subscriber metrics nested */}
                  <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-500 flex items-center justify-between mt-4">
                    <span className="font-mono">Subscribers Count:</span>
                    <span className="font-bold font-display text-slate-800">{subscribersCount} employees</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                  <div className="text-xs font-mono text-slate-500">
                    <span>Premium: </span>
                    <span className="font-bold text-slate-800">${plan.monthlyCost}/mo</span>
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    <span>Company covers: </span>
                    <span className="font-bold text-indigo-600">{plan.employerContribution}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leave request tracking dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Approve Workflows (2/3 width) */}
        <div className="bg-white border border-slate-200 rounded-lg lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-lg font-display font-medium text-slate-900 flex items-center gap-2">
                <PlaneTakeoff className="w-5 h-5 text-indigo-600" />
                Active Time-Off Decisions Ledger
              </h3>
              <p className="text-xs text-slate-505 mt-0.5">Evaluate pending requests and decrement remaining leave pools directly.</p>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
              {leaveRequests.filter(req => isHR || (isVP && req.employeeDept === "Engineering") || req.employeeId === currentUser.id).length > 0 ? (
                leaveRequests
                  .filter(req => isHR || (isVP && req.employeeDept === "Engineering") || req.employeeId === currentUser.id)
                  .map((req) => {
                    const employeeRecord = employees.find(e => e.id === req.employeeId);
                    const remainingDays = employeeRecord 
                      ? employeeRecord.leavesTotal - employeeRecord.leavesUsed 
                      : 0;

                    return (
                      <div key={req.id} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">{req.employeeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({req.employeeDept})</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              req.type === LeaveType.ANNUAL ? "bg-indigo-50 text-indigo-700" :
                              req.type === LeaveType.MEDICAL ? "bg-amber-50 text-amber-700" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                              {req.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 italic">"{req.reason}"</p>
                          <div className="text-[11px] font-mono text-slate-400 flex flex-wrap gap-x-4 gap-y-1.5 items-center">
                            <span>Timeline: {req.startDate} to {req.endDate} ({req.totalDays} Days)</span>
                            {employeeRecord && (
                              <>
                                <span className="text-slate-500 font-medium">Remaining Balance: {remainingDays} / {employeeRecord.leavesTotal} Days</span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-650 bg-indigo-50 border border-indigo-125 px-1.5 py-0.5 rounded-md" title="Projected balance in 3 months with standard monthly accrual and future scheduled leaves">
                                  <TrendingUp className="w-3 h-3 text-indigo-500" />
                                  Proj. 3M Balance: {calculateEmployeeProjection(employeeRecord, 3).projectedBalance} days
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Approval triggers */}
                        <div className="flex items-center gap-2 shrink-0">
                          {req.status === LeaveStatus.PENDING ? (
                            isHR || (isVP && req.employeeDept === "Engineering") ? (
                              <>
                                <button
                                  onClick={() => onApproveLeave(req.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => onRejectLeave(req.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 border border-rose-100 rounded-lg transition-all cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 font-semibold italic bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
                                Pending HR Approval
                              </span>
                            )
                          ) : (
                            <span className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded border ${
                              req.status === LeaveStatus.APPROVED ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              "bg-rose-50 text-rose-700 border-rose-100"
                            }`}>
                              {req.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="p-12 text-center text-slate-400 text-sm font-mono">
                  No active time-off request decide history located.
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Authoritative Org Decider</span>
            <span>Accrual: Monthly cycle simulation</span>
          </div>
        </div>

        {/* Info panel + Interactive Projections Dashboard */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between" id="accrual-projections-panel">
          <div>
            {/* Tab Swappers */}
            <div className="flex border-b border-slate-150 mb-4 pb-2 justify-between items-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider">Projection Toolset</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setRightPanelTab("pools")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    rightPanelTab === "pools" 
                      ? "bg-slate-100 text-slate-800 border border-slate-200" 
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Pools Directory
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab("projection")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    rightPanelTab === "projection" 
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-150" 
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Accrual Predictor
                </button>
              </div>
            </div>

            {rightPanelTab === "pools" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-mono uppercase text-slate-400 font-bold tracking-widest flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    Accrued Leave Pools
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Select employee to model</span>
                </div>
                
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {employees
                    .filter(e => e.status !== EmployeeStatus.TERMINATED)
                    .filter(e => isHR || isVP || e.id === currentUser.id)
                    .map(emp => {
                      const used = emp.leavesUsed;
                      const total = emp.leavesTotal;
                      const rem = total - used;
                      const percent = Math.min(100, (used / total) * 100);
                      
                      // Pre-calculate 3M projection summary for fast comparison
                      const projSummary = calculateEmployeeProjection(emp, 3);

                      return (
                        <div 
                          key={emp.id} 
                          onClick={() => {
                            setSelectedEmpId(emp.id);
                            setRightPanelTab("projection");
                          }}
                          className={`p-3 border rounded-xl transition-all cursor-pointer hover:bg-slate-50/50 relative group ${
                            selectedEmpId === emp.id 
                              ? "border-indigo-300 bg-indigo-50/15" 
                              : "border-slate-150 bg-white"
                          }`}
                        >
                          <div className="flex justify-between items-baseline mb-1">
                            <div>
                              <span className="font-bold text-slate-850 text-xs block group-hover:text-indigo-600 transition-colors">{emp.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono">{emp.role}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-[10.5px] font-semibold text-slate-700 block">{rem} / {total} days rem</span>
                              <span className="text-[9px] text-indigo-600 font-semibold block uppercase tracking-wider font-mono">Proj (3m): {projSummary.projectedBalance}d</span>
                            </div>
                          </div>
                          
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-mono uppercase text-slate-400 font-bold tracking-widest flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-indigo-500" />
                    Accrual Predictor
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setRightPanelTab("pools")}
                    className="text-[10px] text-indigo-600 font-semibold uppercase hover:underline"
                  >
                    ← Pools Directory
                  </button>
                </div>

                <div className="space-y-3.5">
                  {/* Select Employee dropdown */}
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1">Target Employee</label>
                    <select
                      value={selectedEmpId}
                      onChange={(e) => setSelectedEmpId(e.target.value)}
                      disabled={!isHR && !isVP}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-lg text-xs text-slate-800 cursor-pointer font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {activeEmployees
                        .filter(e => isHR || isVP || e.id === currentUser.id)
                        .map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.department})
                          </option>
                        ))}
                    </select>
                  </div>

                  {(() => {
                    const selectedEmp = employees.find(e => e.id === selectedEmpId) || activeEmployees[0];
                    if (!selectedEmp) return null;

                    const math = calculateEmployeeProjection(selectedEmp, projectionMonths);
                    const isSevere = math.projectedBalance < 2;

                    return (
                      <>
                        {/* Projection Months Selector Slider */}
                        <div>
                          <div className="flex justify-between items-center mb-1 text-[10px]">
                            <span className="uppercase font-mono text-slate-400 font-semibold">Projection Horizon</span>
                            <span className="font-bold text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.5 rounded">{projectionMonths} Months (Until {math.endDateLabel})</span>
                          </div>
                          
                          {/* Slider range input */}
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="1"
                              max="12"
                              value={projectionMonths}
                              onChange={(e) => setProjectionMonths(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>

                          {/* Quick selection tags */}
                          <div className="flex justify-between mt-2">
                            {[1, 3, 6, 12].map(m => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setProjectionMonths(m)}
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                                  projectionMonths === m 
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" 
                                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                } transition-all cursor-pointer`}
                              >
                                {m}m
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Leave statistics and accrual details */}
                        <div className="bg-slate-50/75 border border-slate-150 p-2.5 rounded-lg space-y-1.5 text-[11px]">
                          <div className="flex justify-between text-slate-500">
                            <span>Base leave allowance:</span>
                            <span className="font-semibold text-slate-700 font-mono">{selectedEmp.leavesTotal} days / yr</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Monthly accrual rate:</span>
                            <span className="font-bold text-indigo-600 font-mono">+{math.accrualRate} days/mo</span>
                          </div>
                        </div>

                        {/* Calculation breakdown */}
                        <div className="border border-slate-150 rounded-lg overflow-hidden font-sans">
                          <div className="p-2 bg-slate-50 border-b border-slate-150 text-[9px] uppercase font-mono font-bold text-slate-450 tracking-wider">
                            Future balance math
                          </div>
                          
                          <div className="p-3 space-y-2 text-xs text-slate-700 bg-white">
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Current leave balance:</span>
                              <span className="font-bold font-mono">+{math.currentBalance} d</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-650">
                              <span>Projected accrual (+):</span>
                              <span className="font-bold font-mono text-emerald-600">+{math.projectedAccrued} d</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-650 border-b border-slate-100 pb-1.5">
                              <span>Approved scheduled leave (-):</span>
                              <span className="font-bold font-mono text-rose-600">-{math.approvedDays} d</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                              <span className="font-bold text-slate-800">Projected final balance:</span>
                              <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                                isSevere ? "bg-rose-100 text-rose-700 font-extrabold animate-pulse" : "bg-emerald-50 text-emerald-700"
                              }`}>
                                {math.projectedBalance} days
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Warnings on severe balances */}
                        {isSevere && (
                          <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-[10px] flex items-start gap-2 leading-relaxed">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">Accrual warning limit reached</p>
                              <p className="font-normal text-slate-605 mt-0.5">Projected balance ends below 2 days. The employee may face unapproved absences if additional leave is taken.</p>
                            </div>
                          </div>
                        )}

                        {/* List of upcoming leave */}
                        <div className="space-y-1.5 pt-0.5">
                          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                            Leaves in Horizon ({math.upcomingApproved.length} Approved)
                          </span>
                          
                          {math.upcomingApproved.length > 0 ? (
                            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                              {math.upcomingApproved.map(req => (
                                <div key={req.id} className="p-2 bg-slate-50 border border-slate-150 rounded text-[10.5px] leading-relaxed flex justify-between items-start gap-2">
                                  <div className="truncate">
                                    <div className="font-semibold text-slate-700 truncate">{req.type}</div>
                                    <div className="text-slate-450 text-[9px] font-mono mt-0.5">{req.startDate} to {req.endDate}</div>
                                  </div>
                                  <span className="font-mono font-bold text-rose-600 bg-rose-50 border border-rose-100/50 px-1 py-0.5 rounded whitespace-nowrap shrink-0">
                                    -{req.totalDays} d
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-2 text-center text-slate-400 italic text-[10px] border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                              No approved scheduled leaves in this horizon.
                            </div>
                          )}
                        </div>

                        {/* Warning on pending leave overlap */}
                        {math.upcomingPending.length > 0 && (
                          <div className="p-2.5 bg-amber-50/70 border border-amber-250 rounded-lg text-[10px] text-amber-805 leading-relaxed">
                            <span className="font-bold flex items-center gap-1 mb-1 text-amber-800">
                              <Calendar className="w-3.5 h-3.5 text-amber-500" />
                              Pending Overlaps: {math.pendingDays} days
                            </span>
                            <p className="font-normal text-slate-650">
                              Awaiting authorization. Approval would reduce projection to <strong>{math.projectedBalanceWithPending} days</strong>.
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 leading-normal flex items-start gap-1.5">
            <span className="text-indigo-600 font-bold font-mono">ⓘ</span>
            <div>
              <p className="font-bold text-slate-850">Regulatory compliance check</p>
              <p className="font-normal text-slate-500 mt-0.5">By corporate regulations, employees with leave saturation exceeding 80% must schedule offset leaves to prevent loss of balance.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Slide-over request leave form overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" id="leave-request-modal">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md shadow-xl p-6 relative">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-display font-medium text-slate-900 pb-3 border-b border-slate-150 mb-5">
              {isHR || isVP ? "Submit Leave on Employee Behalf" : "Submit Personal Leave Request"}
            </h3>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg mb-4 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs font-medium text-slate-700">
              
              {/* Select Employee */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Select Employee</label>
                <select
                  required
                  value={newRequest.employeeId}
                  onChange={(e) => setNewRequest({ ...newRequest, employeeId: e.target.value })}
                  disabled={!isHR && !isVP}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg focus:bg-white text-slate-800 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees
                    .filter(e => e.status !== EmployeeStatus.TERMINATED)
                    .filter(e => isHR || isVP || e.id === currentUser.id)
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                    ))}
                </select>
              </div>

              {/* Leave Type */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Leave Category</label>
                <select
                  value={newRequest.type}
                  onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value as LeaveType })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg focus:bg-white text-slate-800 cursor-pointer"
                >
                  <option value={LeaveType.ANNUAL}>Annual Vacation</option>
                  <option value={LeaveType.MEDICAL}>Medical Leave</option>
                  <option value={LeaveType.UNPAID}>Unpaid Absence</option>
                  <option value={LeaveType.PARENTAL}>Parental Leave</option>
                </select>
              </div>

              {/* Timelines split */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newRequest.startDate}
                    onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newRequest.endDate}
                    onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Detailed Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide brief vacation or medical justification details..."
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg focus:bg-white text-slate-800 font-normal leading-relaxed text-xs"
                />
              </div>

              {/* Submit triggers */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs cursor-pointer"
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
