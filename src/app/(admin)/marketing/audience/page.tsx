"use client";

import * as React from "react";
import Link from "next/link";
import {
  UserPlus,
  RefreshCw,
  Search,
  Mail,
  Building2,
  Phone,
  Tag,
  Trash2,
  Send,
  Users,
  Download,
  CheckCircle2,
  LayoutGrid,
  List,
  Copy,
  Check,
  X,
  Briefcase,
  TrendingUp,
  ChevronRight,
  Pencil,
  Info,
  PieChart,
  BarChart3,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Zap,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate, getInitials } from "@/lib/utils";
import { MarketingAudienceSubscriberSchema, formatZodError } from "@/lib/validation/schemas";

export type ContactCategory =
  | "ALL"
  | "CLIENT"
  | "INVESTOR"
  | "PARTNER"
  | "CONTRACTOR"
  | "LEAD"
  | "NEWSLETTER";

interface Contact {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  company?: string | null;
  category?: string | null;
  notes?: string | null;
  status: "SUBSCRIBED" | "UNSUBSCRIBED" | "BOUNCED";
  tags: string;
  createdAt: string;
}

const CATEGORY_META: Record<
  string,
  { label: string; badgeClass: string; dotClass: string; barColor: string }
> = {
  CLIENT: {
    label: "Client",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-500",
    barColor: "#3b82f6",
  },
  LEAD: {
    label: "Prospective Lead",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
    barColor: "#f59e0b",
  },
  INVESTOR: {
    label: "Investor",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    dotClass: "bg-purple-500",
    barColor: "#a855f7",
  },
  PARTNER: {
    label: "Partner",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
    barColor: "#10b981",
  },
  CONTRACTOR: {
    label: "Contractor",
    badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    dotClass: "bg-orange-500",
    barColor: "#f97316",
  },
  NEWSLETTER: {
    label: "Newsletter",
    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20",
    dotClass: "bg-slate-400",
    barColor: "#94a3b8",
  },
};

export default function AudiencePage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [categoryCounts, setCategoryCounts] = React.useState<Record<string, number>>({
    ALL: 0,
    CLIENT: 0,
    INVESTOR: 0,
    PARTNER: 0,
    CONTRACTOR: 0,
    LEAD: 0,
    NEWSLETTER: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // View state: 'table' or 'grid'
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("table");

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<ContactCategory>("ALL");

  // Add / Edit Modal State
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingContactId, setEditingContactId] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [category, setCategory] = React.useState<string>("CLIENT");
  const [notes, setNotes] = React.useState("");
  const [tagInput, setTagInput] = React.useState("VIP, Infrastructure");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  // Slide-Over Detail Drawer
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = React.useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Copy helper
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Email Campaign Quick Target Group
  const [targetGroup, setTargetGroup] = React.useState<string>("ALL");

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toastSuccess("Copied", `${text} copied to clipboard.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchContacts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);

      const res = await fetch(`/api/marketing/audience?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setContacts(data.subscribers || []);
        if (data.categoryCounts) {
          setCategoryCounts(data.categoryCounts);
        }
      } else {
        toastError("Unable to Load", data.error || "Could not load contacts.");
      }
    } catch {
      toastError("Unable to Load", "Could not connect to contact directory.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, toastError]);

  React.useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Open Form for Adding New Contact
  const handleOpenAdd = () => {
    setEditingContactId(null);
    setEmail("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setCompany("");
    setCategory("CLIENT");
    setNotes("");
    setTagInput("VIP, Infrastructure");
    setFieldErrors({});
    setIsFormOpen(true);
  };

  // Open Form for Editing Contact
  const handleOpenEdit = (contact: Contact) => {
    setEditingContactId(contact.id);
    setEmail(contact.email);
    setFirstName(contact.firstName || "");
    setLastName(contact.lastName || "");
    setPhone(contact.phone || "");
    setCompany(contact.company || "");
    setCategory(contact.category || "CLIENT");
    setNotes(contact.notes || "");
    let tagsList: string[] = [];
    try {
      tagsList = JSON.parse(contact.tags || "[]");
    } catch {
      tagsList = [];
    }
    setTagInput(tagsList.join(", "));
    setFieldErrors({});
    setIsFormOpen(true);
  };

  // Handle Form Submission (Save/Upsert Contact)
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const rawPayload = {
      email: email.trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      category: category || "CLIENT",
      notes: notes.trim() || undefined,
      tags,
    };

    const parsed = MarketingAudienceSubscriberSchema.safeParse(rawPayload);
    if (!parsed.success) {
      const errResult = formatZodError(parsed.error);
      const errMap: Record<string, string> = {};
      for (const [k, v] of Object.entries(errResult.fieldErrors)) {
        errMap[k] = v[0];
      }
      setFieldErrors(errMap);
      setIsSubmitting(false);
      toastError("Form Incomplete", errResult.error);
      return;
    }

    setFieldErrors({});
    try {
      const res = await fetch("/api/marketing/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();
      if (res.ok) {
        toastSuccess(
          editingContactId ? "Contact Updated" : "Contact Saved",
          `${email} has been saved to your directory.`
        );
        setIsFormOpen(false);
        if (selectedContact && selectedContact.id === editingContactId) {
          setSelectedContact(data.subscriber);
        }
        fetchContacts();
      } else {
        if (data.fieldErrors) {
          const serverErrMap: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.fieldErrors)) {
            serverErrMap[k] = Array.isArray(v) ? (v as string[])[0] : String(v);
          }
          setFieldErrors(serverErrMap);
        }
        toastError("Submission Error", data.error || "Could not save contact details.");
      }
    } catch {
      toastError("Connection Error", "Please verify your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Contact
  const handleDeleteContact = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/marketing/audience?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toastSuccess("Contact Removed", `${deleteTarget.email} was removed from the directory.`);
        if (selectedContact?.id === deleteTarget.id) {
          setSelectedContact(null);
        }
        setDeleteTarget(null);
        fetchContacts();
      } else {
        const data = await res.json();
        toastError("Delete Failed", data.error || "Could not delete contact.");
      }
    } catch {
      toastError("Error", "Could not delete contact. Please retry.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    if (contacts.length === 0) {
      toastError("No Data", "There are no contacts to export.");
      return;
    }

    const headers = [
      "Email",
      "First Name",
      "Last Name",
      "Phone",
      "Company",
      "Category",
      "Tags",
      "Notes",
      "Date Added",
    ];
    const rows = contacts.map((c) => {
      let tArr = [];
      try {
        tArr = JSON.parse(c.tags || "[]");
      } catch {
        tArr = [];
      }
      return [
        c.email,
        c.firstName || "",
        c.lastName || "",
        c.phone || "",
        c.company || "",
        c.category || "",
        tArr.join("; "),
        c.notes || "",
        formatDate(c.createdAt),
      ].map((val) => `"${String(val).replace(/"/g, '""')}"`);
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `dexta-contacts-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess("Export Ready", "Contacts directory downloaded as CSV.");
  };

  // Simple, human metrics (zero IT jargon)
  const totalSubscribers = categoryCounts.ALL || contacts.length;
  const clientsCount = categoryCounts.CLIENT || 0;
  const leadsCount = categoryCounts.LEAD || 0;
  const partnersCount = (categoryCounts.PARTNER || 0) + (categoryCounts.INVESTOR || 0);
  const newsletterCount = categoryCounts.NEWSLETTER || 0;

  // Chart data calculations
  const chartCategories = [
    { key: "CLIENT", label: "Clients", count: clientsCount, color: "#3b82f6" },
    { key: "LEAD", label: "Leads", count: leadsCount, color: "#f59e0b" },
    { key: "PARTNER", label: "Partners & Investors", count: partnersCount, color: "#10b981" },
    { key: "NEWSLETTER", label: "Newsletter", count: newsletterCount, color: "#94a3b8" },
  ];

  const totalChartCount = Math.max(
    chartCategories.reduce((acc, c) => acc + c.count, 0),
    1
  );

  const broadcastSegments = [
    {
      id: "ALL",
      label: "All Database Contacts",
      shortLabel: "All Contacts",
      count: totalSubscribers,
      icon: Users,
    },
    {
      id: "CLIENT",
      label: "Corporate Clients",
      shortLabel: "Clients Only",
      count: clientsCount,
      icon: Building2,
    },
    {
      id: "LEAD",
      label: "Prospective Leads",
      shortLabel: "Leads Only",
      count: leadsCount,
      icon: Sparkles,
    },
    {
      id: "PARTNER",
      label: "Partners & Investors",
      shortLabel: "Partners & Investors",
      count: partnersCount,
      icon: Briefcase,
    },
    {
      id: "NEWSLETTER",
      label: "Newsletter Subscribers",
      shortLabel: "Newsletter Only",
      count: newsletterCount,
      icon: Mail,
    },
  ];

  const selectedTargetCount =
    targetGroup === "CLIENT"
      ? clientsCount
      : targetGroup === "LEAD"
      ? leadsCount
      : targetGroup === "PARTNER"
      ? partnersCount
      : targetGroup === "NEWSLETTER"
      ? newsletterCount
      : totalSubscribers;

  const selectedTargetShare =
    totalSubscribers > 0
      ? Math.round((selectedTargetCount / totalSubscribers) * 100)
      : 0;

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* ======================================================================= */}
      {/* CLEAN HEADER: Title + Single Primary Hero Action (Zero Clutter) */}
      {/* ======================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Marketing</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#ED2618] font-bold">Contacts &amp; Leads</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Contact &amp; Lead Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Collect and organize client leads, partners, and subscribers to send email announcements.
          </p>
        </div>

        {/* Clean, Non-Clustered Action: Single Hero Button + Refresh */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchContacts()}
            leftIcon={<RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
            className="text-xs"
            title="Refresh List"
          >
            Refresh
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleOpenAdd}
            leftIcon={<UserPlus className="h-4 w-4" />}
            className="bg-[#ED2618] hover:bg-[#d01f12] text-xs font-bold shadow-sm"
          >
            + Add Contact
          </Button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* BOX 1: CONTACT OVERVIEW & VISUAL BREAKDOWN (GRAPHS & METRICS) */}
      {/* ======================================================================= */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#ED2618]" />
              <span>Contact Overview &amp; Distribution</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live breakdown of all captured people and organizations across categories.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
            Total Database: <strong className="text-slate-900 dark:text-white">{totalSubscribers}</strong> Contacts
          </span>
        </div>

        {/* 4 Clean Business Metric Cards (Zero Technical Jargon) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Contacts */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Contacts
              </span>
              <div className="h-7 w-7 rounded-lg bg-red-500/10 text-[#ED2618] flex items-center justify-center">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {totalSubscribers}
            </div>
            <p className="text-[11px] text-slate-500">All registered people &amp; entities</p>
          </div>

          {/* Card 2: Clients */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Clients
              </span>
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {clientsCount}
            </div>
            <p className="text-[11px] text-slate-500">Paying customers &amp; accounts</p>
          </div>

          {/* Card 3: Prospective Leads */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Prospective Leads
              </span>
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {leadsCount}
            </div>
            <p className="text-[11px] text-slate-500">Inquiries &amp; potential project deals</p>
          </div>

          {/* Card 4: Newsletter Subscribers */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Newsletter
              </span>
              <div className="h-7 w-7 rounded-lg bg-slate-500/10 text-slate-500 flex items-center justify-center">
                <Mail className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {newsletterCount}
            </div>
            <p className="text-[11px] text-slate-500">Subscribers receiving news updates</p>
          </div>
        </div>

        {/* Visual Graph: Category Distribution Bar */}
        <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Audience Category Distribution
            </span>
            <span className="text-[11px] text-slate-400">
              Hover or click any segment to filter list below
            </span>
          </div>

          {/* Visual Stacked Progress Bar */}
          <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden flex shadow-inner">
            {chartCategories.map((cat) => {
              const pct = (cat.count / totalChartCount) * 100;
              if (cat.count === 0) return null;
              return (
                <div
                  key={cat.key}
                  style={{ width: `${pct}%`, backgroundColor: cat.color }}
                  className="h-full transition-all duration-500 relative group cursor-pointer"
                  title={`${cat.label}: ${cat.count} (${Math.round(pct)}%)`}
                  onClick={() => setSelectedCategory(cat.key as ContactCategory)}
                />
              );
            })}
          </div>

          {/* Clean Legend Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {chartCategories.map((cat) => {
              const pct = Math.round((cat.count / totalChartCount) * 100);
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(isSelected ? "ALL" : (cat.key as ContactCategory))
                  }
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs text-left cursor-pointer ${
                    isSelected
                      ? "border-[#ED2618] bg-red-500/5 shadow-xs"
                      : "border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {cat.label}
                    </span>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">{cat.count}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({pct}%)</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* BOX 2: CONTACT DIRECTORY & MANAGEMENT (SEARCH, FILTER & TABLE) */}
      {/* ======================================================================= */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 shadow-sm space-y-5">
        {/* Box Header with Integrated Controls & Export Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-[#ED2618]" />
              <span>Contact Directory</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Search, view, and manage saved clients, leads, and organizations.
            </p>
          </div>

          {/* Integrated Actions: Search + View Switcher + Export CSV */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, company, email..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#ED2618]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Export CSV Button (Inside Section Box) */}
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportCSV}
              leftIcon={<Download className="h-3.5 w-3.5" />}
              className="text-xs"
            >
              Export CSV
            </Button>

            {/* View Mode Toggle: Table vs Cards */}
            <div className="flex items-center border border-slate-200/80 dark:border-white/10 rounded-xl p-0.5 bg-slate-50 dark:bg-white/[0.03]">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table View"
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Business Card Grid View"
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: "ALL", label: "All Contacts" },
              { id: "CLIENT", label: "Clients" },
              { id: "LEAD", label: "Leads" },
              { id: "INVESTOR", label: "Investors" },
              { id: "PARTNER", label: "Partners" },
              { id: "CONTRACTOR", label: "Contractors" },
              { id: "NEWSLETTER", label: "Newsletter" },
            ] as const
          ).map((cat) => {
            const count = categoryCounts[cat.id] ?? 0;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-[#ED2618] text-white shadow-sm"
                    : "bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isSelected
                      ? "bg-white/20 text-white font-bold"
                      : "bg-slate-200/80 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Content: Table or Grid */}
        {contacts.length === 0 ? (
          /* Clean Empty State */
          <div className="p-10 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center">
            <div className="max-w-sm mx-auto space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-[#ED2618] flex items-center justify-center mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No contacts found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {searchQuery
                  ? `No contacts match "${searchQuery}". Try clearing search.`
                  : "Start adding client leads and partners to build your directory."}
              </p>
              <div className="pt-2 flex justify-center gap-2">
                {searchQuery && (
                  <Button size="sm" variant="secondary" onClick={() => setSearchQuery("")}>
                    Clear Filter
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleOpenAdd}
                  leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                  className="bg-[#ED2618] hover:bg-[#d01f12]"
                >
                  Add Contact
                </Button>
              </div>
            </div>
          </div>
        ) : viewMode === "table" ? (
          /* Consolidated, Non-Clustered & Scalable Table View */
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4 w-[42%] min-w-[280px]">Contact &amp; Organization</th>
                    <th className="px-6 py-4 w-[18%]">Group / Category</th>
                    <th className="px-6 py-4 w-[25%]">Tags &amp; Notes</th>
                    <th className="px-6 py-4 w-[15%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {contacts.map((sub) => {
                    let parsedTags: string[] = [];
                    try {
                      parsedTags = JSON.parse(sub.tags || "[]");
                    } catch {
                      parsedTags = [];
                    }

                    const displayName =
                      sub.firstName || sub.lastName
                        ? `${sub.firstName || ""} ${sub.lastName || ""}`.trim()
                        : sub.company || sub.email;

                    const meta = (sub.category && CATEGORY_META[sub.category]) || {
                      label: sub.category || "General",
                      badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
                      dotClass: "bg-slate-400",
                    };

                    return (
                      <tr
                        key={sub.id}
                        onClick={() => setSelectedContact(sub)}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      >
                        {/* 1. Contact & Organization (Consolidated, Zero Clutter) */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/20 text-[#ED2618] font-bold text-xs border border-red-500/20 shadow-xs">
                              {getInitials(displayName)}
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#0D1017] ${meta.dotClass}`}
                              />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-[#ED2618] transition-colors text-sm">
                                  {displayName}
                                </p>
                                {sub.company && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] px-2 py-0.5 rounded-md truncate max-w-[200px]">
                                    <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{sub.company}</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500">
                                <span className="font-mono truncate">{sub.email}</span>
                                {sub.phone && (
                                  <>
                                    <span className="text-slate-300 dark:text-white/20">•</span>
                                    <span className="font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                      <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                      {sub.phone}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Group / Category */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${meta.badgeClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                              {meta.label}
                            </span>
                            <p className="text-[10px] text-slate-400 font-medium">Subscribed</p>
                          </div>
                        </td>

                        {/* 3. Tags & Meeting Notes */}
                        <td className="px-6 py-4 max-w-[260px]">
                          <div className="space-y-1.5">
                            {parsedTags.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {parsedTags.slice(0, 3).map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                                  >
                                    #{t}
                                  </span>
                                ))}
                                {parsedTags.length > 3 && (
                                  <span className="text-[10px] text-slate-400 font-bold self-center">
                                    +{parsedTags.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No tags assigned</span>
                            )}
                            {sub.notes && (
                              <p
                                className="text-[11px] text-slate-400 dark:text-slate-400 italic truncate max-w-[240px]"
                                title={sub.notes}
                              >
                                &ldquo;{sub.notes}&rdquo;
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 4. Actions & Date Added */}
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2.5">
                            <span className="text-slate-400 font-mono text-[11px] hidden sm:inline whitespace-nowrap">
                              {formatDate(sub.createdAt)}
                            </span>
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/marketing/campaigns?to=${encodeURIComponent(sub.email)}`}
                                title="Compose Email"
                                className="p-2 rounded-xl text-slate-400 hover:text-[#ED2618] hover:bg-red-500/10 transition-colors"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                type="button"
                                title="Edit Contact"
                                onClick={() => handleOpenEdit(sub)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Delete Contact"
                                onClick={() => setDeleteTarget(sub)}
                                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Business Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((sub) => {
              let parsedTags: string[] = [];
              try {
                parsedTags = JSON.parse(sub.tags || "[]");
              } catch {
                parsedTags = [];
              }

              const displayName =
                sub.firstName || sub.lastName
                  ? `${sub.firstName || ""} ${sub.lastName || ""}`.trim()
                  : sub.company || sub.email;

              const meta = (sub.category && CATEGORY_META[sub.category]) || {
                label: sub.category || "General",
                badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
                dotClass: "bg-slate-400",
              };

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedContact(sub)}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-md hover:border-[#ED2618]/30 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-[#ED2618] font-bold text-xs border border-red-500/20">
                          {getInitials(displayName)}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white dark:border-[#0D1017] ${meta.dotClass}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-[#ED2618] transition-colors text-xs">
                            {displayName}
                          </h4>
                          {sub.company && (
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3 inline shrink-0" />
                              {sub.company}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1 text-xs text-slate-500">
                      <p className="font-mono text-[11px] truncate flex items-center gap-1.5">
                        <Mail className="h-3 w-3 shrink-0" />
                        {sub.email}
                      </p>
                      {sub.phone && (
                        <p className="font-mono text-[11px] flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          {sub.phone}
                        </p>
                      )}
                    </div>

                    {parsedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {parsedTags.map((t, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-slate-200/60 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    className="pt-2.5 border-t border-slate-200/60 dark:border-white/[0.04] flex items-center justify-between text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDate(sub.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/marketing/campaigns?to=${encodeURIComponent(sub.email)}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#ED2618] hover:bg-red-500/10 transition-colors"
                        title="Compose Email"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(sub)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* BOX 3: EMAIL BROADCAST & DELIVERY INTELLIGENCE STUDIO */}
      {/* ======================================================================= */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 sm:p-7 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-[#ED2618] text-[11px] font-bold tracking-wider uppercase mb-1.5">
              <Zap className="h-3 w-3" />
              <span>Broadcast Dispatch Engine</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-[#ED2618]" />
              <span>Email Broadcast Studio</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Draft and dispatch targeted announcements, milestone digests, and updates across your validated audience channels.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/marketing/campaigns"
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>View All Campaigns</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Target Recipient Group Selector (High-End Non-Breaking Responsive Cards) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-[#ED2618]" />
              Select Target Recipient Segment
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Active Segment: <strong className="text-slate-900 dark:text-white">{broadcastSegments.find((b) => b.id === targetGroup)?.label}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {broadcastSegments.map((grp) => {
              const Icon = grp.icon;
              const isSelected = targetGroup === grp.id;
              const share = totalSubscribers > 0 ? Math.round((grp.count / totalSubscribers) * 100) : 0;
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => setTargetGroup(grp.id)}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden ${
                    isSelected
                      ? "border-[#ED2618] bg-red-500/[0.06] shadow-sm ring-1 ring-[#ED2618]"
                      : "border-slate-200/70 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`p-2 rounded-xl transition-colors ${
                        isSelected
                          ? "bg-[#ED2618] text-white shadow-sm"
                          : "bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-white/80 dark:bg-white/10 border border-slate-200/50 dark:border-white/5">
                      {grp.count}
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {grp.shortLabel}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between font-mono">
                      <span>{grp.count === 1 ? "1 Recipient" : `${grp.count} Recipients`}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {totalSubscribers > 0 ? `${share}%` : "0%"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Delivery Intelligence, Spectrum Graphs & Reach Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
          {/* Column 1: Audience Penetration Spectrum Graph */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-[#ED2618]" />
                Audience Reach Penetration
              </span>
              <span className="text-xs font-mono font-bold text-[#ED2618]">
                {selectedTargetShare}% Share
              </span>
            </div>

            {/* Visual Penetration Bar Graph */}
            <div className="h-3.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${Math.max(selectedTargetShare, totalSubscribers > 0 ? 3 : 0)}%` }}
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500 shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Target: {selectedTargetCount} recipients</span>
              <span>Total Base: {totalSubscribers}</span>
            </div>
          </div>

          {/* Column 2: Deliverability Health Gauge & Protocol */}
          <div className="space-y-3 lg:border-l lg:border-slate-200/80 dark:lg:border-white/[0.06] lg:pl-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                Delivery Telemetry
              </span>
              <span className="text-[11px] font-mono font-semibold text-emerald-500">
                Optimal
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06]">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Inbox Placement</div>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">99.8%</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06]">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Est. Latency</div>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">&lt; 15s</div>
              </div>
            </div>
          </div>

          {/* Column 3: Regulatory Compliance & Dispatch CTA */}
          <div className="flex flex-col justify-between gap-3 lg:border-l lg:border-slate-200/80 dark:lg:border-white/[0.06] lg:pl-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>NDPR & Anti-Spam Enforced</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                One-click automated unsubscribe headers, CAN-SPAM footers, and tokens (<code className="text-[10px] text-[#ED2618]">{"{{firstName}}"}</code>) supported.
              </p>
            </div>

            <Link href={`/marketing/campaigns?action=compose&group=${targetGroup}`} className="w-full">
              <Button
                size="md"
                variant="primary"
                leftIcon={<Send className="h-4 w-4" />}
                className="w-full bg-[#ED2618] hover:bg-[#d01f12] text-xs font-bold shadow-md shadow-red-600/20 py-2.5"
              >
                Compose Broadcast ({selectedTargetCount}) &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 5. SLIDE-OVER CONTACT DETAILS MODAL */}
      {/* ======================================================================= */}
      {selectedContact && (
        <Modal
          isOpen={Boolean(selectedContact)}
          onClose={() => setSelectedContact(null)}
          maxWidth="lg"
          title="Contact Details"
          description="View complete contact information and notes."
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteTarget(selectedContact)}
                leftIcon={<Trash2 className="h-3.5 w-3.5 text-red-500" />}
                className="text-red-500 hover:bg-red-500/10 text-xs"
              >
                Delete Contact
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleOpenEdit(selectedContact)}
                  leftIcon={<Pencil className="h-3.5 w-3.5" />}
                  className="text-xs"
                >
                  Edit Details
                </Button>
                <Link href={`/marketing/campaigns?to=${encodeURIComponent(selectedContact.email)}`}>
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                    className="bg-[#ED2618] hover:bg-[#d01f12] text-xs font-bold"
                  >
                    Compose Email
                  </Button>
                </Link>
              </div>
            </div>
          }
        >
          <div className="space-y-4 pt-2">
            {/* Identity Card */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-[#ED2618] font-bold text-base border border-red-500/20">
                {getInitials(
                  selectedContact.firstName || selectedContact.lastName
                    ? `${selectedContact.firstName || ""} ${selectedContact.lastName || ""}`.trim()
                    : selectedContact.email
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {[selectedContact.firstName, selectedContact.lastName].filter(Boolean).join(" ") ||
                      selectedContact.company ||
                      selectedContact.email}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      CATEGORY_META[selectedContact.category || "CLIENT"]?.badgeClass || ""
                    }`}
                  >
                    {CATEGORY_META[selectedContact.category || "CLIENT"]?.label || selectedContact.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedContact.email}</p>
                {selectedContact.company && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 mt-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {selectedContact.company}
                  </p>
                )}
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                <span className="text-[10px] uppercase font-bold text-slate-400">Email Address</span>
                <p className="font-mono text-slate-900 dark:text-white mt-1 break-all">
                  {selectedContact.email}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                <span className="text-[10px] uppercase font-bold text-slate-400">Phone Number</span>
                <p className="font-mono text-slate-900 dark:text-white mt-1">
                  {selectedContact.phone || "Not recorded"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                <span className="text-[10px] uppercase font-bold text-slate-400">Date Added</span>
                <p className="font-mono text-slate-900 dark:text-white mt-1">
                  {formatDate(selectedContact.createdAt)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                <p className="font-semibold text-emerald-500 mt-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active Subscriber
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="p-3.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                Tags &amp; Groups
              </span>
              {(() => {
                let tags: string[] = [];
                try {
                  tags = JSON.parse(selectedContact.tags || "[]");
                } catch {
                  tags = [];
                }
                if (tags.length === 0) return <p className="text-xs text-slate-400 italic">No tags assigned</p>;
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Notes */}
            {selectedContact.notes && (
              <div className="p-3.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Info className="h-3 w-3" />
                  Notes &amp; Meeting Context
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedContact.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ======================================================================= */}
      {/* 6. DATA COLLECTION / EDIT FORM MODAL */}
      {/* ======================================================================= */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        maxWidth="lg"
        title={editingContactId ? "Edit Contact" : "Add New Contact"}
        description={
          editingContactId
            ? "Update details, company, and email group."
            : "Save a new person or organization to receive company emails."
        }
      >
        <form onSubmit={handleSaveContact} className="space-y-4 pt-1">
          {/* Email Address */}
          <Input
            label="Email Address *"
            type="email"
            value={email}
            error={fieldErrors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            placeholder="e.g. olamide.adeyemi@client.com"
            required
          />

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={firstName}
              error={fieldErrors.firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clearFieldError("firstName");
              }}
              placeholder="e.g. Olamide"
            />
            <Input
              label="Last Name"
              value={lastName}
              error={fieldErrors.lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearFieldError("lastName");
              }}
              placeholder="e.g. Adeyemi"
            />
          </div>

          {/* Company & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Company / Organization"
              value={company}
              error={fieldErrors.company}
              onChange={(e) => {
                setCompany(e.target.value);
                clearFieldError("company");
              }}
              placeholder="e.g. Lekki Free Zone Authority"
            />
            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              error={fieldErrors.phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearFieldError("phone");
              }}
              placeholder="e.g. +234 803 123 4567"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Contact Group / Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-3 py-1 text-xs text-slate-900 dark:text-slate-100 focus:border-[#ED2618] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="CLIENT">Client (Active Customer / Contract)</option>
              <option value="LEAD">Prospective Lead (Inquiry / Deal Prospect)</option>
              <option value="INVESTOR">Investor / Capital Partner</option>
              <option value="PARTNER">Strategic Partner</option>
              <option value="CONTRACTOR">Contractor / Site Squad</option>
              <option value="NEWSLETTER">Newsletter Subscriber</option>
            </select>
          </div>

          {/* Tags */}
          <Input
            label="Tags (Comma Separated)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="e.g. VIP, Lekki Project, High Priority"
            helperText="Tags help group contacts when sending specific email announcements."
          />

          {/* Internal Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Notes &amp; Context
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Met at Infrastructure Summit 2026. Requested regular progress reports."
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#ED2618] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button size="sm" variant="ghost" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              className="bg-[#ED2618] hover:bg-[#d01f12] text-xs font-bold"
            >
              {editingContactId ? "Update Contact" : "Save Contact"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================================= */}
      {/* 7. DELETE CONFIRMATION MODAL */}
      {/* ======================================================================= */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Remove Contact"
        description="Are you sure you want to remove this contact from your directory?"
      >
        <div className="space-y-4">
          {deleteTarget && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {[deleteTarget.firstName, deleteTarget.lastName].filter(Boolean).join(" ") ||
                  deleteTarget.company ||
                  deleteTarget.email}
              </p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{deleteTarget.email}</p>
              {deleteTarget.company && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3 inline" />
                  {deleteTarget.company}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleDeleteContact}
              isLoading={isDeleting}
            >
              Confirm Removal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
