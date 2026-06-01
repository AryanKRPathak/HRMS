import React, { useState } from "react";
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Printer, 
  Plus, 
  ArrowUpRight, 
  Eye, 
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle,
  X,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  FileDown,
  Search,
  Check,
  FileText
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Employee, Payslip, PayrollRun, EmployeeStatus } from "../types";

interface PayrollManagerProps {
  employees: Employee[];
  payrollRuns: PayrollRun[];
  onAddRun: (run: PayrollRun) => void;
  currentUser: any;
}

export default function PayrollManager({ employees, payrollRuns, onAddRun, currentUser }: PayrollManagerProps) {
  const [activeCycle, setActiveCycle] = useState("May 2026");
  const [bonusAllocations, setBonusAllocations] = useState<Record<string, number>>({});
  const [allowanceAllocations, setAllowanceAllocations] = useState<Record<string, number>>({});
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  // States for Payroll Variance & Risk Analytics
  const [bonusThreshold, setBonusThreshold] = useState<number>(500);
  const [allowanceThreshold, setAllowanceThreshold] = useState<number>(300);
  const [momDeltaThreshold, setMomDeltaThreshold] = useState<number>(5);
  const [resolvedAlerts, setResolvedAlerts] = useState<Record<string, "Cleared" | "Audited">>(() => ({}));
  const [varianceSearch, setVarianceSearch] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showThresholds, setShowThresholds] = useState<boolean>(false);

  // Robust fallback-equipped helper to find or construct previous cycle's payslip
  const getPreviousCyclePayslip = (empId: string, currentCycle: string) => {
    let prevCycle = "April 2026";
    if (currentCycle === "April 2026") prevCycle = "March 2026";
    else if (currentCycle === "March 2026") prevCycle = "February 2026";

    // Try finding in actual committed run
    const prevRun = payrollRuns.find(run => run.cycleId === prevCycle);
    if (prevRun && prevRun.payslips) {
      const ps = prevRun.payslips.find(p => p.employeeId === empId);
      if (ps) return ps;
    }

    // Fallback: estimate based on initial employee state
    const emp = employees.find(e => e.id === empId);
    if (!emp) return null;

    // Reject New Joiners who weren't hired/active in previous period
    if (empId === "EMP-105" && prevCycle === "April 2026") return null;

    const monthlyBasic = emp.salary / 12;
    // Default allowance is Wellness Flex fee if active, else 0
    const allowance = emp.benefitPlan.includes("Wellness") ? 100 : 0;
    const taxDeduction = monthlyBasic * 0.22;
    let benefitsDeduction = 0;
    if (emp.benefitPlan.includes("Gold")) benefitsDeduction = 650 * 0.10;
    else if (emp.benefitPlan.includes("Silver")) benefitsDeduction = 450 * 0.20;

    const netPay = (monthlyBasic + allowance) - (taxDeduction + benefitsDeduction);

    return {
      id: `PAY-${prevCycle.replace(" ", "")}-${empId}`,
      employeeId: empId,
      employeeName: emp.name,
      employeeRole: emp.role,
      employeeDepartment: emp.department,
      cycleId: prevCycle,
      basicSalary: parseFloat(monthlyBasic.toFixed(2)),
      allowances: parseFloat(allowance.toFixed(2)),
      taxDeduction: parseFloat(taxDeduction.toFixed(2)),
      benefitsDeduction: parseFloat(benefitsDeduction.toFixed(2)),
      netPay: parseFloat(netPay.toFixed(2)),
      dateProcessed: "2026-04-30",
      status: "Paid" as const
    };
  };

  // Generate variance items for activeCycle
  const generateVarianceItems = () => {
    const items: Array<{
      id: string;
      employeeId: string;
      employeeName: string;
      avatarSeed: string;
      department: string;
      role: string;
      type: "SalaryChange" | "BonusSpike" | "ReimbursementInconsistency" | "NewJoiner" | "StatusWarning";
      severity: "High" | "Medium" | "Low";
      message: string;
      originalValue: string;
      newValue: string;
    }> = [];

    activeDraftPayslips.forEach(ps => {
      const emp = employees.find(e => e.id === ps.employeeId);
      if (!emp) return;

      const prevPs = getPreviousCyclePayslip(ps.employeeId, activeCycle);
      
      // New Joiner Alert
      if (!prevPs) {
        items.push({
          id: `${ps.employeeId}-newjoiner`,
          employeeId: ps.employeeId,
          employeeName: ps.employeeName,
          avatarSeed: emp.avatarSeed,
          department: ps.employeeDepartment,
          role: ps.employeeRole,
          type: "NewJoiner",
          severity: "Medium",
          message: `Onboarding New Hire: Full salary lifecycle run initialized ($${ps.basicSalary.toLocaleString()}/mo) for onboarding staff. Confirm standard I-9 and base compliance forms.`,
          originalValue: "$0",
          newValue: `$${ps.basicSalary.toLocaleString()}`
        });

        const allowanceVal = allowanceAllocations[ps.employeeId] || 0;
        if (allowanceVal > 0) {
          items.push({
            id: `${ps.employeeId}-newjoiner-allowance`,
            employeeId: ps.employeeId,
            employeeName: ps.employeeName,
            avatarSeed: emp.avatarSeed,
            department: ps.employeeDepartment,
            role: ps.employeeRole,
            type: "ReimbursementInconsistency",
            severity: "High",
            message: `First-Month Expense Warning: Reimbursement allocation of $${allowanceVal} entered during onboarding. Must verify with VP of Engineering for authorization.`,
            originalValue: "$0",
            newValue: `$${allowanceVal}`
          });
        }
        return;
      }

      // 1. Month-over-Month Base Salary Changes
      const baseDiff = ps.basicSalary - prevPs.basicSalary;
      const baseDiffPct = prevPs.basicSalary > 0 ? (baseDiff / prevPs.basicSalary) * 100 : 0;
      if (Math.abs(baseDiffPct) > momDeltaThreshold) {
        items.push({
          id: `${ps.employeeId}-salarychange`,
          employeeId: ps.employeeId,
          employeeName: ps.employeeName,
          avatarSeed: emp.avatarSeed,
          department: ps.employeeDepartment,
          role: ps.employeeRole,
          type: "SalaryChange",
          severity: Math.abs(baseDiffPct) > 15 ? "High" : "Medium",
          message: `Base Salary delta detected: Rate adjusted from $${prevPs.basicSalary.toLocaleString()}/mo to $${ps.basicSalary.toLocaleString()}/mo (${baseDiffPct > 0 ? "+" : ""}${baseDiffPct.toFixed(1)}%). Requires updated appointment terms on digital file.`,
          originalValue: `$${prevPs.basicSalary.toLocaleString()}`,
          newValue: `$${ps.basicSalary.toLocaleString()}`
        });
      }

      // 2. Unexpected Bonus Spikes
      const bonusValue = bonusAllocations[ps.employeeId] || 0;
      if (bonusValue > bonusThreshold) {
        items.push({
          id: `${ps.employeeId}-bonusspike`,
          employeeId: ps.employeeId,
          employeeName: ps.employeeName,
          avatarSeed: emp.avatarSeed,
          department: ps.employeeDepartment,
          role: ps.employeeRole,
          type: "BonusSpike",
          severity: bonusValue > 1000 ? "High" : "Medium",
          message: `Bonus Threshold Crossed: Spot award/bonus allocation of $${bonusValue.toLocaleString()} exceeds warning threshold (Limit: $${bonusThreshold}). Audit requires physical performance appraisal documentation.`,
          originalValue: "$0",
          newValue: `$${bonusValue.toLocaleString()}`
        });
      }

      // 3. Reimbursement / Allowance Inconsistencies
      const allowanceValue = allowanceAllocations[ps.employeeId] || (emp.benefitPlan.includes("Wellness") ? 100 : 0);
      if (allowanceValue > allowanceThreshold) {
        items.push({
          id: `${ps.employeeId}-allowancehigh`,
          employeeId: ps.employeeId,
          employeeName: ps.employeeName,
          avatarSeed: emp.avatarSeed,
          department: ps.employeeDepartment,
          role: ps.employeeRole,
          type: "ReimbursementInconsistency",
          severity: "Medium",
          message: `Anomalous Allowance Limit: Cycle allowance allocation is $${allowanceValue.toLocaleString()}, exceeding standard parameter ($${allowanceThreshold}). Please cross-verify attached receipts.`,
          originalValue: `$${(emp.benefitPlan.includes("Wellness") ? 100 : 0)}`,
          newValue: `$${allowanceValue.toLocaleString()}`
        });
      }

      // 4. Status Warning during Leave
      if (emp.status === EmployeeStatus.LEAVE && allowanceValue > 0) {
        items.push({
          id: `${ps.employeeId}-leavewarning`,
          employeeId: ps.employeeId,
          employeeName: ps.employeeName,
          avatarSeed: emp.avatarSeed,
          department: ps.employeeDepartment,
          role: ps.employeeRole,
          type: "StatusWarning",
          severity: "High",
          message: `Ineligible Disbursement Flag: Staff member is on extended leave ("${emp.status}") but remains in current cycle payout for a reimbursement value of $${allowanceValue}.`,
          originalValue: "$0",
          newValue: `$${allowanceValue}`
        });
      }
    });

    return items;
  };

  // Generate aggregated data for Recharts MoM cycle breakdown
  const getRechartsData = () => {
    // April Totals
    let aprilBasic = 0;
    let aprilReimbursements = 0;
    let aprilDeductions = 0;

    // May Totals (Current draft with allocations)
    let mayBasic = 0;
    let mayReimbursements = 0;
    let mayDeductions = 0;

    employees.forEach(emp => {
      // Basic rate
      const basic = emp.salary / 12;

      // Deductions
      const tax = basic * 0.22;
      let ben = 0;
      if (emp.benefitPlan.includes("Gold")) ben = 650 * 0.10;
      else if (emp.benefitPlan.includes("Silver")) ben = 450 * 0.20;

      // April
      if (emp.id !== "EMP-105") {
        aprilBasic += basic;
        // Standard baseline allowance
        aprilReimbursements += emp.benefitPlan.includes("Wellness") ? 100 : 0;
        aprilDeductions += (tax + ben);
      }

      // May
      mayBasic += basic;
      mayReimbursements += (bonusAllocations[emp.id] || 0) + (allowanceAllocations[emp.id] || (emp.benefitPlan.includes("Wellness") ? 100 : 0));
      mayDeductions += (tax + ben);
    });

    return [
      {
        month: "April 2026 (Baseline)",
        "Basic Salary": parseFloat(aprilBasic.toFixed(0)),
        "Bonus & Reimbursements": parseFloat(aprilReimbursements.toFixed(0)),
        "Deductions": parseFloat((aprilDeductions).toFixed(0)),
      },
      {
        month: "May 2026 (Cycle Draft)",
        "Basic Salary": parseFloat(mayBasic.toFixed(0)),
        "Bonus & Reimbursements": parseFloat(mayReimbursements.toFixed(0)),
        "Deductions": parseFloat((mayDeductions).toFixed(0)),
      }
    ];
  };

  const isAdmin = currentUser.role === "Admin";
  const isHRHead = currentUser.role === "HR Head";
  const isHRAssociate = currentUser.role === "HR Associate";
  const isEmployee = currentUser.role === "Employee";

  const isHR = isAdmin || isHRHead;
  const isVP = false;
  
  // Payroll calculation helper
  const calculatePayslipData = (emp: Employee, cycle: string): Payslip => {
    const monthlyBasic = emp.salary / 12;
    const bonus = bonusAllocations[emp.id] || 0;
    const allowance = allowanceAllocations[emp.id] || (emp.benefitPlan.includes("Wellness") ? 100 : 0);
    
    // Deductions calculated programmatically
    const taxDeduction = monthlyBasic * 0.22; // 22% average flat withholding tax
    let benefitsDeduction = 0;
    if (emp.benefitPlan.includes("Gold")) benefitsDeduction = 650 * 0.10; // 10% employee contribution
    else if (emp.benefitPlan.includes("Silver")) benefitsDeduction = 450 * 0.20; // 20% employee contribution

    const netPay = (monthlyBasic + bonus + allowance) - (taxDeduction + benefitsDeduction);

    return {
      id: `PAY-${cycle.replace(" ", "")}-${emp.id}`,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeRole: emp.role,
      employeeDepartment: emp.department,
      cycleId: cycle,
      basicSalary: parseFloat(monthlyBasic.toFixed(2)),
      allowances: parseFloat(allowance.toFixed(2)),
      taxDeduction: parseFloat(taxDeduction.toFixed(2)),
      benefitsDeduction: parseFloat(benefitsDeduction.toFixed(2)),
      netPay: parseFloat(netPay.toFixed(2)),
      dateProcessed: new Date().toISOString().split("T")[0],
      status: "Draft"
    };
  };

  // Compile active draft payslip rows
  const activeDraftPayslips = employees
    .filter(e => e.status !== EmployeeStatus.TERMINATED)
    .map(emp => calculatePayslipData(emp, activeCycle));

  const totalDrawnRaw = activeDraftPayslips.reduce((sum, p) => sum + p.basicSalary, 0);
  const totalBonusesRaw = activeDraftPayslips.reduce((sum, p) => sum + p.allowances, 0);
  const totalTaxRaw = activeDraftPayslips.reduce((sum, p) => sum + p.taxDeduction, 0);
  const totalBenefitDeductionsRaw = activeDraftPayslips.reduce((sum, p) => sum + p.benefitsDeduction, 0);
  const totalNetPayrollRaw = activeDraftPayslips.reduce((sum, p) => sum + p.netPay, 0);

  // Handle Approving/Running Payroll
  const [successToast, setSuccessToast] = useState("");
  const handleApprovePayroll = () => {
    const runAlreadyExists = payrollRuns.some(p => p.cycleId === activeCycle && p.status === "Paid");
    if (runAlreadyExists) {
      alert("Payroll for this cycle has already been disbursed.");
      return;
    }

    const payslipsMarkedPaid = activeDraftPayslips.map(ps => ({
      ...ps,
      status: "Paid" as const
    }));

    const newPayrollRun: PayrollRun = {
      cycleId: activeCycle,
      status: "Paid",
      totalEmployees: payslipsMarkedPaid.length,
      netPayroll: parseFloat(totalNetPayrollRaw.toFixed(2)),
      dateProcessed: new Date().toISOString().split("T")[0],
      payslips: payslipsMarkedPaid
    };

    onAddRun(newPayrollRun);
    setSuccessToast(`Successfully approved and disbursed payroll for cycle: ${activeCycle}! Total ${payslipsMarkedPaid.length} employees paid.`);
    setTimeout(() => setSuccessToast(""), 5000);
  };

  // Adjust specific balances
  const handleBonusChange = (empId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setBonusAllocations(prev => ({ ...prev, [empId]: num }));
  };

  const handleAllowanceChange = (empId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setAllowanceAllocations(prev => ({ ...prev, [empId]: num }));
  };

  if (!isHR && !isVP) {
    // Standard employee view: Beatriz Vance or other standard employee
    const myPayslips: Payslip[] = [];
    
    // Add active draft payslip if eligible
    const activeMe = employees.find(e => e.id === currentUser.id);
    if (activeMe) {
      myPayslips.push(calculatePayslipData(activeMe, activeCycle));
    }
    
    // Gather all historical payslips for current user
    payrollRuns.forEach(run => {
      const ps = run.payslips?.find(slip => slip.employeeId === currentUser.id);
      if (ps) {
        myPayslips.push({
          ...ps,
          dateProcessed: run.dateProcessed // align date
        });
      }
    });

    return (
      <div className="space-y-8 animate-fade-in" id="hrms-payroll-manager">
        {/* Header sections */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">My Pay & Statements</h2>
            <p className="text-sm text-slate-500 mt-1">
              View historical digital pay receipts, active deductions breakdown, and benefits allocation history.
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 font-mono">
            Role: {currentUser.role}
          </div>
        </div>

        {/* Dynamic Personal Financial Summary Cards */}
        {activeMe && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 text-white rounded-lg p-6 border border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono tracking-widest text-indigo-200 uppercase">My Annual Compensation</span>
                <div className="text-4xl font-display font-bold text-white mt-4">
                  ${activeMe.salary.toLocaleString("en-US")}
                </div>
              </div>
              <div className="border-t border-slate-800 pt-4 mt-6 text-xs text-slate-400">
                Monthly Basic Rate: ${(activeMe.salary / 12).toLocaleString("en-US", { maximumFractionDigits: 2 })} / mo
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-wider">Plan & Deductions Summary</span>
                <p className="text-xs text-slate-500 mt-1">Based on "{activeMe.benefitPlan || "No Active Plan"}" enrollment</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Withholding Tax Estimator:</span>
                    <span>22.0%</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Personal Health Contribution:</span>
                    <span>{activeMe.benefitPlan.includes("Gold") ? "10%" : activeMe.benefitPlan.includes("Silver") ? "20%" : "0%"}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 font-mono">
                Changes to withholdings require corporate HR authorization.
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-wider">Payroll Banking Endpoint</span>
                <p className="text-xs text-slate-500 mt-1 font-sans">Wired directly to your routing node</p>
                <div className="mt-4 space-y-2 text-xs text-slate-600 font-mono">
                  <div>Bank: <span className="font-semibold text-slate-800">{activeMe.bankDetails?.bankName || "N/A"}</span></div>
                  <div>Account: <span className="font-semibold text-slate-800">{activeMe.bankDetails?.accountNumber || "N/A"}</span></div>
                </div>
              </div>
              <div className="border-t border-slate-150 pt-3 mt-4 text-[10px] text-indigo-655 text-indigo-600 font-mono">
                Managed securely in the Workforce directory.
              </div>
            </div>
          </div>
        )}

        {/* List of personal payslips */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-lg font-display font-medium text-slate-900">Compensation Statements and Invoices</h3>
            <p className="text-xs text-slate-500 mt-0.5">Click "View Statement" to open an official itemized A4 digital invoice compatible with tax reporting.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
                  <th className="px-6 py-4">Statements Cycle</th>
                  <th className="px-6 py-4">Basic Monthly</th>
                  <th className="px-6 py-4 font-mono">Incentive Bonuses</th>
                  <th className="px-6 py-4 font-mono">Statutory Deductions</th>
                  <th className="px-6 py-4">Total Net Credit</th>
                  <th className="px-6 py-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 divide-dashed">
                {myPayslips.length > 0 ? (
                  myPayslips.map((slip, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900 text-sm block">{slip.cycleId} Invoice</span>
                        <span className="text-[11px] text-slate-400 font-mono">Cleared & Disbursed on {slip.dateProcessed}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">
                        ${slip.basicSalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-700">
                        ${slip.allowances.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-rose-600 font-mono font-medium block">-${(slip.taxDeduction + slip.benefitsDeduction).toFixed(2)}</span>
                        <span className="text-[9px] text-slate-400 font-mono">Tax: ${slip.taxDeduction.toFixed(0)} | Prem: ${slip.benefitsDeduction.toFixed(0)}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-bold text-emerald-600">
                        ${slip.netPay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedPayslip(slip)}
                          className="inline-flex items-center gap-1 px-3 py-1 border border-indigo-100 rounded-md text-xs font-semibold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Statement
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                      No disbursed pay slips or receipts committed to ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Corporate payslip A4 overlay modal */}
        {selectedPayslip && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" id="payslip-detail-modal">
            <div className="bg-white border border-slate-200 rounded-lg w-full max-w-2xl shadow-xl p-8 relative max-h-[92vh] overflow-y-auto font-sans">
              <button 
                onClick={() => setSelectedPayslip(null)}
                className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer no-print"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Print Header */}
              <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-6 mb-6">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold tracking-widest">OFFICIAL SALARY RECORD</span>
                  <h4 className="text-xl font-display font-extrabold text-slate-900">ENTERPRISE RESOURCES INC.</h4>
                  <p className="text-xs text-slate-500 mt-1">100 Corporate Parkway, Suite 500<br/>San Francisco, CA 94107<br/>Employer Tax ID: US-88019283-K</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-medium text-slate-500">Payslip Serial</span>
                  <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{selectedPayslip.id}</div>
                  <div className="mt-4 text-xs font-mono bg-indigo-50 border border-indigo-150 rounded px-2.5 py-1 text-indigo-700 font-bold uppercase inline-block">
                    CYCLE: {selectedPayslip.cycleId}
                  </div>
                </div>
              </div>

              {/* Employee profile metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg text-xs mb-6 border border-slate-200/65 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">EMPLOYEE NAME</span>
                  <span className="font-bold text-slate-800">{selectedPayslip.employeeName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">DEPARTMENT</span>
                  <span className="font-semibold text-slate-700">{selectedPayslip.employeeDepartment}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">JOB ROLE</span>
                  <span className="font-semibold text-slate-700">{selectedPayslip.employeeRole}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">DATE DISBURSED</span>
                  <span className="font-semibold text-slate-700">{selectedPayslip.dateProcessed}</span>
                </div>
              </div>

              {/* Earnings vs Deductions Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Earnings */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block border-b pb-1.5">Earnings</span>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Basic Monthly Pay:</span>
                      <span className="font-semibold text-slate-800">${selectedPayslip.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Allowances / Comforts:</span>
                      <span className="font-semibold text-slate-800">${selectedPayslip.allowances.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-800">
                      <span>Gross Total Earnings:</span>
                      <span>${(selectedPayslip.basicSalary + selectedPayslip.allowances).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block border-b pb-1.5">Deductions</span>
                  <div className="space-y-2 font-mono text-rose-700 font-bold">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-540 font-semibold font-sans">Federal Insurance Withholding (22%):</span>
                      <span>-${selectedPayslip.taxDeduction.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-540 font-semibold font-sans">Health Coverage Plan Split:</span>
                      <span>-${selectedPayslip.benefitsDeduction.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-rose-800">
                      <span>Total Deductions:</span>
                      <span>-${(selectedPayslip.taxDeduction + selectedPayslip.benefitsDeduction).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Net Pay Section */}
              <div className="bg-slate-900 text-white rounded-xl p-5 mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-indigo-300 block uppercase font-bold">NET CASH PAYOUT</span>
                  <span className="text-[10px] text-slate-450 mt-0.5 block leading-tight">Credited directly to corporate banking routing account.</span>
                </div>
                <div className="text-3xl font-display font-bold font-mono tracking-tight text-white">
                  ${selectedPayslip.netPay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Bottom Actions for Payslip */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-2.5 no-print">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  Print Payslip
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Close Invoice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="hrms-payroll-manager">
      
      {/* Dynamic alerts */}
      {successToast && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-3 shadow-xs animate-fade-in font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm font-medium">{successToast}</div>
        </div>
      )}

      {/* Header sections */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Financial & Payroll Center</h2>
          <p className="text-sm text-slate-500 mt-1">
            Reconcile active employee earnings profiles, add performance bonuses, process tax withholdings, and view official corporate payslips.
          </p>
        </div>
        
        {/* Cycle selector tab trigger */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 shadow-xs rounded-lg">
          <span className="text-xs uppercase font-mono text-slate-400 font-bold">Active Pay Cycle:</span>
          <select 
            value={activeCycle}
            onChange={(e) => setActiveCycle(e.target.value)}
            className="text-sm font-semibold text-slate-800 bg-transparent outline-none border-none cursor-pointer"
          >
            <option value="May 2026">May 2026 (Active Draft)</option>
            <option value="April 2026">April 2026 (Cleared)</option>
            <option value="March 2026">March 2026 (Cleared)</option>
          </select>
        </div>
      </div>

      {/* Numerical Payroll calculation breakdown card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left main counters */}
        <div className="bg-slate-900 text-white rounded-lg p-6 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs font-mono tracking-widest text-indigo-200">
              <span>LEDGER RATE</span>
              <span className="bg-indigo-600 px-2 py-0.5 rounded-full text-[10px] text-white">Active Draft</span>
            </div>
            <div className="mt-6">
              <span className="text-[11px] text-slate-400 font-medium font-sans">Net Cash Outflow</span>
              <div className="text-4xl font-display font-bold text-white mt-1">
                ${totalNetPayrollRaw.toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 mt-6 flex justify-between items-center text-xs text-slate-400">
            <span>Cycle: {activeCycle}</span>
            <span>Total: {activeDraftPayslips.length} Employees</span>
          </div>
        </div>

        {/* Deductions visual balance card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-wider">Statutory Deductions Breakdown</span>
            <div className="mt-4 space-y-3.5">
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Flat Federal Tax W/H (22%):</span>
                <span className="font-mono font-bold text-slate-800">${totalTaxRaw.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: "70%" }} />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Corporate Health Benefits Premium-splits:</span>
                <span className="font-mono font-bold text-slate-800">${totalBenefitDeductionsRaw.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: "30%" }} />
              </div>

            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 font-mono">
            Withholdings accrue back in standard corporate accounts.
          </div>
        </div>

        {/* Allowance values */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-wider">Bonuses & Benefits Allowances</span>
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">Total Allocated Bonuses:</span>
                <span className="text-2xl font-mono font-bold text-indigo-600">
                  ${Object.values(bonusAllocations).reduce((sum, v) => sum + v, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">Total Active Reimbursements:</span>
                <span className="text-base font-mono font-semibold text-slate-800">
                  ${Object.values(allowanceAllocations).reduce((sum, v) => sum + v, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleApprovePayroll}
            className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white hover:text-indigo-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
          >
            Disburse Current Ledger Cycles
          </button>
        </div>

      </div>

      {/* Dynamic Payroll Variance & Audit Report */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden" id="payroll-variance-report">
        <div className="p-5 border-b border-rose-100 bg-rose-50/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-slate-900">Payroll Variance & Risk Report</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluates May 2026 active draft cycle against April historical baseline to identify salary deltas, unexpected bonuses, or compliance deviations.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => setShowThresholds(!showThresholds)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                showThresholds
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {showThresholds ? "Hide Threshold Controls" : "Adjust Audit Parameters"}
            </button>
            <button
              onClick={() => {
                const items = generateVarianceItems();
                const headers = ["Employee ID", "Employee Name", "Department", "Role", "Variance Type", "Severity", "Baseline Value", "Current Value", "Message", "Verification Status"];
                const rows = items.map(item => [
                  item.employeeId,
                  item.employeeName,
                  item.department,
                  item.role,
                  item.type,
                  item.severity,
                  item.originalValue,
                  item.newValue,
                  `"${item.message.replace(/"/g, '""')}"`,
                  resolvedAlerts[item.id] || "Pending HR Verification"
                ]);

                const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `payroll_variance_report_May_2026.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-150 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              Export Variance CSV
            </button>
            <button
              onClick={() => {
                const items = generateVarianceItems();
                const updated: Record<string, "Cleared" | "Audited"> = {};
                items.forEach(it => {
                  updated[it.id] = "Cleared";
                });
                setResolvedAlerts(updated);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-55 bg-emerald-50 border border-emerald-150 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Fast-Track Approve All
            </button>
          </div>
        </div>

        {/* Setting Sliders Drawer */}
        {showThresholds && (
          <div className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in text-xs text-slate-700">
            <div className="space-y-2">
              <label className="font-mono uppercase font-bold text-slate-500 tracking-wider block">
                Bonus Warning Ceiling: <span className="text-indigo-655 text-indigo-600 font-bold">${bonusThreshold}</span>
              </label>
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={bonusThreshold}
                onChange={(e) => setBonusThreshold(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <p className="text-[10px] text-slate-400">Flag performance or spot awards exceeding this cash rate.</p>
            </div>

            <div className="space-y-2">
              <label className="font-mono uppercase font-bold text-slate-500 tracking-wider block">
                Allowance Warning Ceiling: <span className="text-indigo-655 text-indigo-600 font-bold">${allowanceThreshold}</span>
              </label>
              <input
                type="range"
                min="50"
                max="2000"
                step="25"
                value={allowanceThreshold}
                onChange={(e) => setAllowanceThreshold(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <p className="text-[10px] text-slate-400">Flag wellness, internet, or WFH reimbursement claims above limit.</p>
            </div>

            <div className="space-y-2">
              <label className="font-mono uppercase font-bold text-slate-500 tracking-wider block">
                MoM Base Salary Delta Warning: <span className="text-indigo-655 text-indigo-600 font-bold">{momDeltaThreshold}%</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={momDeltaThreshold}
                onChange={(e) => setMomDeltaThreshold(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <p className="text-[10px] text-slate-400">Flag base contract hourly/monthly pay shifts between cycles.</p>
            </div>
          </div>
        )}

        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Chart Workspace Container (LHS) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-wider">Month-over-Month Outflow Swing</span>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Aggregated cash variance of May draft vs April disbursed cycles.
              </p>
            </div>

            {/* Recharts chart representation */}
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getRechartsData()}
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    formatter={(value) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                  <Bar dataKey="Basic Salary" fill="#6366f1" name="Basic Salary" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Bonus & Reimbursements" fill="#fbbf24" name="Allowances & Bonuses" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Deductions" fill="#f43f5e" name="Statutory Deductions" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-50 border border-slate-150 rounded-lg p-3.5 text-xs">
              <div className="flex justify-between font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>Summary metric</span>
                <span>Delta Variance</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-600">Total Net Outflow Shift:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {(() => {
                      const data = getRechartsData();
                      // Calculate net difference
                      const aprilNet = data[0]["Basic Salary"] + data[0]["Bonus & Reimbursements"] - data[0]["Deductions"];
                      const mayNet = data[1]["Basic Salary"] + data[1]["Bonus & Reimbursements"] - data[1]["Deductions"];
                      const diff = mayNet - aprilNet;
                      const pct = aprilNet > 0 ? (diff / aprilNet) * 100 : 0;
                      return (
                        <span className={diff > 0 ? "text-rose-600" : "text-emerald-600"}>
                          {diff > 0 ? "+" : ""}${diff.toLocaleString("en-US", { maximumFractionDigits: 0 })} ({diff > 0 ? "+" : ""}{pct.toFixed(1)}%)
                        </span>
                      );
                    })()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-450 leading-normal">
                  *Gross changes caused primarily by <strong className="font-semibold text-indigo-700">onboarding events</strong> and <strong className="font-semibold text-indigo-700">manual bonus adjustments</strong> in current cycle.
                </div>
              </div>
            </div>
          </div>

          {/* Table list of Flags (RHS) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Search and Quick Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search flag by staff name or role..."
                  value={varianceSearch}
                  onChange={(e) => setVarianceSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-150 focus:border-indigo-300 outline-none"
                />
              </div>
              
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white cursor-pointer outline-none"
              >
                <option value="All">All Severities</option>
                <option value="High">⚠️ High Severity</option>
                <option value="Medium">⚡ Medium</option>
                <option value="Low">ℹ️ Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white cursor-pointer outline-none"
              >
                <option value="All">All Verification Statuses</option>
                <option value="Pending">🛡️ Pending Actions</option>
                <option value="Cleared">✅ Cleared & Verified</option>
                <option value="Audited">📁 Flagged for Audit</option>
              </select>
            </div>

            {/* Warning Flags Grid List */}
            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {(() => {
                const items = generateVarianceItems();
                
                // Filtering logic
                const filtered = items.filter(it => {
                  const matchesSearch = it.employeeName.toLowerCase().includes(varianceSearch.toLowerCase()) || 
                                        it.role.toLowerCase().includes(varianceSearch.toLowerCase()) || 
                                        it.department.toLowerCase().includes(varianceSearch.toLowerCase()) || 
                                        it.message.toLowerCase().includes(varianceSearch.toLowerCase());
                  
                  const matchesSeverity = severityFilter === "All" || it.severity === severityFilter;
                  
                  const status = resolvedAlerts[it.id] || "Pending";
                  const matchesStatus = statusFilter === "All" || 
                                        (statusFilter === "Pending" && status === "Pending") || 
                                        (statusFilter === "Cleared" && status === "Cleared") || 
                                        (statusFilter === "Audited" && status === "Audited");

                  return matchesSearch && matchesSeverity && matchesStatus;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                      <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      No matching check failures or variances flagged in this view.
                    </div>
                  );
                }

                return filtered.map((item) => {
                  const status = resolvedAlerts[item.id] || "Pending";
                  const isCleared = status === "Cleared";
                  const isAudited = status === "Audited";

                  return (
                    <div
                      key={item.id}
                      className={`p-4 border transition-all rounded-lg flex flex-col md:flex-row justify-between gap-4 ${
                        isCleared
                          ? "bg-emerald-50/20 border-emerald-150/60 opacity-80"
                          : isAudited
                          ? "bg-amber-50/10 border-amber-250/60"
                          : item.severity === "High"
                          ? "bg-rose-50/30 border-rose-150 shadow-xs"
                          : "bg-slate-50/50 border-slate-200"
                      }`}
                    >
                      {/* Left: Info Grid */}
                      <div className="flex gap-3 items-start">
                        {/* Status Icon */}
                        <div className="mt-0.5 shrink-0">
                          {isCleared ? (
                            <div className="p-1.5 bg-emerald-100 rounded text-emerald-600">
                              <Check className="w-4 h-4" />
                            </div>
                          ) : isAudited ? (
                            <div className="p-1.5 bg-amber-100 rounded text-amber-600">
                              <FileText className="w-4 h-4" />
                            </div>
                          ) : item.severity === "High" ? (
                            <div className="p-1.5 bg-rose-100 rounded text-rose-600 animate-pulse">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="p-1.5 bg-slate-100 rounded text-slate-500">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        {/* Content text */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-semibold text-slate-900 text-xs">{item.employeeName}</span>
                            <span className="text-[10px] text-slate-450 font-mono">
                              {item.role} • {item.department}
                            </span>
                          </div>
                          
                          <p className={`text-[11px] leading-relaxed text-slate-600 ${isCleared ? "line-through text-slate-400" : ""}`}>
                            {item.message}
                          </p>

                          {/* Delta metrics strip */}
                          <div className="flex items-center gap-4 pt-1 text-[10px] font-mono text-slate-500">
                            <div>
                              Baseline: <span className="font-semibold text-slate-700">{item.originalValue}</span>
                            </div>
                            <div>
                              Current Draft: <span className="font-semibold text-indigo-700">{item.newValue}</span>
                            </div>
                            {item.severity === "High" && (
                              <span className="text-rose-600 font-semibold px-1.5 py-0.5 bg-rose-50 border border-rose-100 rounded-[4px] text-[9px]">
                                Critical Block
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions Column */}
                      <div className="flex md:flex-col items-center md:items-end justify-end gap-2 shrink-0 self-start md:self-center">
                        {/* Resolved Badge */}
                        {status !== "Pending" ? (
                          <div className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${isCleared ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {isCleared ? "VERIFIED LEDGER-SAFE" : "AUDIT FLAGGED"}
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wide">
                            Pending Review
                          </span>
                        )}

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setResolvedAlerts(prev => ({
                                ...prev,
                                [item.id]: prev[item.id] === "Cleared" ? "Pending" as any : "Cleared"
                              }));
                            }}
                            className={`p-1.5 border rounded-lg hover:bg-slate-50 transition-all cursor-pointer ${
                              isCleared 
                                ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700" 
                                : "bg-white border-slate-200 text-slate-600"
                            }`}
                            title={isCleared ? "Reset Status" : "Acknowledge as Verified & Clean"}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setResolvedAlerts(prev => ({
                                ...prev,
                                [item.id]: prev[item.id] === "Audited" ? "Pending" as any : "Audited"
                              }));
                            }}
                            className={`p-1.5 border rounded-lg hover:bg-slate-50 transition-all cursor-pointer ${
                              isAudited 
                                ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600" 
                                : "bg-white border-slate-200 text-slate-600"
                            }`}
                            title={isAudited ? "Reset Status" : "Flag for Deeper Audit Check"}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                });
              })()}
            </div>

          </div>

        </div>
      </div>

      {/* Main calculation sheet Grid */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-lg font-display font-medium text-slate-900">Current Pay Cycle Allocation Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">Input employee performance bonuses or wellness adjustments to update local net allocations before disburse.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
                <th className="px-6 py-4">Employee Details</th>
                <th className="px-6 py-4">Basic Monthly ($)</th>
                <th className="px-6 py-4">Bonus Incentive ($)</th>
                <th className="px-6 py-4">Allowances ($)</th>
                <th className="px-6 py-4 font-mono text-center">Taxes & Ded. ($)</th>
                <th className="px-6 py-4">Net Payout ($)</th>
                <th className="px-6 py-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 divide-dashed">
              {activeDraftPayslips.map((payslip) => (
                <tr key={payslip.employeeId} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-3.5">
                    <span className="font-semibold text-slate-900 text-sm block">{payslip.employeeName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{payslip.employeeRole} • {payslip.employeeDepartment}</span>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-700">
                    ${payslip.basicSalary.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5">
                    <input
                      type="number"
                      placeholder="0"
                      value={bonusAllocations[payslip.employeeId] || ""}
                      onChange={(e) => handleBonusChange(payslip.employeeId, e.target.value)}
                      className="w-24 px-2 py-1 border border-slate-200/80 rounded font-mono text-xs focus:ring-1 focus:ring-indigo-100 text-slate-800 outline-none"
                    />
                  </td>
                  <td className="px-6 py-3.5">
                    <input
                      type="number"
                      placeholder="0"
                      value={allowanceAllocations[payslip.employeeId] || ""}
                      onChange={(e) => handleAllowanceChange(payslip.employeeId, e.target.value)}
                      className="w-24 px-2 py-1 border border-slate-200/80 rounded font-mono text-xs focus:ring-1 focus:ring-indigo-100 text-slate-800 outline-none"
                    />
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <div className="text-xs text-rose-600 font-mono font-medium">
                      -${(payslip.taxDeduction + payslip.benefitsDeduction).toFixed(2)}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      Tax: ${payslip.taxDeduction.toFixed(0)} | Premium: ${payslip.benefitsDeduction.toFixed(0)}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-sm font-bold text-slate-800">
                    ${payslip.netPay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedPayslip(payslip)}
                      className="inline-flex items-center gap-1 px-3 py-1 border border-indigo-100 rounded-md text-xs font-semibold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Payroll logs */}
      <div className="bg-white border border-slate-200 p-6 rounded-lg">
        <h3 className="text-lg font-display font-medium text-slate-900 mb-3 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          Disbursed Ledgers Archive
        </h3>
        <p className="text-xs text-slate-500 mb-4">Past cleared runs automatically committed to company ledgers.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {payrollRuns.map((p, idx) => (
            <div key={idx} className="p-4 border border-slate-200 rounded-lg flex flex-col justify-between bg-slate-50/50">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-slate-800 text-sm block">{p.cycleId} Run</span>
                <span className="text-[10px] uppercase font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                  {p.status}
                </span>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold block">Net Payout Outlay</span>
                  <span className="font-mono text-base font-bold text-slate-800">${p.netPayroll.toLocaleString()}</span>
                </div>
                <div className="text-right text-xs font-mono text-slate-400">
                  <span>{p.totalEmployees} employees paid</span>
                  <div className="text-[10px]">{p.dateProcessed}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Corporate payslip A4 overlay modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" id="payslip-detail-modal">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-2xl shadow-xl p-8 relative max-h-[92vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedPayslip(null)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer no-print"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print Header */}
            <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-6 mb-6">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold tracking-widest">OFFICIAL SALARY RECORD</span>
                <h4 className="text-xl font-display font-extrabold text-slate-900">ENTERPRISE RESOURCES INC.</h4>
                <p className="text-xs text-slate-500 mt-1">100 Corporate Parkway, Suite 500<br/>San Francisco, CA 94107<br/>Employer Tax ID: US-88019283-K</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-medium text-slate-500">Payslip Serial</span>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{selectedPayslip.id}</div>
                <div className="mt-4 text-xs font-mono bg-indigo-50 border border-indigo-150 rounded px-2.5 py-1 text-indigo-700 font-bold uppercase inline-block">
                  CYCLE: {selectedPayslip.cycleId}
                </div>
              </div>
            </div>

            {/* Employee profile metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg text-xs mb-6 border border-slate-200/65 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">EMPLOYEE NAME</span>
                <span className="font-bold text-slate-800">{selectedPayslip.employeeName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">DEPARTMENT</span>
                <span className="font-semibold text-slate-700">{selectedPayslip.employeeDepartment}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">JOB ROLE</span>
                <span className="font-semibold text-slate-700">{selectedPayslip.employeeRole}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">DATE DISBURSED</span>
                <span className="font-semibold text-slate-700">{selectedPayslip.dateProcessed}</span>
              </div>
            </div>

            {/* Earnings vs Deductions Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Earnings */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block border-b pb-1.5">Earnings</span>
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Basic Monthly Pay:</span>
                    <span className="font-semibold text-slate-800">${selectedPayslip.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Allowances / Comforts:</span>
                    <span className="font-semibold text-slate-800">${selectedPayslip.allowances.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-800">
                    <span>Gross Total Earnings:</span>
                    <span>${(selectedPayslip.basicSalary + selectedPayslip.allowances).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block border-b pb-1.5">Deductions</span>
                <div className="space-y-2 font-mono text-rose-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Federal Insurance Withholding (22%):</span>
                    <span>-${selectedPayslip.taxDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Health Coverage Plan Split:</span>
                    <span>-${selectedPayslip.benefitsDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-rose-800">
                    <span>Total Deductions:</span>
                    <span>-${(selectedPayslip.taxDeduction + selectedPayslip.benefitsDeduction).toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Total Net Pay Section */}
            <div className="bg-slate-900 text-white rounded-xl p-5 mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-indigo-300 block uppercase font-bold">NET CASH PAYOUT</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">Credited directly to corporate banking routing account.</span>
              </div>
              <div className="text-3xl font-display font-bold font-mono tracking-tight text-white">
                ${selectedPayslip.netPay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Bottom Actions for Payslip */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-2.5 no-print">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                Print Payslip
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close Invoice
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
