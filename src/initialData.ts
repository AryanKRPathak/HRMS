import { Employee, EmployeeStatus, BenefitPlan, BenefitType, LeaveRequest, LeaveStatus, LeaveType, Announcement, Shift, AttendanceRecord } from "./types";

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "EMP-100",
    name: "Arjun Sharma",
    email: "arjun.sharma@enterprise.io",
    role: "Super Admin",
    department: "Executive Office",
    status: EmployeeStatus.ACTIVE,
    salary: 220000,
    joinDate: "2019-01-15",
    benefitPlan: "Health Premium Gold",
    bankDetails: {
      bankName: "HDFC Bank",
      accountNumber: "•••• •••• 9911",
      routingNumber: "021000021"
    },
    leavesUsed: 1,
    leavesTotal: 30,
    avatarSeed: "arjun"
  },
  {
    id: "EMP-101",
    name: "Alexander Mercer",
    email: "a.mercer@enterprise.io",
    role: "VP of Engineering",
    department: "Engineering",
    status: EmployeeStatus.ACTIVE,
    salary: 165000,
    joinDate: "2022-03-15",
    benefitPlan: "Health Premium Gold",
    bankDetails: {
      bankName: "Chase Bank",
      accountNumber: "•••• •••• 4210",
      routingNumber: "021000021"
    },
    leavesUsed: 4,
    leavesTotal: 20,
    avatarSeed: "alex"
  },
  {
    id: "EMP-102",
    name: "Beatriz Vance",
    email: "b.vance@enterprise.io",
    role: "Senior UX Designer",
    department: "Product UX",
    status: EmployeeStatus.ACTIVE,
    salary: 115000,
    joinDate: "2023-01-10",
    benefitPlan: "Health Standard Silver",
    bankDetails: {
      bankName: "Wells Fargo",
      accountNumber: "•••• •••• 1928",
      routingNumber: "121000248"
    },
    leavesUsed: 6,
    leavesTotal: 18,
    avatarSeed: "beatriz",
    managerId: "EMP-101"
  },
  {
    id: "EMP-103",
    name: "Cassian Rook",
    email: "c.rook@enterprise.io",
    role: "Senior Software Engineer",
    department: "Engineering",
    status: EmployeeStatus.ACTIVE,
    salary: 135000,
    joinDate: "2021-08-22",
    benefitPlan: "Health Premium Gold",
    bankDetails: {
      bankName: "Bank of America",
      accountNumber: "•••• •••• 7644",
      routingNumber: "026009593"
    },
    leavesUsed: 8,
    leavesTotal: 20,
    avatarSeed: "cassian",
    managerId: "EMP-101"
  },
  {
    id: "EMP-104",
    name: "Diana Prince",
    email: "d.prince@enterprise.io",
    role: "HR Director",
    department: "Human Resources",
    status: EmployeeStatus.ACTIVE,
    salary: 125000,
    joinDate: "2020-05-18",
    benefitPlan: "Health Premium Gold",
    bankDetails: {
      bankName: "Chase Bank",
      accountNumber: "•••• •••• 6052",
      routingNumber: "021000021"
    },
    leavesUsed: 2,
    leavesTotal: 25,
    avatarSeed: "diana"
  },
  {
    id: "EMP-105",
    name: "Elijah Sterling",
    email: "e.sterling@enterprise.io",
    role: "Growth Marketer",
    department: "Marketing & Growth",
    status: EmployeeStatus.ONBOARDING,
    salary: 82000,
    joinDate: "2026-05-15",
    benefitPlan: "Pending Enrollment",
    bankDetails: {
      bankName: "Citibank",
      accountNumber: "•••• •••• 5591",
      routingNumber: "021000089"
    },
    leavesUsed: 0,
    leavesTotal: 15,
    avatarSeed: "elijah",
    managerId: "EMP-104"
  },
  {
    id: "EMP-106",
    name: "Fiona Gallagher",
    email: "f.gallagher@enterprise.io",
    role: "Sales Operations Specialist",
    department: "Revenue Operations",
    status: EmployeeStatus.LEAVE,
    salary: 95000,
    joinDate: "2024-11-01",
    benefitPlan: "Health Standard Silver",
    bankDetails: {
      bankName: "Capital One",
      accountNumber: "•••• •••• 3341",
      routingNumber: "031175658"
    },
    leavesUsed: 12,
    leavesTotal: 18,
    avatarSeed: "fiona",
    managerId: "EMP-104"
  }
];

export const INITIAL_BENEFIT_PLANS: BenefitPlan[] = [
  {
    id: "BEN-GP01",
    name: "Health Premium Gold",
    type: BenefitType.HEALTH,
    coverageDetails: "Full Medical, Dental, and Vision coverage. $10 copay, $0 deductible. Nationwide network access.",
    monthlyCost: 650,
    employerContribution: 90,
    description: "Exceptional comprehensive coverage recommended for families or peace of mind."
  },
  {
    id: "BEN-SS02",
    name: "Health Standard Silver",
    type: BenefitType.HEALTH,
    coverageDetails: "Comprehensive HMO medical coverage, standard dental, optional visual. $30 copay, $1500 deductible.",
    monthlyCost: 450,
    employerContribution: 80,
    description: "Solid high-value plan balancing monthly premiums with standard copays."
  },
  {
    id: "BEN-RS01",
    name: "401(k) Retirement Shield",
    type: BenefitType.RETIREMENT,
    coverageDetails: "Up to 5% dollar-for-dollar company matching. Immediate vesting. Managed portfolio advisory services included.",
    monthlyCost: 0, // Employee sets contribution rate
    employerContribution: 100, // Matching
    description: "Secure long-term wealth planning with solid employer-matched contributions."
  },
  {
    id: "BEN-WA01",
    name: "Wellness Flex Pack",
    type: BenefitType.WELLNESS,
    coverageDetails: "Up to $100/month reimbursed for gym, sports equipment, mental health apps, and physical rehabilitation.",
    monthlyCost: 100,
    employerContribution: 100,
    description: "Promoting active habits and professional mental health support benefits."
  }
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "LRQ-2201",
    employeeId: "EMP-103",
    employeeName: "Cassian Rook",
    employeeDept: "Engineering",
    type: LeaveType.ANNUAL,
    startDate: "2026-06-01",
    endDate: "2026-06-05",
    totalDays: 5,
    status: LeaveStatus.PENDING,
    reason: "Family summer vacation, plans and flights are booked.",
    submittedDate: "2026-05-18"
  },
  {
    id: "LRQ-2202",
    employeeId: "EMP-102",
    employeeName: "Beatriz Vance",
    employeeDept: "Product UX",
    type: LeaveType.MEDICAL,
    startDate: "2026-05-24",
    endDate: "2026-05-25",
    totalDays: 2,
    status: LeaveStatus.PENDING,
    reason: "Scheduled routine dental surgery procedure and recovery.",
    submittedDate: "2026-05-19"
  },
  {
    id: "LRQ-2203",
    employeeId: "EMP-104",
    employeeName: "Diana Prince",
    employeeDept: "Human Resources",
    type: LeaveType.ANNUAL,
    startDate: "2026-04-10",
    endDate: "2026-04-12",
    totalDays: 3,
    status: LeaveStatus.APPROVED,
    reason: "Extended weekend trip and personal recharge.",
    submittedDate: "2026-03-25"
  },
  {
    id: "LRQ-2204",
    employeeId: "EMP-101",
    employeeName: "Alexander Mercer",
    employeeDept: "Engineering",
    type: LeaveType.PARENTAL,
    startDate: "2026-02-01",
    endDate: "2026-02-14",
    totalDays: 14,
    status: LeaveStatus.APPROVED,
    reason: "Newborn parental bonding and family adjustment period.",
    submittedDate: "2026-01-05"
  }
];

export const INITIAL_PAYROLL_RUNS = [
  {
    cycleId: "March 2026",
    status: "Paid",
    totalEmployees: 5,
    netPayroll: 45750,
    dateProcessed: "2026-03-31"
  },
  {
    cycleId: "April 2026",
    status: "Paid",
    totalEmployees: 5,
    netPayroll: 45750,
    dateProcessed: "2026-04-30"
  },
  {
    cycleId: "May 2026",
    status: "Draft",
    totalEmployees: 6,
    netPayroll: 53200,
    dateProcessed: "Pending Approval"
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ANN-001",
    title: "Annual Benefits Open Enrollment 2026",
    content: "The annual Benefits Open Enrollment period runs from June 1st to June 21st. This is your opportunity to review your healthcare, retirement, and wellness options and make elections for the upcoming year. All employees are required to complete their selection, even if you are keeping your current layout.",
    category: "Policy",
    datePosted: "2026-05-18",
    postedBy: "Diana Prince (HR Director)",
    important: true
  },
  {
    id: "ANN-002",
    title: "Urgent: Mandatory Workspace IT Security Training",
    content: "All employees must complete the Q2 Security Awareness & Anti-Phishing interactive training by this Friday, May 22nd. Failure to complete this will result in temporary suspension of system credentials for compliance audit tracking.",
    category: "Urgent",
    datePosted: "2026-05-19",
    postedBy: "Diana Prince (HR Director)",
    important: true
  },
  {
    id: "ANN-003",
    title: "Upcoming Town Hall & Q2 Milestones Showcase",
    content: "Please join us this Thursday, May 22nd at 3:00 PM UTC for our quarterly Town Hall session. Our executive leadership team will discuss Q2 velocity, share product roadmaps, and celebrate milestone contributions.",
    category: "Event",
    datePosted: "2026-05-20",
    postedBy: "Alexander Mercer (VP of Engineering)",
    important: false
  },
  {
    id: "ANN-004",
    title: "Global Office Closure for Memorial Holiday",
    content: "Please note that all corporate offices will be closed on Monday, May 25th, in observance of the upcoming Memorial Holiday. Enjoy a safe and restful extended weekend with your families!",
    category: "General",
    datePosted: "2026-05-20",
    postedBy: "Diana Prince (HR Director)",
    important: false
  }
];

export const INITIAL_SHIFTS: Shift[] = [
  {
    id: "SFT-1",
    name: "Standard Day Shift",
    startTime: "09:00",
    endTime: "17:00",
    workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    color: "bg-indigo-50 text-indigo-700 border-indigo-150"
  },
  {
    id: "SFT-2",
    name: "Late Morning Shift",
    startTime: "11:00",
    endTime: "19:00",
    workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    color: "bg-amber-50 text-amber-700 border-amber-150"
  },
  {
    id: "SFT-3",
    name: "Night Shift",
    startTime: "21:00",
    endTime: "05:00",
    workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    color: "bg-purple-50 text-purple-700 border-purple-150"
  },
  {
    id: "SFT-4",
    name: "Weekend Support Shift",
    startTime: "08:00",
    endTime: "16:00",
    workDays: ["Saturday", "Sunday"],
    color: "bg-emerald-50 text-emerald-700 border-emerald-150"
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "ATT-1001",
    employeeId: "EMP-101",
    employeeName: "Alexander Mercer",
    employeeDept: "Engineering",
    date: "2026-05-20",
    checkIn: "2026-05-20T08:52:00Z",
    checkOut: "2026-05-20T17:04:00Z",
    hoursWorked: 8.2,
    status: "Present",
    notes: "On-time arrival. Conducted team daily sync.",
    shiftName: "Standard Day Shift"
  },
  {
    id: "ATT-1002",
    employeeId: "EMP-102",
    employeeName: "Beatriz Vance",
    employeeDept: "Product UX",
    date: "2026-05-20",
    checkIn: "2026-05-20T09:12:00Z",
    checkOut: "2026-05-20T17:15:00Z",
    hoursWorked: 8.05,
    status: "Late",
    notes: "Traffic jam on Highway 101.",
    shiftName: "Standard Day Shift"
  },
  {
    id: "ATT-1003",
    employeeId: "EMP-103",
    employeeName: "Cassian Rook",
    employeeDept: "Engineering",
    date: "2026-05-20",
    checkIn: "2026-05-20T08:45:00Z",
    checkOut: "2026-05-20T16:58:00Z",
    hoursWorked: 8.12,
    status: "Present",
    notes: "",
    shiftName: "Standard Day Shift"
  },
  {
    id: "ATT-1004",
    employeeId: "EMP-104",
    employeeName: "Diana Prince",
    employeeDept: "Human Resources",
    date: "2026-05-20",
    checkIn: "2026-05-20T08:58:00Z",
    checkOut: "2026-05-20T17:30:00Z",
    hoursWorked: 8.5,
    status: "Present",
    notes: "Reviewed job letters and benefit enrollments.",
    shiftName: "Standard Day Shift"
  },
  {
    id: "ATT-1005",
    employeeId: "EMP-105",
    employeeName: "Elijah Sterling",
    employeeDept: "Marketing & Growth",
    date: "2026-05-20",
    status: "On Leave",
    checkIn: "2026-05-20T09:00:00Z",
    notes: "Approved special onboarding leave.",
    shiftName: "Standard Day Shift"
  },
  {
    id: "ATT-1006",
    employeeId: "EMP-101",
    employeeName: "Alexander Mercer",
    employeeDept: "Engineering",
    date: "2026-05-19",
    checkIn: "2026-05-19T08:49:00Z",
    checkOut: "2026-05-19T17:10:00Z",
    hoursWorked: 8.35,
    status: "Present",
    notes: "Standard day.",
    shiftName: "Standard Day Shift"
  },
  {
    id: "ATT-1007",
    employeeId: "EMP-102",
    employeeName: "Beatriz Vance",
    employeeDept: "Product UX",
    date: "2026-05-19",
    checkIn: "2026-05-19T08:55:00Z",
    checkOut: "2026-05-19T17:01:00Z",
    hoursWorked: 8.1,
    status: "Present",
    notes: "Arrived standard time.",
    shiftName: "Standard Day Shift"
  },
  {
    id: "ATT-1008",
    employeeId: "EMP-103",
    employeeName: "Cassian Rook",
    employeeDept: "Engineering",
    date: "2026-05-19",
    checkIn: "2026-05-19T08:51:00Z",
    checkOut: "2026-05-19T17:02:00Z",
    hoursWorked: 8.18,
    status: "Present",
    notes: "",
    shiftName: "Standard Day Shift"
  },
  {
    id: "ATT-1009",
    employeeId: "EMP-104",
    employeeName: "Diana Prince",
    employeeDept: "Human Resources",
    date: "2026-05-19",
    checkIn: "2026-05-19T08:42:00Z",
    checkOut: "2026-05-19T17:35:00Z",
    hoursWorked: 8.88,
    status: "Present",
    notes: "",
    shiftName: "Standard Day Shift"
  }
];


