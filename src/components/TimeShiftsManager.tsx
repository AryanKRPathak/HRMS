import React, { useState, useEffect } from "react";
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Plus, 
  Users, 
  Sliders, 
  Briefcase, 
  Search, 
  Filter, 
  Sparkles,
  ChevronRight,
  LogIn,
  LogOut,
  Settings,
  FileSpreadsheet
} from "lucide-react";
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip
} from "recharts";
import { Employee, Shift, AttendanceRecord, EmployeeStatus, getEmployeeAvatar } from "../types";

interface TimeShiftsManagerProps {
  employees: Employee[];
  shifts: Shift[];
  attendance: AttendanceRecord[];
  onAddShift: (shift: Shift) => void;
  onUpdateShift: (shift: Shift) => void;
  onDeleteShift: (id: string) => void;
  onAddAttendance: (record: AttendanceRecord) => void;
  onUpdateAttendance: (record: AttendanceRecord) => void;
  onUpdateEmployeeShift: (employeeId: string, shiftId: string) => void;
  currentUser: any;
}

export default function TimeShiftsManager({
  employees,
  shifts,
  attendance,
  onAddShift,
  onUpdateShift,
  onDeleteShift,
  onAddAttendance,
  onUpdateAttendance,
  onUpdateEmployeeShift,
  currentUser
}: TimeShiftsManagerProps) {
  const isAdmin = currentUser.role === "Admin";
  const isHRHead = currentUser.role === "HR Head";
  const isHRAssociate = currentUser.role === "HR Associate";
  const isEmployee = currentUser.role === "Employee";

  const isHR = isAdmin || isHRHead || isHRAssociate;
  const isVP = false;
  const hasAccess = isHR;

  // Helper to generate 3-month presenteeism trend heatmap data
  const generateHeatmapData = () => {
    const data = [];
    const today = new Date("2026-05-22"); // Base tracking date anchor
    
    // Fall back to clean Sunday starting position 12 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 12 * 7);
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay); // Roll back to Sunday
    
    const activeEmps = employees.filter(e => e.status !== EmployeeStatus.TERMINATED);
    const activeCount = activeEmps.length || 5;

    for (let w = 0; w < 13; w++) {
      for (let d = 0; d < 7; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (w * 7) + d);
        
        const dateStr = currentDate.toISOString().split("T")[0];
        const isWeekend = d === 0 || d === 6;
        
        // Find existing logs for this date
        const listForDate = attendance.filter(r => r.date === dateStr);
        const presentCount = listForDate.filter(r => r.status === "Present" || r.status === "Late" || r.status === "Half Day").length;
        
        let presenteeismRate = 0;
        if (listForDate.length > 0) {
          presenteeismRate = Math.round((presentCount / activeCount) * 100);
        } else {
          // Heatmap baseline color simulation for high-fidelity rendering
          if (isWeekend) {
            presenteeismRate = Math.random() > 0.95 ? 15 : 0;
          } else {
            // Monday blues or Friday standard offsets
            let dayOffset = 0;
            if (d === 1) dayOffset = -4; 
            if (d === 5) dayOffset = -8; 
            
            const hash = dateStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const variation = (hash % 12) + dayOffset;
            presenteeismRate = 86 + variation;
          }
        }
        
        presenteeismRate = Math.min(100, Math.max(0, presenteeismRate));
        
        data.push({
          x: w,
          y: d,
          value: presenteeismRate,
          date: dateStr,
          isWeekend,
          presentCount: listForDate.length > 0 ? presentCount : Math.round((presenteeismRate / 100) * activeCount),
          totalEmployeeCount: activeCount,
          formattedDate: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          dayName: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]
        });
      }
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  // Return month label for a week index in the last 12 weeks
  const getMonthTickLabel = (wkIndex: number) => {
    const today = new Date("2026-05-22");
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 12 * 7);
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);
    
    const weekDate = new Date(startDate);
    weekDate.setDate(startDate.getDate() + wkIndex * 7);
    
    return weekDate.toLocaleDateString("en-US", { month: "short" });
  };

  const getMonthTickLabelFiltered = (wkIndex: number) => {
    const currentMonthLabel = getMonthTickLabel(wkIndex);
    if (wkIndex === 0) return currentMonthLabel;
    
    const prevMonthLabel = getMonthTickLabel(wkIndex - 1);
    if (currentMonthLabel !== prevMonthLabel) {
      return currentMonthLabel;
    }
    return "";
  };

  const renderHeatmapCell = (props: any) => {
    const { cx, cy, payload } = props;
    const value = payload.value;
    const isWeekend = payload.isWeekend;
    
    let fill = "#cbd5e1"; 
    if (isWeekend) {
      fill = "#f8fafc"; // Very clean soft neutral for weekend blocks
    } else if (value === 0) {
      fill = "#f1f5f9"; 
    } else if (value < 40) {
      fill = "#fee2e2"; // Warning Rose/Red for extreme low presence/holidays (<40%)
    } else if (value < 70) {
      fill = "#fef3c7"; // Warning Amber/Orange for moderate caution (40%-70%)
    } else if (value < 85) {
      fill = "#bae6fd"; // Trustworthy Sky Blue for healthy standard baseline (70%-85%)
    } else if (value < 95) {
      fill = "#6366f1"; // Accent Indigo for high attendance (85%-95%)
    } else {
      fill = "#31108f"; // Deep Royal Purple-Violet for peak presence (>=95%)
    }
    
    return (
      <rect
        x={cx - 7}
        y={cy - 7}
        width={14}
        height={14}
        rx={3}
        ry={3}
        fill={fill}
        stroke={isWeekend ? "#e2e8f0" : "#ffffff"}
        strokeWidth={1.5}
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
        className="transition-all duration-300 ease-out hover:stroke-slate-900 hover:scale-125 cursor-pointer"
      />
    );
  };

  // Custom visual tooltip inside heatmap
  const HeatmapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl text-white text-xs font-sans space-y-1 z-50">
          <div className="font-bold border-b border-slate-800 pb-1 mb-1 text-slate-200">
            {data.formattedDate} ({data.dayName})
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Presenteeism index:</span>
            <span className="font-mono font-bold text-indigo-400">{data.value}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Team Presence:</span>
            <span className="font-mono font-bold text-slate-300">{data.presentCount} / {data.totalEmployeeCount} present</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {data.isWeekend ? "Off-duty alignment" : data.value < 85 ? "Low Checkin Warning" : "High Compliance Status"}
          </div>
        </div>
      );
    }
    return null;
  };

  // Active Sub-Tab: "hub" (Attendance Hub) or "shifts" (Shift Scheduler)
  const [activeSubTab, setActiveSubTab] = useState<"hub" | "shifts">("hub");

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date helper
  const getTodayDateString = () => {
    // Return either actual date or standard fixed date matching the app's initial state
    const now = new Date();
    const yr = now.getFullYear();
    // If the year in system is around 2026, use active system date, else align with mock '2026-05-21'
    if (yr >= 2026) {
      return now.toISOString().split("T")[0];
    }
    return "2026-05-21";
  };

  const todayStr = getTodayDateString();

  // Find current log for logged-in user
  const myRecordToday = attendance.find(
    r => r.employeeId === currentUser.id && r.date === todayStr
  );

  // Notes state for current user check-in
  const [attendanceNote, setAttendanceNote] = useState("");

  // Filter / Search state for attendance roster
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(todayStr);

  // State for creating a new shift
  const [isShiftFormOpen, setIsShiftFormOpen] = useState(false);
  const [shiftError, setShiftError] = useState("");
  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "09:00",
    endTime: "17:00",
    workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    color: "bg-indigo-50 text-indigo-700 border-indigo-100"
  });

  // State for manual attendance adjustment
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [manualRecord, setManualRecord] = useState({
    employeeId: "",
    date: todayStr,
    checkInTime: "09:00",
    checkOutTime: "17:00",
    status: "Present" as "Present" | "Late" | "Absent" | "On Leave" | "Half Day",
    notes: ""
  });

  // Unique Departments list
  const departments = Array.from(new Set(employees.map(e => e.department)));

  // Current Employee record of the logged-in user
  const meEmployee = employees.find(e => e.id === currentUser.id);
  const myShiftId = meEmployee?.shiftId || "SFT-1";
  const myShift = shifts.find(s => s.id === myShiftId) || shifts[0];

  // Clock In Action
  const handleClockIn = () => {
    if (myRecordToday) return;

    // Determine status (Late vs Present)
    const [shiftHour, shiftMin] = myShift.startTime.split(":").map(Number);
    const now = new Date();
    let isLate = false;
    
    // Check if current system time (if matches May 21) is past shift start time
    // For demo purposes, if clocking in after shiftStart + 15 mins, mark as late.
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    if (currentHour > shiftHour || (currentHour === shiftHour && currentMin > shiftMin + 15)) {
      isLate = true;
    }

    const rec: AttendanceRecord = {
      id: "ATT-" + Math.floor(Math.random() * 9000 + 1000),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeDept: currentUser.department || meEmployee?.department || "Unassigned",
      date: todayStr,
      checkIn: now.toISOString(),
      status: isLate ? "Late" : "Present",
      notes: attendanceNote,
      shiftName: myShift.name
    };

    onAddAttendance(rec);
    setAttendanceNote("");
  };

  // Clock Out Action
  const handleClockOut = () => {
    if (!myRecordToday || myRecordToday.checkOut) return;

    const now = new Date();
    const checkInDate = new Date(myRecordToday.checkIn);
    
    // Calculate hours
    const diffMs = now.getTime() - checkInDate.getTime();
    // Convert to hours with 2 decimal precision
    const hours = Number((diffMs / (1000 * 60 * 60)).toFixed(2)) || 0.1; // minimum 0.1 for click visual

    const updated: AttendanceRecord = {
      ...myRecordToday,
      checkOut: now.toISOString(),
      hoursWorked: hours
    };

    onUpdateAttendance(updated);
  };

  // Manual Attendance Create
  const handleAddManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRecord.employeeId) return;

    const emp = employees.find(e => e.id === manualRecord.employeeId);
    if (!emp) return;

    const empShift = shifts.find(s => s.id === (emp.shiftId || "SFT-1")) || shifts[0];

    // Combine standard date + manual time to simulate ISO checkin
    const checkInISO = `${manualRecord.date}T${manualRecord.checkInTime}:00Z`;
    const checkOutISO = `${manualRecord.date}T${manualRecord.checkOutTime}:00Z`;

    // Calculate hours worked
    const [inH, inM] = manualRecord.checkInTime.split(":").map(Number);
    const [outH, outM] = manualRecord.checkOutTime.split(":").map(Number);
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    const hours = Number((totalMinutes / 60).toFixed(2));

    const rec: AttendanceRecord = {
      id: "ATT-" + Math.floor(Math.random() * 9000 + 1000),
      employeeId: emp.id,
      employeeName: emp.name,
      employeeDept: emp.department,
      date: manualRecord.date,
      checkIn: checkInISO,
      checkOut: checkOutISO,
      hoursWorked: hours >= 0 ? hours : 0,
      status: manualRecord.status,
      notes: manualRecord.notes,
      shiftName: empShift.name
    };

    onAddAttendance(rec);
    setIsAdjustmentModalOpen(false);
    setManualRecord({
      employeeId: "",
      date: todayStr,
      checkInTime: "09:00",
      checkOutTime: "17:00",
      status: "Present",
      notes: ""
    });
  };

  // Shift Create Action
  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    setShiftError("");
    if (!newShift.name) return;

    // Check if End Time is set earlier than Start Time
    const [startH, startM] = (newShift.startTime || "00:00").split(":").map(Number);
    const [endH, endM] = (newShift.endTime || "00:00").split(":").map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    if (endMins < startMins) {
      setShiftError("Duty End Time cannot be earlier than Duty Start Time.");
      return;
    }

    const colors = [
      "bg-indigo-50 text-indigo-700 border-indigo-100",
      "bg-emerald-50 text-emerald-700 border-emerald-100",
      "bg-amber-50 text-amber-700 border-amber-100",
      "bg-purple-50 text-purple-700 border-purple-100",
      "bg-rose-50 text-rose-700 border-rose-100",
      "bg-sky-50 text-sky-700 border-sky-100"
    ];

    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const created: Shift = {
      id: "SFT-" + (shifts.length + 1),
      name: newShift.name,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      workDays: newShift.workDays,
      color: randomColor
    };

    onAddShift(created);
    setShiftError("");
    setNewShift({
      name: "",
      startTime: "09:00",
      endTime: "17:00",
      workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      color: "bg-indigo-50 text-indigo-700 border-indigo-100"
    });
    setIsShiftFormOpen(false);
  };

  // Work days toggle helper
  const handleDayToggle = (day: string) => {
    setNewShift(prev => {
      const exists = prev.workDays.includes(day);
      if (exists) {
        return { ...prev, workDays: prev.workDays.filter(d => d !== day) };
      } else {
        return { ...prev, workDays: [...prev.workDays, day] };
      }
    });
  };

  // Corporate stats calculating helper
  const getHistoricalRosterStats = () => {
    const listForDate = attendance.filter(r => r.date === dateFilter);
    const activeEmps = employees.filter(e => e.status !== EmployeeStatus.TERMINATED);
    
    const presentCount = listForDate.filter(r => r.status === "Present" || r.status === "Late" || r.status === "Half Day").length;
    const lateCount = listForDate.filter(r => r.status === "Late").length;
    const leaveCount = listForDate.filter(r => r.status === "On Leave").length;
    const excuseCount = activeEmps.length - presentCount - leaveCount;

    const presentRate = activeEmps.length > 0 
      ? Math.round(((presentCount + leaveCount) / activeEmps.length) * 100) 
      : 0;

    const totalHoursToday = listForDate.reduce((acc, current) => acc + (current.hoursWorked || 0), 0);
    const avgHours = presentCount > 0 ? Number((totalHoursToday / presentCount).toFixed(1)) : 0;

    return {
      present: presentCount,
      late: lateCount,
      onLeave: leaveCount,
      avgHours,
      presentRate,
      activeCount: activeEmps.length
    };
  };

  // Shift assignment mapping count helper
  const getEmployeeCountByShift = (shiftId: string) => {
    return employees.filter(e => {
      if (shiftId === "SFT-1" && !e.shiftId) return true; // Default
      return e.shiftId === shiftId;
    }).length;
  };

  const rosterStats = getHistoricalRosterStats();

  // Filtered attendance logs for managers
  const filteredAttendance = attendance.filter(rec => {
    const matchesSearch = rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Department filtering
    const originalEmp = employees.find(e => e.id === rec.employeeId);
    const matchesDept = deptFilter === "all" || rec.employeeDept === deptFilter || (originalEmp && originalEmp.department === deptFilter);
    const matchesStatus = statusFilter === "all" || rec.status === statusFilter;
    const matchesDate = !dateFilter || rec.date === dateFilter;

    // View scope formatting
    const canSee = isHR || (isVP && (rec.employeeDept === "Engineering" || (originalEmp && originalEmp.department === "Engineering"))) || rec.employeeId === currentUser.id;

    return matchesSearch && matchesDept && matchesStatus && matchesDate && canSee;
  });

  // Sort logs by date descending, then time descending
  const sortedCompanyLogs = [...filteredAttendance].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.checkIn.localeCompare(a.checkIn);
  });

  // Personal Logs list for standard workers
  const personalLogs = attendance
    .filter(r => r.employeeId === currentUser.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Export shift schedules and attendance ledger database to pre-formatted CSV report
  const handleExportCSV = () => {
    // 1. Shift Profiles segment
    const shiftHeaders = ["Shift ID", "Shift Name", "Start Time", "End Time", "Work Days", "Mapped Employee Count"];
    const shiftLines = shifts.map(s => {
      const empCount = employees.filter(e => {
        if (s.id === "SFT-1" && !e.shiftId) return true;
        return e.shiftId === s.id;
      }).length;
      return [
        s.id,
        s.name,
        s.startTime,
        s.endTime,
        s.workDays.join("; "),
        empCount.toString()
      ];
    });

    // 2. Attendance Ledger segment
    const logsToExport = hasAccess ? sortedCompanyLogs : personalLogs;
    const attendanceHeaders = [
      "Record ID",
      "Employee ID",
      "Employee Name",
      "Department/Unit",
      "Applied Shift",
      "Date",
      "Check In",
      "Check Out",
      "Hours Worked",
      "Check-in Status",
      "Notes"
    ];

    const attendanceLines = logsToExport.map(rec => {
      const emp = employees.find(e => e.id === rec.employeeId);
      const assignedShiftId = emp?.shiftId || "SFT-1";
      const shiftObj = shifts.find(s => s.id === assignedShiftId) || shifts[0];

      const inTimeStr = rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) : "—";
      const outTimeStr = rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) : "Active/Pending";

      return [
        rec.id,
        rec.employeeId,
        rec.employeeName,
        rec.employeeDept || emp?.department || "Unassigned",
        rec.shiftName || shiftObj.name,
        rec.date,
        inTimeStr,
        outTimeStr,
        rec.hoursWorked ? rec.hoursWorked.toString() : "0",
        rec.status,
        rec.notes || ""
      ];
    });

    // Escape helper
    const escapeCSV = (val: string) => {
      const clean = val.replace(/"/g, '""');
      return `"${clean}"`;
    };

    // Build row combinations
    const csvRows = [];
    
    // Header for Report Meta
    csvRows.push([escapeCSV("HRMS ENTERPRISE WORKFORCE SHIFT & ATTENDANCE REPORT")]);
    csvRows.push([escapeCSV(`Generated at: ${new Date().toISOString()} • Requested by: ${currentUser.name} (${currentUser.role})`)]);
    csvRows.push([]);

    // Section 1: Shifts Catalogue
    csvRows.push([escapeCSV("SECTION A: ACTIVE DUTY SHIFTS CATALOGUE")]);
    csvRows.push(shiftHeaders.map(escapeCSV).join(","));
    shiftLines.forEach(line => {
      csvRows.push(line.map(escapeCSV).join(","));
    });
    csvRows.push([]);
    csvRows.push([]);

    // Section 2: Attendance Registry
    csvRows.push([escapeCSV("SECTION B: ATTENDANCE LEDGER ENTRIES")]);
    csvRows.push(attendanceHeaders.map(escapeCSV).join(","));
    attendanceLines.forEach(line => {
      csvRows.push(line.map(escapeCSV).join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" }); // UTF-8 BOM
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = `Workforce_Time_Management_Report_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="hrms-shift-attendance">
      
      {/* Visual Workspace Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Time & Shift Operations</h2>
          <p className="text-sm text-slate-500 mt-1">
            Track contractual operational hours, manage workforce shifts alignment, and analyze daily attendance checkpoints.
          </p>
        </div>
        
        {/* Toggle between hubs */}
        <div className="flex bg-slate-100 p-0.5 border border-slate-200 rounded-lg select-none">
          <button
            onClick={() => setActiveSubTab("hub")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === "hub"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-550 hover:text-slate-900"
            }`}
          >
            Attendance Hub
          </button>
          <button
            onClick={() => setActiveSubTab("shifts")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === "shifts"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-550 hover:text-slate-900"
            }`}
          >
            Shift Scheduler
          </button>
        </div>
      </div>

      {activeSubTab === "hub" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Attendance marking workspace (Left/Middle Column) */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Clock-In Console Card */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden relative">
              <div className="px-5 pt-5 pb-1 text-left border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Time Clock Controller</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Register shift events or remote log check-ins</p>
              </div>
              
              <div className="p-5 text-center space-y-4">
                {/* Visual Digital Clock */}
                <div className="py-5 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 font-sans relative overflow-hidden">
                  <div className="text-4xl font-black tracking-widest font-mono text-indigo-600">
                    {currentTime.toLocaleTimeString("en-US", { hour12: false })}
                  </div>
                  <div className="text-[10.5px] font-semibold text-slate-550 text-slate-500 mt-1.5 uppercase tracking-wider">
                    {currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
                  </div>
                </div>

                {/* Active Assign Shift Info Banner */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left flex items-start gap-3">
                  <Clock className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Assigned Duty Shift</span>
                    <span className="text-xs font-semibold text-slate-800 block">{myShift.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      Hours: {myShift.startTime} to {myShift.endTime} • {myShift.workDays.length} days/week
                    </span>
                  </div>
                </div>

                {/* Clock button mechanics */}
                <div className="space-y-3">
                  {!myRecordToday ? (
                    <div className="space-y-3">
                      <div className="text-left">
                        <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Check-In Broadcast Note</label>
                        <input
                          type="text"
                          value={attendanceNote}
                          onChange={(e) => setAttendanceNote(e.target.value)}
                          placeholder="e.g. Remote log, field client session, standard sync..."
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white bg-slate-50"
                        />
                      </div>
                      <button
                        onClick={handleClockIn}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-lg shadow-md font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        Broadcast Clock In
                      </button>
                    </div>
                  ) : !myRecordToday.checkOut ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-left text-xs space-y-1 text-emerald-800">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Active Logged In Today!</span>
                        </div>
                        <p className="font-mono text-[10.5px] mt-1 pl-5">
                          Time Entered: {new Date(myRecordToday.checkIn).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {myRecordToday.notes && (
                          <p className="italic pl-5 font-sans mt-0.5 text-[11px] text-emerald-700">"Note: {myRecordToday.notes}"</p>
                        )}
                      </div>
                      <button
                        onClick={handleClockOut}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-lg shadow-md font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Broadcast Clock Out
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 bg-slate-100 border border-slate-200 rounded-lg text-center space-y-2.5">
                      <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto" />
                      <div>
                        <span className="font-bold text-slate-700 text-sm block">Shift Log Completed</span>
                        <span className="text-xs text-slate-400 block mt-0.5">Hours logged: {myRecordToday.hoursWorked} hrs</span>
                      </div>
                      <div className="text-[10px] font-mono uppercase bg-slate-200 text-slate-750 px-2.5 py-1 rounded inline-block font-bold">
                        Cleared & Sealed
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Micro Stats for current person */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <h4 className="text-sm font-display font-semibold text-slate-900 border-b pb-2 mb-2">My Attendance Summary</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase">Days Logged</span>
                  <span className="text-xl font-bold text-slate-800 font-mono mt-0.5">
                    {personalLogs.length}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase">Total Shift Hours</span>
                  <span className="text-xl font-bold text-indigo-650 text-indigo-600 font-mono mt-0.5">
                    {personalLogs.reduce((acc, c) => acc + (c.hoursWorked || 0), 0).toFixed(1)} hrs
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase">Tardiness Count</span>
                  <span className="text-xl font-bold text-amber-650 text-amber-600 font-mono mt-0.5">
                    {personalLogs.filter(l => l.status === "Late").length}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase">Perfect Logs (%)</span>
                  <span className="text-xl font-bold text-emerald-600 font-mono mt-0.5">
                    {personalLogs.length > 0 
                      ? Math.round((personalLogs.filter(l => l.status === "Present").length / personalLogs.length) * 100) 
                      : 100}%
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Roster & Consolidated Ledger lists (Right / Two Columns) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Visual Heatmap Trends Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs" id="presenteeism-heatmap-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-50 pb-3">
                <div className="space-y-1">
                  <h3 className="text-base font-display font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    3-Month Presenteeism Trend Heatmap
                  </h3>
                  <p className="text-xs text-slate-450 text-slate-500">
                    Visual audit of enterprise-wide check-in activity and presence consistency by weekday.
                  </p>
                </div>
                
                {/* Metric breakdown pill */}
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg px-2.5 py-1 flex items-center gap-2 text-indigo-900 font-medium">
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-indigo-400 block uppercase font-bold leading-none">Last 90 Days Average</span>
                    <span className="text-xs font-mono font-bold leading-none">91.4% present</span>
                  </div>
                </div>
              </div>

              {/* Heatmap Grid Wrapper */}
              <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
                <div className="min-w-[580px] h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 15, right: 10, bottom: 5, left: 10 }}>
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        domain={[0, 12]} 
                        ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
                        tickFormatter={getMonthTickLabelFiltered}
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={5}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        domain={[-0.5, 6.5]} 
                        ticks={[0, 1, 2, 3, 4, 5, 6]}
                        tickFormatter={(y) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][y]}
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        width={30}
                      />
                      <ZAxis type="number" dataKey="value" range={[144, 144]} />
                      <Tooltip 
                        content={<HeatmapTooltip />} 
                        cursor={{ strokeDasharray: "2 2", stroke: "#818cf8", strokeOpacity: 0.5 }} 
                        animationDuration={450}
                      />
                      <Scatter 
                        data={heatmapData} 
                        shape={renderHeatmapCell} 
                        isAnimationActive={true} 
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Legend with Color Scale */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-105 border-slate-100 text-[10.5px] text-slate-500 font-sans">
                <div className="flex flex-wrap items-center gap-1">
                  <span>Legend Scale:</span>
                  <div className="flex flex-wrap items-center gap-3 ml-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-[#f8fafc] border border-slate-200" />
                      <span>Weekend</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-[#fee2e2] border border-rose-200" />
                      <span className="text-rose-600 font-semibold">&lt;40%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-[#fef3c7] border border-amber-200" />
                      <span className="text-amber-600 font-semibold">40–70%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-[#bae6fd] border border-sky-200" />
                      <span className="text-sky-600 font-semibold">70–85%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-[#6366f1] border border-indigo-200" />
                      <span className="text-indigo-600 font-semibold">85–95%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-[#31108f] border border-[#31108f]" />
                      <span className="text-violet-850 text-indigo-900 font-semibold">&gt;=95%</span>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-indigo-650 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold shrink-0">
                  * 3-Month rolling window
                </div>
              </div>
            </div>

            {/* If manager/HR, show today's statistics panel */}
            {hasAccess && (
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                  <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-wider">Operational Overview Logs & Stats</span>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="text-xs bg-slate-100 border border-slate-200 rounded-md p-1 font-mono outline-none cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <span className="text-[10px] font-mono uppercase text-indigo-700 block font-bold">Log Checkin Rate</span>
                    <span className="text-2xl font-black text-indigo-900 font-mono block mt-1">{rosterStats.presentRate}%</span>
                    <span className="text-[9px] font-mono text-indigo-650 text-indigo-600 mt-0.5 block font-semibold">
                      {rosterStats.present} of {rosterStats.activeCount} Clocked
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <span className="text-[10px] font-mono uppercase text-amber-700 block font-bold">Late Arrival Incident</span>
                    <span className="text-2xl font-black text-amber-900 font-mono block mt-1">{rosterStats.late}</span>
                    <span className="text-[9px] font-sans text-amber-650 text-amber-600 mt-0.5 block">Requires review</span>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <span className="text-[10px] font-mono uppercase text-emerald-700 block font-bold">On Active Leaves</span>
                    <span className="text-2xl font-black text-emerald-900 font-mono block mt-1">{rosterStats.onLeave}</span>
                    <span className="text-[9px] font-sans text-emerald-650 text-emerald-600 mt-0.5 block font-medium">Valid Excuses logged</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">Avg Hours Today</span>
                    <span className="text-2xl font-black text-slate-800 font-mono block mt-1">{rosterStats.avgHours} hrs</span>
                    <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">Shift standard: 8.0</span>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Logs List / Ledger Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              
              {/* Filter controls panel */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-display font-medium text-slate-900">Attendance Database & Ledger</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {hasAccess ? "Enterprise-wide digital attendance audit trail." : "My personal monthly duty timesheet."}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-xs text-slate-700"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                    {hasAccess && (
                      <button
                        onClick={() => setIsAdjustmentModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Manual Log Fixes
                      </button>
                    )}
                  </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search record..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>

                  {hasAccess && (
                    <>
                      <select
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none cursor-pointer"
                      >
                        <option value="all">All Departments/Units</option>
                        {departments.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none cursor-pointer"
                      >
                        <option value="all">All Checkin Status</option>
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="Absent">Absent</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Half Day">Half Day</option>
                      </select>
                    </>
                  )}
                </div>
              </div>

              {/* Roster Ledger Table Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                      <th className="px-5 py-3">Employee</th>
                      <th className="px-5 py-3 font-mono">Date & Shift info</th>
                      <th className="px-5 py-3 font-mono">Check In</th>
                      <th className="px-5 py-3 font-mono">Check Out</th>
                      <th className="px-5 py-3">Duration</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {hasAccess ? (
                      sortedCompanyLogs.length > 0 ? (
                        sortedCompanyLogs.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3.5">
                              <span className="font-bold text-slate-800 block leading-tight">{rec.employeeName}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-medium block">ID: {rec.employeeId}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-650">
                              <span className="block font-medium">{rec.date}</span>
                              <span className="text-[10px] text-slate-400">{rec.shiftName || "Standard Day Shift"}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-700">
                              {rec.checkIn ? (
                                new Date(rec.checkIn).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-705 text-slate-700">
                              {rec.checkOut ? (
                                new Date(rec.checkOut).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
                              ) : (
                                <span className="text-[10px] text-indigo-650 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded italic font-semibold">Logged-in</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-semibold font-mono text-slate-800">
                              {rec.hoursWorked ? `${rec.hoursWorked} hrs` : "—"}
                            </td>
                            <td className="px-5 py-3.5 font-sans">
                              <span className={`text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                rec.status === "Present" ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                                rec.status === "Late" ? "bg-amber-50 text-amber-700 border-amber-150" :
                                rec.status === "On Leave" ? "bg-indigo-50 text-indigo-700 border-indigo-150" :
                                "bg-rose-50 text-rose-700 border-rose-150"
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right font-sans text-slate-500 italic text-[11px] max-w-[150px] truncate" title={rec.notes}>
                              {rec.notes || "—"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 text-sm font-mono italic">
                            No matching corporate duty log entries located.
                          </td>
                        </tr>
                      )
                    ) : (
                      personalLogs.length > 0 ? (
                        personalLogs.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3.5">
                              <span className="font-bold text-slate-800 block leading-tight">{rec.employeeName}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-medium block">ID: {rec.employeeId}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-655 text-slate-700">
                              <span className="block font-medium">{rec.date}</span>
                              <span className="text-[10px] text-slate-400">{rec.shiftName || "Standard Day Shift"}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-700">
                              {rec.checkIn ? (
                                new Date(rec.checkIn).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-700">
                              {rec.checkOut ? (
                                new Date(rec.checkOut).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
                              ) : (
                                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded italic font-semibold">Active Duty</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-semibold font-mono text-slate-800">
                              {rec.hoursWorked ? `${rec.hoursWorked} hrs` : "—"}
                            </td>
                            <td className="px-5 py-3.5 font-sans">
                              <span className={`text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                rec.status === "Present" ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                                rec.status === "Late" ? "bg-amber-50 text-amber-700 border-amber-150" :
                                rec.status === "On Leave" ? "bg-indigo-50 text-indigo-700 border-indigo-150" :
                                "bg-rose-50 text-rose-700 border-rose-150"
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right font-sans text-slate-500 italic text-[11px] max-w-[150px] truncate" title={rec.notes}>
                              {rec.notes || "—"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 text-sm font-mono italic">
                            No duty logs committed for your user profile yet.
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {activeSubTab === "shifts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Shift catalog overview panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-base font-display font-bold text-slate-900">Shift Catalogue</h3>
                  <p className="text-[11px] text-slate-400">Standard operational coverage profiles.</p>
                </div>
                
                {isHR && (
                  <button
                    onClick={() => { setShiftError(""); setIsShiftFormOpen(true); }}
                    className="p-1 px-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-colors rounded text-[11px] font-bold flex items-center gap-1.5 cursor-pointer uppercase font-mono"
                  >
                    <Plus className="w-3 h-3" /> New Shift
                  </button>
                )}
              </div>

              {/* Shift list cards */}
              <div className="space-y-4">
                {shifts.map(shift => {
                  const empCount = getEmployeeCountByShift(shift.id);
                  return (
                    <div key={shift.id} className="border border-slate-150 rounded-lg p-4 space-y-3 hover:border-slate-350 hover:border-slate-300 transition-colors relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-sm text-slate-800 block">{shift.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{shift.id}</span>
                        </div>
                        <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded border inline-block ${shift.color || "bg-indigo-50 border-indigo-100 text-indigo-700"}`}>
                          ACTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100 text-[11px] font-mono text-slate-600">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Start-End</span>
                          <span className="font-semibold">{shift.startTime} – {shift.endTime}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Mapped Strength</span>
                          <span className="font-semibold text-indigo-600">{empCount} {empCount === 1 ? "Employee" : "Employees"}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-mono font-bold block">Active Days</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                            const isWorking = shift.workDays.includes(day);
                            return (
                              <span 
                                key={day} 
                                className={`text-[8.5px] px-1 py-0.5 rounded font-bold ${
                                  isWorking 
                                    ? "bg-slate-800 text-white" 
                                    : "bg-slate-100 text-slate-350"
                                }`}
                                title={day}
                              >
                                {day.substring(0, 3)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Employee Mapping grid details (Middle/Right columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-base font-display font-bold text-slate-900">Workforce Shift Register</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Assign active employees to operational shifts. Employees can look up shifts when checking in.
                </p>
              </div>

              <div className="divide-y divide-slate-100 font-sans text-xs">
                {employees
                  .filter(e => e.status !== EmployeeStatus.TERMINATED)
                  .map(emp => {
                    const assignedShiftId = emp.shiftId || "SFT-1";
                    const assignedShift = shifts.find(s => s.id === assignedShiftId) || shifts[0];
                    return (
                      <div key={emp.id} className="p-5 hover:bg-slate-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-sm">
                            <img 
                              src={getEmployeeAvatar(emp.name)} 
                              alt={emp.name} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block leading-tight">{emp.name}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">{emp.role} • <span className="font-semibold text-slate-500">{emp.department}</span></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold">Currently Configured</span>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold font-mono py-1 px-2.5 rounded-full mt-1 border ${assignedShift.color}`}>
                              <Clock className="w-3 h-3 shrink-0" />
                              {assignedShift.name} ({assignedShift.startTime} — {assignedShift.endTime})
                            </span>
                          </div>

                          {isHR && (
                            <div className="flex flex-col">
                              <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold mb-1">Reassign Node</span>
                              <select
                                value={assignedShiftId}
                                onChange={(e) => onUpdateEmployeeShift(emp.id, e.target.value)}
                                className="text-xs font-mono px-2 py-1.5 bg-slate-50 border border-slate-250 border-slate-200 outline-none rounded-lg cursor-pointer hover:bg-white"
                              >
                                {shifts.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* FORM: Create Shift Modal Overlay */}
      {isShiftFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md shadow-xl p-6 relative">
            <h3 className="text-lg font-display font-bold text-slate-900 border-b pb-3 mb-4">Create New Duty Shift</h3>
            
            {shiftError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs leading-relaxed mb-4 flex items-center gap-2 animate-fade-in" id="shift-error-alert">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{shiftError}</span>
              </div>
            )}

            <form onSubmit={handleCreateShift} className="space-y-4 text-xs font-sans">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Shift Name / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afternoon Overtime Shift, APAC Core Shift..."
                  value={newShift.name}
                  onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-205 border-slate-200 outline-none rounded-lg focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Duty Start Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-205 border-slate-200 outline-none rounded-lg focus:bg-white focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Duty End Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-205 border-slate-200 outline-none rounded-lg focus:bg-white focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Duty Active Days (Weekly)</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                    const selected = newShift.workDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`px-2.5 py-1.5 border gap-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          selected 
                            ? "bg-slate-900 border-slate-900 text-white" 
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShiftError(""); setIsShiftFormOpen(false); }}
                  className="px-4 py-2 border border-slate-250 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Create Profile
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* FORM: Manual Attendance Adjusted Records Modal Overlay */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md shadow-xl p-6 relative">
            <h3 className="text-lg font-display font-bold text-slate-900 border-b pb-3 mb-4">Manual Attendance Entry</h3>
            
            <form onSubmit={handleAddManualRecord} className="space-y-4 text-xs font-sans">
              
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Choose Employee Node</label>
                <select
                  required
                  value={manualRecord.employeeId}
                  onChange={(e) => setManualRecord({ ...manualRecord, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg focus:bg-white text-slate-800 cursor-pointer"
                >
                  <option value="">-- Choose Employee Record --</option>
                  {employees
                    .filter(e => e.status !== EmployeeStatus.TERMINATED)
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Operational Date</label>
                  <input
                    type="date"
                    required
                    value={manualRecord.date}
                    onChange={(e) => setManualRecord({ ...manualRecord, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-205 border-slate-200 outline-none rounded-lg focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Duty Status Match</label>
                  <select
                    value={manualRecord.status}
                    onChange={(e) => setManualRecord({ ...manualRecord, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg focus:bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="Present">Present (On-Time)</option>
                    <option value="Late">Late Entry</option>
                    <option value="Half Day">Half Day</option>
                    <option value="On Leave">Authorized Leave</option>
                    <option value="Absent">Unexcused Absent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Clock In Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={manualRecord.checkInTime}
                    disabled={manualRecord.status === "Absent" || manualRecord.status === "On Leave"}
                    onChange={(e) => setManualRecord({ ...manualRecord, checkInTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-205 border-slate-200 outline-none rounded-lg focus:bg-white disabled:opacity-50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Clock Out Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={manualRecord.checkOutTime}
                    disabled={manualRecord.status === "Absent" || manualRecord.status === "On Leave"}
                    onChange={(e) => setManualRecord({ ...manualRecord, checkOutTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-205 border-slate-200 outline-none rounded-lg focus:bg-white disabled:opacity-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Audit Entry Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Forgot to clock in, corrected sick entry..."
                  value={manualRecord.notes}
                  onChange={(e) => setManualRecord({ ...manualRecord, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-205 border-slate-200 outline-none rounded-lg focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Commit Log
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
