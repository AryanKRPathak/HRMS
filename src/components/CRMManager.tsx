import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Headphones, 
  UserPlus, 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  Building2,
  Mail,
  Phone
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  company: string;
  category: "Client" | "Tech Vendor" | "Partner" | "Vendor" | "HR Agency";
  email: string;
  phone: string;
  status: "Active" | "Inactive";
}

interface SupportTicket {
  id: string;
  title: string;
  contactName: string;
  category: "Technical" | "Access" | "Benefits" | "Operations" | "Vendor Management";
  priority: "Low" | "Medium" | "High" | "Urgent";
  createdDate: string;
  status: "Open" | "In Progress" | "Resolved";
  description: string;
}

interface CRMManagerProps {
  currentUser: any;
  onNavigate: (tabId: string) => void;
  onAddAuditLog: (action: string, entity: string, entityId: string) => void;
}

export default function CRMManager({ currentUser, onNavigate, onAddAuditLog }: CRMManagerProps) {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem("hrms_crm_contacts");
    if (saved) return JSON.parse(saved);
    return [
      { id: "CON-001", name: "Techpark Solutions", company: "Techpark Solutions Ltd.", category: "Tech Vendor", email: "partner@techpark.com", phone: "+91 9830022312", status: "Active" },
      { id: "CON-002", name: "Acme Corp HR", company: "Acme Corporate LLC", category: "Client", email: "support@acme.com", phone: "+1 415-920-1100", status: "Active" },
      { id: "CON-003", name: "BenefitPlus Insurance", company: "BenefitPlus Insurance Pvt.", category: "Partner", email: "claims@benefitplus.com", phone: "+91 1800-420-1111", status: "Active" },
      { id: "CON-004", name: "Infra Spaces", company: "Infra Spaces Real Estate", category: "Vendor", email: "lease@infraspaces.in", phone: "+91 80 44101900", status: "Inactive" },
      { id: "CON-005", name: "GlobalStaff Agency", company: "GlobalStaff Careers Inc.", category: "HR Agency", email: "hires@globalstaff.co", phone: "+44 207 946 0958", status: "Active" }
    ];
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem("hrms_crm_tickets");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "TCK-001",
        title: "Payroll Integration not syncing",
        contactName: "Techpark Solutions",
        category: "Technical",
        priority: "High",
        createdDate: "20 May 2026, 08:15 pm",
        status: "Open",
        description: "Monthly payroll dataset fails to synchronise to current client bank servers."
      },
      {
        id: "TCK-002",
        title: "Employee portal access issue",
        contactName: "Acme Corp HR",
        category: "Access",
        priority: "Urgent",
        createdDate: "20 May 2026, 08:15 pm",
        status: "In Progress",
        description: "Some employees are unable to login to web portal after JWT routine system upgrades."
      },
      {
        id: "TCK-003",
        title: "Insurance claim rejected",
        contactName: "BenefitPlus Insurance",
        category: "Benefits",
        priority: "Medium",
        createdDate: "20 May 2026, 08:15 pm",
        status: "Open",
        description: "Employee surgical medical reimbursement claim rejected without appropriate explanation SLA."
      },
      {
        id: "TCK-004",
        title: "Office lease renewal query",
        contactName: "Infra Spaces",
        category: "Operations",
        priority: "Low",
        createdDate: "20 May 2026, 08:15 pm",
        status: "Resolved",
        description: "Dispatched lease renewal documentation of secondary engineering workspace floor."
      },
      {
        id: "TCK-005",
        title: "Recruitment agency contract renewal",
        contactName: "GlobalStaff Agency",
        category: "Vendor Management",
        priority: "Medium",
        createdDate: "20 May 2026, 08:15 pm",
        status: "Open",
        description: "Standard executive hiring contract is scheduled to expire in current week. Requesting SLA renegotiation."
      }
    ];
  });

  const [activeTab, setActiveTab ] = useState<"tickets" | "contacts">("tickets");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const [ticketForm, setTicketForm] = useState({
    title: "",
    contactName: "Techpark Solutions",
    category: "Technical" as const,
    priority: "Medium" as const,
    description: ""
  });

  const [contactForm, setContactForm] = useState({
    name: "",
    company: "",
    category: "Client" as const,
    email: "",
    phone: ""
  });

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("hrms_crm_contacts", JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem("hrms_crm_tickets", JSON.stringify(tickets));
  }, [tickets]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email) {
      triggerToast("Please provide all required fields.");
      return;
    }

    const newContact: Contact = {
      id: `CON-00${Math.floor(Math.random() * 900) + 100}`,
      name: contactForm.name,
      company: contactForm.company || contactForm.name,
      category: contactForm.category,
      email: contactForm.email,
      phone: contactForm.phone || "+91 9999999999",
      status: "Active"
    };

    setContacts(prev => [newContact, ...prev]);
    onAddAuditLog(`CREATE CRM contact ${newContact.name}`, "CRM", newContact.id);
    setIsContactModalOpen(false);
    triggerToast(`Added contact: ${newContact.name}`);
    setContactForm({
      name: "",
      company: "",
      category: "Client",
      email: "",
      phone: ""
    });
  };

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.title || !ticketForm.description) {
      triggerToast("Please enter ticket title and summary description.");
      return;
    }

    const newTicket: SupportTicket = {
      id: `TCK-00${Math.floor(Math.random() * 900) + 100}`,
      title: ticketForm.title,
      contactName: ticketForm.contactName,
      category: ticketForm.category,
      priority: ticketForm.priority,
      createdDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }),
      status: "Open",
      description: ticketForm.description
    };

    setTickets(prev => [newTicket, ...prev]);
    onAddAuditLog(`CREATE CRM support_ticket ${newTicket.title}`, "CRM", newTicket.id);
    setIsTicketModalOpen(false);
    triggerToast(`Created Support Ticket: ${newTicket.id}`);
    setTicketForm({
      title: "",
      contactName: contacts[0]?.name || "Techpark Solutions",
      category: "Technical",
      priority: "Medium",
      description: ""
    });
  };

  const handleUpdateTicketStatus = (ticketId: string, nextStatus: any) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: nextStatus };
      }
      return t;
    }));
    onAddAuditLog(`UPDATE support_ticket status of ${ticketId} to ${nextStatus}`, "CRM", ticketId);
    triggerToast(`Ticket updated to ${nextStatus}`);
  };

  const handleDeleteContact = (conId: string) => {
    setContacts(prev => prev.filter(c => c.id !== conId));
    onAddAuditLog(`DELETE CRM contact ${conId}`, "CRM", conId);
    triggerToast("Contact removed.");
  };

  // Calculations
  const openCount = tickets.filter(t => t.status === "Open").length;
  const inProgressCount = tickets.filter(t => t.status === "In Progress").length;
  const resolvedCount = tickets.filter(t => t.status === "Resolved").length;

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" id="crm-panel">
      {toast && (
        <div className="fixed top-5 right-5 z-55 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-750 flex items-center gap-2 animate-fade-in no-print">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {toast}
        </div>
      )}

      {/* Header operations row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
            CRM
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Manage corporate partner contacts and external support tickets.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-55 hover:border-slate-300 rounded-lg text-xs cursor-pointer shadow-3xs flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-400" />
            Add Contact
          </button>
          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-lg text-xs cursor-pointer shadow-md shadow-blue-900/10 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Ticket
          </button>
        </div>
      </div>

      {/* KPI blocks matching screenshot directly */}
      {activeTab === "tickets" && (
        <div className="grid grid-cols-3 gap-5">
          
          {/* Open Tickets */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
            <span className="text-[26px] font-bold text-slate-800 leading-none">{openCount}</span>
            <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">Open Tickets</span>
          </div>

          {/* In Progress */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
            <span className="text-[26px] font-bold text-blue-605 text-blue-650 text-blue-600 leading-none">{inProgressCount}</span>
            <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">In Progress</span>
          </div>

          {/* Resolved */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
            <span className="text-[26px] font-bold text-emerald-600 leading-none">{resolvedCount}</span>
            <span className="text-xs font-semibold text-slate-400 tracking-wide mt-2">Resolved</span>
          </div>

        </div>
      )}

      {/* Main card box */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        
        {/* Navigation and sub-filters row */}
        <div className="bg-slate-50/40 border-b border-slate-100 p-4 flex flex-col sm:flex-row justify-between gap-4 items-center">
          
          {/* Main Tab switches */}
          <div className="flex bg-slate-100/90 p-1 rounded-lg self-start sm:self-auto shrink-0">
            <button
              onClick={() => { setActiveTab("tickets"); setSearchTerm(""); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === "tickets" 
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Support Tickets
            </button>
            <button
              onClick={() => { setActiveTab("contacts"); setSearchTerm(""); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === "contacts" 
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Contacts
            </button>
          </div>

          {/* Core Search box */}
          <div className="relative w-full sm:w-64 md:w-80">
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder={activeTab === "tickets" ? "Search support tickets..." : "Search corporate contacts..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-105 text-xs text-slate-705 font-medium rounded-lg bg-white"
            />
          </div>

        </div>

        {/* Dynamic Lists table */}
        <div className="p-4 overflow-x-auto">
          {activeTab === "tickets" ? (
            filteredTickets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">No support tickets match your filters.</p>
            ) : (
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium pb-2 text-[10.5px] uppercase tracking-wider">
                    <th className="py-3 font-semibold pb-2.5">Title</th>
                    <th className="py-3 font-semibold">Contact</th>
                    <th className="py-3 font-semibold">Category</th>
                    <th className="py-3 font-semibold">Priority</th>
                    <th className="py-3 font-semibold">Created Date</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {filteredTickets.map(tck => (
                    <tr key={tck.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 pr-2 max-w-xs md:max-w-sm">
                        <div className="font-bold text-slate-805 leading-snug">{tck.title}</div>
                        <div className="text-[10px] text-slate-400 leading-normal mt-0.5 font-sans break-words line-clamp-1">{tck.description}</div>
                      </td>
                      <td className="py-3.5 pr-2 text-slate-600 font-bold">{tck.contactName}</td>
                      <td className="py-3.5 text-slate-400">{tck.category}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          tck.priority === "Urgent" ? "bg-rose-50 text-rose-750 border-rose-150 animate-pulse" :
                          tck.priority === "High" ? "bg-amber-50 text-amber-700 border-amber-105" :
                          tck.priority === "Medium" ? "bg-blue-50 text-blue-700 border-blue-150" :
                          "bg-slate-100 text-slate-650 border-slate-200"
                        }`}>
                          {tck.priority}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-slate-400 whitespace-nowrap">{tck.createdDate}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          tck.status === "Resolved" ? "bg-green-50 text-green-700 border-green-150" :
                          tck.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-155" :
                          "bg-amber-50 text-amber-705 border-amber-105"
                        }`}>
                          {tck.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        {tck.status === "Open" && (
                          <button
                            onClick={() => handleUpdateTicketStatus(tck.id, "In Progress")}
                            className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-md text-[10px] hover:bg-blue-700 cursor-pointer"
                          >
                            Work On
                          </button>
                        )}
                        {tck.status === "In Progress" && (
                          <button
                            onClick={() => handleUpdateTicketStatus(tck.id, "Resolved")}
                            className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-md text-[10px] hover:bg-emerald-700 cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                        {tck.status === "Resolved" && (
                          <span className="text-[10px] text-slate-405 font-bold uppercase font-mono">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            filteredContacts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">No contacts recorded in database.</p>
            ) : (
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium pb-2 text-[10.5px] uppercase tracking-wider">
                    <th className="py-3 font-semibold pb-2.5">Partner Contact</th>
                    <th className="py-3 font-semibold">Corporate entity</th>
                    <th className="py-3 font-semibold">Connection Class</th>
                    <th className="py-3 font-semibold">Contact Email</th>
                    <th className="py-3 font-semibold">Phone info</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 font-semibold text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {filteredContacts.map(con => (
                    <tr key={con.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5">
                        <div className="font-bold text-slate-805">{con.name}</div>
                        <div className="text-[9.5px] text-slate-400 block mt-0.5 font-mono">{con.id}</div>
                      </td>
                      <td className="py-3.5 font-bold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{con.company}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          con.category === "Client" ? "bg-indigo-50 text-indigo-700 border-indigo-150" :
                          con.category === "Tech Vendor" ? "bg-blue-50 text-blue-700 border-blue-150" :
                          con.category === "HR Agency" ? "bg-purple-50 text-purple-700 border-purple-150" :
                          "bg-slate-100 text-slate-650 border-slate-205"
                        }`}>
                          {con.category}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2">
                        <span className="flex items-center gap-1 text-slate-500 font-mono">
                          <Mail className="w-3.5 h-3.5 text-slate-350" />
                          <span>{con.email}</span>
                        </span>
                      </td>
                      <td className="py-3.5 pr-2">
                        <span className="flex items-center gap-1 text-slate-500 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-350" />
                          <span>{con.phone}</span>
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          con.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-150 text-slate-500"
                        }`}>
                          {con.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-1">
                        <button
                          onClick={() => handleDeleteContact(con.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

      </div>

      {/* New Ticket Modal */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-xs z-55 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-50 animate-fade-in relative font-sans">
            <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Create Support Ticket</h3>
            <p className="text-xs text-slate-400 mt-0.5">Publish a support ticket linked to corporate or partner contacts.</p>
            
            <form onSubmit={handleAddTicket} className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ticket Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Compensation payouts failing to process"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Contact Link *</label>
                  <select
                    value={ticketForm.contactName}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, contactName: e.target.value }))}
                    className="w-full px-2 py-2 border border-slate-200 outline-none rounded-lg text-xs text-slate-650 bg-white"
                  >
                    {contacts.map(con => (
                      <option key={con.id} value={con.name}>{con.name} ({con.category})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Support Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-2 py-2 border border-slate-200 outline-none rounded-lg text-xs text-slate-650 bg-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Access">Access</option>
                    <option value="Benefits">Benefits</option>
                    <option value="Operations">Operations</option>
                    <option value="Vendor Management">Vendor Management</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority SLA</label>
                <select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-2 py-2 border border-slate-200 outline-none rounded-lg text-xs text-slate-650 bg-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Insert error outputs, logs, or details..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-normal resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Publish Ticket
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-xs z-55 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-50 animate-fade-in relative font-sans">
            <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Add Contact</h3>
            <p className="text-xs text-slate-400 mt-0.5">Register a tech vendor, client, or corporate partner contact.</p>
            
            <form onSubmit={handleAddContact} className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Partner / Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Health Benefits"
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Corporate Entity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Healthcare Providers Ltd"
                  value={contactForm.company}
                  onChange={(e) => setContactForm(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Category Classification</label>
                <select
                  value={contactForm.category}
                  onChange={(e) => setContactForm(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-2 py-2 border border-slate-200 outline-none rounded-lg text-xs text-slate-650 bg-white"
                >
                  <option value="Client">Client</option>
                  <option value="Tech Vendor">Tech Vendor</option>
                  <option value="Partner">Partner</option>
                  <option value="Vendor">Vendor</option>
                  <option value="HR Agency">HR Agency</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. claims@apexhealth.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9123456789"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Commit Entry
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
