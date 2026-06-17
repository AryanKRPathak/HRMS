import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { 
  GitFork, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Info, 
  ChevronDown, 
  ChevronRight, 
  Search,
  Sliders,
  User,
  Activity,
  UserCheck
} from "lucide-react";
import { OrgNode, SchemaField } from "./OrganizationStructureManager";
import { Employee, getEmployeeAvatar } from "../types";

interface D3OrgTreeChartProps {
  nodes: OrgNode[];
  schemaFields: SchemaField[];
  employees: Employee[];
  onEditNode?: (node: OrgNode) => void;
  onAddSubNode?: (parentId: string) => void;
}

interface TreeHierarchyNode {
  id: string;
  name: string;
  type: string;
  location: string;
  parentId?: string;
  budgetLimit?: number;
  leadEmployeeId?: string;
  customFieldValues: Record<string, string>;
  children?: TreeHierarchyNode[];
}

export default function D3OrgTreeChart({
  nodes,
  schemaFields,
  employees,
  onEditNode,
  onAddSubNode
}: D3OrgTreeChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Layout Configuration States
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [showTooltipOfNode, setShowTooltipOfNode] = useState<OrgNode | null>(null);

  // Branch collapse tracker (React state-driven for robustness)
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Dynamic dimension states to prevent viewport overflow
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Update container size on resize
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 600),
          height: Math.max(height, 500)
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute stats of selected node
  const activeNode = nodes.find(n => n.id === selectedNodeId);
  const leadEmployee = activeNode && employees.find(e => e.id === activeNode.leadEmployeeId);

  // Group nodes and build hierarchical D3 structure
  const buildHierarchy = () => {
    if (nodes.length === 0) return null;

    const nodeMap = new Map<string, OrgNode>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    // Identify real root nodes (no parentId, or parentId refers to non-existent node)
    const roots = nodes.filter(n => !n.parentId || !nodeMap.has(n.parentId));

    if (roots.length === 0 && nodes.length > 0) {
      // Circle protection: if circular parent, break circular dependency on the first node
      return null;
    }

    const buildTreeRecursive = (node: OrgNode): TreeHierarchyNode => {
      const isCollapsed = collapsedNodes[node.id];
      const childrenNodes = nodes.filter(n => n.parentId === node.id);

      return {
        id: node.id,
        name: node.name,
        type: node.type,
        location: node.location,
        parentId: node.parentId,
        budgetLimit: node.budgetLimit,
        leadEmployeeId: node.leadEmployeeId,
        customFieldValues: node.customFieldValues,
        children: isCollapsed ? undefined : childrenNodes.map(c => buildTreeRecursive(c))
      };
    };

    // If we have single root, render it; otherwise, join multiple disjoint roots under a virtual company universe node
    if (roots.length === 1) {
      return buildTreeRecursive(roots[0]);
    } else {
      const totalBudget = nodes.reduce((sum, n) => sum + (n.budgetLimit || 0), 0);
      return {
        id: "VIRTUAL_UNIVERSE",
        name: "Enterprise Universe",
        type: "Division",
        location: "Global Grid",
        budgetLimit: totalBudget,
        customFieldValues: {},
        children: roots.map(root => buildTreeRecursive(root))
      };
    }
  };

  const hierarchyData = buildHierarchy();

  // Reset Zoom function helper
  const handleResetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const chartGroup = svg.select(".chart-group");
    
    // Zoom back to default 
    const transform = d3.zoomIdentity.translate(50, dimensions.height / 2 - 20).scale(0.85);
    
    if (orientation === "vertical") {
      svg.transition().duration(750).call(
        d3.zoom<SVGSVGElement, unknown>().transform as any, 
        d3.zoomIdentity.translate(dimensions.width / 2, 50).scale(0.75)
      );
    } else {
      svg.transition().duration(750).call(
        d3.zoom<SVGSVGElement, unknown>().transform as any, 
        transform
      );
    }
  };

  // Redraw the D3 diagram when dependencies update
  useEffect(() => {
    if (!svgRef.current || !hierarchyData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Wipe clean

    const width = dimensions.width;
    const height = dimensions.height;

    // Outer SVG setup & ViewBox constraints
    svg
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    // Master SVG container group supporting zoom & pan transformations
    const chartGroup = svg.append("g").attr("class", "chart-group");

    // Zoom behavior declaration
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3.5])
      .on("zoom", (event) => {
        chartGroup.attr("transform", event.transform);
        setZoomScale(event.transform.k);
      });

    svg.call(zoomBehavior);

    // Initial translation positioning depending on orientation preference
    let initialTransform = d3.zoomIdentity.translate(50, height / 2 - 20).scale(0.8);
    if (orientation === "vertical") {
      initialTransform = d3.zoomIdentity.translate(width / 2, 60).scale(0.75);
    }
    svg.call(zoomBehavior.transform, initialTransform);

    // Initial Tree Layout formulation
    const d3Root = d3.hierarchy<TreeHierarchyNode>(hierarchyData);

    const cardWidth = 230;
    const cardHeight = 85;

    // Node separation factors to avoid overlaps
    const nodeWidthSeparation = cardWidth + 90;
    const nodeHeightSeparation = cardHeight + 45;

    const treeLayout = d3.tree<TreeHierarchyNode>();
    
    if (orientation === "horizontal") {
      treeLayout.nodeSize([nodeHeightSeparation, nodeWidthSeparation]);
    } else {
      treeLayout.nodeSize([nodeWidthSeparation, nodeHeightSeparation]);
    }

    treeLayout(d3Root as any);

    // Coordinates mapping
    const getX = (d: any) => orientation === "horizontal" ? d.y : d.x;
    const getY = (d: any) => orientation === "horizontal" ? d.x : d.y;

    // Connective Paths Render (Link curves)
    chartGroup.append("g")
      .attr("class", "links")
      .attr("fill", "none")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", "1.5px")
      .selectAll("path")
      .data(d3Root.links())
      .join("path")
      .attr("d", (d: any) => {
        // Draw neat orthogonal curves
        const xOffset = 0;
        const o = orientation;
        const sourceX = getX(d.source);
        const sourceY = getY(d.source);
        const targetX = getX(d.target);
        const targetY = getY(d.target);

        if (o === "horizontal") {
          return `M ${sourceX} ${sourceY} C ${(sourceX + targetX) / 2} ${sourceY}, ${(sourceX + targetX) / 2} ${targetY}, ${targetX} ${targetY}`;
        } else {
          return `M ${sourceX} ${sourceY} C ${sourceX} ${(sourceY + targetY) / 2}, ${targetX} ${(sourceY + targetY) / 2}, ${targetX} ${targetY}`;
        }
      })
      .attr("stroke-dasharray", (d: any) => d.target.data.id === "VIRTUAL_UNIVERSE" ? "4,4" : "none");

    // Creating Interactive Node Groups
    const nodeSelect = chartGroup.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(d3Root.descendants())
      .join("g")
      .attr("class", "node-item")
      .attr("transform", (d: any) => `translate(${getX(d)}, ${getY(d)})`)
      .style("cursor", "pointer");

    // Draw visual backdrop cards
    nodeSelect.append("rect")
      .attr("width", cardWidth)
      .attr("height", cardHeight)
      .attr("x", -cardWidth / 2)
      .attr("y", -cardHeight / 2)
      .attr("rx", 12)
      .attr("ry", 12)
      .attr("fill", d => {
        // Highlight matched search queries
        if (searchQuery.trim() && d.data.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return "#fef3c7"; // Warm highlight
        }
        if (selectedNodeId === d.data.id) {
          return "#e0e7ff"; // Selected node Indigo
        }
        return "#ffffff";
      })
      .attr("stroke", d => {
        if (selectedNodeId === d.data.id) return "#6366f1";
        if (searchQuery.trim() && d.data.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return "#d97706";
        }
        return "#e2e8f0";
      })
      .attr("stroke-width", d => selectedNodeId === d.data.id ? "3px" : "1.5px")
      .attr("filter", "drop-shadow(0 2px 3px rgba(15, 23, 42, 0.04))")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNodeId(d.data.id);
      });

    // Node Type Banner accent colors
    nodeSelect.append("rect")
      .attr("width", 8)
      .attr("height", cardHeight - 20)
      .attr("x", -cardWidth / 2 + 5)
      .attr("y", -cardHeight / 2 + 10)
      .attr("rx", 4)
      .attr("fill", d => {
        if (d.data.id === "VIRTUAL_UNIVERSE") return "#475569";
        const type = d.data.type;
        if (type === "Division") return "#3b82f6";     // Blue
        if (type === "Department") return "#10b981";   // Emerald
        if (type === "Sub-Department") return "#8b5cf6"; // Purple
        if (type === "Agile Pod") return "#6366f1";      // Indigo
        return "#f59e0b";                               // Amber
      });

    // Append Category Type label badge
    nodeSelect.append("text")
      .attr("x", -cardWidth / 2 + 22)
      .attr("y", -cardHeight / 2 + 20)
      .attr("font-size", "9px")
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("font-weight", "bold")
      .attr("fill", d => {
        const type = d.data.type;
        if (type === "Division") return "#2563eb";
        if (type === "Department") return "#059669";
        if (type === "Sub-Department") return "#7c3aed";
        return "#475569";
      })
      .text(d => d.data.type.toUpperCase());

    // Append Node Name (Truncated if necessary)
    nodeSelect.append("text")
      .attr("x", -cardWidth / 2 + 22)
      .attr("y", -cardHeight / 2 + 38)
      .attr("font-size", "12px")
      .attr("font-weight", "800")
      .attr("font-family", "Inter, sans-serif")
      .attr("fill", "#0f172a")
      .text(d => d.data.name.length > 20 ? d.data.name.substring(0, 18) + "..." : d.data.name);

    // Append Location Details 
    nodeSelect.append("text")
      .attr("x", -cardWidth / 2 + 22)
      .attr("y", -cardHeight / 2 + 54)
      .attr("font-size", "9.5px")
      .attr("font-family", "Inter, sans-serif")
      .attr("fill", "#64748b")
      .text(d => `📍 ${d.data.location}`);

    // Append Budget limit text indicator if present
    nodeSelect.append("text")
      .attr("x", -cardWidth / 2 + 22)
      .attr("y", -cardHeight / 2 + 69)
      .attr("font-size", "9.5px")
      .attr("font-weight", "600")
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("fill", "#475569")
      .text(d => d.data.budgetLimit ? `💵 $${d.data.budgetLimit.toLocaleString()}` : "");

    // Expand / Collapse interactivity button overlay
    const childNodesCheck = (id: string) => nodes.some(n => n.parentId === id);

    const toggleGroup = nodeSelect.append("g")
      .attr("transform", `translate(${cardWidth / 2 - 15}, ${cardHeight / 2 - 15})`)
      .on("click", (event, d) => {
        event.stopPropagation();
        if (d.data.id === "VIRTUAL_UNIVERSE") return;

        // Toggle collapsed state in state
        const id = d.data.id;
        setCollapsedNodes(prev => ({
          ...prev,
          [id]: !prev[id]
        }));
      });

    // Render interactive circle container only for nodes with children
    toggleGroup.filter(d => childNodesCheck(d.data.id))
      .append("circle")
      .attr("r", 9.5)
      .attr("fill", d => collapsedNodes[d.data.id] ? "#6366f1" : "#f1f5f9")
      .attr("stroke", d => collapsedNodes[d.data.id] ? "#4f46e5" : "#cbd5e1")
      .attr("stroke-width", "1.2px");

    // Add tiny arrow icon indicators
    toggleGroup.filter(d => childNodesCheck(d.data.id))
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "8.5px")
      .attr("font-family", "monospace")
      .attr("font-weight", "bold")
      .attr("fill", d => collapsedNodes[d.data.id] ? "#ffffff" : "#475569")
      .text(d => collapsedNodes[d.data.id] ? "+" : "-");

  }, [hierarchyData, dimensions, orientation, selectedNodeId, searchQuery, collapsedNodes]);

  const handleToggleCollapseDirect = (nodeId: string) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleCollapseAll = () => {
    // Collapse every single non-root node
    const updated: Record<string, boolean> = {};
    const rootMap = new Map(nodes.map(n => [n.id, n]));
    const roots = nodes.filter(n => !n.parentId || !rootMap.has(n.parentId));
    
    nodes.forEach(n => {
      if (!roots.some(r => r.id === n.id)) {
        updated[n.id] = true;
      }
    });
    setCollapsedNodes(updated);
  };

  const handleExpandAll = () => {
    setCollapsedNodes({});
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 select-none">
      
      {/* 1. D3 Canvas Viewport Area */}
      <div className="xl:col-span-3 flex flex-col space-y-4">
        
        {/* Secondary command bar for visualization options */}
        <div className="bg-slate-50 border border-slate-205 p-3 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GitFork className="w-4.5 h-4.5 text-indigo-500" />
            <span className="text-xs font-bold text-slate-700 font-mono uppercase tracking-tight">
              Interactive Link-Node Canvas
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search filter overlay */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Highlight node..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white border border-slate-200 outline-none rounded-lg text-xs font-semibold w-40 focus:ring-1 focus:ring-indigo-300"
              />
            </div>

            {/* Layout direction toggle */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setOrientation("horizontal")}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  orientation === "horizontal"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Horizontal
              </button>
              <button
                type="button"
                onClick={() => setOrientation("vertical")}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  orientation === "vertical"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Vertical
              </button>
            </div>

            {/* Collapse / Expand Globals */}
            <button
              onClick={handleExpandAll}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-350 rounded-lg text-[10px] font-bold text-slate-600 cursor-pointer"
              title="Expand all tree paths"
            >
              Expand All
            </button>
            <button
              onClick={handleCollapseAll}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-350 rounded-lg text-[10px] font-bold text-slate-600 cursor-pointer"
              title="Collapse sub-branches"
            >
              Collapse Sub
            </button>

            {/* Zoom / Reset functions */}
            <div className="flex items-center gap-1.5 border-l pl-2 border-slate-250">
              <button
                onClick={handleResetZoom}
                className="p-1 px-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-md text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                title="Reset zoom & viewport focus"
              >
                <RotateCcw className="w-3 h-3 text-indigo-500" /> Focus
              </button>
              <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-100 border px-1.5 py-0.5 rounded">
                {(zoomScale * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* The SVG element canvas stage */}
        <div 
          ref={containerRef}
          className="w-full h-[540px] bg-[#f8fafc] rounded-2xl relative border border-slate-200/80 overflow-hidden shadow-xs"
        >
          {nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 space-y-2">
              <Info className="w-8 h-8 text-indigo-500 shrink-0" />
              <p className="text-sm font-bold">No organizational structures available to render.</p>
              <p className="text-xs text-center max-w-sm text-slate-400">Specify mock presets or use the creator tool at the top right to launch components!</p>
            </div>
          ) : (
            <>
              <svg 
                ref={svgRef} 
                className="w-full h-full block"
              />
              
              {/* Floating aesthetic helper badge */}
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-[9px] font-mono font-medium text-slate-404 flex items-center gap-1.5 select-none pointer-events-none">
                <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0 animate-pulse" />
                <span>Scroll to Zoom. Click node to inspect details. Drag canvas to pan.</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Interactive Inspector Sidebar Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-full flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-indigo-900 uppercase font-mono tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" /> Structural Inspector
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Click any node item on the interactive SVG canvas grid to trigger metadata fields.</p>
          </div>

          {activeNode ? (
            <div className="space-y-4 animate-scale-up">
              
              {/* Selected Node card block */}
              <div className="p-3.5 bg-slate-50 border border-indigo-100 rounded-xl space-y-2 relative overflow-hidden">
                <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-100/60 text-indigo-800 rounded-md border border-indigo-200">
                  {activeNode.type}
                </span>

                <h4 className="text-sm font-extrabold text-slate-850 uppercase leading-snug mt-1 border-b pb-1">
                  {activeNode.name}
                </h4>

                <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>HQ Branch: <strong>{activeNode.location}</strong></span>
                  </div>
                  {activeNode.budgetLimit !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Allocated Budget: <strong>${activeNode.budgetLimit.toLocaleString()}</strong></span>
                    </div>
                  )}
                </div>

                {/* Subordinate trigger modifiers inside inspector */}
                <div className="pt-2 flex items-center gap-2 border-t border-slate-200/80 mt-2">
                  {onEditNode && (
                    <button
                      type="button"
                      onClick={() => onEditNode(activeNode)}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-350 rounded-lg text-[10px] font-semibold text-slate-650 cursor-pointer transition-all"
                    >
                      Modify Parameters
                    </button>
                  )}
                  {onAddSubNode && (
                    <button
                      type="button"
                      onClick={() => onAddSubNode(activeNode.id)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-semibold cursor-pointer transition-all"
                    >
                      + Add Report Node
                    </button>
                  )}
                </div>
              </div>

              {/* Leader Supervisor Info card */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block tracking-wide">
                  Department / Pod Leader
                </span>

                {leadEmployee ? (
                  <div className="flex items-center gap-3 p-3 bg-white border border-slate-150 rounded-xl shadow-3xs">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                      <img 
                        src={getEmployeeAvatar(leadEmployee.name)} 
                        alt={leadEmployee.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-slate-800 block truncate leading-tight">{leadEmployee.name}</span>
                      <span className="text-[10px] text-slate-450 block truncate font-mono mt-0.5">{leadEmployee.role}</span>
                      <span className="text-[9px] text-slate-400 block truncate">{leadEmployee.email}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50/50 border border-slate-150 border-dashed rounded-xl text-center text-slate-404 text-[11px] italic">
                    No individual supervisor assigned yet. Edit this structure to appoint a team lead.
                  </div>
                )}
              </div>

              {/* Dynamic schema custom key value list */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block tracking-wide">
                  Dynamic Meta Schema Values
                </span>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {schemaFields.length === 0 ? (
                    <span className="text-[10px] italic text-slate-400 block">No custom attributes established yet. Customize dynamic keys using the third tab tab.</span>
                  ) : (
                    schemaFields.map(field => {
                      const val = activeNode.customFieldValues?.[field.key] || "--";
                      return (
                        <div key={field.key} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border text-xs">
                          <span className="text-slate-450 font-mono text-[10px]">{field.label}</span>
                          <span className="font-bold text-indigo-700 font-mono text-[10px]">{val}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs italic bg-slate-50 border border-slate-150 border-dashed rounded-xl p-4 flex flex-col justify-center items-center space-y-2">
              <Briefcase className="w-6 h-6 text-slate-300" />
              <span>No element selected in the interactive framework canvas tree diagram.</span>
            </div>
          )}

          {/* Children nodes summary sub roster */}
          {activeNode && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-400 uppercase">
                <span>Immediate Report Nodes</span>
                <span>{nodes.filter(n => n.parentId === activeNode.id).length} Nodes</span>
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {nodes.filter(n => n.parentId === activeNode.id).map(childNode => (
                  <div 
                    key={childNode.id}
                    onClick={() => setSelectedNodeId(childNode.id)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 border hover:border-slate-300 rounded-lg text-[10px] font-semibold text-slate-700 flex items-center justify-between transition-colors cursor-pointer select-none"
                  >
                    <span className="truncate pr-1 uppercase">{childNode.name}</span>
                    <span className="text-[8px] font-mono font-bold bg-slate-200/80 border px-1 rounded text-slate-500 shrink-0">{childNode.type}</span>
                  </div>
                ))}
                {nodes.filter(n => n.parentId === activeNode.id).length === 0 && (
                  <span className="text-[10px] italic text-slate-400 block py-1 font-mono text-center">No structural dependencies report to this leaf node.</span>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Selected target indicator card */}
        <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[10px] text-indigo-900 font-medium flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Interactive structure synchronizes immediately with active records.</span>
        </div>
      </div>

    </div>
  );
}
