import React from "react";
import { 
  Users, 
  DollarSign, 
  Heart, 
  Calendar, 
  ArrowUpRight, 
  Sparkles, 
  Clock, 
  TrendingUp,
  FileCheck,
  Megaphone,
  Pin,
  Lock,
  Headphones,
  UserCheck,
  UserX,
  UserPlus,
  HelpCircle,
  Plus,
  Compass,
  Activity,
  FileText
} from "lucide-react";
import { Employee, LeaveRequest, BenefitPlan, LeaveStatus, EmployeeStatus, Announcement } from "../types";
import { 
  ResponsiveContainer, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Cell,
  Legend,
  PieChart,
  Pie
} from "recharts";

interface DashboardProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  plans: BenefitPlan[];
  announcements: Announcement[];
  onNavigate: (tab: string) => void;
  currentUser: any;
}

export default function Dashboard({ employees, leaves, plans, announcements, onNavigate, currentUser }: DashboardProps) {
  const isAdmin = currentUser.role === "Admin";
  const isHRHead = currentUser.role === "HR Head";
  const isHRAssociate = currentUser.role === "HR Associate";
  const isEmployee = currentUser.role === "Employee";

  const isHR = isAdmin || isHRHead || isHRAssociate;
  const isHRManagement = isAdmin || isHRHead;
  const isVP = false;
  const selfEmployee = employees.find(e => e.id === currentUser.id);

  // Stats calculations for HR
  const totalCount = employees.length;
  const activeCount = employees.filter(e => e.status === EmployeeStatus.ACTIVE).length;
  const onboardingCount = employees.filter(e => e.status === EmployeeStatus.ONBOARDING).length;
  const leaveCount = employees.filter(e => e.status === EmployeeStatus.LEAVE).length;

  const totalMonthlyPayroll = employees
    .filter(e => e.status !== EmployeeStatus.TERMINATED)
    .reduce((val, e) => val + (e.salary / 12), 0);

  const pendingLeavesCount = leaves.filter(l => l.status === LeaveStatus.PENDING).length;

  // Active benefits enrollment count
  const nonPendingPlans = employees.filter(e => e.benefitPlan !== "Pending Enrollment" && e.benefitPlan !== "").length;

  // Stats calculations for VP of Engineering
  const engEmployees = employees.filter(e => e.department === "Engineering");
  const engCount = engEmployees.length;
  const engActive = engEmployees.filter(e => e.status === EmployeeStatus.ACTIVE).length;
  const engOnboarding = engEmployees.filter(e => e.status === EmployeeStatus.ONBOARDING).length;
  const engLeaveCount = engEmployees.filter(e => e.status === EmployeeStatus.LEAVE).length;

  const engMonthlyPayroll = engEmployees
    .filter(e => e.status !== EmployeeStatus.TERMINATED)
    .reduce((val, e) => val + (e.salary / 12), 0);

  const engPendingLeavesCount = leaves.filter(l => l.status === LeaveStatus.PENDING && l.employeeDept === "Engineering").length;
  const engEnrolledCount = engEmployees.filter(e => e.benefitPlan !== "Pending Enrollment" && e.benefitPlan !== "").length;

  // Simple static historical analytics data for standard Recharts
  const chartData = [
    { name: "Jan 2026", Engineers: 38000, Ops: 18000, Marketing: 12000, Total: 68000 },
    { name: "Feb 2026", Engineers: 42000, Ops: 18000, Marketing: 15000, Total: 75000 },
    { name: "Mar 2026", Engineers: 44000, Ops: 22000, Marketing: 18000, Total: 84000 },
    { name: "Apr 2026", Engineers: 49000, Ops: 22000, Marketing: 18000, Total: 89000 },
    { name: "May 2026", Engineers: 55000, Ops: 25000, Marketing: 21000, Total: 101000 }
  ];

  // Up-to-date alert items depending on roles
  const getTasksByRole = () => {
    if (isHR) {
      return [
        {
          id: 1,
          title: "Approve impending Leave Requests",
          description: `${pendingLeavesCount} employee request(s) waiting for manager signoff.`,
          type: "warning",
          targetTab: "benefits",
          badge: `${pendingLeavesCount} Pending`
        },
        {
          id: 2,
          title: "May 2026 Payroll Cycle Open",
          description: "Approve mock deductions and issue final salaries across rosters.",
          type: "info",
          targetTab: "payroll",
          badge: "Action Required"
        },
        {
          id: 3,
          title: "Onboard Elijah Sterling",
          description: "Marked as 'Onboarding'. Benefit plan setup and accounts sync pending.",
          type: "success",
          targetTab: "employees",
          badge: "Onboarding"
        },
        {
          id: 4,
          title: "Optimize Shift Assignments",
          description: "Manage employee work calendars, shifts, and check daily attendance.",
          type: "success",
          targetTab: "shifts",
          badge: "Compliance Logs"
        }
      ];
    } else if (isVP) {
      return [
        {
          id: 1,
          title: "Approve Engineering Leaves",
          description: `${engPendingLeavesCount} developer schedule(s) awaiting department signoff.`,
          type: "warning",
          targetTab: "benefits",
          badge: `${engPendingLeavesCount} Pending`
        },
        {
          id: 2,
          title: "Conduct Engineering Review Cycles",
          description: "Align engineering goal metrics and track active developer streams with AI.",
          type: "info",
          targetTab: "advisory",
          badge: "Action Required"
        },
        {
          id: 3,
          title: "Developer Attendance & Check-Ins",
          description: "Analyze daily engineering team clock-in rates and active shift slots.",
          type: "success",
          targetTab: "shifts",
          badge: "Active Rosters"
        }
      ];
    } else {
      return [
        {
          id: 1,
          title: "Check Active Insurance Options",
          description: `Your active plan is "${selfEmployee?.benefitPlan || 'Pending Enrollment'}". View detailed premium coverage.`,
          type: "info",
          targetTab: "benefits",
          badge: "Personal"
        },
        {
          id: 2,
          title: "Model Future Time-Off Balance",
          description: "Use the interactive Accrual Predictor map to schedule upcoming vacations.",
          type: "success",
          targetTab: "benefits",
          badge: "Predictor"
        },
        {
          id: 3,
          title: "Clock Daily Work Shift",
          description: `Assigned shift: "${selfEmployee?.shiftId === 'SFT-2' ? 'Late Morning Shift' : selfEmployee?.shiftId === 'SFT-3' ? 'Night Shift' : selfEmployee?.shiftId === 'SFT-4' ? 'Weekend Support' : 'Standard Day Shift'}". Mark check-in.`,
          type: "warning",
          targetTab: "shifts",
          badge: "Duty Active"
        }
      ];
    }
  };

  const calculateSelf3MProjection = () => {
    if (!selfEmployee) return { remaining: 0, accrual: 0, projected: 0, upcomingCount: 0, upcomingDays: 0 };
    const remaining = selfEmployee.leavesTotal - selfEmployee.leavesUsed;
    const accrualRate = selfEmployee.leavesTotal / 12;
    const months = 3;
    const projectedAccrued = accrualRate * months;

    // Upcoming approved/pending leaves
    const upcomingLeaves = leaves.filter(r => 
      r.employeeId === selfEmployee.id && 
      r.status === LeaveStatus.APPROVED &&
      r.startDate >= "2026-05-20"
    );
    const approvedDays = upcomingLeaves.reduce((sum, r) => sum + r.totalDays, 0);
    const projectedFinal = Number((remaining + projectedAccrued - approvedDays).toFixed(1));

    return {
      remaining,
      accrual: Number(accrualRate.toFixed(2)),
      projected: projectedFinal,
      upcomingCount: upcomingLeaves.length,
      upcomingDays: approvedDays
    };
  };

  const tasks = getTasksByRole();
  const selfProj = calculateSelf3MProjection();

  if (!isHR && !isVP) {
    // Beatriz Vance or other standard employee
    const myNextLeaves = leaves.filter(l => l.employeeId === currentUser.id);
    return (
      <div className="space-y-8 animate-fade-in" id="hrms-dashboard">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
              My Self-Service Hub
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back, {currentUser.name}. Explore active coverage, track monthly compensation, and manage vacations.
            </p>
          </div>
        </div>

        {/* Grid of Key Stats Indicators for Standard Employee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Position Details */}
          <div className="bg-white border border-slate-200 p-6 rounded-lg transition-all shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">My Assignment</p>
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-750 text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Active
              </span>
            </div>
            <div className="mt-4">
              <span className="text-base font-bold text-slate-805 text-slate-900 block truncate">{currentUser.role}</span>
              <span className="text-xs text-slate-400 font-mono block mt-1">{currentUser.department}</span>
            </div>
          </div>

          {/* Card 2: Personal Earnings */}
          <div onClick={() => onNavigate("payroll")} className="bg-white border border-slate-200 p-6 rounded-lg cursor-pointer hover:border-indigo-305 hover:shadow-xs transition-all shadow-xs group">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">My Gross Base Salary</p>
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Monthly Rate
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-display font-bold text-slate-900 font-mono">
                ${selfEmployee ? (selfEmployee.salary / 12).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "0"}
              </span>
              <span className="text-xs text-slate-400">/mo</span>
            </div>
            <div className="mt-3.5 pt-3.5 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
              <span>Annual Contract: ${selfEmployee ? selfEmployee.salary.toLocaleString() : "0"}</span>
              <span className="text-indigo-600 font-semibold group-hover:underline text-[10.5px]">View Payslips &rarr;</span>
            </div>
          </div>

          {/* Card 3: Personal Benefits */}
          <div onClick={() => onNavigate("benefits")} className="bg-white border border-slate-200 p-6 rounded-lg cursor-pointer hover:border-indigo-305 hover:shadow-xs transition-all shadow-xs group">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">My Benefits plan</p>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                Enrolled
              </span>
            </div>
            <div className="mt-4">
              <span className="text-sm font-bold text-slate-800 block truncate">{selfEmployee?.benefitPlan || "Pending Enrollment"}</span>
              <span className="text-[11px] text-slate-450 block mt-1">Click to view corporate options</span>
            </div>
          </div>

          {/* Card 4: Leave Balances & Accrual */}
          <div onClick={() => onNavigate("benefits")} className="bg-white border border-slate-200 p-6 rounded-lg cursor-pointer hover:border-indigo-305 hover:shadow-xs transition-all shadow-xs group">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">My PTO Ballance</p>
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                Accruing Daily
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-slate-900 font-mono">{selfProj.remaining}</span>
              <span className="text-xs text-slate-400 font-mono">days of {selfEmployee?.leavesTotal || 15}</span>
            </div>
            <div className="mt-3.5 pt-3.5 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
              <span>Spent so far: {selfEmployee?.leavesUsed || 0} days</span>
              <span className="text-indigo-600 font-semibold group-hover:underline text-[10.5px]">Predictor tool &rarr;</span>
            </div>
          </div>

        </div>

        {/* Column layout: Leave details & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Vacation details with projections (2/3 width) */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 lg:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-display font-medium text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                My Leaves & Future PTO Accrual Balance Predictions
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                A customized analysis based on your annual allowance, monthly accumulation rate, and any upcoming scheduled leaves.
              </p>

              {/* Accrual projection card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div className="p-3 bg-white border border-slate-100 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase">Current PTO Remaining</span>
                  <span className="text-xl font-display font-bold text-slate-800 block mt-1.5">{selfProj.remaining} days</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase">Projected Accrual (3m)</span>
                  <span className="text-xl font-display font-bold text-emerald-600 block mt-1.5">+{selfProj.accrual * 3} days</span>
                  <span className="text-[9px] text-slate-400 block font-mono mt-0.5">Rate: +{selfProj.accrual} days/month</span>
                </div>
                <div className="p-3 bg-indigo-50/15 border border-indigo-150/60 rounded-lg">
                  <span className="text-[10px] font-mono text-indigo-600 block font-bold uppercase">Estimated PTO (3 months)</span>
                  <span className="text-xl font-display font-bold text-indigo-700 block mt-1.5">{selfProj.projected} days</span>
                  <span className="text-[9px] text-slate-500 block font-mono mt-0.5">Correct for upcoming approved stays</span>
                </div>
              </div>

              {/* Upcoming schedules */}
              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">My Upcoming Vacation Schedules</h4>
                {myNextLeaves.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-150 rounded-lg overflow-hidden">
                    {myNextLeaves.map(req => (
                      <div key={req.id} className="p-3 bg-white hover:bg-slate-50/20 flex justify-between items-center gap-4 text-xs">
                        <div>
                          <div className="font-semibold text-slate-850">{req.type} Vacation</div>
                          <div className="text-slate-400 font-mono text-[10.5px] mt-0.5">{req.startDate} to {req.endDate} ({req.totalDays} Days)</div>
                        </div>
                        <span className={`text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                          req.status === LeaveStatus.APPROVED ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          req.status === LeaveStatus.PENDING ? "bg-amber-50 text-amber-700 border-amber-100" :
                          "bg-rose-50 text-rose-700 border-rose-100"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 italic text-xs border border-dashed border-slate-205 rounded-lg bg-slate-50/40">
                    No active vacation schedules mapped.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center font-mono">
              <span>Calculated at: 2026-05-20</span>
              <button onClick={() => onNavigate("benefits")} className="text-indigo-600 hover:underline font-semibold font-sans">
                Predictor Panel &rarr;
              </button>
            </div>
          </div>

          {/* Quick Actions Ledger (1/3 width) */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
            <div>
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-lg font-display font-medium text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Self Service Actions
                </h3>
              </div>

              <div className="mt-4 space-y-3.5">
                <button
                  onClick={() => onNavigate("benefits")}
                  className="w-full p-4 border border-slate-150 hover:border-indigo-400 bg-slate-50/50 hover:bg-white text-left rounded-xl transition-all cursor-pointer group"
                >
                  <span className="text-[10px] uppercase font-mono text-indigo-600 font-bold tracking-wider block mb-1">Time-Off</span>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Request Personal PTO</h4>
                  <p className="text-xs text-slate-550 leading-relaxed mt-1 text-slate-400">Book personal vacation dates or log medical records.</p>
                </button>

                <button
                  onClick={() => onNavigate("payroll")}
                  className="w-full p-4 border border-slate-150 hover:border-indigo-400 bg-slate-50/50 hover:bg-white text-left rounded-xl transition-all cursor-pointer group"
                >
                  <span className="text-[10px] uppercase font-mono text-emerald-600 font-bold tracking-wider block mb-1">Invoices</span>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">View Payslips & Invoices</h4>
                  <p className="text-xs text-slate-550 leading-relaxed mt-1 text-slate-400">Inspect gross base monthly outputs, federal tax records, and generate PDF invoices.</p>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[10.5px] font-mono text-slate-400">
              Role: Standard Contributor
            </div>
          </div>

        </div>

        {/* Company Announcements Row */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-600" />
              <span className="text-lg font-display font-medium text-slate-900">
                Latest Company Announcements
              </span>
            </div>
            <button
              onClick={() => onNavigate("announcements")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-850 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              All Bulletins &rarr;
            </button>
          </div>

          {announcements.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4 font-medium">No announcements published yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {announcements
                .slice(0, 3)
                .map((ann) => {
                  const isUrgent = ann.category === "Urgent";
                  return (
                    <div 
                      key={ann.id} 
                      className={`p-4 border rounded-lg flex flex-col justify-between transition-all hover:border-slate-300 hover:shadow-2xs relative ${
                        isUrgent 
                          ? "border-rose-200 bg-rose-50/10" 
                          : ann.important
                            ? "border-indigo-150 bg-indigo-50/5"
                            : "border-slate-200 bg-slate-50/10"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            ann.category === "Urgent" ? "bg-rose-100 text-rose-700 font-bold" :
                            ann.category === "Policy" ? "bg-indigo-100 text-indigo-700 font-bold" :
                            ann.category === "Event" ? "bg-amber-100 text-amber-700 font-bold" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {ann.category}
                          </span>
                        </div>
                        
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 block leading-snug">
                          {ann.title}
                        </h4>
                        <p className="text-xs text-slate-505 mt-1.5 line-clamp-3 leading-relaxed font-sans">
                          {ann.content}
                        </p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>By: {ann.postedBy.split(" ")[0]}</span>
                        <span>{ann.datePosted}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

      </div>
    );
  }

  const headcountTrendData = [
    { month: "Aug 2025", Count: 15 },
    { month: "Oct 2025", Count: 15 },
    { month: "Dec 2025", Count: 15 },
    { month: "Feb 2026", Count: 15 },
    { month: "Apr 2026", Count: 15 },
    { month: "Jun 2026", Count: 14 }
  ];

  const attritionData = [
    { name: "Jul", Joiners: 0, Exits: 0 },
    { name: "Aug", Joiners: 0, Exits: 0 },
    { name: "Sep", Joiners: 0, Exits: 0 },
    { name: "Oct", Joiners: 0, Exits: 0 },
    { name: "Nov", Joiners: 0, Exits: 0 },
    { name: "Dec", Joiners: 0, Exits: 0 },
    { name: "Jan", Joiners: 0, Exits: 0 },
    { name: "Feb", Joiners: 0, Exits: 0 },
    { name: "Mar", Joiners: 0, Exits: 0 },
    { name: "Apr", Joiners: 0, Exits: 0 },
    { name: "May", Joiners: 0, Exits: 1 },
    { name: "Jun", Joiners: 0, Exits: 0 }
  ];

  const departments = employees.reduce((acc: Record<string, number>, emp) => {
    const dept = emp.department || "No Department";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const departmentData = Object.entries(departments).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899", "#06b6d4"];

  const activityLogs = [
    { id: 1, action: "LOGIN on user #1", user: "Arjun Sharma", date: "20 May 2026, 06:16 pm" },
    { id: 2, action: "CREATE on employee #7", user: "Arjun Sharma", date: "20 May 2026, 06:16 pm" },
    { id: 3, action: "APPROVE on leave_request #1", user: "Arjun Sharma", date: "20 May 2026, 06:16 pm" },
    { id: 4, action: "APPROVE on leave_request #2", user: "Arjun Sharma", date: "20 May 2026, 06:16 pm" },
    { id: 5, action: "UPDATE on employee #23", user: "Arjun Sharma", date: "19 May 2026, 04:30 pm" },
    { id: 6, action: "CREATE on announcement #3", user: "Arjun Sharma", date: "19 May 2026, 02:15 pm" },
    { id: 7, action: "LOGIN on user #2", user: "Beatriz Vance", date: "18 May 2026, 09:00 am" }
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="hrms-dashboard">
      
      {/* Title Segment */}
      <div>
        <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
          Dashboard
        </h1>
        <p className="text-sm text-slate-400 font-medium">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Row 1 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
        
        {/* Total Employees */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[26px] font-bold text-slate-800 leading-none">
              {totalCount}
            </span>
            <div className="p-2 bg-blue-50/50 rounded-lg text-blue-600">
              <Users className="w-[18px] h-[18px]" />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">
            Total Employees
          </span>
        </div>

        {/* Active */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[26px] font-bold text-slate-800 leading-none">
              {activeCount}
            </span>
            <div className="p-2 bg-emerald-50/50 rounded-lg text-emerald-600">
              <UserCheck className="w-[18px] h-[18px]" />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">
            Active
          </span>
        </div>

        {/* On Leave Today */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[26px] font-bold text-slate-800 leading-none">
              {leaveCount}
            </span>
            <div className="p-2 bg-orange-50/50 rounded-lg text-orange-600">
              <Calendar className="w-[18px] h-[18px]" />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">
            On Leave Today
          </span>
        </div>

        {/* Open Positions */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[26px] font-bold text-slate-800 leading-none">
              6
            </span>
            <div className="p-2 bg-purple-50/50 rounded-lg text-purple-600">
              <Plus className="w-[18px] h-[18px]" />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">
            Open Positions
          </span>
        </div>

        {/* Pending Leave Request */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[110px] cursor-pointer hover:border-blue-100 transition-all" onClick={() => onNavigate("benefits")}>
          <div className="flex justify-between items-start">
            <span className="text-[26px] font-bold text-slate-800 leading-none">
              {pendingLeavesCount}
            </span>
            <div className="p-2 bg-rose-50/50 rounded-lg text-rose-600 animate-pulse">
              <FileText className="w-[18px] h-[18px]" />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">
            Pending Leave
          </span>
        </div>

      </div>

      {/* Row 2 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
        
        {/* Monthly Payroll */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[110px] cursor-pointer hover:border-blue-100 transition-all" onClick={() => onNavigate("payroll")}>
          <div className="flex justify-between items-start">
            <span className="text-[19px] sm:text-[21px] font-bold text-slate-800 leading-none truncate">
              ₹1,26,500,000
            </span>
            <div className="p-2 bg-teal-50/50 rounded-lg text-teal-600 shrink-0">
              <DollarSign className="w-[18px] h-[18px]" />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2 pr-1 truncate">
            Monthly Payroll
          </span>
        </div>

        {/* Upcoming Exits */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[26px] font-bold text-slate-800 leading-none">
              1
            </span>
            <div className="p-2 bg-rose-50/50 rounded-lg text-rose-550">
              <UserX className="w-[18px] h-[18px]" />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">
            Upcoming Exits
          </span>
        </div>

        {/* New This Month */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[26px] font-bold text-slate-800 leading-none">
              0
            </span>
            <div className="p-2 bg-green-50/50 rounded-lg text-green-600">
              <UserPlus className="w-[18px] h-[18px]" />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">
            New This Month
          </span>
        </div>

        {/* Payroll Approvals */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[26px] font-bold text-slate-800 leading-none">
              0
            </span>
            <div className="p-2 bg-amber-50/50 rounded-lg text-amber-600">
              <FileCheck className="w-[18px] h-[18px]" />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">
            Payroll Approvals
          </span>
        </div>

        {/* Open Tickets */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[26px] font-bold text-slate-800 leading-none">
              3
            </span>
            <div className="p-2 bg-indigo-50/50 rounded-lg text-indigo-600">
              <Headphones className="w-[18px] h-[18px]" />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">
            Open Tickets
          </span>
        </div>

      </div>

      {/* Row 3 - Charts: Headcount Trend & Dept Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Headcount Trend area chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 lg:col-span-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800 tracking-tight leading-none">
              Headcount Trend
            </h3>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">
              Active company strength over trailing months
            </span>
          </div>

          <div className="mt-6 flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={headcountTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 16]} ticks={[0, 4, 8, 12, 16]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0f172a", color: "#f8fafc", borderRadius: "10px", fontSize: "11px", border: "none" }} />
                <Area type="monotone" dataKey="Count" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dept Breakdown Pie Donut chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800 tracking-tight leading-none">
              Dept Breakdown
            </h3>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">
              Distribution of talent by department
            </span>
          </div>

          <div className="mt-4 flex-1 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Profile(s)`, "Total"]} contentStyle={{ background: "#0f172a", color: "#f8fafc", borderRadius: "10px", fontSize: "11px", border: "none" }} />
              </PieChart>
            </ResponsiveContainer>

            {/* Dynamic visual legend matching mockup */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-4 text-[11px] font-medium max-h-[90px] overflow-y-auto pr-1">
              {departmentData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-500 truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Row 4 - Charts: Attrition vs Joiners & Recent Activity logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attrition vs Joiners column bar chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 lg:col-span-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800 tracking-tight leading-none">
              Attrition vs Joiners
            </h3>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">
              Monthly recruitment arrivals and transition departures
            </span>
          </div>

          <div className="mt-6 flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={attritionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 1.2]} ticks={[0, 0.4, 0.8, 1.2]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0f172a", color: "#f8fafc", borderRadius: "10px", fontSize: "11px", border: "none" }} />
                <Legend verticalAlign="bottom" height={36} iconType="rect" align="center" formatter={(value) => <span className="text-xs text-slate-500 font-semibold">{value}</span>} />
                <Bar dataKey="Joiners" fill="#10b981" radius={[3, 3, 0, 0]} barSize={20} />
                <Bar dataKey="Exits" fill="#ef4444" radius={[3, 3, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity logs matches mockup layout with dark grey track scrollbar */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[350px]">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="text-[15px] font-bold text-slate-800 tracking-tight leading-none flex items-center gap-1.5">
              <Activity className="w-[15px] h-[15px] text-slate-500" />
              <span>Recent Activity</span>
            </h3>
            <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
              Live Feed
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[290px] pr-1.5 divide-y divide-slate-100 mt-4 custom-scrollbar">
            {activityLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col gap-1 first:pt-0 last:pb-0">
                <span className="text-xs font-bold text-slate-755 tracking-tight leading-snug">
                  {log.action}
                </span>
                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-medium">
                  <span>{log.user}</span>
                  <span>•</span>
                  <span>{log.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Styled announcements row at bottom */}
      {announcements.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Active Broadcasts</h3>
            <span className="text-[10px] text-indigo-600 font-medium cursor-pointer hover:underline" onClick={() => onNavigate("announcements")}>View All</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {announcements.slice(0, 3).map((ann) => (
              <div key={ann.id} className="p-4 rounded-xl border border-slate-50 bg-slate-50/20 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 uppercase">
                    {ann.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 mt-2 line-clamp-1">{ann.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{ann.content}</p>
                </div>
                <div className="mt-3 text-[9px] text-slate-400 flex justify-between font-mono pt-2 border-t border-slate-50">
                  <span>{ann.postedBy.split(" ")[0]}</span>
                  <span>{ann.datePosted}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corporate Compliance Advisor prompt row */}
      <div className="bg-[#eff6ff] border border-blue-50 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h4 className="font-display font-bold text-blue-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
              <span>India Payroll & Corporate Policy Consultant Active</span>
            </h4>
            <p className="text-xs text-blue-700/80 leading-relaxed max-w-2xl font-medium">
              Validate employment contracts, consult real HR-PAY-031 guidelines, inspect specific compensation rules, or research Indian government benefit metrics on-demand using the HR AI Advisor Hub.
            </p>
          </div>
          <button
            onClick={() => onNavigate("advisory")}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-bold transition-all shadow-md shadow-blue-900/10 shrink-0 cursor-pointer"
          >
            Ask Workspace Copilot
          </button>
        </div>
      </div>

    </div>
  );
}
