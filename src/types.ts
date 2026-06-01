export enum EmployeeStatus {
  ACTIVE = "Active",
  ONBOARDING = "Onboarding",
  TERMINATED = "Terminated",
  LEAVE = "On Leave"
}

export enum BenefitType {
  HEALTH = "Health Insurance",
  RETIREMENT = "401(k) Retirement Plan",
  WELLNESS = "Wellness Allowance",
  LIFE_INSURANCE = "Life Insurance"
}

export enum LeaveStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected"
}

export enum LeaveType {
  ANNUAL = "Annual Leave",
  MEDICAL = "Medical Leave",
  UNPAID = "Unpaid Leave",
  PARENTAL = "Parental Leave"
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: EmployeeStatus;
  salary: number;
  joinDate: string;
  benefitPlan: string;
  bankDetails: BankDetails;
  leavesUsed: number;
  leavesTotal: number;
  avatarSeed: string; // for seeding beautiful gradient avatars
  managerId?: string;
  shiftId?: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  employeeDepartment: string;
  cycleId: string; // e.g. "May 2026"
  basicSalary: number;
  allowances: number;
  taxDeduction: number;
  benefitsDeduction: number;
  netPay: number;
  dateProcessed: string;
  status: "Draft" | "Processed" | "Paid";
}

export interface PayrollRun {
  cycleId: string;
  status: "Draft" | "Processed" | "Paid";
  totalEmployees: number;
  netPayroll: number;
  dateProcessed: string;
  payslips: Payslip[];
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDept: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: LeaveStatus;
  reason: string;
  submittedDate: string;
}

export interface BenefitPlan {
  id: string;
  name: string;
  type: BenefitType;
  coverageDetails: string;
  monthlyCost: number;
  description: string;
  employerContribution: number; // percentage
}

export interface DocumentDraft {
  type: "OfferLetter" | "PromotionLetter" | "WarningLetter" | "PerformanceReview";
  employeeName: string;
  details: string; // e.g. custom terms, notes
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "General" | "Policy" | "Event" | "Urgent";
  datePosted: string;
  postedBy: string;
  important: boolean;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "17:00"
  workDays: string[]; // e.g. ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  color: string; // Tailwind bg color class for tags
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDept: string;
  date: string; // e.g. "2026-05-21"
  checkIn: string; // ISO timestamp or HH:MM
  checkOut?: string; // ISO timestamp or HH:MM
  status: "Present" | "Late" | "Absent" | "On Leave" | "Half Day";
  hoursWorked?: number;
  notes?: string;
  shiftName?: string;
}

export function getEmployeeAvatar(employeeName: string | undefined | null): string {
  if (!employeeName) {
    return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80";
  }
  const name = employeeName.trim().toLowerCase();
  if (name.includes("alexander") || name.includes("mercer") || name.includes("alex")) {
    return "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80";
  }
  if (name.includes("beatriz") || name.includes("vance")) {
    return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80";
  }
  if (name.includes("cassian") || name.includes("rook")) {
    return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80";
  }
  if (name.includes("diana") || name.includes("prince")) {
    return "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80";
  }
  if (name.includes("elijah") || name.includes("sterling")) {
    return "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80";
  }
  if (name.includes("fiona") || name.includes("gallagher")) {
    return "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80";
  }
  
  // Hash fallback
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 6;
  const fallbacks = [
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&h=150&q=80"
  ];
  return fallbacks[index];
}


