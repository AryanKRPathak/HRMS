import React, { useState, useEffect } from "react";
import { 
  Network, 
  Plus, 
  Trash2, 
  Edit2, 
  Sliders, 
  MapPin, 
  Users, 
  GitFork, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Download, 
  FolderOpen, 
  Layout, 
  ArrowRight,
  Check,
  Settings,
  HelpCircle,
  AlertCircle,
  Shield,
  Briefcase,
  X
} from "lucide-react";
import { Employee, getEmployeeAvatar } from "../types";
import D3OrgTreeChart from "./D3OrgTreeChart";

// Dynamic schema field definitions for organizational structures
export interface SchemaField {
  key: string;       // Unique ID of the custom field, e.g. "cost_center"
  label: string;     // User friendly label, e.g. "Cost Center ID"
  type: "text" | "number" | "select";
  required?: boolean;
  options?: string[]; // Allowed values for select type
}

// Structure node representing hierarchy
export interface OrgNode {
  id: string;
  name: string;
  type: "Division" | "Department" | "Sub-Department" | "Agile Pod" | "Specific Role";
  location: string;
  parentId?: string; // Links hierarchy
  leadEmployeeId?: string; // Who runs this node
  budgetLimit?: number;
  customFieldValues: Record<string, string>; // Dynamic schema values
  order: number; // For manual ordering priority
}

// Standard schemas companies can start with or customize
const GENERAL_SCHEMAS_PRESET: SchemaField[] = [
  { key: "cost_center", label: "Cost Center ID", type: "text", required: true },
  { key: "access_clearance", label: "Access Level", type: "select", options: ["L1 - Open Public", "L2 - Confidential", "L3 - Executive Only", "L4 - State Cryptographic"], required: false },
  { key: "work_style", label: "Work Style Mode", type: "select", options: ["On-Site Daily", "Hybrid Flexible", "Fully Remote Grounded"], required: false }
];

const STARTUP_NODES_PRESET: OrgNode[] = [
  {
    id: "N-ROOT",
    name: "Apex Corporate Holdings",
    type: "Division",
    location: "San Francisco",
    budgetLimit: 500000,
    customFieldValues: { cost_center: "CC-900", access_clearance: "L3 - Executive Only", work_style: "On-Site Daily" },
    order: 1
  },
  {
    id: "N-ENG",
    name: "Engineering Squad",
    type: "Department",
    location: "London",
    parentId: "N-ROOT",
    leadEmployeeId: "EMP-101", // Alexander Mercer
    budgetLimit: 2500000,
    customFieldValues: { cost_center: "CC-E44", access_clearance: "L2 - Confidential", work_style: "Hybrid Flexible" },
    order: 1
  },
  {
    id: "N-REACT",
    name: "Frontend UI/UX Unit",
    type: "Agile Pod",
    location: "London",
    parentId: "N-ENG",
    leadEmployeeId: "EMP-102", // Beatriz Vance
    budgetLimit: 1200000,
    customFieldValues: { cost_center: "CC-E44-UI", access_clearance: "L1 - Open Public", work_style: "Hybrid Flexible" },
    order: 1
  },
  {
    id: "N-CORP-COMMS",
    name: "Corporate Talent Council",
    type: "Department",
    location: "New York",
    parentId: "N-ROOT",
    leadEmployeeId: "EMP-104", // Diana Prince
    budgetLimit: 850000,
    customFieldValues: { cost_center: "CC-HR7", access_clearance: "L3 - Executive Only", work_style: "On-Site Daily" },
    order: 2
  }
];

const ENTERPRISE_NODES_PRESET: OrgNode[] = [
  {
    id: "E-GLOBAL",
    name: "Omni Group plc",
    type: "Division",
    location: "London",
    budgetLimit: 15000000,
    customFieldValues: { cost_center: "GBL-00", access_clearance: "L4 - State Cryptographic", work_style: "On-Site Daily" },
    order: 1
  },
  {
    id: "E-AMER",
    name: "Americas Region Hub",
    type: "Division",
    location: "New York",
    parentId: "E-GLOBAL",
    budgetLimit: 6000000,
    customFieldValues: { cost_center: "REG-AM", access_clearance: "L3 - Executive Only", work_style: "Hybrid Flexible" },
    order: 1
  },
  {
    id: "E-EMEA",
    name: "EMEA Region Hub",
    type: "Division",
    location: "London",
    parentId: "E-GLOBAL",
    budgetLimit: 5500000,
    customFieldValues: { cost_center: "REG-EM", access_clearance: "L3 - Executive Only", work_style: "Hybrid Flexible" },
    order: 2
  },
  {
    id: "E-ENGINEERING",
    name: "Core Tech R&D",
    type: "Department",
    location: "San Francisco",
    parentId: "E-AMER",
    leadEmployeeId: "EMP-101",
    budgetLimit: 3800000,
    customFieldValues: { cost_center: "CC-ENG", access_clearance: "L2 - Confidential", work_style: "Fully Remote Grounded" },
    order: 1
  },
  {
    id: "E-INFRA",
    name: "Cloud Platform Ops",
    type: "Sub-Department",
    location: "London",
    parentId: "E-EMEA",
    leadEmployeeId: "EMP-103",
    budgetLimit: 1900000,
    customFieldValues: { cost_center: "CC-SEC-INF", access_clearance: "L4 - State Cryptographic", work_style: "Fully Remote Grounded" },
    order: 1
  },
  {
    id: "E-HR-TALENT",
    name: "Global Human Capital Operations",
    type: "Department",
    location: " London",
    parentId: "E-EMEA",
    leadEmployeeId: "EMP-104",
    budgetLimit: 1100000,
    customFieldValues: { cost_center: "CC-GHC", access_clearance: "L3 - Executive Only", work_style: "On-Site Daily" },
    order: 2
  }
];

interface OrganizationStructureManagerProps {
  employees: Employee[];
  currentUser: { name: string; role: string; email: string };
  onAddAuditLog?: (action: string, module: string, details: string) => void;
}

export default function OrganizationStructureManager({
  employees,
  currentUser,
  onAddAuditLog
}: OrganizationStructureManagerProps) {
  // PERSISTENT DATA
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>(() => {
    const saved = localStorage.getItem("org_schema_fields");
    return saved ? JSON.parse(saved) : GENERAL_SCHEMAS_PRESET;
  });

  const [nodes, setNodes] = useState<OrgNode[]>(() => {
    const saved = localStorage.getItem("org_structure_nodes");
    return saved ? JSON.parse(saved) : STARTUP_NODES_PRESET;
  });

  // UI STATES
  const [activeSchemaTab, setActiveSchemaTab] = useState<"visual" | "schema" | "list">("visual");
  const [visualSubMode, setVisualSubMode] = useState<"d3" | "list">("d3");
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  
  // Custom Filters
  const [filterLocation, setFilterLocation] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Search results expansion tracker
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    "N-ROOT": true,
    "E-GLOBAL": true,
    "E-AMER": true,
    "E-EMEA": true
  });

  // Schema Editor State
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "select">("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [schemaError, setSchemaError] = useState("");

  // Node Dialog States
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
  const [nodeFormData, setNodeFormData] = useState<{
    name: string;
    type: "Division" | "Department" | "Sub-Department" | "Agile Pod" | "Specific Role";
    location: string;
    parentId: string;
    leadEmployeeId: string;
    budgetLimit: string;
    customFieldValues: Record<string, string>;
  }>({
    name: "",
    type: "Department",
    location: "New York",
    parentId: "",
    leadEmployeeId: "",
    budgetLimit: "",
    customFieldValues: {}
  });
  const [nodeModalError, setNodeModalError] = useState("");

  // Persist states automatically
  useEffect(() => {
    localStorage.setItem("org_schema_fields", JSON.stringify(schemaFields));
  }, [schemaFields]);

  useEffect(() => {
    localStorage.setItem("org_structure_nodes", JSON.stringify(nodes));
  }, [nodes]);

  const triggerAudit = (action: string, details: string) => {
    if (onAddAuditLog) {
      onAddAuditLog(action, "Organization Structures", details);
    }
  };

  // Preset Handlers
  const handleLoadPreset = (preset: "startup" | "enterprise") => {
    const confirmation = window.confirm(
      `Loading the preset will overwrite your active database scheme and organizational configuration structure. Continue?`
    );
    if (!confirmation) return;

    if (preset === "startup") {
      setSchemaFields(GENERAL_SCHEMAS_PRESET);
      setNodes(STARTUP_NODES_PRESET);
      setExpandedNodes({ "N-ROOT": true });
      triggerAudit("Load Presets", "Loaded Agile Startup organization mockup structure.");
    } else {
      setSchemaFields(GENERAL_SCHEMAS_PRESET);
      setNodes(ENTERPRISE_NODES_PRESET);
      setExpandedNodes({ "E-GLOBAL": true, "E-AMER": true, "E-EMEA": true });
      triggerAudit("Load Presets", "Loaded Multinational Enterprise hierarchical structure.");
    }
  };

  // Toggle node children collapse
  const toggleNodeCollapse = (id: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // SCHEMA MANIPULATION
  const handleAddSchemaField = (e: React.FormEvent) => {
    e.preventDefault();
    setSchemaError("");

    const cleanKey = newFieldKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!cleanKey || !newFieldLabel.trim()) {
      setSchemaError("Key validation failed. Use standard letters, numbers and underscores.");
      return;
    }

    if (schemaFields.some(f => f.key === cleanKey)) {
      setSchemaError("A dynamic field key with this identifier already exists.");
      return;
    }

    const fieldOptions = newFieldType === "select" 
      ? newFieldOptions.split(",").map(o => o.trim()).filter(o => o.length > 0)
      : undefined;

    if (newFieldType === "select" && (!fieldOptions || fieldOptions.length === 0)) {
      setSchemaError("Must define comma-separated list option values for select dropdowns.");
      return;
    }

    const newField: SchemaField = {
      key: cleanKey,
      label: newFieldLabel.trim(),
      type: newFieldType,
      options: fieldOptions,
      required: false
    };

    setSchemaFields([...schemaFields, newField]);
    setNewFieldKey("");
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldOptions("");
    triggerAudit("Create Schema Field", `Added custom organizational field: ${newField.label} (${newField.key})`);
  };

  const handleDeleteSchemaField = (key: string) => {
    if (!window.confirm("Underlying metrics value assigned to nodes will disappear permanently. Continue?")) return;
    setSchemaFields(schemaFields.filter(f => f.key !== key));
    triggerAudit("Delete Schema Field", `Removed custom organization metadata field: ${key}`);
  };

  // RE-PARENT DRAG AND DROP HANDLERS (With fallback options)
  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    setDraggedNodeId(nodeId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedNodeId === targetId) return;
    
    // Guard: Prevent parenting a node to itself or any of its children (recursively)
    const isDescendant = (parent: string, child: string): boolean => {
      const childNode = nodes.find(n => n.id === child);
      if (!childNode || !childNode.parentId) return false;
      if (childNode.parentId === parent) return true;
      return isDescendant(parent, childNode.parentId);
    };

    if (draggedNodeId && isDescendant(draggedNodeId, targetId)) {
      return;
    }

    setDragOverNodeId(targetId);
  };

  const handleDrop = (e: React.DragEvent, targetParentId: string) => {
    e.preventDefault();
    if (!draggedNodeId || draggedNodeId === targetParentId) {
      setDraggedNodeId(null);
      setDragOverNodeId(null);
      return;
    }

    // Assigning to a node as direct parent
    const updated = nodes.map(node => {
      if (node.id === draggedNodeId) {
        return { ...node, parentId: targetParentId };
      }
      return node;
    });

    setNodes(updated);
    
    const dragName = nodes.find(n => n.id === draggedNodeId)?.name || draggedNodeId;
    const targetName = nodes.find(n => n.id === targetParentId)?.name || targetParentId;
    triggerAudit("Re-parent Node", `Re-parented '${dragName}' to report to '${targetName}' under structural schema.`);
    
    // Automatically expand target parent to show the new child
    setExpandedNodes(prev => ({ ...prev, [targetParentId]: true }));

    setDraggedNodeId(null);
    setDragOverNodeId(null);
  };

  const handlePromoteToRoot = (nodeId: string) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, parentId: undefined } : n));
    triggerAudit("Root Promotion", `Promoted node ${nodeId} to standard divisional root level.`);
  };

  const handleAssignParentManually = (nodeId: string, parsedParentId: string) => {
    setNodes(nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, parentId: parsedParentId || undefined };
      }
      return n;
    }));
    triggerAudit("Re-parent Node", `Reassigned node ${nodeId} parent structures.`);
  };

  // NODE INITIATION & UPDATE FORM SUBMISSIONS
  const handleOpenNodeModal = (nodeToEdit?: OrgNode, initialParentId?: string) => {
    setNodeModalError("");
    if (nodeToEdit) {
      setEditingNode(nodeToEdit);
      setNodeFormData({
        name: nodeToEdit.name,
        type: nodeToEdit.type,
        location: nodeToEdit.location,
        parentId: nodeToEdit.parentId || "",
        leadEmployeeId: nodeToEdit.leadEmployeeId || "",
        budgetLimit: nodeToEdit.budgetLimit ? nodeToEdit.budgetLimit.toString() : "",
        customFieldValues: { ...nodeToEdit.customFieldValues }
      });
    } else {
      setEditingNode(null);
      // Determine default manager
      const rootExists = nodes.length > 0;
      setNodeFormData({
        name: "",
        type: "Department",
        location: employees[0]?.location || "New York",
        parentId: initialParentId || (rootExists ? nodes[0].id : ""),
        leadEmployeeId: "",
        budgetLimit: "",
        customFieldValues: schemaFields.reduce((acc, f) => {
          acc[f.key] = f.type === "select" && f.options ? f.options[0] : "";
          return acc;
        }, {} as Record<string, string>)
      });
    }
    setIsNodeModalOpen(true);
  };

  const handleNodeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNodeModalError("");

    if (!nodeFormData.name.trim()) {
      setNodeModalError("Please provide a name for this node.");
      return;
    }

    const budgetParsed = nodeFormData.budgetLimit ? parseFloat(nodeFormData.budgetLimit) : undefined;
    if (budgetParsed !== undefined && isNaN(budgetParsed)) {
      setNodeModalError("Assigned monetary budget operates as a pure numeric value.");
      return;
    }

    if (editingNode) {
      // Loop recursion checker
      if (nodeFormData.parentId && nodeFormData.parentId === editingNode.id) {
        setNodeModalError("A node cannot report directly to itself.");
        return;
      }
      
      const isDescendant = (parent: string, child: string): boolean => {
        const childNode = nodes.find(n => n.id === child);
        if (!childNode || !childNode.parentId) return false;
        if (childNode.parentId === parent) return true;
        return isDescendant(parent, childNode.parentId);
      };

      if (nodeFormData.parentId && isDescendant(editingNode.id, nodeFormData.parentId)) {
        setNodeModalError("A node cannot report to one of its own sub-elements.");
        return;
      }

      // Update active list state
      const updated = nodes.map(n => n.id === editingNode.id ? {
        ...n,
        name: nodeFormData.name.trim(),
        type: nodeFormData.type,
        location: nodeFormData.location,
        parentId: nodeFormData.parentId ? nodeFormData.parentId : undefined,
        leadEmployeeId: nodeFormData.leadEmployeeId ? nodeFormData.leadEmployeeId : undefined,
        budgetLimit: budgetParsed,
        customFieldValues: nodeFormData.customFieldValues
      } : n);

      setNodes(updated);
      triggerAudit("Update Org Node", `Updated characteristics of element: ${nodeFormData.name}`);
    } else {
      // Creation
      const id = `N-${Date.now()}`;
      const newNode: OrgNode = {
        id,
        name: nodeFormData.name.trim(),
        type: nodeFormData.type,
        location: nodeFormData.location,
        parentId: nodeFormData.parentId ? nodeFormData.parentId : undefined,
        leadEmployeeId: nodeFormData.leadEmployeeId ? nodeFormData.leadEmployeeId : undefined,
        budgetLimit: budgetParsed,
        customFieldValues: nodeFormData.customFieldValues,
        order: nodes.length + 1
      };

      setNodes([...nodes, newNode]);
      triggerAudit("Create Org Node", `Launched organizational architectural unit: ${newNode.name}`);
      
      // Expand newly created parent immediately
      if (newNode.parentId) {
        setExpandedNodes(prev => ({ ...prev, [newNode.parentId!]: true }));
      }
    }

    setIsNodeModalOpen(false);
    setEditingNode(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    const nodeObj = nodes.find(n => n.id === nodeId);
    if (!nodeObj) return;

    const childrenList = nodes.filter(n => n.parentId === nodeId);
    let msg = `Are you sure you would like to delete '${nodeObj.name}' organizational element?`;
    if (childrenList.length > 0) {
      msg += ` This will automatically reassess reporting lines: ${childrenList.length} sub-elements will be migrated upwards.`;
    }

    if (!window.confirm(msg)) return;

    // Migrate child nodes to point to deleted node's parent
    const migrated = nodes.map(n => {
      if (n.parentId === nodeId) {
        return { ...n, parentId: nodeObj.parentId };
      }
      return n;
    }).filter(n => n.id !== nodeId);

    setNodes(migrated);
    triggerAudit("Delete Org Node", `Decommissioned structural node: ${nodeObj.name}`);
  };

  // DATA CALCULATION FOR DISPLAY METRICS
  const totalAllocatedBudget = nodes.reduce((sum, n) => sum + (n.budgetLimit || 0), 0);
  const totalDefinedCustomFields = schemaFields.length;
  
  // Filtering algorithm
  const getFilteredNodesChain = (): OrgNode[] => {
    return nodes.filter(n => {
      const matchSearch = n.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLoc = filterLocation === "All" || n.location === filterLocation;
      const matchType = filterType === "All" || n.type === filterType;
      return matchSearch && matchLoc && matchType;
    });
  };

  const filteredNodesList = getFilteredNodesChain();

  // Root level visualizer builder
  const rootNodes = nodes.filter(n => !n.parentId || !nodes.some(parent => parent.id === n.parentId));

  // RENDER RECURSIVE VISUAL TREE
  const renderVisualNode = (node: OrgNode, level: number = 0): React.ReactNode => {
    const children = nodes.filter(n => n.parentId === node.id);
    const isExpanded = expandedNodes[node.id] !== false;
    const isMatched = filteredNodesList.some(fn => fn.id === node.id);

    const supervisor = employees.find(e => e.id === node.leadEmployeeId);

    // Styling according to category
    let typeBadgeColor = "bg-purple-50 text-purple-700 border-purple-200";
    if (node.type === "Division") typeBadgeColor = "bg-blue-50 text-blue-700 border-blue-200";
    if (node.type === "Department") typeBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (node.type === "Agile Pod") typeBadgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (node.type === "Specific Role") typeBadgeColor = "bg-amber-55 text-amber-800 border-amber-250";

    const isHoveredOver = dragOverNodeId === node.id;

    return (
      <div 
        key={node.id} 
        style={{ marginLeft: `${level > 0 ? 34 : 0}px` }} 
        className="relative group/node select-none"
      >
        {/* Draw vertical trace-lines for visual hierarchy connectivity */}
        {level > 0 && (
          <div className="absolute top-0 -left-[22px] w-[22px] h-[34px] border-l-2 border-b-2 border-slate-200 rounded-bl-xl -z-10" />
        )}

        {/* Dynamic Canvas element block */}
        <div 
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDrop={(e) => handleDrop(e, node.id)}
          className={`p-4 rounded-xl border mb-3 transition-all relative ${
            isMatched 
              ? "bg-white shadow-xs" 
              : "bg-slate-50/70 border-slate-200/50 opacity-60 hover:opacity-85"
          } ${
            isHoveredOver 
              ? "border-dashed border-2 ring-2 ring-indigo-500 border-indigo-500 scale-[1.01]" 
              : "border-slate-200"
          } max-w-2xl hover:shadow-md`}
        >
          {/* Header row of Node */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${typeBadgeColor}`}>
                {node.type}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-mono tracking-wide">
                ID: {node.id}
              </span>
              {node.parentId && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-100 px-1 border rounded">
                  <ArrowRight className="w-2.5 h-2.5" /> Reports: {node.parentId}
                </span>
              )}
            </div>

            {/* Editing and structural modifiers */}
            <div className="flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => handleOpenNodeModal(undefined, node.id)}
                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded cursor-pointer"
                title="Create Direct Subordinate element"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleOpenNodeModal(node)}
                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded cursor-pointer"
                title="Edit visual parameters"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              {node.parentId && (
                <button
                  type="button"
                  onClick={() => handlePromoteToRoot(node.id)}
                  className="p-1 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded cursor-pointer"
                  title="Promote node to standard independent root division"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDeleteNode(node.id)}
                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-rose-650 rounded cursor-pointer"
                title="Decommission elements"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Node Name and Primary info */}
          <div className="mt-2 flex items-start justify-between">
            <div>
              <h5 className="font-bold text-slate-850 text-sm leading-tight uppercase tracking-tight group-hover/node:text-indigo-700 transition-colors">
                {node.name}
              </h5>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" /> {node.location}
                </span>
                {node.budgetLimit !== undefined && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">Budget: ${node.budgetLimit.toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>

            {/* Section lead or designated supervisor card snippet */}
            {supervisor && (
              <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-150 rounded-lg max-w-xs shrink-0 select-none">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-white">
                  <img 
                    src={getEmployeeAvatar(supervisor.name)} 
                    alt={supervisor.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-[10px] text-slate-800 block leading-tight truncate">{supervisor.name}</span>
                  <span className="text-[8px] text-slate-400 block truncate font-mono">{supervisor.role}</span>
                </div>
              </div>
            )}
          </div>

          {/* DYNAMIC SCHEMA CUSTOM FIELDS GRID PREVIEW */}
          {Object.keys(node.customFieldValues).length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
              {schemaFields.map(field => {
                const val = node.customFieldValues[field.key];
                if (!val) return null;
                return (
                  <div key={field.key} className="inline-flex flex-col bg-slate-50 px-2 py-1 rounded-md border border-slate-150 min-w-[120px]">
                    <span className="text-[8px] uppercase font-mono text-slate-400 tracking-wider leading-none font-semibold">
                      {field.label}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-700 mt-0.5 line-clamp-1">
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Collapsible toggle expand button */}
          {children.length > 0 && (
            <button
              type="button"
              onClick={() => toggleNodeCollapse(node.id)}
              className="absolute -bottom-3 left-6 px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-500 rounded-full text-[9px] font-mono shadow-xs font-bold cursor-pointer transition-all z-10 block"
            >
              {isExpanded ? `▼ Collapse (${children.length})` : `▶ Expand (${children.length})`}
            </button>
          )}
        </div>

        {/* Visual Line Connectors for children trace */}
        {children.length > 0 && isExpanded && (
          <div className="relative pl-1.5 pb-2">
            <div className="absolute top-0 left-[14px] bottom-6 w-0.5 bg-slate-200" />
            {children.map(child => renderVisualNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-12 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Enterprise Architect workspace
            </span>
            <h2 className="text-2xl font-bold tracking-tight uppercase">Organisation Structure Manager</h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Construct high-performance hierarchies. Build customized meta schema attributes dynamically, reassign reporting lines flawlessly, and audit structural divisions in real-time.
            </p>
          </div>

          {/* Quick preset loaders */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 bg-slate-800/40 p-2 border border-slate-700/60 rounded-xl">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase w-full md:w-auto text-left mr-1">Load Mock Presets:</span>
            <button
              type="button"
              onClick={() => handleLoadPreset("startup")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Agile Startup Pods
            </button>
            <button
              type="button"
              onClick={() => handleLoadPreset("enterprise")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              Enterprise Divisions
            </button>
          </div>
        </div>

        {/* Global Stats Matrix */}
        <div className="mt-6 pt-5 border-t border-slate-850 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-850/60 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block font-semibold uppercase">Total Nodes Managed</span>
            <span className="text-xl font-bold font-mono text-slate-100">{nodes.length} structural elements</span>
          </div>
          <div className="p-3 bg-slate-850/60 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block font-semibold uppercase">Allocated Budget Matrix</span>
            <span className="text-xl font-bold font-mono text-indigo-300">${totalAllocatedBudget.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-slate-850/60 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block font-semibold uppercase">Custom Schema Fields</span>
            <span className="text-xl font-bold font-mono text-slate-100">{totalDefinedCustomFields} active keys</span>
          </div>
          <div className="p-3 bg-slate-850/60 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block font-semibold uppercase">Unique Locations</span>
            <span className="text-xl font-bold font-mono text-slate-100">
              {Array.from(new Set(nodes.map(n => n.location))).length} branches
            </span>
          </div>
        </div>
      </div>

      {/* Control center panel & Strategy Switchers */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Strategy selector tabs */}
          <div className="flex items-center gap-1 bg-slate-105 p-1 rounded-xl border border-slate-250 self-start">
            <button
              onClick={() => setActiveSchemaTab("visual")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                activeSchemaTab === "visual"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Network className="w-4 h-4" />
              Hierarchical Visual Tree
            </button>
            <button
              onClick={() => setActiveSchemaTab("list")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                activeSchemaTab === "list"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              Tabular Grid List ({nodes.length})
            </button>
            <button
              onClick={() => setActiveSchemaTab("schema")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                activeSchemaTab === "schema"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-4 h-4" />
              Dynamic Schema Customizer ({schemaFields.length})
            </button>
          </div>

          {/* Quick interactive search/filters */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search structures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 focus:bg-white outline-hidden rounded-lg font-medium w-48 transition-all"
            />

            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 cursor-pointer outline-hidden"
            >
              <option value="All">All Branches</option>
              {Array.from(new Set(nodes.map(n => n.location))).map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 cursor-pointer outline-hidden mr-1"
            >
              <option value="All">All Types</option>
              <option value="Division">Divisions</option>
              <option value="Department">Departments</option>
              <option value="Sub-Department">Sub-Departments</option>
              <option value="Agile Pod">Agile Pods</option>
              <option value="Specific Role">Roles</option>
            </select>

            <button
              onClick={() => handleOpenNodeModal()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold tracking-tight inline-flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Build Node
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE VIEW CARD CANVAS RENDERER */}
      
      {/* 1. VISUAL ORGANIZATIONAL TREE TAB */}
      {activeSchemaTab === "visual" && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-wider block">
                Visual Organizational Architect Map
              </span>
              <p className="text-[11px] text-slate-450">Select your layout style to view and govern corporate entities</p>
            </div>

            {/* Sub-mode buttons toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border self-start">
              <button
                type="button"
                onClick={() => setVisualSubMode("d3")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  visualSubMode === "d3"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <GitFork className="w-3.5 h-3.5" />
                D3 Interactive Tree
              </button>
              <button
                type="button"
                onClick={() => setVisualSubMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  visualSubMode === "list"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                List Trace (Drag & Drop)
              </button>
            </div>
          </div>

          {visualSubMode === "d3" ? (
            <D3OrgTreeChart 
              nodes={filteredNodesList}
              schemaFields={schemaFields}
              employees={employees}
              onEditNode={(node) => handleOpenNodeModal(node)}
              onAddSubNode={(parentId) => handleOpenNodeModal(undefined, parentId)}
            />
          ) : (
            <div className="p-6 bg-slate-50/40 rounded-xl border border-slate-150 overflow-x-auto min-h-[500px]">
              {/* Quick Helper Alert */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-slate-655 flex items-center gap-2 mb-4">
                <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Drag and drop instruction:</strong> Drag any white node box over another container block to assign it dynamically as a report/child. Use top arrows to promote elements to the divisional root block.
                </span>
              </div>

              <div className="space-y-6 min-w-max pb-8 pl-4 pt-1">
                {rootNodes.length > 0 ? (
                  rootNodes.map(root => renderVisualNode(root))
                ) : (
                  <div className="py-20 text-center text-slate-400 italic">
                    No structures found matching the selected parameters. Load standard startup/enterprise nodes presets above!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. TABULAR GRID LIST VIEW */}
      {activeSchemaTab === "list" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-wider">Tabular Organizational Roster Chart</span>
            <div className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border px-2.5 py-0.5 rounded-full font-bold">
              {filteredNodesList.length} total elements represented
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-mono font-bold text-slate-450 tracking-wider">
                  <th className="p-4">Structure Element</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Geographic Branch</th>
                  <th className="p-4">Direct Parent Node</th>
                  <th className="p-4">Appointed Lead</th>
                  <th className="p-4">Budget limit</th>
                  {schemaFields.map(field => (
                    <th key={field.key} className="p-4">{field.label}</th>
                  ))}
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNodesList.length > 0 ? (
                  filteredNodesList.map(node => {
                    const parentNode = nodes.find(n => n.id === node.parentId);
                    const leadEmp = employees.find(e => e.id === node.leadEmployeeId);

                    return (
                      <tr key={node.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Name */}
                        <td className="p-4">
                          <div className="font-bold text-slate-800 uppercase text-[11px] font-sans">
                            {node.name}
                          </div>
                          <span className="text-[9px] font-mono font-semibold text-slate-400 block mt-0.5">ID: {node.id}</span>
                        </td>
                        {/* Type */}
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase tracking-wider bg-slate-100 border">
                            {node.type}
                          </span>
                        </td>
                        {/* Location */}
                        <td className="p-4 font-semibold text-slate-600 font-mono">
                          {node.location}
                        </td>
                        {/* Parent Node */}
                        <td className="p-4">
                          {parentNode ? (
                            <div className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-50 border px-1.5 py-0.5 rounded text-slate-705">
                              {parentNode.name}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono italic text-[10px]">Independent Root</span>
                          )}
                        </td>
                        {/* Lead */}
                        <td className="p-4">
                          {leadEmp ? (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full overflow-hidden border">
                                <img src={getEmployeeAvatar(leadEmp.name)} alt={leadEmp.name} className="w-full h-full object-cover" />
                              </div>
                              <span className="font-semibold text-slate-750">{leadEmp.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic font-mono">Unassigned</span>
                          )}
                        </td>
                        {/* Budget */}
                        <td className="p-4 font-mono font-semibold text-slate-700">
                          {node.budgetLimit !== undefined ? `$${node.budgetLimit.toLocaleString()}` : "N/A"}
                        </td>
                        {/* Dynamic Custom values */}
                        {schemaFields.map(field => {
                          const val = node.customFieldValues[field.key] || "--";
                          return (
                            <td key={field.key} className="p-4 font-semibold text-indigo-700 font-mono">
                              {val}
                            </td>
                          );
                        })}
                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenNodeModal(node)}
                              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-650 cursor-pointer rounded"
                              title="Edit record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNode(node.id)}
                              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-rose-650 cursor-pointer rounded"
                              title="Decommission node"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6 + schemaFields.length} className="p-10 text-center text-slate-400 italic">
                      No matching organizational nodes found. Check active branches, filters, and searches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. DYNAMIC SCHEMA CUSTOMIZER VIEW */}
      {activeSchemaTab === "schema" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Field Configuration List */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm">Active Custom Meta Schema Keys</h4>
                <p className="text-xs text-slate-400 mt-0.5">These custom metadata dimensions automatically append themselves to every node form creator inside the dashboard.</p>
              </div>

              <div className="p-5 divide-y divide-slate-100">
                {schemaFields.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 italic text-xs">
                    No custom dimensions registered yet. Build structure keys below!
                  </div>
                ) : (
                  schemaFields.map(field => (
                    <div key={field.key} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{field.label}</span>
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-[10px] font-mono text-indigo-700 rounded font-semibold">
                            key: {field.key}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono font-semibold">
                          <span>TYPE: {field.type.toUpperCase()}</span>
                          {field.options && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600">OPTIONS: {field.options.join(" | ")}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSchemaField(field.key)}
                        className="p-1.5 hover:bg-slate-100 text-slate-450 hover:text-rose-600 rounded cursor-pointer"
                        title="Delete custom schema key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-450 flex items-center gap-1.5 font-mono">
              <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Registered attributes sync automatically with active local client instances.</span>
            </div>
          </div>

          {/* Builder Field additions Form */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Register Custom Structure Field</h4>
              <p className="text-xs text-slate-400 mt-0.5">Append bespoke properties to customize hierarchy structures for small or giant teams.</p>
            </div>

            {schemaError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{schemaError}</span>
              </div>
            )}

            <form onSubmit={handleAddSchemaField} className="space-y-4">
              {/* Key label */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Field Label Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cost Center Code, Security Code"
                  value={newFieldLabel}
                  onChange={(e) => {
                    setNewFieldLabel(e.target.value);
                    // Propose a logical identifier key
                    if (!newFieldKey) {
                      setNewFieldKey(e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-800 transition-all"
                />
              </div>

              {/* Data Type */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Value Class Format Type</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as "text" | "number" | "select")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-xs cursor-pointer focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-800"
                >
                  <option value="text">Standard Text Field</option>
                  <option value="number">Pure Numeric Limit</option>
                  <option value="select">Dropdown Choice Parameters</option>
                </select>
              </div>

              {/* Unique Key Identifier */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Schema Key Identifier (system/unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. cost_center_id"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-xs font-mono font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-800 transition-all"
                />
              </div>

              {/* Custom Options (Select type) */}
              {newFieldType === "select" && (
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Select Options (comma-separated list)</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Phase A, Phase B, Phase C"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-lg text-xs text-slate-800 resize-none transition-all font-medium"
                  />
                  <span className="text-[9px] text-slate-400 font-mono block mt-1">Delimit options with commas. Example: Option A, Option B</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-sm cursor-pointer transition-colors"
              >
                Register Schema Item
              </button>
            </form>
          </div>

        </div>
      )}

      {/* NODE CREATOR & MODAL DIALOG EDITOR */}
      {isNodeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-up">
            
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  {editingNode ? "Configure Organizational Node" : "Launch Organizational Node"}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider mt-0.5">
                  Structure Architect Workspace
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNodeModalOpen(false)}
                className="p-1 hover:bg-slate-100 text-slate-450 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Box Body */}
            <form onSubmit={handleNodeFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {nodeModalError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{nodeModalError}</span>
                </div>
              )}

              {/* Node Name */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Node Element Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central EMEA Sales Force, Chief Technology Suite"
                  value={nodeFormData.name}
                  onChange={(e) => setNodeFormData({ ...nodeFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none rounded-lg text-xs text-slate-800 transition-all font-medium"
                />
              </div>

              {/* Classification Type & Geographic branch */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Hierarchy Classification</label>
                  <select
                    value={nodeFormData.type}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-lg text-xs text-slate-800 cursor-pointer"
                  >
                    <option value="Division">Division / Regional Hub</option>
                    <option value="Department">Department</option>
                    <option value="Sub-Department">Sub-Department</option>
                    <option value="Agile Pod">Agile Pod</option>
                    <option value="Specific Role">Specific Role / Position Node</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Geographic Branch</label>
                  <select
                    value={nodeFormData.location}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-lg text-xs text-slate-800 cursor-pointer"
                  >
                    <option value="New York">New YorkHQ</option>
                    <option value="San Francisco">San Francisco Branch</option>
                    <option value="London">London Chapter</option>
                    <option value="Bengaluru">Bengaluru Hub</option>
                    <option value="Mumbai">Mumbai Chapter</option>
                    <option value="Tokyo">Tokyo HQ</option>
                    <option value="Remote">Remote Distributed</option>
                  </select>
                </div>
              </div>

              {/* Parent Command Link & Section supervisor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Direct Parent Node (Reports to)</label>
                  <select
                    value={nodeFormData.parentId}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, parentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-lg text-xs text-slate-800 cursor-pointer"
                  >
                    <option value="">-- None (Divisional Root Level) --</option>
                    {nodes
                      // Guard: Prevent parenting to yourself during edit
                      .filter(n => !editingNode || n.id !== editingNode.id)
                      .map(n => (
                        <option key={n.id} value={n.id}>
                          [{n.type}] {n.name} (id: {n.id})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Appointed Supervisor Lead</label>
                  <select
                    value={nodeFormData.leadEmployeeId}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, leadEmployeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-lg text-xs text-slate-800 cursor-pointer"
                  >
                    <option value="">-- No Direct Lead Employee Assigned --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Allocated Monetary Budget limit */}
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Allocated Annual Budget ($ USD, Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  value={nodeFormData.budgetLimit}
                  onChange={(e) => setNodeFormData({ ...nodeFormData, budgetLimit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-lg text-xs text-slate-800 font-mono"
                />
              </div>

              {/* RENDER DYNAMIC SCHEMA METRICS INPUT FIELDS */}
              {schemaFields.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold tracking-wider">
                    Dynamic Custom Schema Metrics
                  </span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {schemaFields.map(field => {
                      const currentVal = nodeFormData.customFieldValues[field.key] || "";
                      const setFieldVal = (val: string) => {
                        setNodeFormData({
                          ...nodeFormData,
                          customFieldValues: {
                            ...nodeFormData.customFieldValues,
                            [field.key]: val
                          }
                        });
                      };

                      return (
                        <div key={field.key} className="space-y-1">
                          <label className="text-[9px] uppercase font-semibold font-mono text-slate-405 block">
                            {field.label} {field.required ? "*" : ""}
                          </label>
                          {field.type === "select" && field.options ? (
                            <select
                              value={currentVal}
                              onChange={(e) => setFieldVal(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 cursor-pointer focus:bg-white focus:ring-1 focus:ring-indigo-100"
                            >
                              {field.options.map(o => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              required={field.required}
                              value={currentVal}
                              onChange={(e) => setFieldVal(e.target.value)}
                              placeholder={`Input ${field.label}...`}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 outline-none rounded-lg text-xs text-slate-800 focus:bg-white"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNodeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  {editingNode ? "Save Node configuration" : "Deploy Node Element"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
