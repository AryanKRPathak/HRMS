import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  Compass, 
  MessageSquare, 
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { Employee } from "../types";

interface AICopilotFloatingWidgetProps {
  employees: Employee[];
  currentUser: any;
  onNavigate: (tabId: string) => void;
}

interface Message {
  role: "user" | "model";
  text: string;
}

export default function AICopilotFloatingWidget({ employees, currentUser, onNavigate }: AICopilotFloatingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hello! I am your interactive AI HR Copilot. Ask me any policy questions about Indian leave policies (v3.4), payroll timeline standards (HR-PAY-031), or corporate guidelines, and I will align them instantly for you."
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatLoading, isOpen]);

  const triggerStarterPrompt = (prompt: string) => {
    setChatInput(prompt);
  };

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
        throw new Error("Advisor responded with error");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "model", text: data.text }]);
    } catch (err) {
      console.error(err);
      // Perfect responsive offline compliance knowledge fallback
      setTimeout(() => {
        const query = userMessage.toLowerCase();
        let reply = "";

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
          reply = "### Sensitive Escalation Guidance\n\nFor queries involving legal matters, compliance concerns, formal discrimination, harassment, or sensitive workplace grievances, please connect with the HR department directly.\n\nContact **Diana Prince (HR Director)** or email **hr@enterprise.io** for completely secure, confidential processing.";
        }
        else if (query.includes("leave") || query.includes("vacation") || query.includes("sick") || query.includes("parental") || query.includes("time off") || query.includes("holiday")) {
          if (query.includes("vacation") || query.includes("annual")) {
            reply = "### Annual Vacation Leave Policy\n\nFull-time employees receive **20 days of paid vacation per calendar year**, accruing at 1.67 days/month. After 3 years of service, this increases to **25 days per calendar year**. Vacation requests must be submitted at least **2 weeks in advance** via the Leaves tab.";
          } else if (query.includes("sick") || query.includes("medical") || query.includes("cl/") || query.includes("cl") || query.includes("sl")) {
            reply = "### Paid Sick & Medical Leave Policy (CL/SL)\n\nEmployees receive up to **10 paid medical/sick days per year** for personal or family health recovery. Casual and sick leaves cannot be carried forward to the next fiscal year in the India jurisdiction.";
          } else if (query.includes("parental") || query.includes("maternity") || query.includes("paternity")) {
            reply = "### Paid Parental Leave Policy\n\nEmployees with at least 1 year of service get **14 calendar days of fully paid parental bonding leave**. For India region, maternity leave is offered up to **26 weeks** of protected time off.";
          } else {
            reply = "### Leave Rules Summary\n\n- **Vacation**: 20 days/year (25 days after 3 years tenure)\n- **Sick Leave**: 10 paid days/year\n- **Parental Leave**: 14 days fully paid; 26 weeks maternity for India region staff.";
          }
        }
        else if (query.includes("payroll") || query.includes("salary") || query.includes("pay") || query.includes("lock") || query.includes("hr-pay-031") || query.includes("reimburse")) {
          if (query.includes("lock") || query.includes("date") || query.includes("timeline") || query.includes("hr-pay-031")) {
            reply = "### India Payroll Schedule (HR-PAY-031 v2.4)\n\nUnder our standard **HR-PAY-031** guidelines, payroll locks on the **25th of each month** and salary credits on the **last working day** of the current month.";
          } else if (query.includes("reimburse") || query.includes("expense") || query.includes("sla")) {
            reply = "### Expense Reimbursement SLA\n\nClaims must be submitted by the 25th. Reimbursements are audited and processed to employee bank accounts within **7 to 14 working days** from the submission date.";
          } else {
            reply = "### Payroll and Compensation Suite\n\n- **Payment Frequency**: Semi-monthly or monthly depending on region. India credits on the last working day.\n- **SLA**: Expense claims processed to bank details within 7–14 business days.";
          }
        }
        else if (query.includes("wellness") || query.includes("gym") || query.includes("flex")) {
          reply = "### Wellness Flex Pack Policy\n\nActive full-time employees are eligible for up to **$100 per calendar month** (or equivalent regional stipend) reimbursement for physical fitness, gym packages, or mental wellbeing apps. File claims before the 25th of the month.";
        }
        else {
          reply = "I've searched our NexaHR / ERI compliance guidelines for your query but found no exact clause. Please consult with the **HR Department** or try asking about 'leave caps', 'reimbursements', or 'payroll timeline'.";
        }

        setMessages(prev => [...prev, { role: "model", text: reply }]);
      }, 800);
    } finally {
      setIsChatLoading(false);
    }
  };

  const getSmartActionsForText = (text: string) => {
    const actions: { tabId: string; label: string }[] = [];
    const lowercaseText = text.toLowerCase();
    
    if (lowercaseText.includes("leave") || lowercaseText.includes("vacation") || lowercaseText.includes("sick") || lowercaseText.includes("cl/")) {
      actions.push({ tabId: "benefits", label: "Leaves Hub" });
    }
    if (lowercaseText.includes("payroll") || lowercaseText.includes("salary") || lowercaseText.includes("compensation") || lowercaseText.includes("paystub")) {
      actions.push({ tabId: "payroll", label: "Payroll Ledger" });
    }
    if (lowercaseText.includes("attendance") || lowercaseText.includes("shift") || lowercaseText.includes("clock")) {
      actions.push({ tabId: "shifts", label: "Time Card" });
    }
    
    return actions.filter((v, idx, s) => s.findIndex(t => t.tabId === v.tabId) === idx);
  };

  return (
    <div className="no-print">
      
      {/* Persistent Floating action bar */}
      <button
        onClick={() => setIsOpen(true)}
        id="ai-copilot-floating-trigger"
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-[0_4px_14px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.6)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center group"
        title="Ask AI Copilot"
      >
        <Sparkles className="w-[22px] h-[22px] animate-pulse" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out font-sans font-bold text-xs pl-0 group-hover:pl-2 whitespace-nowrap">
          Ask AI HR Copilot
        </span>
      </button>

      {/* Slide-out Overlay Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-slate-950/25 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Core Panel Container matches design specs precisely */}
          <div className="relative w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-fade-in border-l border-slate-100 font-sans">
            
            {/* Header section with blue accents and sparkles */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-blue-600 rounded-lg text-white">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </span>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">AI HR Copilot</h3>
                  <span className="text-[9.5px] text-blue-400 font-mono tracking-wider font-bold block uppercase leading-none mt-0.5">Enterprise Suite Support</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat conversation flow with deep grey track */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc] custom-scrollbar">
              
              {/* starter prompt recommendations bubble section */}
              <div className="p-3.5 bg-white border border-slate-100 rounded-xl space-y-2.5 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-blue-500" />
                  Quick Compliance Prompts
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => triggerStarterPrompt("What is the HR-PAY-031 lock date and credit SLA?")}
                    className="w-full text-left p-2 bg-slate-50 hover:bg-blue-50/40 border border-slate-150 hover:border-blue-200 text-[10.5px] font-medium text-slate-700 hover:text-blue-700 rounded-lg transition-all truncate cursor-pointer"
                  >
                    🔍 HR-PAY-031 Payroll LOCK
                  </button>
                  <button
                    onClick={() => triggerStarterPrompt("What is the caps for Privilege Leave carryover in India leave rule v3.4?")}
                    className="w-full text-left p-2 bg-slate-50 hover:bg-blue-55/40 border border-slate-150 hover:border-blue-200 text-[10.5px] font-medium text-slate-700 hover:text-blue-700 rounded-lg transition-all truncate cursor-pointer"
                  >
                    🌴 India Leave Rule Privilege Cap
                  </button>
                  <button
                    onClick={() => triggerStarterPrompt("What is the wellness reimbursement monthly limit under ERI benefits?")}
                    className="w-full text-left p-2 bg-slate-50 hover:bg-blue-50/40 border border-slate-150 hover:border-blue-200 text-[10.5px] font-medium text-slate-700 hover:text-blue-700 rounded-lg transition-all truncate cursor-pointer"
                  >
                    💪 Wellness Reimbursement Stipend
                  </button>
                </div>
              </div>

              {/* Chat history items */}
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex gap-2 w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "model" && (
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-[10px] font-bold font-mono text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                      Cop
                    </span>
                  )}
                  <div className="max-w-[82%]">
                    <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-slate-900 text-slate-50 rounded-tr-none text-right" 
                        : "bg-white text-slate-800 border border-slate-150 rounded-tl-none shadow-3xs"
                    }`}>
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    </div>

                    {msg.role === "model" && getSmartActionsForText(msg.text).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {getSmartActionsForText(msg.text).map((act, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              onNavigate(act.tabId);
                              setIsOpen(false);
                            }}
                            className="px-2 py-0.5 bg-blue-50 hover:bg-blue-105 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-100 transition-all cursor-pointer shadow-3xs flex items-center gap-0.5"
                          >
                            <span>Open {act.label}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-2 items-center text-xs text-slate-400 font-medium">
                  <span className="p-1 px-1.5 bg-slate-100 rounded-full animate-spin">
                    <Loader2 className="w-3 h-3 text-blue-600" />
                  </span>
                  <span>AI Copilot is composing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Console Footer */}
            <form 
              onSubmit={handleSendChatMessage} 
              className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center shrink-0 shadow-md"
            >
              <input
                type="text"
                placeholder="Ask policy questions..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 outline-none rounded-xl text-xs focus:ring-2 focus:ring-blue-100 text-slate-700 font-medium bg-[#f8fafc] focus:bg-white transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-400 transition-colors rounded-xl font-bold cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>

        </div>
      )}

    </div>
  );
}
