import React, { useState } from "react";
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  SlidersHorizontal, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  User, 
  Pin,
  ChevronRight,
  Info
} from "lucide-react";
import { Announcement } from "../types";

interface AnnouncementsManagerProps {
  announcements: Announcement[];
  onAddAnnouncement: (announcement: Announcement) => void;
  onUpdateAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  currentUser: any;
}

export default function AnnouncementsManager({
  announcements,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  currentUser
}: AnnouncementsManagerProps) {
  const isAdmin = currentUser.role === "Admin";
  const isHRHead = currentUser.role === "HR Head";
  const isHRAssociate = currentUser.role === "HR Associate";
  const isHR = isAdmin || isHRHead || isHRAssociate;

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [importanceFilter, setImportanceFilter] = useState<string>("all");
  
  // Feed state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  // Toast notifications
  const [toast, setToast] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"General" | "Policy" | "Event" | "Urgent">("General");
  const [important, setImportant] = useState(false);
  const [postedBy, setPostedBy] = useState("Diana Prince (HR Director)");

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenCreateForm = () => {
    setEditingAnnouncement(null);
    setTitle("");
    setContent("");
    setCategory("General");
    setImportant(false);
    setPostedBy("Diana Prince (HR Director)");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setTitle(ann.title);
    setContent(ann.content);
    setCategory(ann.category);
    setImportant(ann.important);
    setPostedBy(ann.postedBy);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast("Please fill in all required fields.");
      return;
    }

    if (editingAnnouncement) {
      const updated: Announcement = {
        ...editingAnnouncement,
        title,
        content,
        category,
        important: category === "Urgent" ? true : important,
        postedBy
      };
      onUpdateAnnouncement(updated);
      showToast("Announcement updated successfully.");
    } else {
      const newAnn: Announcement = {
        id: `ANN-${Date.now().toString().slice(-4)}`,
        title,
        content,
        category,
        important: category === "Urgent" ? true : important,
        datePosted: new Date().toISOString().split("T")[0],
        postedBy,
      };
      onAddAnnouncement(newAnn);
      showToast("Company announcement published successfully.");
    }

    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this company announcement? This action cannot be undone.")) {
      onDeleteAnnouncement(id);
      showToast("Announcement removed.");
    }
  };

  // Filter announcement list
  const filteredAnnouncements = announcements
    .filter(ann => {
      const matchesSearch = 
        ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ann.postedBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || ann.category === categoryFilter;
      
      const matchesImportance = 
        importanceFilter === "all" || 
        (importanceFilter === "important" && ann.important) ||
        (importanceFilter === "standard" && !ann.important);

      return matchesSearch && matchesCategory && matchesImportance;
    })
    // Sort so urgent / important are on top, then by datePosted descending
    .sort((a, b) => {
      if (a.category === "Urgent" && b.category !== "Urgent") return -1;
      if (b.category === "Urgent" && a.category !== "Urgent") return 1;
      if (a.important && !b.important) return -1;
      if (!a.important && b.important) return 1;
      return b.datePosted.localeCompare(a.datePosted);
    });

  const getCategoryTheme = (category: string) => {
    switch(category) {
      case "Urgent":
        return "bg-rose-50 text-rose-700 border-rose-200/60";
      case "Policy":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/60";
      case "Event":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      default:
        return "bg-slate-50 text-slate-705 border-slate-200 text-slate-600";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="hrms-announcements">
      
      {/* Dynamic Action Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-lg flex items-center gap-3 shadow-xl border border-slate-800 animate-slide-in font-medium max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">{toast}</div>
        </div>
      )}

      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-8 h-8 text-indigo-600 stroke-[2]" />
            Company Announcements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Publish and manage enterprise-wide notices, policy changes, and important team schedules.
          </p>
        </div>
        
        {isHR && (
          <button
            onClick={handleOpenCreateForm}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-md shadow-xs flex items-center gap-2 transition-all cursor-pointer h-max self-start md:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Post Update
          </button>
        )}
      </div>

      {/* Workspace search filters & layouts */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search keywords, posts, or authors..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs placeholder:text-slate-400 focus:bg-white focus:outline-indigo-500 transition-all font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-550 font-semibold font-mono">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="General">General</option>
            <option value="Policy">Policy</option>
            <option value="Event">Event</option>
            <option value="Urgent">Urgent</option>
          </select>

          <select
            value={importanceFilter}
            onChange={(e) => setImportanceFilter(e.target.value)}
            className="bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="important">Pinned / Important</option>
            <option value="standard">Standard Level</option>
          </select>
        </div>
      </div>

      {/* Main announcements flow */}
      {filteredAnnouncements.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg py-16 px-6 text-center text-slate-500">
          <Megaphone className="w-12 h-12 text-slate-300 stroke-[1.2] mx-auto mb-3" />
          <h4 className="font-display font-medium text-slate-700 text-sm">No announcements found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
            Refine your filter metrics or post a new team bulletin update using the operational drawer button.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredAnnouncements.map((ann) => {
            const isUrgent = ann.category === "Urgent";
            return (
              <div 
                key={ann.id} 
                className={`bg-white border rounded-lg p-5 sm:p-6 transition-all hover:border-slate-300 flex flex-col justify-between relative ${
                  isUrgent 
                    ? "border-rose-200 bg-gradient-to-br from-rose-50/20 to-white hover:border-rose-300" 
                    : ann.important
                      ? "border-indigo-200 shadow-3xs/50 bg-gradient-to-br from-indigo-500/[0.01] to-white hover:border-indigo-300"
                      : "border-slate-200"
                }`}
              >
                {/* Header ribbon */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryTheme(ann.category)} uppercase tracking-wider`}>
                      {ann.category}
                    </span>
                    {(ann.important || isUrgent) && (
                      <span className="flex items-center gap-1.5 text-[10px] text-indigo-650 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                        <Pin className="w-3 h-3 fill-indigo-500 text-indigo-500 stroke-[2]" />
                        Pinned / Important
                      </span>
                    )}
                  </div>

                  {isHR && (
                    <div className="flex items-center gap-3 text-xs text-slate-450 no-print">
                      <button 
                        onClick={() => handleOpenEditForm(ann)}
                        className="p-1 px-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded flex items-center gap-1 cursor-pointer font-medium text-[11px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(ann.id)}
                        className="p-1 px-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded flex items-center gap-1 cursor-pointer font-medium text-[11px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Content block */}
                <div>
                  <h3 className={`text-base font-display font-medium text-slate-900 ${isUrgent ? "text-rose-950 font-semibold" : ""}`}>
                    {ann.title}
                  </h3>
                  <p className="text-xs text-slate-650 mt-2 leading-relaxed whitespace-pre-wrap">
                    {ann.content}
                  </p>
                </div>

                {/* Footer metadata details */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-450 font-mono">
                  <span className="flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Posted by: <span className="text-slate-700 font-semibold">{ann.postedBy}</span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Posted Date: {ann.datePosted}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Information Compliance Footer Warning */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex gap-3 text-xs text-slate-600 leading-normal">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Compliance Guideline:</span> Under company protocol bylaws, urgent or regulatory structural updates must remain posted for a minimum of 14 days before erasure for active operational and auditing visibility.
        </div>
      </div>

      {/* Custom Slider / Center Panel Overlay for Adding or Editing Announcements */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl relative">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-display font-medium text-slate-900 pb-3 border-b border-slate-100 mb-5">
              {editingAnnouncement ? "Modify Update" : "Publish Announcement"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 block">Announcement Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Annual Benefits Review Period"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded px-3 py-2 text-xs font-semibold text-slate-850 placeholder:text-slate-400 focus:bg-white focus:outline-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 block">Category Select</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:bg-white focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Policy">Policy</option>
                    <option value="Event">Event</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 block">Publishing Author</label>
                  <input 
                    type="text"
                    required
                    value={postedBy}
                    onChange={(e) => setPostedBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 block">Notice Body Text *</label>
                <textarea 
                  required
                  rows={5}
                  placeholder="Write clear, descriptive details for staff members..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-indigo-500 transition-all font-sans leading-relaxed"
                />
              </div>

              {category !== "Urgent" && (
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="checkbox" 
                    id="important-flag"
                    checked={important}
                    onChange={(e) => setImportant(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-200 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="important-flag" className="text-xs font-medium text-slate-705 select-none cursor-pointer">
                    Pin to dashboard headers (Mark as high structural priority)
                  </label>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded text-slate-600 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs shadow-3xs cursor-pointer"
                >
                  {editingAnnouncement ? "Save Changes" : "Broadcast Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
