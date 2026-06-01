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
  Network
} from "lucide-react";
import { Employee, EmployeeStatus, BankDetails, getEmployeeAvatar } from "../types";

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
    managerId: ""
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
        managerId: formData.managerId ? formData.managerId : undefined
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
        managerId: formData.managerId ? formData.managerId : undefined
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
      managerId: emp.managerId || ""
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
        /* Organization Structure Tree Chart layout */
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Network className="w-5 h-5 text-indigo-600" />
                Workforce Hierarchy & Command Chain
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Visualizing direct reporting lines, structural organizational layers, and management assignments. Click names to inspect full records.
              </p>
            </div>
            {/* Quick badges statistical legends */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-150">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" />
                <span>Executive / Manager Roots</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-205 rounded-full border border-slate-300" />
                <span>Line Level Contributors</span>
              </div>
            </div>
          </div>

          {/* Org Tree Visual canvas */}
          <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-100 overflow-x-auto min-h-[450px]">
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
