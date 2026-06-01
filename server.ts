import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// JWT Secrets and Predefined Users
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_keep_it_secure_123456789_enterprise_suite";

const MOCK_USERS = [
  {
    id: "EMP-100",
    name: "Arjun Sharma",
    email: "arjun.sharma@enterprise.io",
    role: "Admin",
    department: "Executive Office",
    avatarSeed: "arjun"
  },
  {
    id: "ADM-999",
    name: "Aryan Pathak",
    email: "aryanpathak099@gmail.com",
    role: "Admin",
    department: "Administration",
    avatarSeed: "aryan"
  },
  {
    id: "EMP-104",
    name: "Diana Prince",
    email: "d.prince@enterprise.io",
    role: "HR Head",
    department: "Human Resources",
    avatarSeed: "diana"
  },
  {
    id: "EMP-106",
    name: "Fiona Gallagher",
    email: "f.gallagher@enterprise.io",
    role: "HR Associate",
    department: "Human Resources",
    avatarSeed: "fiona"
  },
  {
    id: "EMP-101",
    name: "Alexander Mercer",
    email: "a.mercer@enterprise.io",
    role: "Employee",
    department: "Engineering",
    avatarSeed: "alex"
  },
  {
    id: "EMP-102",
    name: "Beatriz Vance",
    email: "b.vance@enterprise.io",
    role: "Employee",
    department: "Product UX",
    avatarSeed: "beatriz"
  }
];

// Token Verification Middleware
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required. Please log in." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Your session has expired or is invalid. Please log in again." });
  }
}

// Authentication API Endpoints
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user || password !== "password") {
    res.status(401).json({ error: "Invalid email credentials. Default password is 'password'." });
    return;
  }

  // Generate JWT token valid for 24 hours
  const token = jwt.sign(
    { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      department: user.department, 
      avatarSeed: user.avatarSeed 
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({ token, user });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
});

// Helper to safely get Google GenAI client (lazy loaded to prevent boot crash when key is empty)
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment secrets.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Robust wrapper for Gemini generateContent to handle 503 high demand transient errors with fallback
async function generateContentWithRetryAndFallback(ai: GoogleGenAI, options: any) {
  const primaryModel = options.model || "gemini-3.5-flash";
  const fallbackModel = "gemini-3.1-flash-lite";

  try {
    return await ai.models.generateContent(options);
  } catch (error: any) {
    const errorStr = String(error?.message || error || "");
    const isTransient = errorStr.includes("503") || 
                        errorStr.includes("500") || 
                        errorStr.includes("429") ||
                        errorStr.includes("demand") || 
                        errorStr.includes("spikes") || 
                        errorStr.includes("temporary") || 
                        errorStr.includes("UNAVAILABLE") || 
                        errorStr.includes("RESOURCE_EXHAUSTED");

    if (isTransient) {
      console.log(`[Gemini Handler] Primary model ${primaryModel} experienced high load or temporal unavailability. Recovering smoothly with standard fallback model ${fallbackModel}...`);
      try {
        const fallbackOptions = {
          ...options,
          model: fallbackModel
        };
        return await ai.models.generateContent(fallbackOptions);
      } catch (fallbackError: any) {
        console.log(`[Gemini Handler] Fallback model ${fallbackModel} also failed.`);
        throw fallbackError;
      }
    }
    throw error;
  }
}

// Check if Gemini API is available
app.get("/api/health/gemini", (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  res.json({
    available: !!apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "",
    configured: !!apiKey
  });
});

// Helper function: Local fallback for HR Advisor policy queries (ERI rules)
function getLocalPolicyAnswer(message: string, user: any): string {
  const query = message.toLowerCase();
  
  // 1. Legal / Sensitive escalation
  if (
    query.includes("harass") || 
    query.includes("discrim") || 
    query.includes("legal") || 
    query.includes("lawsuit") || 
    query.includes("arbitra") || 
    query.includes("dispute") || 
    query.includes("escalat") || 
    query.includes("grievance") ||
    query.includes("severance") ||
    query.includes("retaliat")
  ) {
    return `### Sensitive Escalation Guidance\n\nFor queries involving legal matters, compliance concerns, formal discrimination, harassment, or sensitive workplace grievances, we recommend contacting the Human Resources department directly. \n\nPlease reach out directly to **Diana Prince (HR Director)** or email **hr@enterprise.io** for secure, confidential processing.`;
  }

  // 2. Leave / Vacation/ Casual / Sick / Parental Queries
  if (query.includes("leave") || query.includes("vacation") || query.includes("sick") || query.includes("parental") || query.includes("holiday") || query.includes("time off") || query.includes("sandwich") || query.includes("probation") || query.includes("paternity") || query.includes("maternity") || query.includes("casual")) {
    
    // Actions block: Approve or file requests
    if (query.includes("approve") || query.includes("request") || query.includes("modify") || query.includes("file") || query.includes("log")) {
      return `### Leave Request Submission\n\nAs your AI HR Copilot, I am unable to approve leave requests or modify records. \n\nPlease navigate to the **Time & Shifts** tab to file your formal request. It will be routed automatically to your manager and HR for review.`;
    }

    if (query.includes("sandwich") || query.includes("weekend")) {
      return `### Intervening Holidays (Sandwich Rule)\n\nUnder **India Leave Policy v3.4**, the company **does not** enforce a strict sandwich rule. \n\n*Example*: If an employee takes leave on a Friday and the following Monday, the intervening weekend is excluded from the leave balance deduction.`;
    }

    if (query.includes("probation") || query.includes("new employee") || query.includes("joining")) {
      return `### Probationary Period Rules\n\nUnder **India Leave Policy v3.4**:\n- Employees currently on probation **do not accrue Privilege Leave (PL)**.\n- Probationary employees receive **limited Casual Leave / Sick Leave (CL/SL)** eligibility for urgent emergencies, subject to department head clearance.`;
    }

    if (query.includes("maternity") || query.includes("pregnancy") || query.includes("women")) {
      return `### Statutory Maternity Leave Policy (India)\n\nIn strict compliance with the **Maternity Benefit Act (Amendment) 2017**:\n- Female employees who completed at least **80 days** of active service in the preceding 12 months are entitled to **26 weeks (182 calendar days)** of fully paid maternity leave.\n- A valid medical certificate from a registered obstetrician/gynecologist must be submitted to the HR portal.`;
    }

    if (query.includes("paternity") || query.includes("parental") || query.includes("father") || query.includes("adoption")) {
      return `### Paid Paternity Leave Policy (India)\n\nMale employees welcoming a newborn or legally adopting a child are entitled to **10 consecutive working days** of fully paid paternity leave.\n- This benefit must be availed within **6 months** of the birth or official legal adoption date.`;
    }

    if (query.includes("casual") || query.includes("sick") || query.includes("emergency") || query.includes("medical") || query.includes("cl") || query.includes("sl")) {
      if (query.includes("carry forward") || query.includes("expire") || query.includes("lapse") || query.includes("accumulate")) {
        return `### Casual/Sick Leave (CL/SL) Expiry & Accumulation\n\nUnder **India Leave Policy v3.4**, unused Casual & Sick Leave balances **lapse automatically on December 31st** and cannot be carried forward to the subsequent calendar year. They are also strictly ineligible for cash encashment.`;
      }
      return `### Casual & Sick Leave (CL/SL) Policy (India)\n\n- **Entitlement**: 10 calendar days per annum (combined pool), credited upfront on January 1st (pro-rated for mid-year joiners).\n- **Maximum Usage**: No more than **3 consecutive working days** may be taken without medical validation (upload of MBBS medical certificate).\n- **Half-Day Rule**: CL and SL can be processed as half-day leaves.`;
    }

    if (query.includes("privilege") || query.includes("earned") || query.includes("pl") || query.includes("el") || query.includes("vacation")) {
      if (query.includes("carry forward") || query.includes("carryover") || query.includes("accumulate")) {
        return `### Privilege Leave (PL) Carry-Forward Caps\n\nUnder **India Leave Policy v3.4**, a maximum of **12 unused PL days** may be carried forward to the next calendar year. Any additional accrued days in excess of this cap will automatically expire.`;
      }
      if (query.includes("encash") || query.includes("exit") || query.includes("payout")) {
        return `### Privilege Leave (PL) Encashment Policy\n\nUnder **India Leave Policy v3.4**, employees can encash up to **30 days of unused Privilege Leave (PL)** during their final separation/exit process. Mid-year encashments are not allowed.`;
      }
      if (query.includes("half")) {
        return `### Half-Day Rules for Privilege Leave\n\nUnder **India Leave Policy v3.4**, Privilege Leave (PL) **cannot** be processed or approved in half-day increments. It must be taken for a minimum of 2 consecutive working days.`;
      }
      return `### Privilege Leave (PL) / Earned Leave (EL) Policy (India)\n\n- **Entitlement**: 18 calendar days per annum.\n- **Accrual**: Credited monthly at a rate of 1.5 days for every completed month of service.\n- **Minimum Usage**: Cannot be taken for durations of less than **2 consecutive working days** per request.\n- **Restrictions**: PL cannot be processed for half-day increments, and is not accrued during the 6-month probation period.`;
    }

    if (query.includes("bereavement") || query.includes("death")) {
      return `### Bereavement Leave Policy\n\nEmployees are entitled to **5 consecutive working days** of fully paid bereavement leave on the passing of an immediate family member.`;
    }

    if (query.includes("compensatory") || query.includes("comp") || query.includes("overtime")) {
      return `### Compensatory Off (Comp-Off) Policy\n\n- Working on scheduled weekends or official public holidays requires prior written authorization from your reporting authority.\n- **Comp-Off Validity**: Earned Comp-Off credits must be consumed within **60 calendar days** from the overtime event, after which they expire automatically.`;
    }

    if (query.includes("unpaid") || query.includes("lop") || query.includes("loss of pay")) {
      return `### Loss of Pay (LOP) / Unpaid Leave Policy\n\nLoss of Pay (LOP) is an exceptional status applied only when all other leave balances are completely exhausted. It requires prior written approval from both your **Department Head** and the **HR Head**.`;
    }

    // Default general leave summary (includes India v3.4 leave details)
    return `### Employee Leave & Time-Off Policy (India v3.4)\n\nAll permanent employees are entitled to **28 days of paid leave** per calendar year:\n- **Privilege Leave (PL)**: 18 days/year, accrued at 1.5 days/month. Minimum 2 days usage. Max 12 days carry-forward. No half-days.\n- **Casual & Sick Leave (CL/SL)**: 10 days/year (upfront on Jan 1st). Lapses December 31st. Max 3 consecutive days without medical certificate. Half-days allowed.\n- **Maternity Leave**: 26 weeks fully paid.\n- **Paternity Leave**: 10 consecutive working days (within 6 months).\n- **Bereavement Leave**: 5 consecutive days.\n- **Compensatory Off**: Valid for 60 calendar days.\n\n*Note*: Sandwich rule is not enforced. Weekend is excluded from leave deduction. Employees on probation do not accrue PL. All requests must be submitted on the **Time & Shifts** portal with a delegate assignee. Managers have a 48-hour SLA to review requests.`;
  }

  // 3. Compensation / Payroll / Confidentiality / Reimbursements
  if (query.includes("payroll") || query.includes("salary") || query.includes("pay") || query.includes("earning") || query.includes("wage") || query.includes("overtime") || query.includes("tax") || query.includes("bank") || query.includes("reimburse") || query.includes("wellness") || query.includes("flex pack") || query.includes("gym") || query.includes("stipend") || query.includes("expense") || query.includes("wfh") || query.includes("work from home") || query.includes("pf") || query.includes("provident") || query.includes("tds") || query.includes("component") || query.includes("ctc")) {
    const queryNoUser = query.replace("my", "").replace("me", "");
    const mentionsOther = queryNoUser.includes("alex") || queryNoUser.includes("mercer") || queryNoUser.includes("beatriz") || queryNoUser.includes("vance") || queryNoUser.includes("cassian") || queryNoUser.includes("rook") || queryNoUser.includes("diana") || queryNoUser.includes("prince") || queryNoUser.includes("fiona") || queryNoUser.includes("elijah") || queryNoUser.includes("other") || queryNoUser.includes("anyone else");
    
    if (mentionsOther) {
      return `### Confidentiality Protection Notice\n\nI am strictly prohibited from exposing confidential employee information or revealing the payroll, salary details, tax IDs, or personal banking information of other employees.`;
    }

    // Check if India payroll / reimbursement / HR-PAY-031 / v2.4 specific
    if (query.includes("india") || query.includes("hr-pay-031") || query.includes("v2.4") || query.includes("lock") || query.includes("25") || query.includes("provident") || query.includes("pf") || query.includes("tds") || query.includes("hra") || query.includes("component") || query.includes("pan") || query.includes("sla") || query.includes("7-14") || query.includes("fnf") || query.includes("full and final")) {
      if (query.includes("reimburse") || query.includes("expense") || query.includes("claim") || query.includes("invoice") || query.includes("sla") || query.includes("7-14")) {
        return `### India Reimbursement Policy & Workflow (HR-PAY-031 v2.4)

- **Eligible Items**: Travel expenses, internet reimbursement, work-from-home equipment, business meals, and approved operational expenses (all require valid invoices and business justification).
- **Submission Workflow**: Upload invoices and description on HRMS -> Manager verification -> Finance review -> Approved claims are added to the monthly payroll cycle.
- **SLA Timeline**: Approved reimbursements are processed within **7–14 working days**. Fraudulent claims (fake invoices, duplicate submissions) trigger disciplinary action.`;
      }
      
      if (query.includes("lock") || query.includes("date") || query.includes("cycle") || query.includes("schedule") || query.includes("timeline") || query.includes("25") || query.includes("credit")) {
        return `### India Payroll Cycle & Locking Rules (v2.4)

- **Monthly Payroll Schedule**:
  * **Payroll Lock Date**: 25th of every month (all input and reimbursement edits disabled).
  * **Finance Approval Window**: 26th–28th of every month.
  * **Salary Credit Date**: Last working day of the month (or previous business day if on weekends, holidays, or banking outages).
- **Corrections After Lock**: Any corrections after the 25th lock date require dual **HR & Finance approval** and will be settled in subsequent adjustments.`;
      }

      if (query.includes("security") || query.includes("rbac") || query.includes("visibility") || query.includes("access") || query.includes("mask") || query.includes("protect")) {
        return `### Payroll Access Control & Data Security (HR-PAY-031 v2.4)

- **Role-Based Visibility**:
  * *Employee*: Self payroll only.
  * *HR Associate*: Restricted operational visibility (no full editing access).
  * *HR Head*: Department-wide payroll visibility.
  * *Admin*: Full administration access.
- **Sensitive Data Protection**: Bank account numbers, routing details, PAN, and salary structures are protected via **masked display layers**, restricted API authorization, and field-level visibility rules. Unauthorized access attempts are logged.`;
      }

      if (query.includes("copilot") || query.includes("assistant") || query.includes("safety") || query.includes("limit") || query.includes("can you") || query.includes("modify")) {
        return `### AI HR Copilot Payroll Safety boundaries (v2.4)

- **Allowed Assistance**: Payslip explanations, deduction clarifications, reimbursement guidance, payroll jargon explanation, and cycle timelines.
- **Strict Safety Boundaries**: AI HR Copilot **cannot** modify salary records, approve reimbursements, finalize payroll, expose other employees' payroll details, or bypass finance approvals. Human authorization is always required.`;
      }

      return `### India Payroll & Reimbursement Policy (Doc: HR-PAY-031, v2.4)

- **Payroll Timeline**: Payroll locks on the **25th of each month**. Finance approves 26th–28th. Salaries are credited on the **last working day of the month**.
- **Salary Components**: Basic, House Rent Allowance (HRA), Special Allowance, Performance Bonus, Internet & Meal Allowance, and Employer PF Contributions.
- **Statutory Deductions**: Provident Fund (PF), Professional Tax, Income Tax (TDS), Loss of Pay (LOP) adjustments, and Insurance.
- **Reimbursement Workflow**: Upload invoice -> Manager validation -> Finance review -> Added to monthly cycle. Approved within **7–14 working days**.
- **Data Security**: Strict Role-Based Access Controls (RBAC) and **masked bank account/PAN details** prevent unauthorized exposure. Employees have self-only payroll access.
- **AI Safety**: Copilot can explain deductions but **cannot** modify compensation entries, approve expenses, or view other staff details.`;
    }

    if (query.includes("overtime") || query.includes("non-exempt")) {
      return `### Overtime Compensation Policy\n\nIn compliance with FLSA guidelines, non-exempt employees receive **1.5x their standard regular hourly rate** for all actual physical hours worked exceeding 40 hours in a single calendar workweek.`;
    }
    
    if (query.includes("reimburse") || query.includes("expense") || query.includes("wellness") || query.includes("gym") || query.includes("wfh") || query.includes("stipend")) {
      if (query.includes("wellness") || query.includes("gym") || query.includes("flex")) {
        return `### Wellness Flex Pack Policy\n\nActive full-time employees are eligible for up to **$100 per calendar month** reimbursement to spend on gym memberships, exercise/sports equipment, mental health apps, or physical rehabilitation. Please submit proof-of-payment receipts via the portal before the **25th of the month**.`;
      } else if (query.includes("wfh") || query.includes("work from home") || query.includes("ergonomic") || query.includes("desk") || query.includes("stipend")) {
        return `### Work-from-Home (WFH) Stipend\n\nEnterprise Resources Inc. offers a **one-time $500 workspace stipend** upon onboarding to procure ergonomic desks, office chairs, dual monitors, or peripheral equipment. Receipts are mandatory to process the claim.`;
      } else if (query.includes("travel") || query.includes("flight") || query.includes("hotel") || query.includes("lodging")) {
        return `### Business Travel Expense Policy\n\nStandard flights, lodging, and work meals are fully reimbursable upon submitting valid receipts. Personal detours, room upgrades, and alcoholic beverages are strictly non-reimbursable.`;
      } else {
        return `### Enterprise Expense Reimbursements\n\n- **Wellness Flex Pack**: Up to $100/month reimbursed for physical and mental health. File before the 25th.\n- **WFH Stipend**: One-time $500 ergonomic equipment reimbursement at onboarding.\n- **Travel**: Business-related transportation, lodging, and meals are covered upon receipt submission.`;
      }
    }

    return `### Payroll Cycle & Compensation Terms\n\n- **Payment Cycle**: Paid semi-monthly on the **15th and last day of the calendar month**.\n- **Payment Method**: Direct deposit is highly recommended. You can set this up securely with your bank account number and routing number under the **Employee Profile** tab.\n- **Confidentiality**: Salary details are highly confidential; you may review your personal summary on the dashboard but cannot inquire about others' credentials.`;
  }

  // 5. Onboarding procedures
  if (query.includes("onboard") || query.includes("welcome") || query.includes("checklist") || query.includes("first day") || query.includes("first 30")) {
    return `### New Hire Onboarding Checklist (First 30 Days)\n\n- **Days 1-3**: Review welcome checklist, submit tax forms (W-4 / I-9), and complete direct deposit instructions.\n- **Week 1**: Complete the mandatory **Q2 Security Awareness and Anti-Phishing interactive training**.\n- **Month 1**: Align with your assigned onboarding mentor (buddy), review team tooling access, and secure standard permissions.`;
  }

  // 6. Attendance & shift policies
  if (query.includes("attendance") || query.includes("shift") || query.includes("time") || query.includes("clock") || query.includes("check") || query.includes("hour") || query.includes("timings") || query.includes("regularization") || query.includes("overtime") || query.includes("comp-off") || query.includes("late")) {
    if (query.includes("overtime") || query.includes("comp") || query.includes("compensation") || query.includes("holiday") || query.includes("weekend")) {
      return `### Overtime & Compensatory Off (Comp-Off) Policy (v2.3)
      
- **Overtime Authorization**: All extra-hour tasks require **prior manager approval**, operational justification, and HR logging before execution. Unauthorized overtime is not eligible for compensatory benefits.
- **Weekend / Holiday Work**: Employees working on weekends, company holidays, or emergency shifts qualify for **Comp-Off credit**.
- **Filing Deadline**: Comp-Off requests must be officially submitted via the portal within **7 working days** of the event, otherwise they expire automatically.`;
    }
    
    if (query.includes("late") || query.includes("check-in") || query.includes("grace") || query.includes("half-day") || query.includes("regularize") || query.includes("biometric") || query.includes("anomaly")) {
      return `### Attendance Tracking & Regularization Rules (India HR-ATT-017 v2.3)

- **Flexible Check-In Window**: Employees may check in between **09:30 AM and 10:00 AM** without penalty.
- **Late Entry**: Clocking in between **10:01 AM and 11:00 AM** is classified as a *Late Entry*. More than **5 occurrences within 30 days** will trigger automated warnings and manager escalation.
- **Half-Day Classification**: Checking in **after 11:00 AM**, working **less than 4.5 hours**, or unauthorized extended inactivity defaults your status to a *Half-Day*.
- **Regularization Timeline**: Missing clock-outs, network outages, or biometric/technical failures must be regularized within **48 working hours** on the portal.
- **Manager Review SLA**: Reporting managers have a strict **48-hour SLA** to review and action regularization requests.`;
    }

    return `### India Employee Attendance & Work Hours Policy (Doc: HR-ATT-017, v2.3)

- **General Office Timings**: Monday to Friday, **09:30 AM – 06:30 PM IST** (9 hours total, target 8 hours productive work).
- **Flexible Entry**: Grace window is **09:30 AM – 10:00 AM**. Entries after 10:00 AM are classified as late.
- **Attendance Classifications**:
  * *09:30 AM – 10:00 AM*: Grace window check-in.
  * *10:01 AM – 11:00 AM*: Late Entry.
  * *After 11:00 AM*: Half-day penalty.
  * *Work duration < 4.5 hours*: Half-day status.
- **Regularization SLA**: Missing logs or technical biometric issues must be regularized within **48 working hours**. Managers have a **48-hour SLA** to approve.
- **Remote / Hybrid Rules**: Remote employees must clock in through the HRMS employee portal daily, remain reachable on Slack/Teams, and maintain core business hour availability.
- **Overtime & Comp-Off**: Prior approval is required. Weekend shift work qualifies for Comp-Off, which must be requested within **7 working days**.`;
  }

  // 7. Internal guidelines / generic conduct
  if (query.includes("guideline") || query.includes("conduct") || query.includes("rule") || query.includes("hybrid") || query.includes("remote") || query.includes("code") || query.includes("core hour") || query.includes("policy")) {
    return `### Hybrid Work & Internal Guidelines\n\n- **Hybrid Cadence**: Employees align remote days with managers. Physical office hubs are located in Seattle, WA and San Francisco, CA.\n- **Core Hours**: ERI coordinates daily core collaboration hours from **10:00 AM to 4:00 PM local time**.\n- **Conduct Code**: ERI enforces a respectful workplace. Discrimination or harassment will trigger immediate compliance reviews.\n- **Security**: Annual compliance and Q2 IT Security Awareness modules are mandatory for system login health.`;
  }

  // 8. Confidential employee check (self or others)
  if (query.includes("who is") || query.includes("tell me about") || query.includes("employee") || query.includes("info")) {
    return `### Confidential Employee Information Policy\n\nStrict company guardrails state that confidential employee data (tax, address, or payroll info) cannot be exposed by this Copilot. For certified employee directory lists, please refer directly to the **Employee Directory** tab.`;
  }

  return "I could not find this information in the company policies.";
}

// Helper function: Local fallback for drafted documents
function getLocalDocumentFallback(documentType: string, employeeName: string, details: string, jobTitle: string, department: string, salary: string, currentUser: any): string {
  if (documentType === "OfferLetter") {
    return `## ENTERPRISE RESOURCES INC. — JOB OFFER LETTER

**Date:** June 1, 2026
**To:** ${employeeName}
**Address:** Candidate's Address on File

Dear ${employeeName},

On behalf of **Enterprise Resources Inc. (ERI)**, we are pleased to offer you the position of **${jobTitle || "Software Engineer"}** in our **${department || "Engineering"}** department, reporting to the regional Director of Operations.

### 1. Key Employment Terms
- **Position of Employment:** ${jobTitle || "Software Engineer"}
- **Base Compensation:** $${salary || "110,000"} per annum, distributed semi-monthly in equal installments.
- **Expected Start Date:** June 15, 2026 (or mutual earlier agreement)
- **Classification:** Full-time, Permanent
- **Location:** Hybrid Workspace Operations

### 2. Benefits & Paid Leave Allotments
As a full-time employee of ERI, you will be eligible to participate in our comprehensive benefits portfolio:
- **Paid Time Off (PTO):** Standard PTO allotment of 20 calendar days per annum, pro-rated in your first year.
- **Wellness Flex Pack:** Up to $100 per month reimbursement for health and sport facilities.
- **Home Office Stipend:** A one-time workspace stipend of up to $500 to equip your hybrid setup.
- **Standard Coverage:** Group medical, dental, and vision insurance policies.

### 3. Contingencies & Acceptance Protocols
This offer of employment is contingent upon successful reference checks, submission of necessary identification (W-4 / I-9), and signature of our standard Employment Proprietary Information and Inventions Agreement.

To confirm your acceptance, please sign, date, and return this letter by **June 10, 2026**.

We look forward to welcoming you to the team and building the future of Enterprise Resources Inc. together.

Sincerely,

---
**Prepared By:**
${currentUser.name}, ${currentUser.role}
Enterprise Resources Inc. (ERI)

---
### **CANDIDATE SIGN-OFF**
I accept the offer of employment as outlined above:

**Signature:** __________________________
**Date:** ______________________________`;
  } else if (documentType === "PromotionLetter") {
    return `## ENTERPRISE RESOURCES INC. — LETTER OF PROMOTION

**Date:** June 1, 2026
**To:** ${employeeName}
**Current Department:** ${department || "Product Management"}

Dear ${employeeName},

We are absolutely thrilled to extend our warmest congratulations on your official promotion to the position of **${jobTitle || "Senior Specialist"}** within the **${department || "Product Management"}** department of **Enterprise Resources Inc. (ERI)**.

This promotion is a direct reflection of your outstanding contributions, exemplary initiative, and phenomenal dedication to ERI's core products. In particular, we want to appreciate your incredible work on:
- ${details || "Outstanding leadership on the core releases and phenomenal team collaboration."}

### Revised Employment Terms
- **New Official Title:** ${jobTitle || "Senior Specialist"}
- **Effective Date:** June 15, 2026
- **New Salary / Adjustment:** ${salary ? `$${salary}` : "15% increase in base compensation"} per annum, paid semi-monthly.
- **Reporting Line:** Authorized Regional Manager

In your new role, you will be taking on senior responsibilities including mentoring team members, managing key product release timelines, and driving operational excellence.

Thank you for your continuous passion and hard work. ERI is extremely proud and privileged to have you as a leader in our organization.

Sincerely,

---
**Authorized Signatory:**
${currentUser.name}, ${currentUser.role}
Enterprise Resources Inc. (ERI)

---
### **EMPLOYEE ACKNOWLEDGEMENT**
I accept the promotion and the terms outlined above:

**Signature:** __________________________
**Date:** ______________________________`;
  } else if (documentType === "WarningLetter") {
    return `## ENTERPRISE RESOURCES INC. — WRITTEN WARNING & PERFORMANCE UPDATE

**Date:** June 1, 2026
**To:** ${employeeName}
**Department:** ${department || "Operations"}
**Classification:** Confidential / Internal HR Only

Dear ${employeeName},

This letter serves as a formal Written Warning for Performance Improvement, issued to document certain ongoing procedural challenges and to outline a structured Performance Improvement Plan (PIP) designed to help you regain alignment.

### 1. Areas and Details of Concern
Our review has identified specific issues requiring immediate attention and corrective modification:
- ${details || "Inconsistent task completion and repeating missed alignment sessions."}

### 2. Expectations & Corrective Actions
To achieve satisfactory performance standing, you are expected to meet the following parameters starting immediately:
- Establish consistent and timely completion of all deliverables and team assignments.
- Coordinate closely with your manager to provide daily progress updates on your designated backlog.
- Maintain full attendance in all mandatory hybrid standups, core hours, and alignment sessions.

### 3. Monitoring & Review Timeline
For the next 30 calendar days, your reporting manager will conduct bi-weekly sessions to inspect your progress and provide constructive guidance. 

Failure to meet these standard expectations or demonstrate consistent, sustained improvement during this warning phase may lead to further disciplinary actions up to and including termination of your employment. ERI is fully committed to providing feedback and resources to help you succeed.

Sincerely,

---
**Issued By:**
${currentUser.name}, ${currentUser.role}
Enterprise Resources Inc. (ERI)

---
### **EMPLOYEE RECEIPT ACKNOWLEDGEMENT**
My signature below confirms only that I have received a copy of this warning document:

**Signature:** __________________________
**Date:** ______________________________`;
  } else if (documentType === "PerformanceReview") {
    return `## ENTERPRISE RESOURCES INC. — PERFORMANCE REVIEW SUMMARY

**Date:** June 1, 2026
**For Employee:** ${employeeName}
**Position Title:** ${jobTitle || "Analyst"}
**Department:** ${department || "Finance"}
**Review Conducted By:** ${currentUser.name}, ${currentUser.role}

---

### 1. CORE ACCOMPLISHMENTS & GENERAL CONTRIBUTIONS
During this assessment cycle, ${employeeName} has demonstrated professional capabilities and valuable contributions to the department. Specific highlights include:
- ${details || "Excellent analytical precision and fast reports generation. Opportunities to improve public presentation confidence."}

### 2. PERFORMANCE EVALUATION RATINGS
- **Quality of Work:** Meets or exceeds expectations. Showcases precision and thorough analysis of outputs.
- **Collaboration & Communication:** Highly supportive peer-to-peer engagement. Works effectively across shared sprints.
- **Attendance & Professional Conduct:** Consistent shift clock-ins. Highly respectful of the enterprise workspace.

### 3. AREAS OF GROWTH & DEPARTMENTAL SUPPORT
We have mapped out the following focal points for growth:
- Continuous advancement in taking independent lead over complex deliverables.
- Further development of public presentation confidence and cross-departmental product pitches.
- Proactive engagement in defining team mentorship initiatives.

### 4. FUTURE PERFORMANCE GOALS
- Complete the scheduled professional development certificates.
- Successfully deliver the upcoming quarterly integration target of the department.

---
**Evaluated By:**
${currentUser.name}, ${currentUser.role}
Enterprise Resources Inc. (ERI)

---
**Employee Signature:** ______________________  **Date:** _______________`;
  }

  return `## ENTERPRISE RESOURCES INC. — OFFICIAL STAFF DOCUMENT

**Date:** June 1, 2026
**Subject:** Official HR Notification
**For Employee:** ${employeeName}

This letter serves as an official staff documentation for ${employeeName} regarding ERI operations. 

**Details:**
${details || "Standard administrative confirmation record."}

---
**Issued By:**
${currentUser.name}, ${currentUser.role}
Enterprise Resources Inc. (ERI)`;
}

// API Endpoint: Intelligent HR Chat Advisor (Protected)
app.post("/api/gemini/advisor", authenticateToken, async (req, res) => {
  const { message, history } = req.body;
  const currentUser = (req as any).user;

  try {
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const ai = getAIClient();
    
    // Construct chat format or structured contents using user role context
    const systemPrompt = `You are the friendly, professional, clear, and enterprise-safe Ask HR AI Copilot for Enterprise Resources Inc. (ERI). 
Your role is to help employees understand company HR policies, leave rules, payroll terms, reimbursement processes, onboarding procedures, attendance policies, and internal guidelines.

Active employee consulting you:
- Name: "${currentUser.name}"
- Role: "${currentUser.role}"
- Department: "${currentUser.department}"

========================================
COMPANY HR POLICIES AND GUIDELINES:

1. WORK MODELS & HOURS:
- Enterprise Resources Inc. operates as a hybrid workforce.
- Employees are expected to coordinate their core collaboration hours (typically 10:00 AM to 4:00 PM local time) with their respective engineering lead or department manager.
- Primary physical offices/hubs are located adjacent to San Francisco, CA and Seattle, WA.
- Standard work shifts:
  * Standard Day Shift (SFT-1): 09:00 - 17:00, Monday to Friday.
  * Late Morning Shift (SFT-2): 11:00 - 19:00, Monday to Friday.
  * Night Shift (SFT-3): 21:00 - 05:00, Monday to Saturday.
  * Weekend Support Shift (SFT-4): 08:00 - 16:00, Saturday and Sunday.

2. LEAVE RULES & BALANCES (US AND INDIA REGION-SPECIFIC V3.4 POLICY):
- US Standard Employee Leave Rules:
  * Annual Vacation Leave: Full-time employees receive 20 days per calendar year. Tenured staff (after 3 years of service) receive 25 days. Vacation days accrue monthly at 1.67 days/month. Requests must be submitted at least 2 weeks in advance via the HR portal.
  * Medical & Sick Leave: Full-time employees receive up to 10 paid sick days per fiscal year for personal or immediate family medical situations. Routine surgeries or scheduled recovery require at least 1-week prior notice.
  * Parental Leave: Eligible after 1 year of continuous service. Parents receive 14 days of fully paid parental bonding leave. Unpaid bonding extensions can be requested under family care guidelines.
- India Employee Leave Rules (Policy HR-POL-042, Version: v3.4, Effective: June 1, 2026):
  * Paid annual pool is 28 days total: 18 Privilege Leave (PL) days and 10 Casual & Sick Leave (CL/SL) days.
  * Privilege Leave (PL): Accrues monthly at 1.5 days. Does not accrue during the 6-month probation period. Minimum request of 2 consecutive days, cannot be processed or approved in half-day increments. Maximum carry-over of 12 days to the subsequent calendar year (excess days expire). Encashment up to 30 days of unused PL days is permitted ONLY during exit separation.
  * Casual & Sick Leave (CL/SL) Combined Pool: 10 days credited upfront on Jan 1st. Max 3 consecutive days can be taken without medical validation (upload of MBBS medical certificate). CL/SL can be taken as half-days. Unused CL/SL balances lapse on December 31st (cannot carry forward, cannot encash).
  * Maternity Leave: 26 weeks (182 calendar days) fully paid for female employees who completed 80 days of active service in the preceding 12 months. Requires medical certificate from obstetrician/gynecologist.
  * Paternity Leave: 10 consecutive working days fully paid on birth or adoption. Must be availed within 6 months.
  * Bereavement Leave: 5 consecutive working days on the passing of an immediate family member.
  * Compensatory Off (Comp-Off): Weekend or holiday work with prior written authorization can earn Comp-Off. Must be consumed within 60 calendar days of the overtime event or it expires.
  * Sandwich Rule: Not enforced. Intervening weekends or holidays are excluded from leave deduction.
  * Probation Rules: Employees on probation do not accrue PL and have limited CL/SL.
  * Leave Submission & SLAs: All leave requests must specify a delegate assignee. Managers have a 48-hour SLA to take action; of which failures automatically escalate to the Department Head.
- Leave Submission: The AI Copilot cannot approve or modify any leave logs. Employees must file formal leave requests in the Time & Shifts tab or Employee Self-Service (ESS) system.

3. PAYROLL & COMPENSATION TERMS:
- Pay Cycle: Semi-monthly (paid on the 15th and the final day of the calendar month). Direct deposit is recommended and can be set up via Bank Details on the Employee Profile tab.
- Overtime Policies: Non-exempt personnel are eligible for 1.5x regular payment rates for actual physical hours worked exceeding 40 hours per workweek, in compliance with FLSA metrics.
- Salary Confidentiality: Confidentiality is of supreme importance. You must NEVER expose payroll or salary details of OTHER employees, nor reveal any bank accounts or tax IDs. If the user asks for their own salary or benefits, you may outline their personal profile but you cannot look up other employees' specific salary numbers.

4. REIMBURSEMENT PROCESSES:
- Wellness Flex Pack: Reimburses up to $100 per calendar month for gym memberships, exercise/sports equipment, mental health apps, or physical rehabilitation. Receipts must be submitted through the portal before the 25th of the month.
- Work-from-Home Stipend: A one-time $500 workspace stipend is available upon onboarding to procure ergonomic desks, office chairs, screens, or peripherals. Receipts are mandatory.
- Business Travel: Standard flights, business lodging, and meals are fully reimbursable upon receipt submission. Detours and alcohol are not reimbursable.

5. ONBOARDING PROCEDURES:
- New Hire First 30 Days checklist:
  * Days 1-3: Handover welcome checklist, submit tax forms (W-4 / I-9), and complete direct deposit instructions.
  * Week 1: Complete the mandatory interactive "Q2 Security Awareness & Anti-Phishing" training.
  * Month 1: Check-in with assigned mentor/buddy and complete tooling permissions alignment.

6. ATTENDANCE & SHIFT COMPLIANCE (US CORE & INDIA HR-ATT-017 V2.3 POLICY):
- General Office Timings (India): Monday to Friday, 09:30 AM – 06:30 PM IST (9 hours total, including breaks; 8 hours productive work expectation).
- Flexible Check-In Window: 09:30 AM – 10:00 AM (Grace period). Check-ins after 10:00 AM are categorized as late arrivals.
- Arrival Classifications:
  * 09:30 AM – 10:00 AM: Within grace window.
  * 10:01 AM – 11:00 AM: Classified as Late Entry. Exceeding 5 occurrences within 30 days triggers automated warnings and manager escalation.
  * After 11:00 AM: Classified as Half-Day Attendance.
- Half-Day Status Causes: Checking in after 11:00 AM, total daily work duration below 4.5 hours, or unauthorized extended inactivity.
- Missing Check-Outs: Leaves the log incomplete. Must be regularized via the portal within 48 working hours.
- Attendance Regularization: Allowed for biometric failures, network outages, emergencies, or business travel. Requires submitting clarification notes.
- Manager SLAs: Managers must review and resolve regularization requests or disputes within 48 working hours.
- Overtime & Extended Hours: Overtime requires prior written manager approval. Working authorized weekends/holidays qualifies for Comp-Off, which must be requested within 7 working days.
- Remote / Hybrid Rules: Must check in via the HRMS portal, update status, and remain available/reachable on Slack/Teams during core collaboration hours.

7. INDIA PAYROLL & REIMBURSEMENT POLICY (HR-PAY-031 V2.4):
- Monthly Payroll Schedule: Payroll locks on the 25th of every month. Finance approval window is 26th–28th. Salary is credited on the last working day of the month (previous business day if weekends/holidays/banking outages).
- Payroll Locking Rules: After lock on the 25th, salary components cannot be modified, reimbursement edits are disabled, and records are audit-protected. Post-lock adjustments require dual HR & Finance approval.
- Salary Structure & Deductions: CTC contains Basic Salary, House Rent Allowance (HRA), Special Allowance, Performance Bonus, Internet Allowance, Meal Allowance, and Employer PF Contributions. Deductions include Provident Fund (PF), Professional Tax, Income Tax (TDS), Loss of Pay (LOP) adjustments, and Insurance.
- Eligible Reimbursements: Travel expenses, internet reimbursement, WFH equipment, business meals, and approved operational expenses (with invoices and justification).
- Reimbursement Submission Workflow: Upload invoice/description on HRMS -> Manager verification -> Finance review -> Added to monthly cycle. Processed in 7–14 working days. Fraudulent claims result in disciplinary action.
- Data Security & Masking: Bank account numbers, routing details, PAN, and salary structures are protected via masked display layers and restricted APIs. Employee can see self-only payroll. HR Associates have restricted operational view; HR Head has department-wide view; Admin has full view.
- AI Safety Boundaries: AI Copilot can explain payslips, deductions, and reimbursement guidelines, but CANNOT modify salary records, approve expenses, finalize payroll, or bypass clearance gates.

========================================
CRITICAL OPERATIONAL RULES:
1. ONLY answer questions using the exact company HR policy context provided above.
2. If the user's query refers to a policy, rules, terms, or database state that is missing from or not covered by the context above, you MUST answer EXACTLY:
   “I could not find this information in the company policies.”
3. NEVER generate or make up fake HR policies, numbers, timelines, or guides.
4. NEVER expose confidential employee information or reveal payroll or salary details of other employees. If asked about another employee, politely refuse.
5. NEVER approve leave requests, modify databases, adjust attendance, or check employees in/out. Direct them to use the Time & Shifts tab for manual logs or requests.
6. Keep answers short, professional, and employee-friendly. Long blocks of text should be broken down into scannable markdown bullet lists.
7. If a query involves legal issues, formal discrimination/harassment reports, compliance audits, disputes, or sensitive escalations, recommend contacting the HR department directly (specifically, HR Director Diana Prince or via hr@enterprise.io).

TONE: Professional, clear, supportive, enterprise-safe.`;

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Generate output
    const response = await generateContentWithRetryAndFallback(ai, {
      model: "gemini-3.5-flash",
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Advisor Error:", error);
    try {
      const fallbackText = getLocalPolicyAnswer(message, currentUser);
      res.json({ text: fallbackText });
    } catch (fallbackError: any) {
      res.status(500).json({ 
        error: error.message || "Failed to communicate with AI Advisor",
        needConfig: !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY"
      });
    }
  }
});

// API Endpoint: Document Generator for Employee Letters (Protected)
app.post("/api/gemini/document", authenticateToken, async (req, res) => {
  const currentUser = (req as any).user;
  if (!currentUser) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (currentUser.role === "Employee") {
    res.status(403).json({ error: "Access denied. Standard employees are not authorized to draft corporate HR documents." });
    return;
  }

  const { documentType, employeeName, details, jobTitle, department, salary } = req.body;
  if (!documentType || !employeeName) {
    res.status(400).json({ error: "Document type and Employee name are required" });
    return;
  }

  try {
    const ai = getAIClient();

    let docPrompt = "";
    if (documentType === "OfferLetter") {
      docPrompt = `Draft an official, professional Job Offer Letter for "${employeeName}". 
- Position: ${jobTitle || "Software Engineer"}
- Department: ${department || "Engineering"}
- Annual Base Salary: $${salary || "110,000"} 
- Start Date: Imminent
- Additional Details/Terms: ${details || "Standard healthcare package, 15 days PTO, and standard stock options."}
Format it as a ready-to-use template with placeholders for dates, signatures, and addresses. Make it sound warm, welcoming, while being legally clear and business professional.
Include a closing block signed off by: "${currentUser.name}, ${currentUser.role}".`;
    } else if (documentType === "PromotionLetter") {
      docPrompt = `Draft a formal Letter of Promotion for "${employeeName}".
- New Title: ${jobTitle || "Senior Specialist"}
- Department: ${department || "Product Management"}
- New Salary/Compensation adjustment: ${salary ? `$${salary}` : "15% increase in compensation"}
- Details from Manager: ${details || "Outstanding leadership on the core releases and phenomenal team collaboration."}
Write a stellar appreciation message detailing their achievements, their new responsibilities, and key metrics. Format as a formal corporate letter ready for signoff.
Include a signature line for: "${currentUser.name}, ${currentUser.role}".`;
    } else if (documentType === "WarningLetter") {
      docPrompt = `Draft a constructive, formal employee Warning / Performance Improvement Notification for "${employeeName}".
- Department: ${department || "Operations"}
- Core Issue / Situation: ${details || "Inconsistent task completion and repeating missed alignment sessions."}
- Consequences: Constructive action plan, regular check-ins, and future review timelines.
Maintain a respectful, supportive yet firm corporate style outlining exactly what needs improvement, clear expectations, and the company's commitment to help them succeed.
Sign it as issued by: "${currentUser.name}, ${currentUser.role}".`;
    } else if (documentType === "PerformanceReview") {
      docPrompt = `Draft a modern summary Performance Review Assessment for "${employeeName}".
- Role: ${jobTitle || "Analyst"}
- Department: ${department || "Finance"}
- Scope & Performance Highlights: ${details || "Excellent analytical precision and fast reports generation. Opportunities to improve public presentation confidence."}
Format this into clear sections: 1. Core Accomplishments, 2. Performance Evaluation Ratings, 3. Areas of Growth & Support, and 4. Agreed Goals for Following Period. Make it constructive, balanced, objective, and inspiring.
Sign it as evaluated by: "${currentUser.name}, ${currentUser.role}".`;
    } else {
      docPrompt = `Generate a standard HR document for ${employeeName} with details: ${details}. Format beautifully with markdown.`;
    }

    const response = await generateContentWithRetryAndFallback(ai, {
      model: "gemini-3.5-flash",
      contents: docPrompt,
      config: {
        systemInstruction: "You are a professional Human Resources Documents Draftsman. You output well-designed templates in clean markdown with letterheads, structural layout, signature lines, and elegant formatting.",
        temperature: 0.6,
      }
    });

    res.json({ document: response.text });
  } catch (error: any) {
    console.error("Gemini Document Error:", error);
    try {
      const fallbackDoc = getLocalDocumentFallback(documentType, employeeName, details, jobTitle, department, salary, currentUser);
      res.json({ document: fallbackDoc });
    } catch (fallbackError: any) {
      res.status(500).json({ 
        error: error.message || "Failed to generate HR document",
        needConfig: !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY"
      });
    }
  }
});


// Configure Vite middleware and static routes
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode with static static file hosting...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HRMS Express running on host 0.0.0.0 on port ${PORT}`);
  });
}

setupServer();
