import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  FileText, 
  Copy, 
  Check, 
  Printer, 
  Building, 
  Info, 
  MessageSquare,
  Compass,
  AlertTriangle,
  Loader2,
  Trash2
} from "lucide-react";
import { Employee } from "../types";
import Markdown from "react-markdown";

interface HRAssistanceProps {
  employees: Employee[];
  currentUser: any;
  onNavigate?: (tabId: string) => void;
}

interface Message {
  role: "user" | "model";
  text: string;
}

export default function HRAssistance({ employees, currentUser, onNavigate }: HRAssistanceProps) {
  const isEmployee = currentUser?.role === "Employee";
  const [activeTab, setActiveTab] = useState<"advisor" | "draftsman">("advisor");
  const [isGeminiHealthy, setIsGeminiHealthy] = useState<boolean | null>(null);

  // Chat Advisor States
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hello! I am your HR Compliance Advisor and talent strategist. Ask me anything about labor laws, onboarding checklists, performance standards, benefits comparisons, or employee retention strategies."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Document Draftsman States
  const [docType, setDocType] = useState<"OfferLetter" | "PromotionLetter" | "WarningLetter" | "PerformanceReview">("OfferLetter");
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [customName, setCustomName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [salary, setSalary] = useState("");
  const [specialDetails, setSpecialDetails] = useState("");
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Parse active policy match based on user's chat input typing
  const getActiveGroundingPolicyMatch = () => {
    if (!chatInput.trim()) return null;
    const val = chatInput.toLowerCase();
    
    if (val.includes("hr-pay-031") || val.includes("pf") || val.includes("provident") || val.includes("tds") || val.includes("ctc") || val.includes("reimburse") || val.includes("payroll") || val.includes("salary")) {
      if (val.includes("india") || val.includes("v2.4") || val.includes("hr-pay-031") || val.includes("pf") || val.includes("provident") || val.includes("tds") || val.includes("lock") || val.includes("hra") || val.includes("ctc")) {
        return {
          code: "HR-PAY-031 (v2.4)",
          title: "India Payroll & Reimbursement Policy v2.4",
          summary: "Payroll locks 25th, credited last working day. Structured CTC (Basic, HRA, PF, Tax, TDS, LOP). Reimbursements processed within 7–14 working days. Confidential and role-based access."
        };
      }
    }

    if (val.includes("india") || val.includes("privilege") || val.includes("cl/") || val.includes("sandwich") || val.includes("probation") || val.includes("maternity") || val.includes("paternity") || val.includes("pl") || val.includes("el") || val.includes("earned") || val.includes("v3.4") || val.includes("carryover") || val.includes("carry forward") || val.includes("encash")) {
      return {
        code: "HR-POL-042 (v3.4)",
        title: "India Employee Leave Policy v3.4 (Effective June 1, 2026)",
        summary: "Privilege Leaves minimum 2 days (no half-days), maximum 12 days carry-over, 26 weeks maternity, 10 days paternity, no sandwich rule enforced."
      };
    }
    if (val.includes("leave") || val.includes("vacation") || val.includes("sick") || val.includes("parental") || val.includes("time off") || val.includes("holiday") || val.includes("casual")) {
      return {
        code: "HR-POL-012",
        title: "US Core Employee Time-Off & Vacation Rulebook",
        summary: "20 Vacation days per year (25 days after 3 years), 10 paid Sick days, 14 days Parental bonding leave. Subject to 2-week prior notice."
      };
    }
    if (val.includes("payroll") || val.includes("salary") || val.includes("pay") || val.includes("earning") || val.includes("overtime") || val.includes("wage") || val.includes("flsa") || val.includes("tax")) {
      return {
        code: "HR-COMP-701",
        title: "Wage & Payroll Compliance Standard (FLSA & Direct Payouts)",
        summary: "Semi-monthly pay cycles (15th / last day). Non-exempt employees get 1.5x regular payment for hours > 40/week. Strict peer-salary confidentiality."
      };
    }
    if (val.includes("wellness") || val.includes("gym") || val.includes("flex") || val.includes("reimburse") || val.includes("expense") || val.includes("stipend") || val.includes("wfh")) {
      return {
        code: "HR-BEN-310",
        title: "Wellness Reimbursement & Dynamic Workspace Allotments",
        summary: "Up to $100/month Wellness Flex Pack (submit by 25th). One-time WFH ergonomic setup reimbursement up to $500."
      };
    }
    if (val.includes("harass") || val.includes("discrim") || val.includes("legal") || val.includes("arbitra") || val.includes("dispute") || val.includes("escalat") || val.includes("grievance") || val.includes("dispute") || val.includes("lawsuit") || val.includes("retaliat")) {
      return {
        code: "HR-COMP-911",
        title: "Sensitive Grievance & Direct Human Resource Escalation",
        summary: "Immediate routing to HR Director Diana Prince (hr@enterprise.io) for legal/sensitive mediation. Confidentially secured."
      };
    }
    if (val.includes("onboard") || val.includes("welcome") || val.includes("checklist") || val.includes("first 30") || val.includes("buddy")) {
      return {
        code: "HR-ONBD-101",
        title: "New Hire Onboarding Procedural Milestones",
        summary: "W-4/I-9 submissions in Days 1-3. Q2 Security & Anti-Phishing mandatory training in week 1. Mentor buddy syncs."
      };
    }
    if (val.includes("attendance") || val.includes("shift") || val.includes("clock") || val.includes("check-in") || val.includes("sft") || val.includes("timings") || val.includes("hour") || val.includes("late") || val.includes("overtime") || val.includes("grace") || val.includes("regularization")) {
      return {
        code: "HR-ATT-017 (v2.3)",
        title: "India Employee Attendance & Work Hours Policy v2.3",
        summary: "Office hours 09:30 AM-06:30 PM. Grace check-in 09:30-10:00 AM. Late Entry 10:01-11:00 AM. Half-Day after 11:00 AM. Regularize missing logs within 48h (Manager 48h SLA)."
      };
    }
    return null;
  };

  const getSmartActionsForText = (text: string) => {
    const actions: { tabId: string; label: string }[] = [];
    const lowercaseText = text.toLowerCase();
    
    if (lowercaseText.includes("time") || lowercaseText.includes("shifts") || lowercaseText.includes("clock-in") || lowercaseText.includes("check-in") || lowercaseText.includes("shift") || lowercaseText.includes("sft")) {
      actions.push({ tabId: "shifts", label: isEmployee ? "My Shift & Check-In" : "Time & Shifts" });
    }
    if (lowercaseText.includes("leave") || lowercaseText.includes("benefit") || lowercaseText.includes("vacation") || lowercaseText.includes("sick") || lowercaseText.includes("privilege") || lowercaseText.includes("parental") || lowercaseText.includes("maternity") || lowercaseText.includes("paternity") || lowercaseText.includes("casual")) {
      actions.push({ tabId: "benefits", label: isEmployee ? "My Leaves & Benefits" : "Leaves & Benefits" });
    }
    if (lowercaseText.includes("payroll") || lowercaseText.includes("paystub") || lowercaseText.includes("salary") || lowercaseText.includes("overtime") || lowercaseText.includes("wage") || lowercaseText.includes("compensation")) {
      actions.push({ tabId: "payroll", label: isEmployee ? "My Paystubs" : "Payroll & Finance" });
    }
    if (lowercaseText.includes("profile") || lowercaseText.includes("roster") || lowercaseText.includes("directory") || lowercaseText.includes("employee")) {
      actions.push({ tabId: "employees", label: isEmployee ? "My Profile" : "Talent Roster" });
    }
    if (lowercaseText.includes("announcement") || lowercaseText.includes("broadcast")) {
      actions.push({ tabId: "announcements", label: "Announcements" });
    }
    
    // De-duplicate actions based on tabId
    const uniqueActions = actions.filter((value, index, self) =>
      self.findIndex(v => v.tabId === value.tabId) === index
    );
    
    return uniqueActions;
  };

  const matchedPolicy = getActiveGroundingPolicyMatch();

  // Fetch API health on mount
  useEffect(() => {
    fetch("/api/health/gemini")
      .then(res => res.json())
      .then(data => {
        setIsGeminiHealthy(data.available);
      })
      .catch(() => {
        setIsGeminiHealthy(false);
      });
  }, []);

  // Sync scroll on chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  // Autofill fields if employee selected
  useEffect(() => {
    if (selectedEmpId) {
      const emp = employees.find(e => e.id === selectedEmpId);
      if (emp) {
        setCustomName(emp.name);
        setJobTitle(emp.role);
        setDepartment(emp.department);
        setSalary(emp.salary.toString());
      }
    } else {
      setCustomName("");
      setJobTitle("");
      setDepartment("");
      setSalary("");
    }
  }, [selectedEmpId, employees]);

  // Handle Advisor Chat Submission
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsChatLoading(true);

    try {
      const token = localStorage.getItem("hrms_token");
      const response = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(1) // exclude first greeting
        })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Unauthorized or expired session. Please re-authenticate.");
        }
        throw new Error("Advisor responded with an error status.");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "model", text: data.text }]);
    } catch (err) {
      console.error(err);
      // Fallback for demonstration when offline/unconfigured - strictly following company policies and guardrails
      setTimeout(() => {
        const query = userMessage.toLowerCase();
        let reply = "";
        
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
          reply = "### Sensitive Escalation Guidance\n\nFor queries involving legal matters, compliance concerns, formal discrimination, harassment, or sensitive workplace grievances, we recommend contacting the Human Resources department directly. \n\nPlease reach out directly to **Diana Prince (HR Director)** or email **hr@enterprise.io** for secure, confidential processing.";
        }
        // 2. Leave rules & approvals
        else if (query.includes("leave") || query.includes("vacation") || query.includes("sick") || query.includes("parental") || query.includes("time off") || query.includes("holiday")) {
          if (query.includes("approve") || query.includes("request") || query.includes("modify") || query.includes("file") || query.includes("log")) {
            reply = "### Leave Request Submission\n\nAs your AI HR Copilot, I am unable to approve leave requests or modify records. \n\nPlease navigate to the **Time & Shifts** tab to file your formal request. It will be routed automatically to your manager and HR for review.";
          } else if (query.includes("vacation") || query.includes("annual")) {
            reply = "### Annual Vacation Leave Policy\n\nFull-time employees receive **20 days of paid vacation per calendar year**, which accrues monthly at a rate of 1.67 days/month. After 3 years of continuous service (tenured staff), this allotment increases to **25 days per calendar year**. Vacation requests must be submitted at least **2 weeks in advance** via the HR portal. I am unable to modify records directly.";
          } else if (query.includes("sick") || query.includes("medical")) {
            reply = "### Paid Sick & Medical Leave Policy\n\nActive full-time employees receive up to **10 paid medical/sick days per fiscal year** for personal or immediate family health recovery. For planned procedures or routine surgeries, please provide at least **1 week of prior notice**.";
          } else if (query.includes("parental") || query.includes("maternity") || query.includes("paternity")) {
            reply = "### Paid Parental Leave Policy\n\nFull-time employees with at least 1 year of continuous service are eligible for **14 calendar days of fully paid parental bonding leave** following the birth or adoption of a child. Extended unpaid bonding can be requested under family care guidelines.";
          } else {
            reply = "### Leave Rules & Allotments\n\nUsing ERI's HR guidelines, here are the key leave segments:\n- **Vacation**: 20 days/year (25 days after 3 years tenure), accrued monthly.\n- **Sick Leave**: 10 paid days/year for personal/family health.\n- **Parental Leave**: 14 days fully paid parental bonding leave after 1 year of service.\n\n*Note*: Leave requests must be filed formally under the **Time & Shifts** tab. I cannot approve or modify requests.";
          }
        }
        // 3. Compensation / Payroll / Confidentiality
        else if (query.includes("payroll") || query.includes("salary") || query.includes("pay") || query.includes("earning") || query.includes("wage") || query.includes("overtime")) {
          // Check if user is asking about other employees
          const queryNoUser = query.replace("my", "").replace("me", "");
          const mentionsOther = queryNoUser.includes("alex") || queryNoUser.includes("mercer") || queryNoUser.includes("beatriz") || queryNoUser.includes("vance") || queryNoUser.includes("cassian") || queryNoUser.includes("rook") || queryNoUser.includes("diana") || queryNoUser.includes("prince") || queryNoUser.includes("fiona") || queryNoUser.includes("elijah") || queryNoUser.includes("other") || queryNoUser.includes("anyone else");
          
          if (mentionsOther) {
            reply = "### Confidentiality Protection Notice\n\nI am strictly prohibited from exposing confidential employee information or revealing the payroll, salary details, or personal banking information of other employees.";
          } else if (query.includes("overtime") || query.includes("non-exempt")) {
            reply = "### Overtime Compensation Policy\n\nIn compliance with FLSA guidelines, non-exempt employees receive **1.5x their standard regular hourly rate** for all actual physical hours worked exceeding 40 hours in a single calendar workweek.";
          } else {
            reply = "### Payroll Cycle and Direct Deposit\n\n- **Payment Cycle**: Paid semi-monthly on the **15th and last day of the calendar month**.\n- **Payment Method**: Direct deposit is highly recommended. You can set this up securely with your bank account number and routing number under the **Employee Profile** tab.";
          }
        }
        // 4. Reimbursement / Wellness / Expenses
        else if (query.includes("reimburse") || query.includes("wellness") || query.includes("flex pack") || query.includes("gym") || query.includes("stipend") || query.includes("expense") || query.includes("wfh") || query.includes("work from home")) {
          if (query.includes("wellness") || query.includes("gym") || query.includes("flex")) {
            reply = "### Wellness Flex Pack Policy\n\nActive full-time employees are eligible for up to **$100 per calendar month** reimbursement to spend on gym memberships, exercise/sports equipment, mental health apps, or physical rehabilitation. Please submit proof-of-payment receipts via the portal before the **25th of the month**.";
          } else if (query.includes("wfh") || query.includes("work from home") || query.includes("ergonomic") || query.includes("desk") || query.includes("stipend")) {
            reply = "### Work-from-Home (WFH) Stipend\n\nEnterprise Resources Inc. offers a **one-time $500 workspace stipend** upon onboarding to procure ergonomic desks, office chairs, dual monitors, or peripheral equipment. Receipts are mandatory to process the claim.";
          } else if (query.includes("travel") || query.includes("flight") || query.includes("hotel") || query.includes("lodging")) {
            reply = "### Business Travel Expense Policy\n\nStandard flights, lodging, and work meals are fully reimbursable upon submitting valid receipts. Personal detours, room upgrades, and alcoholic beverages are strictly non-reimbursable.";
          } else {
            reply = "### Enterprise Expense Reimbursements\n\n- **Wellness Flex Pack**: Up to $100/month reimbursed for physical and mental health. File before the 25th.\n- **WFH Stipend**: One-time $500 ergonomic equipment reimbursement at onboarding.\n- **Travel**: Business-related transportation, lodging, and meals are covered upon receipt submission.";
          }
        }
        // 5. Onboarding procedures
        else if (query.includes("onboard") || query.includes("welcome") || query.includes("checklist") || query.includes("first day") || query.includes("first 30")) {
          reply = "### New Hire Onboarding Checklist (First 30 Days)\n\n- **Days 1-3**: Review welcome checklist, submit tax forms (W-4 / I-9), and complete direct deposit instructions.\n- **Week 1**: Complete the mandatory **Q2 Security Awareness and Anti-Phishing interactive training**.\n- **Month 1**: Align with your assigned onboarding mentor (buddy), review team tooling access, and secure standard permissions.";
        }
        // 6. Attendance & shift policies
        else if (query.includes("attendance") || query.includes("shift") || query.includes("time") || query.includes("clock") || query.includes("check")) {
          reply = "### Shift Alignment & Attendance Policy\n\n- **Regular Shifts**: Available standard slots are:\n  * `SFT-1` Standard Day: 09:00 - 17:00, Mon-Fri\n  * `SFT-2` Late Morning: 11:00 - 19:00, Mon-Fri\n  * `SFT-3` Night Shift: 21:00 - 05:00, Mon-Sat\n  * `SFT-4` Weekend Support: 08:00 - 16:00, Sat-Sun\n- **Daily Tracking**: Clock-in and clock-out daily in the **Time & Shifts** tab. Late arrivals (due to transit, server issues, etc.) should be logged with concise explanation notes for review.";
        }
        // 7. Internal guidelines / generic conduct
        else if (query.includes("guideline") || query.includes("conduct") || query.includes("rule") || query.includes("hybrid") || query.includes("remote") || query.includes("code") || query.includes("core hour") || query.includes("policy")) {
          reply = "### Hybrid Work & Internal Guidelines\n\n- **Hybrid Cadence**: Employees align remote days with managers. Physical office hubs are located in Seattle, WA and San Francisco, CA.\n- **Core Hours**: ERI coordinates daily core collaboration hours from **10:00 AM to 4:00 PM local time**.\n- **Conduct Code**: ERI enforces a respectful workplace. Discrimination or harassment will trigger immediate compliance reviews.\n- **Security**: Annual compliance and Q2 IT Security Awareness modules are mandatory for system login health.";
        }
        // 8. Confidential employee check (self or others)
        else if (query.includes("who is") || query.includes("tell me about") || query.includes("employee") || query.includes("info")) {
          reply = "### Confidential Employee Information Policy\n\nStrict company guardrails state that confidential employee data (tax, address, or payroll info) cannot be exposed by this Copilot. For certified employee directory lists, please refer directly to the **Employee Directory** tab.";
        }
        // 9. Otherwise, strictly indicate that information is not found in the policies
        else {
          reply = "I could not find this information in the company policies.";
        }
        
        setMessages(prev => [...prev, { role: "model", text: reply }]);
      }, 1000);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Chat Starter Prompt Helpers
  const triggerStarterPrompt = (prompt: string) => {
    setChatInput(prompt);
  };

  // Handle Document Draft Generation
  const handleGenerateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDocLoading) return;

    const nameToUse = customName.trim() || "Jane Resident";
    setIsDocLoading(true);
    setGeneratedDoc(null);

    try {
      const token = localStorage.getItem("hrms_token");
      const response = await fetch("/api/gemini/document", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          documentType: docType,
          employeeName: nameToUse,
          details: specialDetails,
          jobTitle,
          department,
          salary
        })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Unauthorized or expired session. Please re-authenticate.");
        }
        throw new Error("Failed to produce template draft");
      }

      const data = await response.json();
      setGeneratedDoc(data.document);
    } catch (err) {
      console.error(err);
      // Dynamic local offline template mockup generator
      setTimeout(() => {
        let simulatedDoc = "";
        const formattedWage = salary ? Number(salary).toLocaleString() : "105,000";

        if (docType === "OfferLetter") {
          simulatedDoc = `# JOB OFFER LETTER

**Date: May 20, 2026**

**To:** ${nameToUse}  
**Department:** ${department || "Engineering"}  
**Proposed Title:** ${jobTitle || "Full Stack Developer"}  

---

Dear ${nameToUse},

We are thrilled to extend an official offer of employment to join our growing team at **Enterprise Resources Inc.** as a **${jobTitle || "Full Stack Developer"}**.

### 1. Position and Scope
You will report directly to the respective engineering alignment leads. The scope of your position is focused on technical execution, software architectures of the main SaaS releases, and peer code collaborations.

### 2. Compensation & Standard Benefits
* **Annual Base Salary:** $${formattedWage} USD per annum, payable in standard monthly payroll Cycles.
* **Health Coverage split:** Premium plans with standard company coverage contribution.
* **Paid Time Off:** Accruing up to 15 days of annual paid vacation leave per fiscal year.

### 3. Special Provisions
${specialDetails || "This draft is subject to background verification standard guidelines."}

We hope to hear back from you regarding your acceptance of this proposal within 5 business days.

Sincerely,  
**Diana Prince**  
Director of Human Resources  
_Enterprise Resources Inc._

---
**Acceptance Sign-off:**

Name: ______________________  
Signature: __________________  
Date: ________________________`;
        } else if (docType === "PromotionLetter") {
          simulatedDoc = `# LETTER OF CONGRATULATIONS & PROMOTION

**Date:** May 20, 2026  
**Employee Name:** ${nameToUse}  
**New Position:** ${jobTitle || "Senior Alignment Lead"}  

---

Dear ${nameToUse},

It is with immense appreciation that we formally announce your promotion to **${jobTitle || "Senior Alignment Lead"}** within the **${department || "Product Division"}**.

This elevation is in strategic recognition of your outstanding performance, technical mentorship, and leadership during our core system sprints.

### Adjusted Terms & Outflow:
* **New Base Compensation:** $${formattedWage} USD per Year.
* **Effective Date:** Immediate.
* **Core metrics:** Standard leadership expectations as discussed in performance review assessments.

Thank you for your continued dedication to our collective success.

Warmest Regards,  
**Alexander Mercer**  
VP of Engineering`;
        } else {
          simulatedDoc = `# HR NOTIFICATION & ASSESSMENT DRAFT

**Relates to:** ${nameToUse}  
**Document Type:** ${docType}  

---

## 1. Context Information
This file acts as a formal corporate draft tracking ${docType} criteria for **${nameToUse}**.

## 2. Details and Alignment Notes
${specialDetails || "Performance expectations remain high. Regular 30-60-90 day benchmarks must be tracked in the core system."}

**Generated Decider Signature:**  
Corporate HR compliance Admin`;
        }

        setGeneratedDoc(simulatedDoc);
      }, 1000);
    } finally {
      setIsDocLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedDoc) return;
    navigator.clipboard.writeText(generatedDoc);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="hrms-ai-assistance">
      
      {/* Top Advisory Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex gap-4 items-start">
          <span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-1">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </span>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">AI HR Advisor & Document Draftsman</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-normal">
              Empowered by Gemini AI models, this module helps you solve legal compliance bottlenecks and generates corporate templates with a click.
            </p>
          </div>
        </div>

        {/* Gemini State Health Status Badge */}
        <div className="shrink-0">
          {isGeminiHealthy === null ? (
            <span className="text-xs text-slate-400 font-mono animate-pulse">Confirming credentials...</span>
          ) : isGeminiHealthy ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Gemini Online
            </span>
          ) : (
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[11px] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Local Simulated Mode
              </span>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-tight font-sans">
                Mock responses prepared. Configure your real **GEMINI_API_KEY** under Settings for live generation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Primary tab triggers */}
      {!isEmployee && (
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("advisor")}
            className={`px-6 py-3 font-display font-bold text-sm tracking-tight border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
              activeTab === "advisor" 
                ? "border-indigo-600 text-indigo-600 bg-white" 
                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            HR Compliance Advisor Chat
          </button>
          <button
            onClick={() => setActiveTab("draftsman")}
            className={`px-6 py-3 font-display font-bold text-sm tracking-tight border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
              activeTab === "draftsman" 
                ? "border-indigo-600 text-indigo-600 bg-white" 
                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FileText className="w-4 h-4" />
            Structured Letter Draftsman
          </button>
        </div>
      )}

      {/* Tab 1: Compliance Advisor Chat Console */}
      {activeTab === "advisor" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="advisor-tab-content">
          
          {/* Quick-starter guides (left 1/4) */}
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-slate-50 p-4 border border-slate-200/65 rounded-xl space-y-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5 pb-2 border-b">
                  <Compass className="w-4 h-4 text-indigo-500" />
                  Compliance Prompts
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">Select a concept below to load the query instantly:</p>
              </div>
              
              <div className="space-y-3">
                {/* Section A: Global & US Core */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1 px-1">US & Global Core</span>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => triggerStarterPrompt("What is the US Core policy for annual vacation allocation and parental bonding leave?")}
                      className="w-full text-left p-2 bg-white border border-slate-150 hover:border-indigo-200 text-[11px] font-medium text-slate-700 hover:text-indigo-600 rounded-lg transition-all text-ellipsis cursor-pointer line-clamp-1"
                    >
                      US Core Time-Off Rules
                    </button>
                    <button
                      onClick={() => triggerStarterPrompt("Explain how FLSA overtime is calculated for non-exempt staff at ERI.")}
                      className="w-full text-left p-2 bg-white border border-slate-150 hover:border-indigo-200 text-[11px] font-medium text-slate-700 hover:text-indigo-650 rounded-lg transition-all text-ellipsis cursor-pointer line-clamp-1"
                    >
                      FLSA Overtime Calculation
                    </button>
                    <button
                      onClick={() => triggerStarterPrompt("How to structure a constructive 30-60-90 Performance Improvement Plan (PIP)?")}
                      className="w-full text-left p-2 bg-white border border-slate-150 hover:border-indigo-200 text-[11px] font-medium text-slate-700 hover:text-indigo-650 rounded-lg transition-all text-ellipsis cursor-pointer line-clamp-1"
                    >
                      PIP Checklists & Standards
                    </button>
                  </div>
                </div>

                {/* Section B: India Region Specific */}
                <div className="pt-2 border-t border-slate-200/70">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase font-mono block mb-1 px-1">India Region Policies</span>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => triggerStarterPrompt("Summarize the India Leave Policy v3.4 rules, including Privilege Leave (PL) accrual and caps.")}
                      className="w-full text-left p-2 bg-white border border-emerald-150 hover:border-emerald-300 text-[11px] font-medium text-slate-700 hover:text-emerald-700 rounded-lg transition-all text-ellipsis cursor-pointer line-clamp-1"
                    >
                      India Leave Policy v3.4 Summary
                    </button>
                    <button
                      onClick={() => triggerStarterPrompt("What is the carry-over cap and encashment rules for Privilege Leave in India?")}
                      className="w-full text-left p-2 bg-white border border-emerald-150 hover:border-emerald-300 text-[11px] font-medium text-slate-700 hover:text-emerald-700 rounded-lg transition-all text-ellipsis cursor-pointer line-clamp-1"
                    >
                      PL Carry-over & Cashout
                    </button>
                    <button
                      onClick={() => triggerStarterPrompt("Can Casual Leave or Sick Leave (CL/SL) be carried over in India, and is a medical certificate required?")}
                      className="w-full text-left p-2 bg-white border border-emerald-150 hover:border-emerald-300 text-[11px] font-medium text-slate-700 hover:text-emerald-700 rounded-lg transition-all text-ellipsis cursor-pointer line-clamp-1"
                    >
                      CL/SL Verification Rules
                    </button>
                    <button
                      onClick={() => triggerStarterPrompt("Provide an overview of the India Payroll & Reimbursement Policy HR-PAY-031 v2.4.")}
                      className="w-full text-left p-2 bg-white border border-emerald-150 hover:border-emerald-300 text-[11px] font-medium text-slate-700 hover:text-emerald-750 rounded-lg transition-all text-ellipsis cursor-pointer line-clamp-1"
                    >
                      Payroll & Reimbursement (v2.4)
                    </button>
                    <button
                      onClick={() => triggerStarterPrompt("What is the monthly payroll lock timeline and salary credit dates under policy HR-PAY-031?")}
                      className="w-full text-left p-2 bg-white border border-emerald-150 hover:border-emerald-300 text-[11px] font-medium text-slate-700 hover:text-emerald-750 rounded-lg transition-all text-ellipsis cursor-pointer line-clamp-1"
                    >
                      Payroll Schedule & Dates (v2.4)
                    </button>
                    <button
                      onClick={() => triggerStarterPrompt("What is the reimbursement submission workflow and processing SLAs under policy HR-PAY-031?")}
                      className="w-full text-left p-2 bg-white border border-emerald-150 hover:border-emerald-300 text-[11px] font-medium text-slate-700 hover:text-emerald-750 rounded-lg transition-all text-ellipsis cursor-pointer line-clamp-1"
                    >
                      India Reimbursement SLA & Steps
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-150/70 rounded-xl text-[11px] text-slate-650 leading-relaxed space-y-2">
              <span className="font-bold text-indigo-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Active RAG Grounds:
              </span>
              <p className="text-[10.5px] leading-normal text-slate-500">
                AI Copilot processes queries using the official **Enterprise Resources Employee Handbooks (US Core / India v3.4)** with Zero-Hallucination guarantees.
              </p>
            </div>
          </div>

          {/* Core Chat (right 3/4) */}
          <div className="bg-white border border-slate-200 rounded-lg flex flex-col justify-between h-[520px] lg:col-span-3 overflow-hidden">
            
            {/* Conversations */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-sm ${
                    msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-250 text-slate-700"
                  }`}>
                    {msg.role === "user" ? "US" : "AI"}
                  </span>
                  
                  <div className="flex flex-col gap-2 max-w-[90%]">
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-slate-900 text-slate-50 rounded-tr-none" 
                        : "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-150"
                    }`}>
                      <div className="markdown-body">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                    {msg.role === "model" && onNavigate && (
                      <div className="flex flex-wrap gap-1.5 px-0.5 mt-0.5 animate-fade-in">
                        {getSmartActionsForText(msg.text).map((act, keyIdx) => (
                          <button
                            key={keyIdx}
                            type="button"
                            onClick={() => onNavigate(act.tabId)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-200 text-indigo-650 hover:text-indigo-700 font-semibold text-[10px] rounded-full transition-all cursor-pointer shadow-3xs"
                          >
                            <span>Open {act.label}</span>
                            <span className="text-[11px] leading-none">↗</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-3 max-w-[85%] mr-auto items-center text-xs text-slate-400">
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold shrink-0 animate-spin">
                    <Loader2 className="w-4 h-4 text-indigo-600" />
                  </span>
                  <span>AI Advisory is drafting response...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Matched Policy Live Grounding bar */}
            {matchedPolicy && (
              <div className="px-4 py-2 bg-indigo-50/65 border-t border-b border-indigo-100/60 flex items-start gap-2.5 animate-fade-in max-h-[100px] overflow-y-auto">
                <span className="p-1 px-1.5 bg-indigo-600 text-white rounded text-[9px] uppercase font-mono font-bold shrink-0 mt-0.5 tracking-wider">
                  Grounding MATCH
                </span>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    {matchedPolicy.title} <span className="text-[10px] font-mono text-indigo-500">({matchedPolicy.code})</span>
                  </span>
                  <span className="text-[10.5px] leading-tight text-slate-500 block leading-normal">
                    {matchedPolicy.summary}
                  </span>
                </div>
              </div>
            )}

            {/* Chat Input Console */}
            <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 items-center">
              <input
                type="text"
                placeholder="Ask your compliance and legal questions here..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 outline-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-400 transition-colors rounded-xl shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>

        </div>
      )}

      {/* Tab 2: Document Draftsman Console */}
      {activeTab === "draftsman" && !isEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="draftsman-tab-content">
          
          {/* Configure parameters Form (5/12 width) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 lg:col-span-5 h-max space-y-4">
            <h3 className="text-sm font-mono uppercase text-slate-400 font-bold tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Draft parameters Configuration
            </h3>

            <form onSubmit={handleGenerateDocument} className="space-y-4 text-xs font-medium text-slate-700">
              
              {/* Select doc type */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Letter Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "OfferLetter", label: "Job Offer" },
                    { id: "PromotionLetter", label: "Promotion" },
                    { id: "WarningLetter", label: "Notice / PIP" },
                    { id: "PerformanceReview", label: "Perf. Review" }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDocType(item.id as any)}
                      className={`py-2 px-3 text-center rounded-lg border font-semibold transition-all text-[11px] cursor-pointer ${
                        docType === item.id 
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs" 
                          : "border-slate-200 hover:bg-slate-50 text-slate-650"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Fill Directory */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Quick-Fill From Directory (Optional)</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg focus:bg-white text-slate-800 cursor-pointer"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              {/* Input details */}
              <div className="space-y-3 pt-2 border-t border-slate-50">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Recipient Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Resident"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Strategist"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Revenues"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Annual salary adjustment ($ / Year)</label>
                  <input
                    type="number"
                    placeholder="e.g. 110000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Special terms or milestones</label>
                  <textarea
                    rows={4}
                    placeholder="Specify special health packages, milestone guidelines, warning reasons, or achievement evaluation feedback..."
                    value={specialDetails}
                    onChange={(e) => setSpecialDetails(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg focus:bg-white text-slate-800 font-normal leading-relaxed text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isDocLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs font-semibold hover:translate-y-[-0.5px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
              >
                {isDocLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Drafting content...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Assemble Professional Draft
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Render Result (7/12 width) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            {generatedDoc ? (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col h-full justify-between">
                
                {/* Result header */}
                <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Assembled Letterhead template</span>
                  <div className="flex gap-2.5">
                    <button
                      onClick={handleCopyToClipboard}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 transition-colors text-[10px] font-semibold cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      {isCopied ? "Copied" : "Copy Markup"}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Letter
                    </button>
                  </div>
                </div>

                {/* Printable Letter Head */}
                <div className="p-8 prose prose-slate max-w-none text-xs leading-relaxed max-h-[500px] overflow-y-auto" id="printable-letter-container">
                  <div className="border p-6 rounded-xl border-slate-150 font-sans tracking-wide space-y-4">
                    <div className="markdown-body">
                      <Markdown>{generatedDoc}</Markdown>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-150 text-center text-[10px] text-slate-400 leading-normal font-mono">
                  Confirm contents with company alignment leads before finalize signature.
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center py-20 px-8 text-center text-slate-450 h-full border-dashed min-h-[400px]">
                <FileText className="w-12 h-12 text-slate-300 stroke-[1.2] mb-3" />
                <h4 className="font-display font-medium text-slate-600 text-sm">Waiting for Draft Parameters</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1 leading-normal">
                  Configure corporate parameters on the left and trigger the assembler to create perfect, fully legally compliant document markup here.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
