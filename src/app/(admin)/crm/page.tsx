"use client";

import * as React from "react";
import {
  Briefcase,
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  FileCheck,
  Award,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

interface CrmDeal {
  id: string;
  clientId: string;
  title: string;
  value: number;
  currency: string;
  stage: "PROPOSAL" | "DUE_DILIGENCE" | "CLOSING" | "WON" | "LOST";
  probability: number;
  expectedCloseDate?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface CrmActivity {
  id: string;
  clientId: string;
  type: "CALL" | "MEETING" | "EMAIL" | "CONTRACT_MEMO" | "TASK" | "MILESTONE";
  title: string;
  description?: string | null;
  outcome?: string | null;
  activityDate: string;
  user?: { fullName: string; email: string } | null;
}

interface CrmClient {
  id: string;
  name: string;
  company?: string | null;
  email: string;
  phone?: string | null;
  category: "PROSPECT" | "ACTIVE_CLIENT" | "INVESTOR" | "STRATEGIC_PARTNER" | "VENDOR";
  stage: "INQUIRY" | "DISCOVERY" | "PROPOSAL_SENT" | "NEGOTIATION" | "CONTRACT_SIGNED" | "ACTIVE_ACCOUNT";
  estimatedValue: number;
  currency: string;
  assignedTo?: string | null;
  location?: string | null;
  tags: string; // JSON array string
  notes?: string | null;
  createdAt: string;
  deals: CrmDeal[];
  activities: CrmActivity[];
}

const STAGES = [
  { id: "ALL", label: "All Stages" },
  { id: "INQUIRY", label: "Initial Inquiry" },
  { id: "DISCOVERY", label: "Discovery" },
  { id: "PROPOSAL_SENT", label: "Proposal Sent" },
  { id: "NEGOTIATION", label: "Negotiation" },
  { id: "CONTRACT_SIGNED", label: "Contract Signed" },
  { id: "ACTIVE_ACCOUNT", label: "Active Account" },
];

const CATEGORIES = [
  { id: "ALL", label: "All Categories" },
  { id: "PROSPECT", label: "Prospect" },
  { id: "ACTIVE_CLIENT", label: "Active Client" },
  { id: "INVESTOR", label: "Institutional Investor" },
  { id: "STRATEGIC_PARTNER", label: "Strategic Partner" },
  { id: "VENDOR", label: "Vendor" },
];

export default function CrmDashboardPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [clients, setClients] = React.useState<CrmClient[]>([]);
  const [stats, setStats] = React.useState({
    totalPipelineValue: 0,
    totalCount: 0,
    activeClientsCount: 0,
    dealsCount: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStage, setSelectedStage] = React.useState("ALL");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");

  // Client Details Drawer/Modal
  const [selectedClient, setSelectedClient] = React.useState<CrmClient | null>(null);

  // New Client Modal
  const [newClientModalOpen, setNewClientModalOpen] = React.useState(false);
  const [clientForm, setClientForm] = React.useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    category: "ACTIVE_CLIENT",
    stage: "NEGOTIATION",
    estimatedValue: "",
    location: "Lagos, Nigeria",
    notes: "",
    tagString: "High Value, Flagship",
  });
  const [isSubmittingClient, setIsSubmittingClient] = React.useState(false);

  // Log Activity Modal
  const [activityModalOpen, setActivityModalOpen] = React.useState(false);
  const [activityTargetClient, setActivityTargetClient] = React.useState<CrmClient | null>(null);
  const [activityForm, setActivityForm] = React.useState({
    type: "MEETING",
    title: "",
    description: "",
    outcome: "",
  });
  const [isSubmittingActivity, setIsSubmittingActivity] = React.useState(false);

  // Fetch Clients
  const fetchClients = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/crm/clients");
      if (!res.ok) throw new Error("Failed to load CRM data");
      const data = await res.json();
      setClients(data.clients || []);
      setStats(data.stats || { totalPipelineValue: 0, totalCount: 0, activeClientsCount: 0, dealsCount: 0 });
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Error connecting to CRM service");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Create Client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.email) {
      toastError("Contact name and email are mandatory");
      return;
    }

    setIsSubmittingClient(true);
    try {
      const tags = clientForm.tagString
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/crm/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientForm.name,
          company: clientForm.company || undefined,
          email: clientForm.email,
          phone: clientForm.phone || undefined,
          category: clientForm.category,
          stage: clientForm.stage,
          estimatedValue: clientForm.estimatedValue ? parseFloat(clientForm.estimatedValue) : 0,
          location: clientForm.location,
          notes: clientForm.notes,
          tags,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create client profile");
      }

      toastSuccess(`Client ${clientForm.name} onboarded to CRM`);
      setNewClientModalOpen(false);
      setClientForm({
        name: "",
        company: "",
        email: "",
        phone: "",
        category: "ACTIVE_CLIENT",
        stage: "NEGOTIATION",
        estimatedValue: "",
        location: "Lagos, Nigeria",
        notes: "",
        tagString: "High Value, Flagship",
      });
      fetchClients();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Error onboarding client");
    } finally {
      setIsSubmittingClient(false);
    }
  };

  // Log Activity
  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTargetClient || !activityForm.title) {
      toastError("Interaction title is required");
      return;
    }

    setIsSubmittingActivity(true);
    try {
      const res = await fetch("/api/crm/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activityTargetClient.id,
          type: activityForm.type,
          title: activityForm.title,
          description: activityForm.description,
          outcome: activityForm.outcome,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log interaction");
      }

      toastSuccess("Interaction logged to client timeline");
      setActivityModalOpen(false);
      setActivityForm({ type: "MEETING", title: "", description: "", outcome: "" });
      fetchClients();

      // If drawer is open with this client, update its activities
      if (selectedClient && selectedClient.id === activityTargetClient.id) {
        setSelectedClient((prev) =>
          prev
            ? {
                ...prev,
                activities: [
                  {
                    id: `temp-${Date.now()}`,
                    clientId: prev.id,
                    type: activityForm.type as any,
                    title: activityForm.title,
                    description: activityForm.description,
                    outcome: activityForm.outcome,
                    activityDate: new Date().toISOString(),
                  },
                  ...prev.activities,
                ],
              }
            : null
        );
      }
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Failed to record activity");
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // Update Client Stage Directly
  const handleUpdateStage = async (clientId: string, newStage: string) => {
    try {
      const res = await fetch("/api/crm/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: clientId, stage: newStage }),
      });

      if (!res.ok) throw new Error("Failed to transition deal stage");
      toastSuccess(`Pipeline stage updated to ${newStage.replace(/_/g, " ")}`);
      fetchClients();
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient((prev) => (prev ? { ...prev, stage: newStage as any } : null));
      }
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Stage transition failed");
    }
  };

  // Format currency
  const formatMoney = (val: number, cur = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Parsed tags helper
  const parseTags = (tagStr: string): string[] => {
    try {
      const parsed = JSON.parse(tagStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Filtered clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.location && c.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStage = selectedStage === "ALL" || c.stage === selectedStage;
    const matchesCategory = selectedCategory === "ALL" || c.category === selectedCategory;

    return matchesSearch && matchesStage && matchesCategory;
  });

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Client Relationships & Strategic Deal Pipeline
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Centralized institutional investor, client contracts, deal milestones, and high-value project pipelines.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <a
            href="/crm-portal"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Executive CRM Landing</span>
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchClients}
            className="flex items-center gap-2 border-slate-200 dark:border-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh CRM</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setNewClientModalOpen(true)}
            className="flex items-center gap-2 bg-[#ED2618] hover:bg-[#d02013] text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Onboard Client / Partner</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Active Pipeline Value
            </span>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {formatMoney(stats.totalPipelineValue)}
            </span>
          </div>
          <p className="mt-1 text-xs text-emerald-600 font-medium">
            Aggregated institutional real estate deals
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Contracted Accounts
            </span>
            <Award className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.activeClientsCount}
            </span>
            <span className="text-xs text-slate-500">
              of {stats.totalCount} accounts
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Signed contracts & active developments
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Active Deal Records
            </span>
            <Layers className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.dealsCount}
            </span>
            <span className="text-xs text-indigo-600 font-medium">
              Milestone tracked
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Due diligence, closing & delivery stages
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              CRM Intelligence
            </span>
            <Sparkles className="h-5 w-5 text-[#ED2618]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Zero-Loss
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            External spreadsheets eliminated
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search client name, corporate entity, email or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Filter by deal pipeline stage"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by relationship category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clients & Deal Pipeline Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-400 mb-3" />
            <p className="text-sm text-slate-500">Loading strategic client directory...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No clients or deals found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add your first strategic client or partner to start tracking deals.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Client / Entity</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Pipeline Stage</th>
                  <th className="py-3.5 px-4">Portfolio Value</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Active Deals</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-sm">
                {filteredClients.map((client) => {
                  const tags = parseTags(client.tags);
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => setSelectedClient(client)}
                            className="font-semibold text-left text-slate-900 dark:text-white hover:text-[#ED2618] transition-colors"
                          >
                            {client.name}
                          </button>
                          <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            {client.company && (
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {client.company} •
                              </span>
                            )}
                            {client.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                          {client.category.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          aria-label={`Change stage for ${client.name}`}
                          value={client.stage}
                          onChange={(e) => handleUpdateStage(client.id, e.target.value)}
                          className="text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#ED2618]"
                        >
                          <option value="INQUIRY">Initial Inquiry</option>
                          <option value="DISCOVERY">Discovery</option>
                          <option value="PROPOSAL_SENT">Proposal Sent</option>
                          <option value="NEGOTIATION">Negotiation</option>
                          <option value="CONTRACT_SIGNED">Contract Signed</option>
                          <option value="ACTIVE_ACCOUNT">Active Account</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                        {formatMoney(client.estimatedValue, client.currency)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {client.location || "Lagos, Nigeria"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <FileCheck className="h-3 w-3" />
                          {client.deals.length} Deals
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActivityTargetClient(client);
                              setActivityModalOpen(true);
                            }}
                            className="text-xs h-8 px-2.5 border-slate-200 dark:border-white/10"
                            title="Log Call, Meeting or Note"
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1" />
                            Log Note
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setSelectedClient(client)}
                            className="text-xs h-8 px-2.5 bg-slate-900 hover:bg-black dark:bg-white/10 dark:hover:bg-white/20 text-white"
                          >
                            <span>Profile</span>
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Onboard Client / Partner */}
      <Modal
        isOpen={newClientModalOpen}
        onClose={() => setNewClientModalOpen(false)}
        title="Onboard Strategic Client / Institutional Partner"
        description="Eliminates external spreadsheets. Direct database registration with deal pipeline linkage."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateClient} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Name *
              </label>
              <Input
                required
                placeholder="e.g. Chief Raymond Alade"
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Entity / Corporate Name
              </label>
              <Input
                placeholder="e.g. Eko Capital Holdings Ltd"
                value={clientForm.company}
                onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Email *
              </label>
              <Input
                type="email"
                required
                placeholder="e.g. r.alade@ekocapital.ng"
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Telephone Number
              </label>
              <Input
                placeholder="e.g. +234 803 111 2233"
                value={clientForm.phone}
                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                aria-label="Relationship category"
                value={clientForm.category}
                onChange={(e) => setClientForm({ ...clientForm, category: e.target.value as any })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-xs text-slate-900 dark:text-white"
              >
                <option value="PROSPECT">Prospect</option>
                <option value="ACTIVE_CLIENT">Active Client</option>
                <option value="INVESTOR">Institutional Investor</option>
                <option value="STRATEGIC_PARTNER">Strategic Partner</option>
                <option value="VENDOR">Vendor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pipeline Stage
              </label>
              <select
                aria-label="Deal pipeline stage"
                value={clientForm.stage}
                onChange={(e) => setClientForm({ ...clientForm, stage: e.target.value as any })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-xs text-slate-900 dark:text-white"
              >
                <option value="INQUIRY">Initial Inquiry</option>
                <option value="DISCOVERY">Discovery</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="CONTRACT_SIGNED">Contract Signed</option>
                <option value="ACTIVE_ACCOUNT">Active Account</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estimated Deal Value ($)
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000000"
                value={clientForm.estimatedValue}
                onChange={(e) => setClientForm({ ...clientForm, estimatedValue: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Location
              </label>
              <Input
                placeholder="e.g. Ikoyi, Lagos, Nigeria"
                value={clientForm.location}
                onChange={(e) => setClientForm({ ...clientForm, location: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Strategic Tags (Comma Separated)
              </label>
              <Input
                placeholder="e.g. Residential, Flagship, Off-Plan"
                value={clientForm.tagString}
                onChange={(e) => setClientForm({ ...clientForm, tagString: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Internal Strategy & Brief Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Interested in luxury penthouse acquisition with phased escrow payments..."
              value={clientForm.notes}
              onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ED2618]"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNewClientModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingClient}
              className="bg-[#ED2618] hover:bg-[#d02013] text-white"
            >
              {isSubmittingClient ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                  Saving Client...
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-1.5" />
                  Register Client in CRM
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Log Interaction / Activity */}
      <Modal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        title={`Log Interaction: ${activityTargetClient?.name || ""}`}
        description="Record executive meetings, calls, memos and milestone agreements."
        maxWidth="md"
      >
        <form onSubmit={handleLogActivity} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Interaction Channel
              </label>
              <select
                aria-label="Interaction channel"
                value={activityForm.type}
                onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as any })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-xs text-slate-900 dark:text-white"
              >
                <option value="MEETING">Board / In-Person Meeting</option>
                <option value="CALL">Executive Phone Call</option>
                <option value="EMAIL">Contract / Formal Email</option>
                <option value="CONTRACT_MEMO">Legal / Contract Memo</option>
                <option value="MILESTONE">Development Milestone</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Summary Subject *
              </label>
              <Input
                required
                placeholder="e.g. Terms of Escrow Review"
                value={activityForm.title}
                onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Discussion Brief / Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Met with lead counsel to finalize clause 4 on delivery milestones..."
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ED2618]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Agreed Next Step / Outcome
            </label>
            <Input
              placeholder="e.g. Exchange countersigned deeds by Friday"
              value={activityForm.outcome}
              onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActivityModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingActivity}
              className="bg-[#ED2618] hover:bg-[#d02013] text-white"
            >
              {isSubmittingActivity ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                  Recording...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  Save Interaction
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Client Deep-Dive Profile & Deal Vault */}
      <Modal
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title={selectedClient?.name || "Client Dossier"}
        description={`${selectedClient?.company || "Strategic Client"} • ${selectedClient?.location || "Lagos, Nigeria"}`}
        maxWidth="xl"
      >
        {selectedClient && (
          <div className="space-y-6 pt-2">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08]">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Stage</span>
                <p className="text-xs font-bold text-[#ED2618] mt-0.5">
                  {selectedClient.stage.replace(/_/g, " ")}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Deal Value</span>
                <p className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatMoney(selectedClient.estimatedValue, selectedClient.currency)}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Email</span>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                  {selectedClient.email}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Phone</span>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                  {selectedClient.phone || "Not specified"}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {parseTags(selectedClient.tags).map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Notes */}
            {selectedClient.notes && (
              <div className="p-3.5 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 text-xs">
                <span className="font-semibold text-amber-800 dark:text-amber-400">Internal Strategy Note:</span>
                <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedClient.notes}
                </p>
              </div>
            )}

            {/* Associated Deals List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Associated Deals & Real Estate Contracts ({selectedClient.deals.length})
                </h4>
              </div>

              {selectedClient.deals.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
                  No individual deal records logged. Current portfolio value: {formatMoney(selectedClient.estimatedValue)}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedClient.deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-black/30 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {deal.title}
                        </span>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Stage: {deal.stage}</span>
                          <span>•</span>
                          <span>Probability: {deal.probability}%</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatMoney(deal.value, deal.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interaction History / Activity Feed */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Interaction Log & Timeline
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActivityTargetClient(selectedClient);
                    setActivityModalOpen(true);
                  }}
                  className="h-7 text-xs border-slate-200 dark:border-white/10"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Entry
                </Button>
              </div>

              {selectedClient.activities.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
                  No interactions recorded yet. Click &ldquo;Add Entry&rdquo; to log your first call or meeting.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedClient.activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.05] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-[#ED2618]" />
                          {act.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(act.activityDate)}
                        </span>
                      </div>
                      {act.description && (
                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                          {act.description}
                        </p>
                      )}
                      {act.outcome && (
                        <div className="pt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Outcome: {act.outcome}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedClient(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

