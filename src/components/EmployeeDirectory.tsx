import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Mail, 
  Building, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  ChevronDown,
  X,
  CreditCard,
  Briefcase,
  AlertCircle,
  FileCheck,
  Network,
  MapPin,
  Users,
  Sliders,
  Target,
  Workflow,
  UserCheck
} from "lucide-react";
import { Employee, EmployeeStatus, BankDetails, getEmployeeAvatar } from "../types";

export interface CustomTeam {
  id: string;
  name: string;
  type: string; // e.g. "Agile Pod", "Regional Chapter", "Task Force", "Corporate Command"
  location: string;
  department: string;
  leadId: string;
  memberIds: string[];
  description: string;
}

const INITIAL_CUSTOM_TEAMS: CustomTeam[] = [
  {
    id: "TEAM-01",
    name: "Axiom Engineering Strike-Team",
    type: "Agile Pod",
    location: "San Francisco",
    department: "Engineering",
    leadId: "EMP-101", // Alexander Mercer
    memberIds: ["EMP-103", "EMP-102"], // Cassian Rook, Beatriz Vance
    description: "Rapid delivery unit focusing on cloud framework operations and design alignment."
  },
  {
    id: "TEAM-02",
    name: "London Operations Syndicate",
    type: "Regional Chapter",
    location: "London",
    department: "Human Resources",
    leadId: "EMP-104", // Diana Prince
    memberIds: ["EMP-105"], // Elijah Sterling
    description: "Regional talent acquisition and EMEA employee relations support squad."
  }
];

interface EmployeeDirectoryProps {
  employees: Employee[];
  benefitPlans: string[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee, originalId?: string) => void;
  onDeleteEmployee: (id: string) => void;
  currentUser: any;
}

export default function EmployeeDirectory({ 
  employees, 
  benefitPlans, 
  onAddEmployee, 
  onUpdateEmployee, 
  onDeleteEmployee,
  currentUser
}: EmployeeDirectoryProps) {
  const isAdmin = currentUser.role === "Admin";
  const isHRHead = currentUser.role === "HR Head";
  const isHRAssociate = currentUser.role === "HR Associate";
  const isEmployee = currentUser.role === "Employee";

  const isHR = isAdmin || isHRHead || isHRAssociate;
  const isHRManagement = isAdmin || isHRHead;

  const canSeeSalary = (empId: string, dept: string) => isHRManagement || empId === currentUser.id;
  const canSeeBank = (empId: string) => isHRManagement || empId === currentUser.id;
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Drawer / Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Derived org structure relations for viewing inside the details drawer
  const viewingManager = viewingEmployee?.managerId ? employees.find(e => e.id === viewingEmployee.managerId) : null;
  const viewingReports = viewingEmployee ? employees.filter(e => e.managerId === viewingEmployee.id) : [];

  // View modes: list or organizational structure tree
  const [viewMode, setViewMode] = useState<"list" | "org">("list");
  // State to track custom collapsed states for org structure nodes
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Dynamic Org sub-modes: traditional (manager chain), location (location/dept grid), custom (custom team groups)
  const [orgSubMode, setOrgSubMode] = useState<"traditional" | "location" | "custom">("traditional");

  // Custom persistent Teams array
  const [customTeams, setCustomTeams] = useState<CustomTeam[]>(() => {
    const saved = localStorage.getItem("nexahr_custom_org_teams");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_CUSTOM_TEAMS;
  });

  const saveCustomTeams = (updated: CustomTeam[]) => {
    setCustomTeams(updated);
    localStorage.setItem("nexahr_custom_org_teams", JSON.stringify(updated));
  };

  const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<CustomTeam | null>(null);

  const initialTeamFormState = {
    id: "",
    name: "",
    type: "Agile Pod",
    location: "New York",
    department: "Engineering",
    leadId: employees[0]?.id || "",
    memberIds: [] as string[],
    description: ""
  };
  const [teamFormData, setTeamFormData] = useState(initialTeamFormState);
  const [teamFormError, setTeamFormError] = useState("");

  // New Employee Form State
  const initialFormState = {
    id: "",
    name: "",
    email: "",
    role: "",
    department: "",
    status: EmployeeStatus.ONBOARDING,
    salary: "",
    joinDate: new Date().toISOString().split("T")[0],
    benefitPlan: "Pending Enrollment",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    leavesTotal: "15",
    managerId: "",
    location: "New York"
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState("");

  // Get unique departments for filter dropdown
  const departments = ["All", ...Array.from(new Set(employees.map(e => e.department)))];

  // Filter logic
  const filteredEmployees = employees.filter(e => {
    if (isEmployee) {
      return e.id === currentUser.id;
    }

    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDept === "All" || e.department === selectedDept;
    
    const matchesStatus = selectedStatus === "All" || e.status === selectedStatus;
    
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Handle Form Submission (Add or Edit)
  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");

    // Validate inputs
    if (!formData.name.trim() || !formData.email.trim() || !formData.role.trim() || !formData.department.trim()) {
      setFormError("Please fill out all standard employee information fields.");
      return;
    }

    const cleanId = formData.id.trim();
    if (!cleanId) {
      setFormError("Employee ID is required.");
      return;
    }

    // Check uniqueness of ID
    const idExists = employees.some(emp => 
      emp.id.toLowerCase() === cleanId.toLowerCase() && 
      (!editingEmployee || emp.id.toLowerCase() !== editingEmployee.id.toLowerCase())
    );

    if (idExists) {
      setFormError(`An employee with ID "${cleanId}" already exists. Please choose a unique Employee ID.`);
      return;
    }

    const finalSalary = isHRManagement ? Number(formData.salary) : (editingEmployee ? editingEmployee.salary : 0);

    if (isHRManagement && (isNaN(finalSalary) || finalSalary <= 0)) {
      setFormError("Please supply a valid annual salary rate greater than zero.");
      return;
    }

    const bankDetails: BankDetails = {
      bankName: formData.bankName.trim() || "National Central Bank",
      accountNumber: formData.accountNumber.trim() || "•••• •••• ----",
      routingNumber: formData.routingNumber.trim() || "000000000"
    };

    if (editingEmployee) {
      // Edit mode
      const updated: Employee = {
        ...editingEmployee,
        id: cleanId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role.trim(),
        department: formData.department.trim(),
        status: formData.status,
        salary: finalSalary,
        joinDate: formData.joinDate,
        benefitPlan: formData.benefitPlan,
        bankDetails,
        leavesTotal: Number(formData.leavesTotal) || 15,
        managerId: formData.managerId ? formData.managerId : undefined,
        location: formData.location
      };
      onUpdateEmployee(updated, editingEmployee.id);
      setIsFormOpen(false);
      setEditingEmployee(null);
    } else {
      // Add mode
      const created: Employee = {
        id: cleanId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role.trim(),
        department: formData.department.trim(),
        status: formData.status,
        salary: finalSalary,
        joinDate: formData.joinDate,
        benefitPlan: formData.benefitPlan,
        bankDetails,
        leavesUsed: 0,
        leavesTotal: Number(formData.leavesTotal) || 15,
        avatarSeed: formData.name.toLowerCase().replace(/\s+/g, ""),
        managerId: formData.managerId ? formData.managerId : undefined,
        location: formData.location
      };
      onAddEmployee(created);
      setIsFormOpen(false);
    }

    // Reset Form
    setFormData(initialFormState);
  };

  // Trigger editing state and populate form fields
  const handleEditClick = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      department: emp.department,
      status: emp.status,
      salary: emp.salary.toString(),
      joinDate: emp.joinDate,
      benefitPlan: emp.benefitPlan,
      bankName: emp.bankDetails?.bankName || "",
      accountNumber: emp.bankDetails?.accountNumber || "",
      routingNumber: emp.bankDetails?.routingNumber || "",
      leavesTotal: emp.leavesTotal.toString(),
      managerId: emp.managerId || "",
      location: emp.location || "New York"
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleCreateNewClick = () => {
    setEditingEmployee(null);
    const newId = `EMP-${100 + employees.length + Math.floor(Math.random() * 50)}`;
    setFormData({
      ...initialFormState,
      id: newId,
      managerId: ""
    });
    setFormError("");
    setIsFormOpen(true);
  };

  // Custom Team submission and mutation handlers
  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamFormData.name.trim() || !teamFormData.leadId) {
      setTeamFormError("Please provide a team unit name and assign an active supervisor/lead.");
      return;
    }

    if (editingTeam) {
      // Edit mode
      const updated = customTeams.map(t => t.id === editingTeam.id ? {
        ...t,
        name: teamFormData.name.trim(),
        type: teamFormData.type,
        location: teamFormData.location,
        department: teamFormData.department,
        leadId: teamFormData.leadId,
        memberIds: teamFormData.memberIds,
        description: teamFormData.description.trim()
      } : t);
      saveCustomTeams(updated);
      setIsTeamFormOpen(false);
      setEditingTeam(null);
    } else {
      // Add mode
      const newTeam: CustomTeam = {
        id: `TEAM-${Date.now()}`,
        name: teamFormData.name.trim(),
        type: teamFormData.type,
        location: teamFormData.location,
        department: teamFormData.department,
        leadId: teamFormData.leadId,
        memberIds: teamFormData.memberIds,
        description: teamFormData.description.trim()
      };
      saveCustomTeams([...customTeams, newTeam]);
      setIsTeamFormOpen(false);
    }
    setTeamFormData({
      id: "",
      name: "",
      type: "Agile Pod",
      location: "New York",
      department: "Engineering",
      leadId: employees[0]?.id || "",
      memberIds: [],
      description: ""
    });
    setTeamFormError("");
  };

  const handleDeleteTeam = (teamId: string) => {
    if (window.confirm("Are you sure you would like to decommission this organizational unit? All associated direct reporting parameters will revert.")) {
      saveCustomTeams(customTeams.filter(t => t.id !== teamId));
    }
  };

  // Recursive renderer for Organizational Structure Tree Nodes
  const renderOrgNode = (node: Employee, depth: number = 0, visited: Set<string> = new Set()): React.ReactNode => {
    if (visited.has(node.id)) {
      return (
        <div key={`cycle-${node.id}`} className="p-3 bg-rose-50 border border-rose-150 rounded-lg text-rose-700 text-xs font-semibold leading-relaxed max-w-sm ml-6 relative">
          {depth > 0 && (
            <div className="absolute left-[-24px] top-[20px] w-[24px] h-[1.5px] bg-rose-200" />
          )}
          <span>⚠️ Cyclic reporting loop detected for <strong>{node.name}</strong> (ID: {node.id})</span>
        </div>
      );
    }
    visited.add(node.id);
    
    const isCollapsed = collapsedNodes[node.id];
    const directReports = employees.filter(emp => emp.managerId === node.id);
    const hasReports = directReports.length > 0;

    // Direct color schemes map on string seeds
    const charCodeSum = node.name.charCodeAt(0) + node.name.charCodeAt(node.name.length - 1);
    const gradients = [
      "from-blue-500 to-indigo-600",
      "from-purple-500 to-pink-600",
      "from-teal-500 to-emerald-600",
      "from-amber-500 to-orange-600"
    ];
    const avatarGrad = gradients[charCodeSum % gradients.length];

    return (
      <div key={node.id} className="relative select-none">
        {/* Node visual card box */}
        <div className="flex items-start gap-2.5 relative z-10 w-fit">
          
          {/* Connector horizontal line graphics if nested */}
          {depth > 0 && (
            <div className="absolute left-[-26px] top-[24px] w-[26px] h-[1.5px] bg-slate-200" />
          )}

          {/* Employee Node Card */}
          <div className="bg-white border border-slate-200 hover:border-indigo-400 p-3.5 rounded-xl shadow-2xs hover:shadow-xs transition-all w-80 flex items-center justify-between group relative overflow-hidden">
            <div className="flex items-center gap-3 truncate">
              <div className="w-9.5 h-9.5 rounded-full overflow-hidden shadow-xs shrink-0 bg-slate-100 border border-slate-200">
                <img 
                  src={getEmployeeAvatar(node.name)} 
                  alt={node.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate pr-1">
                <span 
                  onClick={() => { setViewingEmployee(node); setIsDrawerOpen(true); }}
                  className="font-bold text-slate-800 hover:text-indigo-600 cursor-pointer block text-xs leading-tight hover:underline transition-colors truncate"
                  title="Click to view deep-dive profile details"
                >
                  {node.name}
                </span>
                <span className="text-indigo-600 font-mono text-[9px] font-semibold tracking-wide block uppercase mt-0.5 truncate">{node.role}</span>
                <span className="text-slate-400 text-[9px] block truncate mt-0.5">{node.department} • {node.id}</span>
              </div>
            </div>

            {/* End stats / Actions */}
            <div className="flex flex-col items-end gap-1.5 shrink-0 pl-1.5">
              <span className={`inline-flex items-center gap-1 font-semibold text-[8px] px-1.5 py-0.5 rounded-full border uppercase ${
                node.status === EmployeeStatus.ACTIVE ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                node.status === EmployeeStatus.ONBOARDING ? "bg-blue-50 text-blue-700 border-blue-100" :
                node.status === EmployeeStatus.LEAVE ? "bg-amber-50 text-amber-700 border-amber-100" :
                "bg-rose-50 text-rose-700 border-rose-100"
              }`}>
                {node.status}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleEditClick(node)}
                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-md cursor-pointer"
                  title="Quick Edit"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Depth Level Indicator badge */}
            <span className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-350 font-medium">Lvl {depth + 1}</span>
          </div>
          
          {/* Collapse/Expand Toggle button */}
          {hasReports && (
            <button
              type="button"
              onClick={() => setCollapsedNodes(prev => ({ ...prev, [node.id]: !prev[node.id] }))}
              className={`p-1 mt-3 bg-white border border-slate-200 rounded-full hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 shadow-3xs cursor-pointer transition-all shrink-0 ${
                isCollapsed ? "rotate-[-90deg] bg-indigo-50 text-indigo-600 border-indigo-200" : ""
              }`}
              title={isCollapsed ? `Expand ${directReports.length} reports` : `Collapse reporting tree`}
            >
              <ChevronDown className="w-3 nav h-3" />
            </button>
          )}

        </div>

        {/* Children Nested Branching list */}
        {hasReports && !isCollapsed && (
          <div className="pl-10 border-l border-dashed border-indigo-100/80 ml-5 mt-2 relative space-y-4">
            {/* Smooth transition hook details */}
            <div className="absolute left-[-1px] bottom-6 w-[2px] bg-white h-3 z-0" />
            {directReports.map((report) => 
              renderOrgNode(report, depth + 1, new Set(visited))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" id="hrms-employee-directory">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-905">{isEmployee ? "My Core Profile" : "Workforce Roster"}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEmployee 
              ? "View and verify your registered personnel details, banking direct deposits, and benefits plan choices." 
              : "Administer individual payroll credentials, general positions, and official status."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Switcher Controls */}
          {!isEmployee && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/40 mr-1">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "list" 
                    ? "bg-white text-indigo-600 shadow-2xs" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
                title="Spreadsheet Directory List View"
              >
                <Building className="w-3.5 h-3.5" />
                List
              </button>
              <button
                onClick={() => setViewMode("org")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "org" 
                    ? "bg-white text-indigo-600 shadow-2xs" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
                title="Workforce Hierarchical Org Structure Chart"
              >
                <Network className="w-3.5 h-3.5" />
                Org Structure
              </button>
            </div>
          )}

          {isHRManagement && (
            <button
              onClick={handleCreateNewClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium text-sm transition-all hover:translate-y-[-1px] cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
              Add Employee Record
            </button>
          )}
        </div>
      </div>

      {viewMode === "list" ? (
        <>
          {/* Roster Controls Panel */}
          {!isEmployee && (
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center gap-3 justify-between">
            
            {/* Search Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search records by name, email, id, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 text-slate-800 border-none outline-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Filters Group */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Department Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/50 rounded-lg px-3 py-1 text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold uppercase">Dept:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-transparent border-none text-xs font-medium focus:ring-0 cursor-pointer outline-none text-slate-800"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/50 rounded-lg px-3 py-1 text-slate-700">
                <span className="text-xs font-semibold uppercase">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-transparent border-none text-xs font-medium focus:ring-0 cursor-pointer outline-none text-slate-800"
                >
                  <option value="All">All statuses</option>
                  <option value={EmployeeStatus.ACTIVE}>Active</option>
                  <option value={EmployeeStatus.ONBOARDING}>Onboarding</option>
                  <option value={EmployeeStatus.LEAVE}>On Leave</option>
                  <option value={EmployeeStatus.TERMINATED}>Terminated</option>
                </select>
              </div>

            </div>

          </div>
          )}

          {/* Roster Table Grid layout */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
                    <th className="px-6 py-4">Employee Details</th>
                    <th className="px-6 py-4">Department & Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-indigo-700 bg-indigo-50/45 border-x border-indigo-150/20 font-bold font-sans tracking-tight rounded-t-lg transition-all duration-300">
                      <div className="flex items-center gap-1.5 justify-start">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>Annual Compensation</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => {
                      // Stylized gradient color map based on character
                      const charCodeSum = emp.name.charCodeAt(0) + emp.name.charCodeAt(emp.name.length - 1);
                      const gradients = [
                        "from-blue-400 to-indigo-500",
                        "from-purple-400 to-pink-500",
                        "from-teal-400 to-emerald-500",
                        "from-amber-400 to-orange-500"
                      ];
                      const avatarGrad = gradients[charCodeSum % gradients.length];

                      return (
                        <tr 
                          key={emp.id}
                          className="hover:bg-slate-50/40 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm shrink-0 bg-slate-100 border border-slate-200">
                                <img 
                                  src={getEmployeeAvatar(emp.name)} 
                                  alt={emp.name} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <span 
                                  onClick={() => { setViewingEmployee(emp); setIsDrawerOpen(true); }}
                                  className="font-medium text-slate-900 group-hover:text-indigo-600 cursor-pointer transition-colors block text-sm animate-pulse-once"
                                >
                                  {emp.name}
                                </span>
                                <span className="text-slate-400 text-xs font-mono">{emp.id} • {emp.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-800">{emp.role}</div>
                            <div className="text-xs text-slate-500">{emp.department}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              emp.status === EmployeeStatus.ACTIVE ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              emp.status === EmployeeStatus.ONBOARDING ? "bg-blue-50 text-blue-700 border-blue-100" :
                              emp.status === EmployeeStatus.LEAVE ? "bg-amber-50 text-amber-700 border-amber-100" :
                              "bg-rose-50 text-rose-700 border-rose-100"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                emp.status === EmployeeStatus.ACTIVE ? "bg-emerald-500" :
                                emp.status === EmployeeStatus.ONBOARDING ? "bg-blue-500" :
                                emp.status === EmployeeStatus.LEAVE ? "bg-amber-500" :
                                "bg-rose-500"
                              }`} />
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-700 font-medium text-sm">
                            {canSeeSalary(emp.id, emp.department) 
                              ? `$${emp.salary.toLocaleString("en-US")}` 
                              : "•••• (Restricted)"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => { setViewingEmployee(emp); setIsDrawerOpen(true); }}
                                className="p-1 px-2.5 text-xs text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 font-semibold rounded-md transition-colors cursor-pointer"
                              >
                                Details
                              </button>
                              {isHR && (
                                <>
                                  <button
                                    onClick={() => handleEditClick(emp)}
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                    title="Edit Record"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  {isHRManagement && (
                                    <button
                                      onClick={() => onDeleteEmployee(emp.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                      title="Terminate/Remove"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                        No matching records found in company directories.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Dynamic Organization Architect Workspace */
        <div className="space-y-6">
          {/* Main Controls Panel for Org Architect */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Network className="w-5.5 h-5.5 text-indigo-600" />
                  Dynamic Organisation Architect
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Design, manage, and inspect multi-dimensional company hierarchies. Group by command chain, global locations, or model bespoke team structures.
                </p>
              </div>

              {/* Strategy Selector tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-150 self-start xl:self-auto">
                <button
                  type="button"
                  onClick={() => setOrgSubMode("traditional")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    orgSubMode === "traditional"
                      ? "bg-white text-indigo-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                  title="Traditional Direct Supervisor Command Chain"
                >
                  <Workflow className="w-3.5 h-3.5" />
                  Chain of Command
                </button>
                <button
                  type="button"
                  onClick={() => setOrgSubMode("location")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    orgSubMode === "location"
                      ? "bg-white text-indigo-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                  title="Group workforce by registered office location or branch"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Office Locations
                </button>
                <button
                  type="button"
                  onClick={() => setOrgSubMode("custom")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    orgSubMode === "custom"
                      ? "bg-white text-indigo-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                  title="Model dynamic company pods, regional teams or chapters"
                >
                  <Users className="w-3.5 h-3.5" />
                  Custom Teams & Pods
                </button>
              </div>
            </div>

            {/* Explanatory banner for active mode */}
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  {orgSubMode === "traditional" && "Traditional Model: Reporting structures reflect the 'Supervisor' specified on each profile file."}
                  {orgSubMode === "location" && "Location Matrix: All roles grouped automatically by their office base. Reassign location inputs to see them move."}
                  {orgSubMode === "custom" && "Bespoke Units: Create customized groupings, agile squats, task forces, or regional bodies matching small or big structures."}
                </span>
              </div>
              {orgSubMode === "custom" && isHRManagement && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeam(null);
                    setTeamFormData({
                      id: "",
                      name: "",
                      type: "Agile Pod",
                      location: "New York",
                      department: "Engineering",
                      leadId: employees[0]?.id || "",
                      memberIds: [],
                      description: ""
                    });
                    setTeamFormError("");
                    setIsTeamFormOpen(true);
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold font-mono text-[10px] uppercase shadow-xs cursor-pointer transition-all shrink-0"
                >
                  + Create Unit Node
                </button>
              )}
            </div>
          </div>

          {/* VIEW: Traditional Supervisor Command Chain tree */}
          {orgSubMode === "traditional" && (
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-wider">Top-Down Reporting Tree</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border px-2 py-0.5 rounded">
                  Roots: {employees.filter(emp => !emp.managerId || !employees.some(parent => parent.id === emp.managerId)).length}
                </span>
              </div>

              <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-100 overflow-x-auto min-h-[480px]">
                <div className="space-y-6 min-w-max pb-8 pl-4 pt-2">
                  {employees.filter(emp => !emp.managerId || !employees.some(parent => parent.id === emp.managerId)).length > 0 ? (
                    employees
                      .filter(emp => !emp.managerId || !employees.some(parent => parent.id === emp.managerId))
                      .map(rootNode => renderOrgNode(rootNode))
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-sm italic">
                      No reporting structure defined yet. Edit employee records to specify their Direct Supervisors!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Geographical Location Matrix Maps */}
          {orgSubMode === "location" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from(new Set(employees.map(emp => emp.location || "New York"))).map(locName => {
                const locEmployees = employees.filter(emp => (emp.location || "New York") === locName);
                
                return (
                  <div key={locName} className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between transition-all">
                    {/* Location Card Header */}
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4.5 h-4.5 text-rose-500" />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{locName} Headquarters</h4>
                          <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">Operational Hub</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-bold">
                        {locEmployees.length} Staff
                      </span>
                    </div>

                    {/* Employee Grid List at this Location */}
                    <div className="p-4 flex-1 space-y-3 max-h-96 overflow-y-auto">
                      {locEmployees.map(emp => (
                        <div key={emp.id} className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-between group transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-white shrink-0">
                              <img 
                                src={getEmployeeAvatar(emp.name)} 
                                alt={emp.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 pr-1">
                              <span 
                                onClick={() => { setViewingEmployee(emp); setIsDrawerOpen(true); }}
                                className="font-bold text-xs text-slate-800 hover:text-indigo-600 block truncate hover:underline cursor-pointer"
                              >
                                {emp.name}
                              </span>
                              <span className="text-[9px] text-slate-400 block truncate">{emp.department} • {emp.role}</span>
                            </div>
                          </div>

                          {/* Quick relocate trigger control */}
                          <div className="shrink-0 flex items-center gap-1.5">
                            <select
                              value={emp.location || "New York"}
                              onChange={(e) => {
                                const updatedEmp = { ...emp, location: e.target.value };
                                onUpdateEmployee(updatedEmp, emp.id);
                              }}
                              className="text-[9px] font-mono font-medium outline-hidden bg-white border border-slate-200 hover:border-slate-350 px-1.5 py-0.5 rounded cursor-pointer text-slate-500"
                              title="Instant geographic relocation"
                            >
                              <option value="New York">NY</option>
                              <option value="San Francisco">SF</option>
                              <option value="London">LDN</option>
                              <option value="Bengaluru">BLR</option>
                              <option value="Mumbai">BOM</option>
                              <option value="Tokyo">TKY</option>
                              <option value="Remote">REM</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Location Card Footer statistics */}
                    <div className="p-3.5 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Unique Departments: {Array.from(new Set(locEmployees.map(e => e.department))).length}</span>
                      <span>Active Roll: {locEmployees.filter(e => e.status === EmployeeStatus.ACTIVE).length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW: Bespoke Custom Teams List & Architect Grid */}
          {orgSubMode === "custom" && (
            <div className="space-y-6">
              {customTeams.length === 0 ? (
                <div className="bg-white border border-slate-150 p-12 rounded-xl text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-150 rounded-full flex items-center justify-center text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">No Bespoke Teams Configured</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                      Your organization appears to have a flat structure. Deploy dynamic agile squads, task forces or cross-functional departments.
                    </p>
                  </div>
                  {isHRManagement && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeam(null);
                        setTeamFormData({
                          id: "",
                          name: "",
                          type: "Agile Pod",
                          location: "New York",
                          department: "Engineering",
                          leadId: employees[0]?.id || "",
                          memberIds: [],
                          description: ""
                        });
                        setTeamFormError("");
                        setIsTeamFormOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold font-mono"
                    >
                      + Initialise first Squad
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customTeams.map(team => {
                    const leadEmployee = employees.find(e => e.id === team.leadId);
                    const matchedMembers = employees.filter(e => team.memberIds.includes(e.id));

                    return (
                      <div key={team.id} className="bg-white border border-slate-155 hover:border-slate-300 rounded-xl shadow-2xs hover:shadow-xs transition-all p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group">
                        {/* Team Card Header Info */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 border border-indigo-150 rounded text-indigo-700">
                              {team.type}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isHRManagement && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTeam(team);
                                      setTeamFormData({
                                        id: team.id,
                                        name: team.name,
                                        type: team.type,
                                        location: team.location,
                                        department: team.department,
                                        leadId: team.leadId,
                                        memberIds: team.memberIds,
                                        description: team.description
                                      });
                                      setTeamFormError("");
                                      setIsTeamFormOpen(true);
                                    }}
                                    className="p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded cursor-pointer"
                                    title="Edit structural details"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTeam(team.id)}
                                    className="p-1 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded cursor-pointer"
                                    title="Decommission team structure"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors uppercase leading-tight">
                            {team.name}
                          </h4>

                          <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-450 font-semibold font-mono">
                            <span>{team.department}</span>
                            <span>•</span>
                            <span>{team.location} Office</span>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2 pr-1 pt-0.5">
                            {team.description || "No custom charter defined. Click edit to configure descriptive focal parameters."}
                          </p>
                        </div>

                        {/* Supervisor / Unit Lead card segment */}
                        <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-150 space-y-2">
                          <span className="text-[9px] uppercase font-mono font-bold text-indigo-600 tracking-wide block">Direct Supervisor / Unit Lead</span>
                          {leadEmployee ? (
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-white shadow-3xs shrink-0">
                                <img 
                                  src={getEmployeeAvatar(leadEmployee.name)} 
                                  alt={leadEmployee.name} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <span 
                                  onClick={() => { setViewingEmployee(leadEmployee); setIsDrawerOpen(true); }}
                                  className="text-xs font-bold text-slate-800 hover:text-indigo-600 hover:underline cursor-pointer block truncate"
                                  title="View full profile"
                                >
                                  {leadEmployee.name}
                                </span>
                                <span className="text-[10px] text-slate-450 block truncate">{leadEmployee.role}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic font-mono block">No supervisor assigned. Appoint an active staff lead.</span>
                          )}
                        </div>

                        {/* Subordinate Members Grid area */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase font-bold">
                            <span>Collaborators & Members</span>
                            <span>{matchedMembers.length} Members</span>
                          </div>

                          {matchedMembers.length === 0 ? (
                            <div className="py-3 text-center text-[11px] text-slate-400 italic bg-dashed rounded-lg border border-slate-200">
                              Choose employees to populate structural members!
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                              {matchedMembers.map(member => (
                                <div 
                                  key={member.id} 
                                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-250 hover:bg-slate-100 rounded-full text-[10px] font-semibold text-slate-700 hover:border-slate-350 transition-colors cursor-pointer"
                                  onClick={() => { setViewingEmployee(member); setIsDrawerOpen(true); }}
                                  title={`Inspect ${member.name} (${member.role})`}
                                >
                                  <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border bg-white">
                                    <img 
                                      src={getEmployeeAvatar(member.name)} 
                                      alt={member.name} 
                                      className="w-full h-full object-cover animate-fade-in"
                                    />
                                  </div>
                                  <span>{member.name.split(" ")[0]}</span>

                                  {isHRManagement && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const withRemoved = team.memberIds.filter(id => id !== member.id);
                                        const updatedTeams = customTeams.map(t => t.id === team.id ? { ...t, memberIds: withRemoved } : t);
                                        saveCustomTeams(updatedTeams);
                                      }}
                                      className="text-slate-400 hover:text-rose-600 hover:bg-white rounded-full p-[1px]"
                                      title="Remove from squad"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FORM: Dynamic Bespoke Team Creator / Editor Dialog Overlay */}
      {isTeamFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scale-up">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-base">{editingTeam ? "Modify Structural Unit" : "Architect Bespoke Node"}</h4>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Dynamic Org Schema Builder</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsTeamFormOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-405 hover:text-slate-655"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form body */}
            <form onSubmit={handleTeamSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {teamFormError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{teamFormError}</span>
                </div>
              )}

              {/* Node Name */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Unit / Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seattle Client Success Chapter"
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-sm text-slate-800 transition-all font-medium"
                />
              </div>

              {/* Hierarchy Node Class Type */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Hierarchy Classification</label>
                <select
                  value={teamFormData.type}
                  onChange={(e) => setTeamFormData({ ...teamFormData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-sm text-slate-800 cursor-pointer"
                >
                  <option value="Agile Pod">Agile Pod</option>
                  <option value="Regional Chapter">Regional Chapter</option>
                  <option value="Task Force">Task Force</option>
                  <option value="Corporate Command">Corporate Command</option>
                  <option value="Special Interest Council">Special Interest Council</option>
                </select>
              </div>

              {/* Geographic affiliation */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Geographic Headquarters</label>
                <select
                  value={teamFormData.location}
                  onChange={(e) => setTeamFormData({ ...teamFormData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-sm text-slate-800 cursor-pointer"
                >
                  <option value="New York">New York</option>
                  <option value="San Francisco">San Francisco</option>
                  <option value="London">London</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Tokyo">Tokyo</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              {/* Departmental alignment */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Corporate Department</label>
                <select
                  value={teamFormData.department}
                  onChange={(e) => setTeamFormData({ ...teamFormData, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-sm text-slate-800 cursor-pointer"
                >
                  {Array.from(new Set(employees.map(emp => emp.department))).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Leader Picker */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Appointed Supervisor / Lead</label>
                <select
                  value={teamFormData.leadId}
                  onChange={(e) => setTeamFormData({ ...teamFormData, leadId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-sm text-slate-800 cursor-pointer font-medium"
                >
                  <option value="">-- Choose supervisor --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              {/* Node Focus Description */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Focus & Structural Charter</label>
                <textarea
                  rows={2}
                  placeholder="Describe focus, target outcomes and responsibilities of this structural node..."
                  value={teamFormData.description}
                  onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-sm text-slate-800 resize-none transition-all"
                />
              </div>

              {/* Members Multiselect Grid */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Select Structure Members</label>
                <div className="border border-slate-200/80 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2 bg-slate-50">
                  {employees.map(emp => {
                    const isChecked = teamFormData.memberIds.includes(emp.id);
                    return (
                      <label key={emp.id} className="flex items-center gap-2.5 p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-150 select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const updatedMembers = isChecked
                              ? teamFormData.memberIds.filter(id => id !== emp.id)
                              : [...teamFormData.memberIds, emp.id];
                            setTeamFormData({ ...teamFormData, memberIds: updatedMembers });
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                        />
                        <div className="w-5.5 h-5.5 rounded-full overflow-hidden border">
                          <img 
                            src={getEmployeeAvatar(emp.name)} 
                            alt={emp.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-750 truncate leading-tight">{emp.name}</div>
                          <div className="text-[9px] text-slate-450 truncate font-mono leading-none mt-0.5">{emp.role}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTeamFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm transition-all"
                >
                  {editingTeam ? "Save Structure" : "Launch Structure Node"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Record Drawer overlay panel */}
      {isDrawerOpen && viewingEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end" id="employee-profile-drawer">
          <div className="bg-white w-full max-w-lg shadow-2xl h-full flex flex-col justify-between animate-slide-in p-6 border-l border-slate-200">
            
            {/* Drawer Header Info */}
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-xs font-mono text-slate-400 font-semibold uppercase">Profile Deep-Dive</span>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Big Avatar details & metrics */}
              <div className="flex items-center gap-4 mt-6">
                <div className="w-16 h-16 rounded-xl overflow-hidden shadow-xs border border-slate-200 shrink-0 bg-slate-100">
                  <img 
                    src={getEmployeeAvatar(viewingEmployee.name)} 
                    alt={viewingEmployee.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-950">{viewingEmployee.name}</h3>
                  <div className="text-slate-500 text-xs mt-0.5 font-mono">{viewingEmployee.id} • {viewingEmployee.email}</div>
                  <div className="mt-2 text-xs font-semibold px-2.5 py-0.5 bg-slate-100 rounded-full text-slate-700 tracking-wide inline-block">{viewingEmployee.role}</div>
                </div>
              </div>

              {/* General details group */}
              <div className="mt-8 space-y-4">
                
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Building className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Organizational Unit</span>
                    <span className="text-sm font-medium text-slate-800">{viewingEmployee.department}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <MapPin className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Primary Location / Branch</span>
                    <span className="text-sm font-medium text-slate-800">{viewingEmployee.location || "New York"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Calendar className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Joined Company</span>
                    <span className="text-sm font-medium text-slate-800 font-mono">{viewingEmployee.joinDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <DollarSign className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Contractual Salary</span>
                    <span className="text-sm font-medium text-slate-800 font-mono">
                      {canSeeSalary(viewingEmployee.id, viewingEmployee.department) 
                        ? `$${viewingEmployee.salary.toLocaleString()} /year` 
                        : "•••• (Restricted)"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <FileCheck className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Benefit Enrollment Choice</span>
                    <span className="text-sm font-medium text-slate-800">{viewingEmployee.benefitPlan}</span>
                  </div>
                </div>

                {/* Organizational Structure relationships in Drawer */}
                <div className="border border-slate-150 bg-slate-50/30 rounded-xl p-4 mt-2 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Network className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-wider">Organization Structure</span>
                  </div>

                  {/* Reports To Manager */}
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold mb-1">Reports To (Direct Supervisor)</span>
                    {viewingManager ? (
                      <button
                        onClick={() => setViewingEmployee(viewingManager)}
                        className="w-full flex items-center gap-2.5 p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition-colors cursor-pointer"
                      >
                        <div className="w-6.5 h-6.5 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                          <img 
                            src={getEmployeeAvatar(viewingManager.name)} 
                            alt={viewingManager.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-indigo-600 hover:underline">{viewingManager.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{viewingManager.role}</div>
                        </div>
                      </button>
                    ) : (
                      <div className="text-xs text-slate-500 italic bg-white p-2 border border-dashed border-slate-200 rounded-lg">
                        None / Top-Level Executive
                      </div>
                    )}
                  </div>

                  {/* Direct Reports list */}
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold mb-1.5">Direct Reports ({viewingReports.length})</span>
                    {viewingReports.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {viewingReports.map(report => (
                          <button
                            key={report.id}
                            onClick={() => setViewingEmployee(report)}
                            className="flex items-center gap-2 p-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-left transition-all cursor-pointer group"
                          >
                            <div className="w-5.5 h-5.5 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                              <img 
                                src={getEmployeeAvatar(report.name)} 
                                alt={report.name} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="truncate">
                              <div className="text-[11px] font-semibold text-slate-700 group-hover:text-indigo-600 truncate">{report.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono truncate">{report.role}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic bg-white p-2 border border-dashed border-slate-200 rounded-lg">
                        Individual Contributor (0 Reports)
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank account details section */}
                <div className="p-4 border border-indigo-50 rounded-xl mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-wider">Payroll Banking details</span>
                  </div>
                  {canSeeBank(viewingEmployee.id) ? (
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block uppercase">Bank Name</span>
                        <span className="font-semibold text-slate-700">{viewingEmployee.bankDetails?.bankName || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block uppercase">Account Number</span>
                        <span className="font-semibold text-slate-700">{viewingEmployee.bankDetails?.accountNumber || "N/A"}</span>
                      </div>
                      <div className="col-span-2 border-t border-slate-100 pt-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium block uppercase">Bank Routing Number</span>
                        <span className="font-semibold text-slate-700">{viewingEmployee.bankDetails?.routingNumber || "N/A"}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 text-center">
                      Restricted. Highly secure banking records are accessible only to corporate HR admins or self-inspection.
                    </p>
                  )}
                </div>

                {/* Leaves Balance details */}
                <div className="p-4 border border-rose-50 rounded-xl">
                  <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-wider block mb-2">Leave Metrics</span>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Leaves Taken:</span>
                    <span className="font-semibold text-slate-800 font-mono">{viewingEmployee.leavesUsed} / {viewingEmployee.leavesTotal} days</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-2" 
                      style={{ width: `${Math.min(100, (viewingEmployee.leavesUsed / viewingEmployee.leavesTotal) * 100)}%` }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Actions of Drawer */}
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => { setIsDrawerOpen(false); handleEditClick(viewingEmployee); }}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 font-semibold text-sm text-white rounded-lg transition-all text-center cursor-pointer"
              >
                Edit Complete Profile
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Slide-over Form Overlay for Adding or Editing Employee */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" id="employee-edit-modal">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl relative">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-display font-medium text-slate-900 pb-3 border-b border-slate-150 mb-5">
              {editingEmployee ? `Modify Employee: ${editingEmployee.name}` : "Create New Employee Profile"}
            </h3>

            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs leading-relaxed mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Employee ID */}
                <div>
                  <label className="text-xs uppercase font-mono text-slate-400 font-semibold block mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-101"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-sm text-slate-800 transition-all font-medium font-mono uppercase"
                  />
                </div>

                {/* Standard input name */}
                <div>
                  <label className="text-xs uppercase font-mono text-slate-400 font-semibold block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-sm text-slate-800 transition-all font-medium"
                  />
                </div>

                {/* Standard input email */}
                <div>
                  <label className="text-xs uppercase font-mono text-slate-400 font-semibold block mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. j.doe@enterprise.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-sm text-slate-800 transition-all font-medium"
                  />
                </div>

                {/* Standard input role */}
                <div>
                  <label className="text-xs uppercase font-mono text-slate-400 font-semibold block mb-1">Job Role Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Systems Architect"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-sm text-slate-800 transition-all font-medium"
                  />
                </div>

                {/* Standard select department */}
                <div>
                  <label className="text-xs uppercase font-mono text-slate-400 font-semibold block mb-1">Operational Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engineering, Sales, Compliance"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-sm text-slate-800 transition-all font-medium"
                  />
                </div>

                {/* Standard select status */}
                <div>
                  <label className="text-xs uppercase font-mono text-slate-400 font-semibold block mb-1">Employment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-sm text-slate-800 cursor-pointer"
                  >
                    <option value={EmployeeStatus.ACTIVE}>Active</option>
                    <option value={EmployeeStatus.ONBOARDING}>Onboarding</option>
                    <option value={EmployeeStatus.LEAVE}>On Leave</option>
                    <option value={EmployeeStatus.TERMINATED}>Terminated</option>
                  </select>
                </div>

                {/* Primary Location/Branch Field */}
                <div>
                  <label className="text-xs uppercase font-mono text-slate-400 font-semibold block mb-1">Office Location / Branch</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-sm text-slate-800 cursor-pointer"
                  >
                    <option value="New York">New York</option>
                    <option value="San Francisco">San Francisco</option>
                    <option value="London">London</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Tokyo">Tokyo</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                {/* Standard input Join Date */}
                <div>
                  <label className="text-xs uppercase font-mono text-slate-400 font-semibold block mb-1">Join Date / Contract Date</label>
                  <input
                    type="date"
                    required
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-sm text-slate-800 font-mono transition-colors"
                  />
                </div>

                {/* Financial Salary */}
                <div>
                  <label className="text-xs uppercase font-mono text-slate-400 font-semibold block mb-1">Contractual Salary ($ / year)</label>
                  <input
                    type={isHRManagement ? "number" : "text"}
                    disabled={!isHRManagement}
                    required={isHRManagement}
                    placeholder={isHRManagement ? "e.g. 110000" : "•••• (Restricted)"}
                    value={isHRManagement ? formData.salary : "•••• (Restricted)"}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className={`w-full px-3 py-2 border outline-none rounded-lg text-sm transition-all font-mono font-medium ${
                      isHRManagement 
                        ? "bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-800" 
                        : "bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  />
                </div>

                {/* Benefit plan assignment */}
                <div>
                  <label className="text-xs uppercase font-mono text-slate-400 font-semibold block mb-1">Benefit Allocation Plan</label>
                  <select
                    value={formData.benefitPlan}
                    onChange={(e) => setFormData({ ...formData, benefitPlan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-sm text-slate-800 cursor-pointer"
                  >
                    <option value="Pending Enrollment">Pending Enrollment</option>
                    {benefitPlans.map(plan => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>
                </div>

                {/* Direct Supervisor/Manager Selection */}
                <div>
                  <label className="text-xs uppercase font-mono text-slate-400 font-semibold block mb-1">Direct Supervisor / Manager</label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-sm text-slate-800 cursor-pointer"
                  >
                    <option value="">None / Top Level Executive</option>
                    {employees
                      .filter(emp => !editingEmployee || emp.id !== editingEmployee.id)
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.role} - {emp.department})
                        </option>
                      ))
                    }
                  </select>
                </div>

              </div>

               {/* Sub bank accounts panel */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wide bg-slate-105 bg-slate-100 px-2 py-0.5 rounded text-slate-500 block w-max">Bank Payroll Routing Credentials</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5 font-bold">Bank Name</label>
                    <input
                      type="text"
                      disabled={!isHRManagement}
                      placeholder={isHRManagement ? "e.g. JP Morgan Chase" : "•••• (Restricted)"}
                      value={isHRManagement ? formData.bankName : "•••• (Restricted)"}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className={`w-full px-3.5 py-1.5 border outline-none rounded-lg text-xs font-medium transition-all ${
                        isHRManagement 
                          ? "bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-800" 
                          : "bg-slate-100 border-slate-105 text-slate-400 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5 font-bold">Account Number</label>
                    <input
                      type="text"
                      disabled={!isHRManagement}
                      placeholder={isHRManagement ? "e.g. 123456789" : "•••• (Restricted)"}
                      value={isHRManagement ? formData.accountNumber : "•••• (Restricted)"}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className={`w-full px-3.5 py-1.5 border outline-none rounded-lg text-xs font-medium font-mono transition-all ${
                        isHRManagement 
                          ? "bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-800" 
                          : "bg-slate-100 border-slate-105 text-slate-400 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5 font-bold">Routing Number</label>
                    <input
                      type="text"
                      disabled={!isHRManagement}
                      placeholder={isHRManagement ? "e.g. 021000021" : "•••• (Restricted)"}
                      value={isHRManagement ? formData.routingNumber : "•••• (Restricted)"}
                      onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                      className={`w-full px-3.5 py-1.5 border outline-none rounded-lg text-xs font-medium font-mono transition-all ${
                        isHRManagement 
                          ? "bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-800" 
                          : "bg-slate-100 border-slate-105 text-slate-400 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* PTO Leave metrics initialization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-mono text-slate-400 block mb-1">Total PTO Leave Pool (Days / Year)</label>
                  <input
                    type="number"
                    value={formData.leavesTotal}
                    onChange={(e) => setFormData({ ...formData, leavesTotal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-sm font-mono"
                  />
                </div>
                <div className="flex items-center text-xs text-slate-500 bg-indigo-50/50 p-3 rounded-xl border border-indigo-50">
                  <p>Leaves will automatically accrue monthly according to regulatory parameters, allowing precise simulation of annual outlays.</p>
                </div>
              </div>

              {/* Form trigger buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
                >
                  {editingEmployee ? "Save Adjustments" : "Create Profile"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
