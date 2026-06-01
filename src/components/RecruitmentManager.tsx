import React, { useState, useEffect } from "react";
import { 
  Users, 
  Briefcase, 
  Plus, 
  MapPin, 
  Search, 
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  FileCheck2,
  Clock,
  ArrowRight,
  ShieldAlert
} from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  email: string;
  position: string;
  currentCTC: string;
  source: string;
  appliedDate: string;
  stage: "Applied" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected";
}

interface JobPosting {
  id: string;
  title: string;
  type: string;
  location: string;
  openings: number;
  description: string;
  status: "Open" | "Closed";
  postedDate: string;
}

interface RecruitmentManagerProps {
  currentUser: any;
  onNavigate: (tabId: string) => void;
  onAddAuditLog: (action: string, entity: string, entityId: string) => void;
}

export default function RecruitmentManager({ currentUser, onNavigate, onAddAuditLog }: RecruitmentManagerProps) {
  if (currentUser?.role === "Employee") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-lg mx-auto text-center my-12 shadow-sm animate-fade-in" id="recruitment-access-denied">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Access Denied</h3>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
          You are not authorized to view this administrative management section. This module is restricted to HR Professionals and Administrators.
        </p>
        <button
          onClick={() => onNavigate("dashboard")}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem("hrms_candidates");
    if (saved) return JSON.parse(saved);
    return [
      { id: "CAN-001", name: "Sonal Desai", email: "sonal.desai@gmail.com", position: "Senior React Developer", currentCTC: "₹9,00,000", source: "Job Board", appliedDate: "10 May 2026", stage: "Screening" },
      { id: "CAN-002", name: "Mohan Lal", email: "mohan.lal@gmail.com", position: "DevOps Engineer", currentCTC: "₹11,00,000", source: "Direct", appliedDate: "15 May 2026", stage: "Applied" },
      { id: "CAN-003", name: "Geeta Sharma", email: "geeta.s@gmail.com", position: "HR Business Partner", currentCTC: "₹7,50,000", source: "Referral", appliedDate: "20 Apr 2026", stage: "Offer" },
      { id: "CAN-004", name: "Aryan Malhotra", email: "aryan.m@gmail.com", position: "Product Designer", currentCTC: "₹8,50,000", source: "LinkedIn", appliedDate: "17 May 2026", stage: "Offer" },
      { id: "CAN-005", name: "Nisha Kapoor", email: "nisha.k@gmail.com", position: "Financial Analyst", currentCTC: "₹7,00,000", source: "Referral", appliedDate: "05 Apr 2026", stage: "Hired" },
      { id: "CAN-006", name: "Prachi Agarwal", email: "prachi@gmail.com", position: "Intern - Software Eng", currentCTC: "₹3,50,000", source: "Referral", appliedDate: "10 May 2026", stage: "Screening" },
      { id: "CAN-007", name: "Ravi Teja", email: "ravi.teja@gmail.com", position: "Senior React Developer", currentCTC: "₹8,00,000", source: "Direct", appliedDate: "30 Apr 2026", stage: "Rejected" }
    ];
  });

  const [jobPostings, setJobPostings] = useState<JobPosting[]>(() => {
    const saved = localStorage.getItem("hrms_job_postings");
    if (saved) return JSON.parse(saved);
    return [
      { id: "JOB-001", title: "Senior React Developer", type: "Full Time", location: "Bengaluru", openings: 2, description: "Lead front-end engineering efforts with React 18, Vite & Tailwind.", status: "Open", postedDate: "10 May 2026" },
      { id: "JOB-002", title: "DevOps Engineer", type: "Full Time", location: "Remote", openings: 1, description: "Construct scalable pipelines on GCP with Docker & Kubernetes.", status: "Open", postedDate: "12 May 2026" },
      { id: "JOB-003", title: "HR Business Partner", type: "Full Time", location: "Bengaluru", openings: 1, description: "Champion policy enforcement & team wellbeing initiatives.", status: "Open", postedDate: "14 May 2026" },
      { id: "JOB-004", title: "Product Designer", type: "Full Time", location: "Bengaluru", openings: 1, description: "Refine user flows and produce delightful design assets.", status: "Open", postedDate: "15 May 2026" },
      { id: "JOB-005", title: "Financial Analyst", type: "Full Time", location: "Mumbai", openings: 1, description: "Spearhead corporate financial compliance modeling.", status: "Closed", postedDate: "20 Apr 2026" }
    ];
  });

  const [activeSubTab, setActiveSubTab] = useState<"candidates" | "jobs">("candidates");
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter ] = useState("All");

  // Add Candidate modal states
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    name: "",
    email: "",
    position: "Senior React Developer",
    currentCTC: "₹8,00,000",
    source: "LinkedIn"
  });

  // Add Job modal states
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "",
    type: "Full Time",
    location: "Bengaluru",
    openings: 1,
    description: ""
  });

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("hrms_candidates", JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem("hrms_job_postings", JSON.stringify(jobPostings));
  }, [jobPostings]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateForm.name || !candidateForm.email) {
      triggerToast("Please provide all required fields.");
      return;
    }
    const newCand: Candidate = {
      id: `CAN-00${Math.floor(Math.random() * 900) + 100}`,
      name: candidateForm.name,
      email: candidateForm.email,
      position: candidateForm.position,
      currentCTC: candidateForm.currentCTC,
      source: candidateForm.source,
      appliedDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      stage: "Applied"
    };

    setCandidates(prev => [newCand, ...prev]);
    onAddAuditLog(`CREATE on candidate ${newCand.id}`, "Candidate", newCand.id);
    setIsCandidateModalOpen(false);
    triggerToast(`Added candidate: ${newCand.name}`);
    setCandidateForm({
      name: "",
      email: "",
      position: "Senior React Developer",
      currentCTC: "₹8,00,000",
      source: "LinkedIn"
    });
  };

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title || !jobForm.description) {
      triggerToast("Please provide a title and description.");
      return;
    }
    const newJob: JobPosting = {
      id: `JOB-00${Math.floor(Math.random() * 900) + 100}`,
      title: jobForm.title,
      type: jobForm.type,
      location: jobForm.location,
      openings: Number(jobForm.openings),
      description: jobForm.description,
      status: "Open",
      postedDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    };

    setJobPostings(prev => [newJob, ...prev]);
    onAddAuditLog(`CREATE on job_posting ${newJob.id}`, "Job", newJob.id);
    setIsJobModalOpen(false);
    triggerToast(`Posted job: ${newJob.title}`);
    setJobForm({
      title: "",
      type: "Full Time",
      location: "Bengaluru",
      openings: 1,
      description: ""
    });
  };

  const handleMoveStage = (candId: string, newStage: any) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candId) {
        return { ...c, stage: newStage };
      }
      return c;
    }));
    onAddAuditLog(`UPDATE on stage to ${newStage} on candidate ${candId}`, "Candidate", candId);
    triggerToast(`Stage updated to ${newStage}`);
  };

  const handleDeleteCandidate = (candId: string) => {
    setCandidates(prev => prev.filter(c => c.id !== candId));
    onAddAuditLog(`DELETE candidate ${candId}`, "Candidate", candId);
    triggerToast("Candidate application deleted.");
  };

  // Stat metrics calculated automatically
  const openJobsCount = jobPostings.filter(j => j.status === "Open").reduce((acc, current) => acc + current.openings, 0);
  const appliedCount = candidates.filter(c => c.stage === "Applied").length;
  const screeningCount = candidates.filter(c => c.stage === "Screening").length;
  const interviewCount = candidates.filter(c => c.stage === "Interview").length;
  const offerCount = candidates.filter(c => c.stage === "Offer").length;
  const hiredCount = candidates.filter(c => c.stage === "Hired").length;
  const rejectedCount = candidates.filter(c => c.stage === "Rejected").length;

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = stageFilter === "All" || c.stage === stageFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredJobs = jobPostings.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" id="recruitment-portal">
      {toast && (
        <div className="fixed top-5 right-5 z-55 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-750 flex items-center gap-2 animate-fade-in no-print">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {toast}
        </div>
      )}

      {/* Header operations bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
            Recruitment & ATS
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Manage corporate candidate pipelines and career listings.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setIsJobModalOpen(true)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-55 hover:border-slate-300 rounded-lg text-xs cursor-pointer shadow-3xs flex items-center gap-1.5 transition-all"
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            Post New Job
          </button>
          <button
            onClick={() => setIsCandidateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-lg text-xs cursor-pointer shadow-md shadow-blue-900/10 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Grid count metrics matched exactly to design style */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        
        {/* Open Jobs */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[90px]">
          <span className="text-[24px] font-bold text-slate-800 leading-none">{openJobsCount}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Open Jobs</span>
        </div>

        {/* Applied */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[90px]">
          <span className="text-[24px] font-bold text-slate-800 leading-none">{appliedCount}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Applied</span>
        </div>

        {/* Screening */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[90px]">
          <span className="text-[24px] font-bold text-slate-800 leading-none">{screeningCount}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Screening</span>
        </div>

        {/* Interview */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[90px]">
          <span className="text-[24px] font-bold text-slate-800 leading-none">{interviewCount}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Interview</span>
        </div>

        {/* Offer */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[90px]">
          <span className="text-[24px] font-bold text-slate-800 leading-none">{offerCount}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Offer</span>
        </div>

        {/* Hired */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[90px]">
          <span className="text-[24px] font-bold text-emerald-600 leading-none">{hiredCount}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Hired</span>
        </div>

        {/* Rejected */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[90px]">
          <span className="text-[24px] font-bold text-rose-500 leading-none">{rejectedCount}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Rejected</span>
        </div>

      </div>

      {/* Main panel */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        
        {/* Navigation / Filter sub-tabs block */}
        <div className="bg-slate-50/40 border-b border-slate-100 p-4 flex flex-col sm:flex-row justify-between gap-4 items-center">
          
          {/* Tabs switch */}
          <div className="flex bg-slate-100/85 p-1 rounded-lg self-start sm:self-auto shrink-0">
            <button
              onClick={() => { setActiveSubTab("candidates"); setSearchTerm(""); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeSubTab === "candidates" 
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Candidates
            </button>
            <button
              onClick={() => { setActiveSubTab("jobs"); setSearchTerm(""); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeSubTab === "jobs" 
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Job Postings
            </button>
          </div>

          {/* Search column and Stage filter */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60 md:w-72">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={activeSubTab === "candidates" ? "Search candidates name..." : "Search jobs titles..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs text-slate-705 font-medium rounded-lg bg-white"
              />
            </div>
            
            {activeSubTab === "candidates" && (
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs font-bold text-slate-600 bg-white"
              >
                <option value="All">All Stages</option>
                <option value="Applied">Applied</option>
                <option value="Screening">Screening</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Hired">Hired</option>
                <option value="Rejected">Rejected</option>
              </select>
            )}
          </div>

        </div>

        {/* Content list body */}
        <div className="p-4 overflow-x-auto">
          {activeSubTab === "candidates" ? (
            filteredCandidates.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">No candidates match your queries.</p>
            ) : (
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium pb-2 text-[10.5px] uppercase tracking-wider">
                    <th className="py-3 font-semibold pb-2.5">Candidate</th>
                    <th className="py-3 font-semibold">Position</th>
                    <th className="py-3 font-semibold">Current CTC</th>
                    <th className="py-3 font-semibold">Applied</th>
                    <th className="py-3 font-semibold">Stage</th>
                    <th className="py-3 font-semibold text-center">Move</th>
                    <th className="py-3 font-semibold text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {filteredCandidates.map(cand => (
                    <tr key={cand.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 pr-2">
                        <div className="font-bold text-slate-805">{cand.name}</div>
                        <div className="text-[10px] text-slate-400 leading-none mt-0.5">{cand.email}</div>
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-slate-700">{cand.position}</span>
                        <span className="text-[10.5px] text-slate-400 block mt-0.5 font-mono">{cand.id} • {cand.source}</span>
                      </td>
                      <td className="py-3.5 pr-2 font-mono text-slate-600 font-bold">{cand.currentCTC}</td>
                      <td className="py-3.5 font-mono text-slate-400 pr-1">{cand.appliedDate}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          cand.stage === "Hired" ? "bg-green-50 text-green-700 border-green-150" :
                          cand.stage === "Rejected" ? "bg-rose-50 text-rose-750 border-rose-150" :
                          cand.stage === "Offer" ? "bg-amber-50 text-amber-700 border-amber-150" :
                          cand.stage === "Interview" ? "bg-purple-50 text-purple-700 border-purple-150" :
                          cand.stage === "Screening" ? "bg-blue-50 text-blue-700 border-blue-150" :
                          "bg-slate-150 text-slate-650 border-slate-205"
                        }`}>
                          {cand.stage}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <select
                          value={cand.stage}
                          onChange={(e) => handleMoveStage(cand.id, e.target.value)}
                          className="px-2.5 py-1 border border-slate-200 outline-none rounded-md text-[10.5px] font-bold text-slate-600 bg-white"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Screening">Screening</option>
                          <option value="Interview">Interview</option>
                          <option value="Offer">Offer</option>
                          <option value="Hired">Hired</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteCandidate(cand.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 rounded hover:bg-rose-50 cursor-pointer transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            filteredJobs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">No job postings registered.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.map(job => (
                  <div key={job.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className={`text-[9px] px-2 py-0.5 font-bold font-mono rounded ${
                          job.status === "Open" ? "bg-blue-50 text-blue-600 uppercase border border-blue-100" : "bg-slate-150 text-slate-500 border border-slate-200 uppercase"
                        }`}>
                          {job.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{job.postedDate}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mt-2.5">{job.title}</h4>
                      <p className="text-[10.5px] text-slate-500 leading-normal mt-1">{job.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10.5px] font-semibold text-slate-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 block shrink-0 text-slate-350" />
                        <span>{job.location} • {job.type}</span>
                      </div>
                      <span className="text-slate-600 font-mono">{job.openings} Openings</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

      </div>

      {/* Add Candidate Modal */}
      {isCandidateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-xs z-55 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-50 animate-fade-in relative font-sans">
            <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Add Candidate</h3>
            <p className="text-xs text-slate-400 mt-0.5">Register a new applicant to active recruitment trackers.</p>
            
            <form onSubmit={handleAddCandidate} className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">First & Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Mishra"
                  value={candidateForm.name}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.m@outlook.com"
                  value={candidateForm.email}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Position Link</label>
                  <select
                    value={candidateForm.position}
                    onChange={(e) => setCandidateForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-2 py-2 border border-slate-200 outline-none rounded-lg text-xs text-slate-650 bg-white"
                  >
                    {jobPostings.map(j => (
                      <option key={j.id} value={j.title}>{j.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Source</label>
                  <select
                    value={candidateForm.source}
                    onChange={(e) => setCandidateForm(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full px-2 py-2 border border-slate-200 outline-none rounded-lg text-xs text-slate-650 bg-white"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Job Board">Job Board</option>
                    <option value="Direct">Direct</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Annual Salary (CTC)</label>
                <input
                  type="text"
                  placeholder="e.g. ₹8,50,000"
                  value={candidateForm.currentCTC}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, currentCTC: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Register Candidate
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Post New Job Modal */}
      {isJobModalOpen && (
        <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-xs z-55 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-50 animate-fade-in relative font-sans">
            <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Post New Job</h3>
            <p className="text-xs text-slate-400 mt-0.5">Publish a corporate organizational requirement on the ATS.</p>
            
            <form onSubmit={handlePostJob} className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Devops Architect"
                  value={jobForm.title}
                  onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Location</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Openings</label>
                  <input
                    type="number"
                    min="1"
                    value={jobForm.openings}
                    onChange={(e) => setJobForm(prev => ({ ...prev, openings: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contract Type</label>
                <select
                  value={jobForm.type}
                  onChange={(e) => setJobForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-2 py-2 border border-slate-200 outline-none rounded-lg text-xs text-slate-650 bg-white"
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Brief Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize key outputs, roles & tools..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 outline-none rounded-lg text-xs leading-normal resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Publish Job Posting
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
