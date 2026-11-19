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
  ExternalLink,
  Send,
  Users,
  Download,
  CheckCircle2,
  Filter,
  Sparkles,
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

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  CLIENT: { label: "Client", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  INVESTOR: { label: "Investor", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  PARTNER: { label: "Partner", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  CONTRACTOR: { label: "Contractor", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  LEAD: { label: "Prospective Lead", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  NEWSLETTER: { label: "Newsletter Subscriber", color: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20" },
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

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<ContactCategory>("ALL");

  // Add / Edit Modal
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [category, setCategory] = React.useState<string>("CLIENT");
  const [notes, setNotes] = React.useState("");
  const [tagInput, setTagInput] = React.useState("VIP, Infrastructure");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  // Delete State
  const [deleteTarget, setDeleteTarget] = React.useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
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
        toastSuccess("Contact Captured", `${email} has been saved to your audience directory.`);
        setIsAddOpen(false);
        // Reset form
        setEmail("");
        setFirstName("");
        setLastName("");
        setPhone("");
        setCompany("");
        setCategory("CLIENT");
        setNotes("");
        setTagInput("VIP, Infrastructure");
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
        toastSuccess("Contact Removed", `${deleteTarget.email} was removed from audience directory.`);
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

    const headers = ["Email", "First Name", "Last Name", "Phone", "Company", "Category", "Tags", "Date Added"];
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

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Top Header & Core Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Contact &amp; Lead Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-[#ED2618] text-xs font-bold font-mono">
              {contacts.length} Contacts
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Collect and organize client leads, partners, investors, and stakeholders to receive targeted email campaigns and announcements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchContacts()}
            leftIcon={<RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
          >
            Refresh
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCSV}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export CSV
          </Button>

          <Link href="/marketing/campaigns">
            <Button size="sm" variant="secondary" leftIcon={<Send className="h-3.5 w-3.5" />}>
              Create Campaign
            </Button>
          </Link>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddOpen(true)}
            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
          >
            Collect New Contact
          </Button>
        </div>
      </div>

      {/* Category Filter Pills & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
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
                    : "bg-white dark:bg-[#121318] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:border-[#ED2618]/40"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#ED2618]"
          />
        </div>
      </div>

      {/* Contacts Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Contact Name &amp; Email</th>
                <th className="px-5 py-3.5">Company / Org</th>
                <th className="px-5 py-3.5">Phone Number</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Tags &amp; Notes</th>
                <th className="px-5 py-3.5">Date Added</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
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
                          : "Start collecting customer, partner, and investor emails to power your campaigns."}
                      </p>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setIsAddOpen(true)}
                        leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                      >
                        Collect First Contact
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((sub) => {
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

                  const catMeta = (sub.category && CATEGORY_LABELS[sub.category]) || {
                    label: sub.category || "General",
                    color: "bg-slate-500/10 text-slate-500 border-slate-500/20",
                  };

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      {/* Name & Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-[#ED2618] font-bold text-xs">
                            {getInitials(displayName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {displayName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                              <Mail className="h-3 w-3 inline text-slate-400" />
                              {sub.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-5 py-4">
                        {sub.company ? (
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{sub.company}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4">
                        {sub.phone ? (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{sub.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catMeta.color}`}
                        >
                          {catMeta.label}
                        </span>
                      </td>

                      {/* Tags & Notes */}
                      <td className="px-5 py-4 max-w-[200px]">
                        <div className="space-y-1">
                          {parsedTags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {parsedTags.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-md bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                          {sub.notes && (
                            <p className="text-[11px] text-slate-400 truncate" title={sub.notes}>
                              {sub.notes}
                            </p>
                          )}
                          {parsedTags.length === 0 && !sub.notes && (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Date Joined */}
                      <td className="px-5 py-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(sub.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/marketing/campaigns?to=${encodeURIComponent(sub.email)}`}
                            title="Compose Email to Contact"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#ED2618] hover:bg-red-500/10 transition-colors"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            title="Delete Contact"
                            onClick={() => setDeleteTarget(sub)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Collection Form Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Collect Contact & Lead Data"
        description="Save contact information to build your recipient database for future announcements, milestone reports, and targeted campaigns."
      >
        <form onSubmit={handleSaveContact} className="space-y-4">
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
            placeholder="e.g. olamide.adeyemi@infrastructure.ng"
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
              Contact Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-3 py-1 text-sm text-slate-900 dark:text-slate-100 focus:border-[#ED2618] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="CLIENT">Client (Active or Institutional)</option>
              <option value="LEAD">Prospective Lead / Deal Prospect</option>
              <option value="INVESTOR">Investor / Capital Partner</option>
              <option value="PARTNER">Strategic Partner</option>
              <option value="CONTRACTOR">Contractor / Engineering Squad</option>
              <option value="NEWSLETTER">General Newsletter Subscriber</option>
            </select>
          </div>

          {/* Tags */}
          <Input
            label="Tags & Project Corridors (Comma Separated)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="e.g. Lekki Project, High Priority, VIP"
            helperText="Tags allow grouping recipients when composing targeted email campaigns."
          />

          {/* Internal Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Internal Notes / Context
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Met at West Africa Infrastructure Summit. Interested in upcoming highway concession reports."
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#ED2618] focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button size="sm" variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" isLoading={isSubmitting}>
              Save Contact
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Remove Contact"
        description="Are you sure you want to remove this contact from your audience database?"
      >
        <div className="space-y-4">
          {deleteTarget && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {[deleteTarget.firstName, deleteTarget.lastName].filter(Boolean).join(" ") || deleteTarget.email}
              </p>
              <p className="text-xs text-slate-500">{deleteTarget.email}</p>
              {deleteTarget.company && (
                <p className="text-xs text-slate-400 mt-1">{deleteTarget.company}</p>
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
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
