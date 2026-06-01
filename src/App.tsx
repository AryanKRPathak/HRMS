import React, { useState, useEffect } from "react";
import { 
  Users, 
  DollarSign, 
  Heart, 
  Sparkles, 
  LayoutDashboard, 
  Building2, 
  ShieldAlert, 
  Menu, 
  X,
  Clock,
  User,
  Settings,
  Megaphone,
  LogOut,
  Bell,
  Briefcase,
  Calendar,
  Layers,
  Activity,
  Headphones,
  FileText,
  CreditCard,
  Network
} from "lucide-react";

import { 
  Employee, 
  EmployeeStatus, 
  BenefitPlan, 
  LeaveRequest, 
  LeaveStatus, 
  PayrollRun,
  Announcement,
  Shift,
  AttendanceRecord,
  getEmployeeAvatar
} from "./types";

import { 
  INITIAL_EMPLOYEES, 
  INITIAL_BENEFIT_PLANS, 
  INITIAL_LEAVE_REQUESTS, 
  INITIAL_PAYROLL_RUNS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_SHIFTS,
  INITIAL_ATTENDANCE
} from "./initialData";

import Dashboard from "./components/Dashboard";
import EmployeeDirectory from "./components/EmployeeDirectory";
import PayrollManager from "./components/PayrollManager";
import BenefitsManager from "./components/BenefitsManager";
import HRAssistance from "./components/HRAssistance";
import AnnouncementsManager from "./components/AnnouncementsManager";
import TimeShiftsManager from "./components/TimeShiftsManager";
import Login from "./components/Login";
import AICopilotFloatingWidget from "./components/AICopilotFloatingWidget";
import RecruitmentManager from "./components/RecruitmentManager";
import OnboardingManager from "./components/OnboardingManager";
import OffboardingManager from "./components/OffboardingManager";
import CRMManager from "./components/CRMManager";
import AuditLogsManager from "./components/AuditLogsManager";

export default function App() {
  // Global Persisted States
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem("hrms_employees");
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [benefitPlans] = useState<BenefitPlan[]>(INITIAL_BENEFIT_PLANS);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem("hrms_leaves");
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => {
    const saved = localStorage.getItem("hrms_payroll_runs");
    return saved ? JSON.parse(saved) : INITIAL_PAYROLL_RUNS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem("hrms_announcements");
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem("hrms_shifts");
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem("hrms_attendance");
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [activeTab, setActiveTab ] = useState<string>(() => {
    return localStorage.getItem("hrms_active_tab") || "dashboard";
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("hrms_sidebar_collapsed");
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("hrms_sidebar_collapsed", JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // JWT Authentication States
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("hrms_token") || null;
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem("hrms_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (user: any, jwtToken: string) => {
    setToken(jwtToken);
    setCurrentUser(user);
    localStorage.setItem("hrms_token", jwtToken);
    localStorage.setItem("hrms_user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem("hrms_token");
    localStorage.removeItem("hrms_user");
  };

  // Sync state changes to storage
  useEffect(() => {
    localStorage.setItem("hrms_employees", JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem("hrms_leaves", JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem("hrms_payroll_runs", JSON.stringify(payrollRuns));
  }, [payrollRuns]);

  useEffect(() => {
    localStorage.setItem("hrms_announcements", JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem("hrms_shifts", JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem("hrms_attendance", JSON.stringify(attendance));
  }, [attendance]);

  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem("hrms_audit_logs");
    if (saved) return JSON.parse(saved);
    return [
      { id: "log-1", timestamp: "20 May 2026, 06:16 pm", actor: "Arjun Sharma", action: "LOGIN", entity: "User", entityId: "#1", ipAddress: "192.168.1.100" },
      { id: "log-2", timestamp: "20 May 2026, 06:16 pm", actor: "Arjun Sharma", action: "CREATE", entity: "Employee", entityId: "#7", ipAddress: "192.168.1.100" },
      { id: "log-3", timestamp: "20 May 2026, 06:16 pm", actor: "Arjun Sharma", action: "APPROVE", entity: "Leave Request", entityId: "#1", ipAddress: "192.168.1.100" },
      { id: "log-4", timestamp: "20 May 2026, 06:16 pm", actor: "Arjun Sharma", action: "APPROVE", entity: "Leave Request", entityId: "#2", ipAddress: "192.168.1.100" },
      { id: "log-5", timestamp: "20 May 2026, 06:16 pm", actor: "Arjun Sharma", action: "APPROVE", entity: "Payroll Run", entityId: "#1", ipAddress: "192.168.1.100" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("hrms_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  const handleAddAuditLog = (action: string, entity: string, entityId: string) => {
    const timestampStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).toLowerCase() + "m";

    const newLog = {
      id: `log-${Math.floor(Math.random() * 100000)}`,
      timestamp: timestampStr,
      actor: currentUser?.name || "System",
      action,
      entity,
      entityId: entityId.startsWith("#") ? entityId : `#${entityId}`,
      ipAddress: "192.168.1.100"
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    localStorage.setItem("hrms_active_tab", activeTab);
  }, [activeTab]);

  // JWT Authentication Guard
  if (!token || !currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // CRUD Operations: Employee Records
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees(prev => [newEmp, ...prev]);
  };

  const handleUpdateEmployee = (updatedEmp: Employee, originalId?: string) => {
    const idToMatch = originalId || updatedEmp.id;
    setEmployees(prev => prev.map(e => e.id === idToMatch ? updatedEmp : e));

    // Keep leave requests referenced if the ID changed
    if (originalId && originalId !== updatedEmp.id) {
      setLeaveRequests(prev => prev.map(leave => 
        leave.employeeId === originalId 
          ? { ...leave, employeeId: updatedEmp.id }
          : leave
      ));
    }
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm("Are you sure you want to terminate/delete this employee record?")) {
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: EmployeeStatus.TERMINATED } : e));
    }
  };

  // Approval Operations: Leave Requests
  const handleApproveLeave = (id: string) => {
    setLeaveRequests(prev => prev.map(req => {
      if (req.id === id) {
        // Increment employee leavesUsed pool
        setEmployees(empPrev => empPrev.map(emp => {
          if (emp.id === req.employeeId) {
            return {
              ...emp,
              leavesUsed: Math.min(emp.leavesTotal, emp.leavesUsed + req.totalDays)
            };
          }
          return emp;
        }));
        return { ...req, status: LeaveStatus.APPROVED };
      }
      return req;
    }));
  };

  const handleRejectLeave = (id: string) => {
    setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status: LeaveStatus.REJECTED } : req));
  };

  const handleAddLeaveRequest = (req: LeaveRequest) => {
    setLeaveRequests(prev => [req, ...prev]);
  };

  // Add Payroll Run Cycle
  const handleAddPayrollRun = (run: PayrollRun) => {
    setPayrollRuns(prev => [run, ...prev]);
  };

  // CRUD Operations: Announcements Center
  const handleAddAnnouncement = (ann: Announcement) => {
    setAnnouncements(prev => [ann, ...prev]);
  };

  const handleUpdateAnnouncement = (updated: Announcement) => {
    setAnnouncements(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // Operations: Time Shifts & Attendance
  const handleAddShift = (newShift: Shift) => {
    setShifts(prev => [...prev, newShift]);
  };

  const handleUpdateShift = (updatedShift: Shift) => {
    setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
  };

  const handleDeleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  const handleAddAttendance = (rec: AttendanceRecord) => {
    setAttendance(prev => [rec, ...prev]);
  };

  const handleUpdateAttendance = (updatedRec: AttendanceRecord) => {
    setAttendance(prev => prev.map(r => r.id === updatedRec.id ? updatedRec : r));
  };

  const handleUpdateEmployeeShift = (empId: string, shiftId: string) => {
    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, shiftId } : e));
  };

  // Core navigation configurations with Role-Based Access Control
  const isSuperAdmin = currentUser.role === "Super Admin";
  const isAdmin = currentUser.role === "Admin" || isSuperAdmin;
  const isHRHead = currentUser.role === "HR Head" || isSuperAdmin;
  const isHRAssociate = currentUser.role === "HR Associate";
  const isEmployee = currentUser.role === "Employee";

  const rawNavigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "employees", label: isEmployee ? "My Profile" : "Employees", icon: Users },
    { id: "shifts", label: isEmployee ? "My Shift & Check-In" : "Attendance", icon: Clock },
    { id: "benefits", label: isEmployee ? "My Leaves & Benefits" : "Leave", icon: Calendar },
    { id: "payroll", label: (isEmployee || isHRAssociate) ? "My Paystubs" : "Payroll", icon: DollarSign },
    { id: "recruitment", label: "Recruitment", icon: Users, roles: ["Super Admin", "Admin", "HR Head", "HR Associate"] },
    { id: "onboarding", label: "Onboarding", icon: Layers, roles: ["Super Admin", "Admin", "HR Head", "HR Associate"] },
    { id: "offboarding", label: "Offboarding", icon: LogOut, roles: ["Super Admin", "Admin", "HR Head", "HR Associate"] },
    { id: "crm", label: "CRM", icon: Headphones },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "audit_logs", label: "Audit Logs", icon: FileText, roles: ["Super Admin", "Admin", "HR Head"] },
    { id: "advisory", label: "AI Advisor Hub", icon: Sparkles },
  ];

  const navigationItems = rawNavigationItems.filter(item => {
    if (item.id === "employees" && isEmployee) {
      return false; // Remove "My Profile" tab from navigation sidebar
    }
    if (item.roles) {
      return item.roles.includes(currentUser.role);
    }
    return true;
  });

  const displayTab = navigationItems.some(item => item.id === activeTab) ? activeTab : "dashboard";

  const handleTabNavigate = (tabId: string, isPlaceholder?: boolean) => {
    const isPermitted = navigationItems.some(n => n.id === tabId);
    if (!isPermitted) {
      triggerToast(`Access Denied: You do not have permission to access the "${tabId}" module.`);
      return;
    }
    if (isPlaceholder) {
      triggerToast(`"${navigationItems.find(n => n.id === tabId)?.label}" is currently a preview placeholder in the NexaHR sandbox.`);
      return;
    }
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const currentPageTitle = navigationItems.find(item => item.id === displayTab)?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex overflow-hidden font-sans relative" id="hrms-workspace">
      
      {/* Absolute Beautiful Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-55 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-750 flex items-center gap-2 animate-fade-in no-print">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          {toastMessage}
        </div>
      )}

      {/* Left static Sidebar layout (hidden on mobile) */}
      <aside className={`hidden md:flex flex-col ${isSidebarCollapsed ? 'w-[78px] p-3' : 'w-[260px] p-5'} bg-[#0f172a] text-slate-300 shrink-0 justify-between no-print h-screen overflow-y-auto transition-all duration-300`}>
        
        <div className="space-y-6">
          {/* Top branding mockup */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full px-0' : 'gap-3 px-2'} py-1 transition-all duration-300`}>
            <span className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-900/10 flex items-center justify-center leading-none">
              <Building2 className="w-5 h-5 animate-fade-in" />
            </span>
            {!isSidebarCollapsed && (
              <div className="animate-fade-in">
                <span className="font-display font-extrabold text-white tracking-wide block text-base leading-tight">NexaHR</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide block leading-none mt-1">Enterprise Edition</span>
              </div>
            )}
          </div>

          <div className="h-[1px] bg-slate-800/80 w-full" />

          {/* Nav List */}
          <nav className="space-y-1 w-full">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabNavigate(item.id)}
                  title={item.label}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3.5 px-4 py-2.5'} rounded-lg font-medium text-xs tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? "bg-blue-600 text-white font-semibold shadow-sm" 
                      : "text-slate-400 hover:bg-slate-800/45 hover:text-white"
                  }`}
                >
                  <Icon className={`w-[16px] h-[16px] shrink-0 ${isActive ? 'text-white' : 'text-slate-450 group-hover:text-white'}`} />
                  {!isSidebarCollapsed && <span className="animate-fade-in truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar current user profile footer matching the mockup */}
        <div className={`border-t border-slate-800 pt-4 mt-6 flex ${isSidebarCollapsed ? 'flex-col gap-3 items-center' : 'items-center justify-between'} no-print transition-all duration-300`}>
          <div 
            onClick={() => setIsProfileDrawerOpen(true)}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'} w-full cursor-pointer hover:bg-slate-800/40 p-1.5 rounded-xl transition-all`}
            title="View your registered profile details"
          >
            <div 
              className="w-[38px] h-[38px] rounded-full overflow-hidden bg-blue-600 border border-blue-500/35 flex items-center justify-center text-white font-extrabold text-xs shadow-sm uppercase shrink-0"
            >
              <img 
                src={getEmployeeAvatar(currentUser.name)} 
                alt={currentUser.name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              {currentUser.name.split(" ").map((n: string) => n[0]).join("")}
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate pr-1 animate-fade-in">
                <span className="text-xs font-bold text-white block leading-tight truncate max-w-[130px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 block leading-none mt-1 truncate max-w-[130px]">
                  {currentUser.role}
                </span>
              </div>
            )}
          </div>
          
          {!isSidebarCollapsed && (
            <button 
              type="button"
              onClick={handleLogout}
              title="Secure Logout"
              className="p-1.5 text-slate-400 hover:text-rose-450 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0 animate-fade-in"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

      </aside>

      {/* Right Canvas: Header + Scrollable content panel */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header navbar corresponding to mockup design */}
        <header className="bg-white border-b border-slate-100 h-16 shrink-0 flex items-center px-6 md:px-8 justify-between z-30 no-print">
          
          {/* Left aligned: Hamburger + Title */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                } else {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }
              }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center justify-center transition-all duration-205"
              title="Toggle Sidebar"
            >
              <Menu className="w-[18px] h-[18px]" />
            </button>
            <h2 className="text-slate-800 font-semibold text-[15px] font-sans">
              {currentPageTitle}
            </h2>
          </div>

          {/* Right aligned: Notifications, Time info, Profile initials */}
          <div className="flex items-center gap-4">
            
            {/* Clock context details / UTC date (extremely clean layout) */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium text-slate-400 font-mono">
              <span className="bg-slate-50 hover:bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sandbox Run Active</span>
              </span>
            </div>

            {/* Notification triggers matching mockup design */}
            <div className="relative cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-all">
              <Bell className="w-[18px] h-[18px] text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-550 bg-red-650 bg-rose-650 bg-rose-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none">
                3
              </span>
            </div>

            {/* Current user photo / initials circular block */}
            <div 
              onClick={() => setIsProfileDrawerOpen(true)}
              className="w-[34px] h-[34px] rounded-full overflow-hidden border border-blue-200 cursor-pointer shadow-xs shrink-0 flex items-center justify-center bg-blue-600 font-extrabold text-[11px] text-white hover:ring-2 hover:ring-blue-100 transition-all uppercase"
              title="View your registered profile details"
            >
              <img 
                src={getEmployeeAvatar(currentUser.name)} 
                alt={currentUser.name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              {currentUser.name.split(" ").map((n: string) => n[0]).join("")}
            </div>

          </div>

        </header>

        {/* Scrollable Work canvas frame */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-6 md:p-8">
          {displayTab === "dashboard" && (
            <Dashboard 
              employees={employees} 
              leaves={leaveRequests} 
              plans={benefitPlans} 
              announcements={announcements}
              onNavigate={handleTabNavigate} 
              currentUser={currentUser}
            />
          )}

          {displayTab === "employees" && (
            <EmployeeDirectory 
              employees={employees} 
              benefitPlans={benefitPlans.map(b => b.name)} 
              onAddEmployee={handleAddEmployee} 
              onUpdateEmployee={handleUpdateEmployee} 
              onDeleteEmployee={handleDeleteEmployee} 
              currentUser={currentUser}
            />
          )}

          {displayTab === "payroll" && (
            <PayrollManager 
              employees={employees} 
              payrollRuns={payrollRuns} 
              onAddRun={handleAddPayrollRun} 
              currentUser={currentUser}
            />
          )}

          {displayTab === "benefits" && (
            <BenefitsManager 
              benefitPlans={benefitPlans} 
              leaveRequests={leaveRequests} 
              employees={employees} 
              onApproveLeave={handleApproveLeave} 
              onRejectLeave={handleRejectLeave} 
              onAddLeaveRequest={handleAddLeaveRequest} 
              currentUser={currentUser}
            />
          )}

          {displayTab === "shifts" && (
            <TimeShiftsManager 
              employees={employees}
              shifts={shifts}
              attendance={attendance}
              onAddShift={handleAddShift}
              onUpdateShift={handleUpdateShift}
              onDeleteShift={handleDeleteShift}
              onAddAttendance={handleAddAttendance}
              onUpdateAttendance={handleUpdateAttendance}
              onUpdateEmployeeShift={handleUpdateEmployeeShift}
              currentUser={currentUser}
            />
          )}

          {displayTab === "announcements" && (
            <AnnouncementsManager 
              announcements={announcements}
              onAddAnnouncement={handleAddAnnouncement}
              onUpdateAnnouncement={handleUpdateAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              currentUser={currentUser}
            />
          )}

          {displayTab === "recruitment" && (
            <RecruitmentManager 
              currentUser={currentUser} 
              onNavigate={handleTabNavigate} 
              onAddAuditLog={handleAddAuditLog} 
            />
          )}

          {displayTab === "onboarding" && (
            <OnboardingManager 
              currentUser={currentUser} 
              employees={employees} 
              onNavigate={handleTabNavigate} 
              onAddAuditLog={handleAddAuditLog} 
            />
          )}

          {displayTab === "offboarding" && (
            <OffboardingManager 
              currentUser={currentUser} 
              employees={employees} 
              onNavigate={handleTabNavigate} 
              onAddAuditLog={handleAddAuditLog} 
            />
          )}

          {displayTab === "crm" && (
            <CRMManager 
              currentUser={currentUser} 
              onNavigate={handleTabNavigate} 
              onAddAuditLog={handleAddAuditLog} 
            />
          )}

          {displayTab === "audit_logs" && (
            <AuditLogsManager 
              currentUser={currentUser} 
              auditLogs={auditLogs} 
              onClearLogs={handleClearAuditLogs} 
            />
          )}

          {displayTab === "advisory" && (
            <HRAssistance 
              employees={employees} 
              currentUser={currentUser}
              onNavigate={handleTabNavigate}
            />
          )}
        </main>

        <AICopilotFloatingWidget 
          employees={employees} 
          currentUser={currentUser} 
          onNavigate={handleTabNavigate} 
        />

      </div>

      {/* Mobile Drawer Overlay specifically for layouts */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 md:hidden no-print" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-[#0f172a] h-full w-[260px] p-5 flex flex-col justify-between border-r border-slate-800" onClick={(e) => e.stopPropagation()}>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-blue-600 rounded-lg text-white shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </span>
                  <span className="font-display font-black text-white text-base">NexaHR</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 cursor-pointer hover:bg-slate-800 rounded">
                  <X className="w-5 h-5 text-slate-400 hover:text-white" />
                </button>
              </div>
              
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabNavigate(item.id)}
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg font-medium text-xs tracking-wide transition-all cursor-pointer ${
                        isActive 
                          ? "bg-blue-600 text-white font-semibold" 
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-405'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 bg-slate-800/40 border border-slate-805 rounded-lg text-xs text-slate-300 flex justify-between items-center">
              <span className="truncate mr-2 font-semibold">{currentUser.name}</span>
              <button 
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1 text-[11px] bg-rose-650/10 hover:bg-rose-650 text-rose-450 hover:text-white border border-rose-500/20 rounded-md transition-all font-bold uppercase shrink-0"
              >
                Logout
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
