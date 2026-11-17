"use client";

import * as React from "react";
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  HardHat,
  Calendar,
  AlertCircle,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
  TrendingUp,
  LayoutGrid,
  Table as TableIcon,
  Briefcase,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export interface MilestoneItem {
  id: string;
  title: string;
  targetDate?: string;
  contractor?: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface InfrastructureProject {
  id: string;
  code: string;
  name: string;
  clientOrEntity: string | null;
  location: string;
  category: "INFRASTRUCTURE" | "COMMERCIAL" | "RESIDENTIAL" | "MARINE_PORT" | "ENERGY" | string;
  status: "PLANNING" | "IN_PROGRESS" | "UNDER_INSPECTION" | "COMPLETED" | "ON_HOLD";
  progressPct: number;
  startDate: string | null;
  targetEndDate: string | null;
  leadEngineer: string | null;
  contractorTeam: string | null;
  budget: number | null;
  currency: string;
  summary: string | null;
  milestones: string | null;
  images: string | null;
  createdByEmail: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "ALL", label: "All Sectors" },
  { value: "INFRASTRUCTURE", label: "Civil & Highway Infrastructure" },
  { value: "COMMERCIAL", label: "Commercial Development" },
  { value: "RESIDENTIAL", label: "Residential Enclaves" },
  { value: "MARINE_PORT", label: "Marine, Port & Coastal" },
  { value: "ENERGY", label: "Energy & Industrial Utilities" },
];

const STATUSES = [
  { value: "ALL", label: "All Statuses" },
  { value: "IN_PROGRESS", label: "In Active Progress" },
  { value: "PLANNING", label: "Planning & Mobilization" },
  { value: "UNDER_INSPECTION", label: "Under Technical Inspection" },
  { value: "COMPLETED", label: "Completed & Commissioned" },
  { value: "ON_HOLD", label: "Temporarily On Hold" },
];

export default function OperationsProjectsPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [projects, setProjects] = React.useState<InfrastructureProject[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"create" | "edit">("create");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [projectToDelete, setProjectToDelete] = React.useState<InfrastructureProject | null>(null);

  // Form State
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [clientOrEntity, setClientOrEntity] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [category, setCategory] = React.useState("INFRASTRUCTURE");
  const [status, setStatus] = React.useState<InfrastructureProject["status"]>("IN_PROGRESS");
  const [progressPct, setProgressPct] = React.useState(15);
  const [startDate, setStartDate] = React.useState("");
  const [targetEndDate, setTargetEndDate] = React.useState("");
  const [leadEngineer, setLeadEngineer] = React.useState("");
  const [contractorTeam, setContractorTeam] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [milestonesList, setMilestonesList] = React.useState<MilestoneItem[]>([]);
  const [newMilestoneText, setNewMilestoneText] = React.useState("");
  const [newMilestoneDate, setNewMilestoneDate] = React.useState("");

  // Fetch Projects from API
  const fetchProjects = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/projects?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load projects");

      setProjects(data.projects || []);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Could not load projects");
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedCategory, searchQuery, toastError]);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Derived Metrics (Calculated dynamically with zero mock data)
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter((p) => p.status === "IN_PROGRESS").length;
  const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;
  
  // Total completed milestones across all projects
  const totalCompletedMilestones = React.useMemo(() => {
    return projects.reduce((acc, p) => {
      try {
        const ms: MilestoneItem[] = p.milestones ? JSON.parse(p.milestones) : [];
        return acc + ms.filter((m) => m.isCompleted).length;
      } catch {
        return acc;
      }
    }, 0);
  }, [projects]);

  const avgVelocity = React.useMemo(() => {
    if (projects.length === 0) return 0;
    const sum = projects.reduce((acc, p) => acc + (p.progressPct || 0), 0);
    return Math.round(sum / projects.length);
  }, [projects]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setName("");
    setClientOrEntity("");
    setLocation("");
    setCategory("INFRASTRUCTURE");
    setStatus("IN_PROGRESS");
    setProgressPct(10);
    setStartDate(new Date().toISOString().split("T")[0]);
    setTargetEndDate("");
    setLeadEngineer("");
    setContractorTeam("");
    setSummary("");
    setMilestonesList([
      { id: `ms-1`, title: "Topographical Survey & Geotechnical Soil Boring", isCompleted: true },
      { id: `ms-2`, title: "Corridor Mobilization, Site Access & Grading", isCompleted: false },
      { id: `ms-3`, title: "Primary Foundation, Structural Piling & Drainage", isCompleted: false },
      { id: `ms-4`, title: "Superstructure Erection & MEP Conduits", isCompleted: false },
      { id: `ms-5`, title: "Final Technical Inspection & Commissioning Clearance", isCompleted: false },
    ]);
    setNewMilestoneText("");
    setNewMilestoneDate("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: InfrastructureProject) => {
    setModalMode("edit");
    setEditingId(p.id);
    setName(p.name);
    setClientOrEntity(p.clientOrEntity || "");
    setLocation(p.location);
    setCategory(p.category);
    setStatus(p.status);
    setProgressPct(p.progressPct || 0);
    setStartDate(p.startDate ? p.startDate.split("T")[0] : "");
    setTargetEndDate(p.targetEndDate ? p.targetEndDate.split("T")[0] : "");
    setLeadEngineer(p.leadEngineer || "");
    setContractorTeam(p.contractorTeam || "");
    setSummary(p.summary || "");

    let parsedMilestones: MilestoneItem[] = [];
    try {
      parsedMilestones = p.milestones ? JSON.parse(p.milestones) : [];
    } catch {
      parsedMilestones = [];
    }
    setMilestonesList(parsedMilestones);
    setNewMilestoneText("");
    setNewMilestoneDate("");
    setIsModalOpen(true);
  };

  // Add Milestone to List
  const handleAddMilestone = () => {
    if (!newMilestoneText.trim()) return;
    const newItem: MilestoneItem = {
      id: `ms-${Date.now()}`,
      title: newMilestoneText.trim(),
      targetDate: newMilestoneDate || undefined,
      isCompleted: false,
    };
    setMilestonesList([...milestonesList, newItem]);
    setNewMilestoneText("");
    setNewMilestoneDate("");
  };

  // Toggle Milestone in Form
  const handleToggleFormMilestone = (id: string) => {
    const updated = milestonesList.map((m) =>
      m.id === id ? { ...m, isCompleted: !m.isCompleted, completedAt: !m.isCompleted ? new Date().toISOString() : undefined } : m
    );
    setMilestonesList(updated);

    // Auto update progress % based on milestones
    if (updated.length > 0) {
      const completedCount = updated.filter((m) => m.isCompleted).length;
      const calculatedPct = Math.round((completedCount / updated.length) * 100);
      setProgressPct(calculatedPct);
    }
  };

  // Delete Milestone in Form
  const handleDeleteFormMilestone = (id: string) => {
    setMilestonesList(milestonesList.filter((m) => m.id !== id));
  };

  // Submit Project (Create or Update)
  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError("Validation Error", "Project name is required.");
      return;
    }
    if (!location.trim()) {
      toastError("Validation Error", "Project location / site corridor is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        clientOrEntity: clientOrEntity.trim() || null,
        location: location.trim(),
        category,
        status,
        progressPct: Number(progressPct),
        startDate: startDate ? new Date(startDate).toISOString() : null,
        targetEndDate: targetEndDate ? new Date(targetEndDate).toISOString() : null,
        leadEngineer: leadEngineer.trim() || null,
        contractorTeam: contractorTeam.trim() || null,
        summary: summary.trim() || null,
        milestones: milestonesList,
      };

      const url = modalMode === "create" ? "/api/projects" : `/api/projects/${editingId}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to save project");

      toastSuccess(
        modalMode === "create" ? "Project Registered" : "Project Updated",
        `Project ${name} (${resJson.project?.code || ""}) was successfully saved.`
      );

      setIsModalOpen(false);
      fetchProjects();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Error saving project");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Inline Milestone Toggle directly from Project Card
  const handleQuickToggleMilestone = async (project: InfrastructureProject, milestoneId: string) => {
    let currentMs: MilestoneItem[] = [];
    try {
      currentMs = project.milestones ? JSON.parse(project.milestones) : [];
    } catch {
      return;
    }

    const updated = currentMs.map((m) =>
      m.id === milestoneId
        ? { ...m, isCompleted: !m.isCompleted, completedAt: !m.isCompleted ? new Date().toISOString() : undefined }
        : m
    );

    // Calculate new progress percentage
    const completedCount = updated.filter((m) => m.isCompleted).length;
    const newProgress = updated.length > 0 ? Math.round((completedCount / updated.length) * 100) : project.progressPct;

    // Optimistic UI update
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? { ...p, milestones: JSON.stringify(updated), progressPct: newProgress }
          : p
      )
    );

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestones: updated,
          progressPct: newProgress,
          status: newProgress === 100 ? "COMPLETED" : project.status === "COMPLETED" ? "IN_PROGRESS" : project.status,
        }),
      });
      if (!res.ok) throw new Error("Could not update milestone");
    } catch (err: unknown) {
      toastError("Failed to update milestone status");
      fetchProjects();
    }
  };

  // Delete Project
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, { method: "DELETE" });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to delete project");

      toastSuccess("Project Deleted", `Project ${projectToDelete.name} has been removed.`);
      setProjectToDelete(null);
      fetchProjects();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Could not delete project");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8">
      {/* ===================================================================== */}
      {/* 1. OPERATIONS HEADER & PRIMARY ACTION */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-500 uppercase">
              Operations Infrastructure Command
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Infrastructure Projects &amp; Milestones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Direct operational entry, physical site delivery, contractor squad supervision, and ground milestone completion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            className="bg-[#ED2618] hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Enter New Project</span>
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. REAL-TIME TELEMETRY RIBBON (No Mock Data, 100% Calculated) */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c0d12] p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Projects</span>
            <Building2 className="h-4 w-4 text-[#ED2618]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {totalProjects}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Operational project records
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c0d12] p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active In Progress</span>
            <HardHat className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {inProgressProjects}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Ground execution ongoing
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c0d12] p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Milestones</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {totalCompletedMilestones}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Verified ground deliverables
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c0d12] p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Site Velocity</span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {avgVelocity}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Mean delivery completion
          </p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. FILTER & SEARCH CONTROL MATRIX */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c0d12] p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by project name, code, site location, contractor, or supervising engineer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#ED2618] text-slate-900 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by Sector"
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#ED2618]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-white dark:bg-slate-900">
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Execution Status"
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#ED2618]"
            >
              {STATUSES.map((st) => (
                <option key={st.value} value={st.value} className="bg-white dark:bg-slate-900">
                  {st.label}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden p-0.5 bg-slate-100 dark:bg-white/[0.05]">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg text-xs transition-colors",
                  viewMode === "grid"
                    ? "bg-white dark:bg-[#181a20] text-slate-900 dark:text-white shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                )}
                title="Cards & Milestones View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-lg text-xs transition-colors",
                  viewMode === "table"
                    ? "bg-white dark:bg-[#181a20] text-slate-900 dark:text-white shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                )}
                title="Matrix Table View"
              >
                <TableIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. MAIN PROJECT LISTINGS */}
      {/* ===================================================================== */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#ED2618] border-r-transparent" />
          <p className="mt-3 text-xs text-slate-500">Loading infrastructure projects from telemetry database...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c0d12] p-12 text-center shadow-sm">
          <div className="max-w-md mx-auto space-y-3">
            <div className="h-12 w-12 rounded-xl bg-red-50 text-[#ED2618] dark:bg-red-950/30 mx-auto flex items-center justify-center">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Projects Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No infrastructure projects match your current filters. As the Operations Officer, you can enter new projects, establish milestones, assign contractor squads, and track execution velocity.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreate}
                className="bg-[#ED2618] hover:bg-red-700 text-white text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                <span>Enter New Project</span>
              </Button>
            </div>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW: CARDS & MILESTONE CHECKLIST */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((p) => {
            let milestones: MilestoneItem[] = [];
            try {
              milestones = p.milestones ? JSON.parse(p.milestones) : [];
            } catch {
              milestones = [];
            }

            const completedCount = milestones.filter((m) => m.isCompleted).length;

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c0d12] p-5 shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-[#ED2618] bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md">
                          {p.code}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                          {p.category.replace("_", " ")}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        {p.name}
                      </h3>
                      {p.clientOrEntity && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <Briefcase className="h-3 w-3 shrink-0" />
                          <span>Client: {p.clientOrEntity}</span>
                        </p>
                      )}
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0",
                        p.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                          : p.status === "IN_PROGRESS"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
                          : p.status === "UNDER_INSPECTION"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40"
                          : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                      )}
                    >
                      {p.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Location & Supervising Team */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5 mb-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#ED2618] shrink-0" />
                      <span className="truncate" title={p.location}>
                        {p.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <HardHat className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="truncate" title={p.contractorTeam || "Dexta Operational Squad"}>
                        {p.contractorTeam || "Dexta Squad Alpha"}
                      </span>
                    </div>

                    {p.leadEngineer && (
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">
                          Supervising: {p.leadEngineer}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Physical Delivery Progress
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {p.progressPct}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          p.progressPct >= 100
                            ? "bg-emerald-500"
                            : p.progressPct >= 50
                            ? "bg-[#ED2618]"
                            : "bg-amber-500"
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, p.progressPct))}%` }}
                      />
                    </div>
                  </div>

                  {/* Ground Milestones Checklist */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Key Ground Milestones</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {completedCount} / {milestones.length} Completed
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {milestones.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No milestones defined yet.</p>
                      ) : (
                        milestones.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleQuickToggleMilestone(p, m.id)}
                            className={cn(
                              "flex items-start gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors",
                              m.isCompleted
                                ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/30 text-emerald-900 dark:text-emerald-300"
                                : "bg-white dark:bg-white/[0.02] border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                            )}
                          >
                            {m.isCompleted ? (
                              <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn("leading-tight font-medium", m.isCompleted && "line-through opacity-80")}>
                                {m.title}
                              </p>
                              {m.targetDate && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Due: {m.targetDate}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[11px] text-slate-400">
                    Updated {new Date(p.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(p)}
                      className="h-7 text-xs border-slate-200 dark:border-white/10"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      <span>Edit &amp; Mutate</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProjectToDelete(p)}
                      className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW: DETAILED MATRIX */
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c0d12] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 text-slate-500 uppercase font-mono tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Project Name &amp; Sector</th>
                  <th className="py-3 px-4">Site Location</th>
                  <th className="py-3 px-4">Contractor / Lead</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Progress %</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#ED2618]">
                      {p.code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{p.category.replace("_", " ")}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.location}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{p.contractorTeam || "Dexta Squad Alpha"}</div>
                      {p.leadEngineer && <div className="text-[10px] text-slate-400">{p.leadEngineer}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        {p.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      {p.progressPct}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(p)}
                          className="h-7 text-xs"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setProjectToDelete(p)}
                          className="h-7 text-xs text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. CREATE & EDIT PROJECT MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "create" ? "Enter New Infrastructure Project" : `Edit Project: ${name}`}
      >
        <form onSubmit={handleSubmitProject} className="space-y-4 text-slate-900 dark:text-white max-h-[80vh] overflow-y-auto px-1">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Project Title / Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Eko Atlantic Maritime Logistics Corridor Phase 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#ED2618]"
            />
          </div>

          {/* Client or Entity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Client / Sovereign Partner
              </label>
              <input
                type="text"
                placeholder="e.g. Federal Ministry of Works / Lagos State"
                value={clientOrEntity}
                onChange={(e) => setClientOrEntity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#ED2618]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Site Location Corridor *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lekki Coastal Expressway Corridor, Lagos"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#ED2618]"
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sector / Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#ED2618]"
              >
                {CATEGORIES.filter((c) => c.value !== "ALL").map((c) => (
                  <option key={c.value} value={c.value} className="bg-white dark:bg-slate-900">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Execution Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#ED2618]"
              >
                {STATUSES.filter((s) => s.value !== "ALL").map((s) => (
                  <option key={s.value} value={s.value} className="bg-white dark:bg-slate-900">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress Percentage */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Site Progress Percentage
              </label>
              <span className="text-xs font-mono font-bold text-[#ED2618]">
                {progressPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progressPct}
              onChange={(e) => setProgressPct(Number(e.target.value))}
              className="w-full accent-[#ED2618]"
            />
          </div>

          {/* Lead Engineer & Contractor Squad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lead Supervising Engineer
              </label>
              <input
                type="text"
                placeholder="e.g. Engr. Babatunde Alabi, FNSE"
                value={leadEngineer}
                onChange={(e) => setLeadEngineer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#ED2618]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Contractor Squad / Firm
              </label>
              <input
                type="text"
                placeholder="e.g. Julius Berger / Dexta Field Squad Alpha"
                value={contractorTeam}
                onChange={(e) => setContractorTeam(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#ED2618]"
              />
            </div>
          </div>

          {/* Target Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobilization Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#ED2618]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Commissioning Date
              </label>
              <input
                type="date"
                value={targetEndDate}
                onChange={(e) => setTargetEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#ED2618]"
              />
            </div>
          </div>

          {/* Scope / Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Project Technical Scope &amp; Summary
            </label>
            <textarea
              rows={2}
              placeholder="Provide executive scope, ground coordinates, and technical specifications..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#ED2618]"
            />
          </div>

          {/* Milestones Management */}
          <div className="border-t border-slate-200 dark:border-white/10 pt-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Ground Execution Milestones
            </label>

            {/* Existing Milestones List */}
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
              {milestonesList.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-xs"
                >
                  <div
                    className="flex items-center gap-2 cursor-pointer flex-1"
                    onClick={() => handleToggleFormMilestone(m.id)}
                  >
                    {m.isCompleted ? (
                      <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                    <span className={cn(m.isCompleted && "line-through text-slate-400 font-medium")}>
                      {m.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteFormMilestone(m.id)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Milestone */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter new milestone description..."
                value={newMilestoneText}
                onChange={(e) => setNewMilestoneText(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#ED2618]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMilestone}
                className="text-xs h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#ED2618] hover:bg-red-700 text-white text-xs font-bold"
            >
              {isSubmitting ? "Saving..." : modalMode === "create" ? "Establish Project" : "Update Project"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* 6. DELETE CONFIRMATION MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        title="Confirm Project Deletion"
      >
        <div className="space-y-4 p-2 text-slate-900 dark:text-white">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Permanent Deletion Warning</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Are you sure you want to delete <strong>{projectToDelete?.name}</strong> ({projectToDelete?.code})? All associated milestones and contractor telemetry records will be permanently removed.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProjectToDelete(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
            >
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
