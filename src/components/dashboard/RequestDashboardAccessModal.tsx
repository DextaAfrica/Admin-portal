"use client";

import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Mail,
  Coins,
  Building2,
  FolderGit2,
  FileSpreadsheet,
  HardDrive,
  Users2,
  Lock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DigitalSignaturePad } from "@/components/ui/DigitalSignaturePad";

export interface DashboardModuleOption {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  sensitive?: boolean;
}

export const AVAILABLE_DASHBOARD_MODULES: DashboardModuleOption[] = [
  {
    id: "campaigns",
    name: "Email Campaigns & Marketing Studio",
    category: "Communications",
    description: "Design, compose, and dispatch executive email campaigns, investor announcements, and newsletters.",
    icon: Mail,
  },
  {
    id: "treasury",
    name: "Accounting & Sovereign Treasury Inflow",
    category: "Financial Control",
    description: "Inspect multi-currency reserves, concession disbursements, escrow ledgers, and cash flow forecasts.",
    icon: Coins,
    sensitive: true,
  },
  {
    id: "crm",
    name: "CRM Sovereign Deals & Client Portfolios",
    category: "Commercial Operations",
    description: "Manage institutional client pipelines, government concession negotiations, and commercial contracts.",
    icon: Building2,
  },
  {
    id: "projects",
    name: "Concessions & Infrastructure Projects",
    category: "Project Delivery",
    description: "Track engineering milestones, contractor performance, site inspections, and concession delivery.",
    icon: FolderGit2,
  },
  {
    id: "forms",
    name: "Intake Portals & Forms Studio",
    category: "Public Gateways",
    description: "Architect secure client intake portals, summit registrations, and NDPR-compliant onboarding workflows.",
    icon: FileSpreadsheet,
  },
  {
    id: "storage",
    name: "Document Storage & Asset Vault",
    category: "Data Assets",
    description: "Upload, categorize, and control confidential engineering briefs, concession deeds, and corporate filings.",
    icon: HardDrive,
  },
  {
    id: "hr",
    name: "Staff Directory & Workforce Management",
    category: "Human Resources",
    description: "Access employee directories, department rosters, executive profiles, and internal personnel records.",
    icon: Users2,
    sensitive: true,
  },
  {
    id: "approvals",
    name: "Two-Level Executive Approvals",
    category: "Governance",
    description: "Submit or clear two-tier production clearance workflows before content or forms go live to the public.",
    icon: Lock,
  },
];

interface RequestDashboardAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    fullName: string;
    email: string;
    department?: string | null;
    jobTitle?: string | null;
    assignedModules?: string | null;
  };
  onRequestSubmitted?: () => void;
}

export function RequestDashboardAccessModal({
  isOpen,
  onClose,
  currentUser,
  onRequestSubmitted,
}: RequestDashboardAccessModalProps) {
  // Parse currently assigned modules
  let activeModules: string[] = [];
  try {
    if (currentUser.assignedModules) {
      activeModules = JSON.parse(currentUser.assignedModules);
    }
  } catch {
    activeModules = ["operations", "approvals", "personal"];
  }

  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [justification, setJustification] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<"DRAWN" | "TYPED" | "UPLOADED">("DRAWN");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleModule = (modId: string) => {
    if (selectedModules.includes(modId)) {
      setSelectedModules(selectedModules.filter((m) => m !== modId));
    } else {
      setSelectedModules([...selectedModules, modId]);
    }
  };

  const handleSignatureCapture = (dataUrl: string, type: "DRAWN" | "TYPED" | "UPLOADED") => {
    setSignatureData(dataUrl);
    setSignatureType(type);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedModules.length === 0) {
      setErrorMessage("Please select at least one dashboard module or structure to request.");
      return;
    }

    if (!justification.trim() || justification.trim().length < 15) {
      setErrorMessage("Please enter a comprehensive business justification (minimum 15 characters).");
      return;
    }

    if (!signatureData) {
      setErrorMessage("Your digital signature is mandatory to authorize this IT request.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/it/dashboard-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedModules: selectedModules,
          justification: justification.trim(),
          signatureData,
          signatureType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setSuccessTicket(data.request?.ticketNumber || "DSH-2026-SUBMITTED");
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while submitting your request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSelectedModules([]);
    setJustification("");
    setSignatureData(null);
    setErrorMessage(null);
    setSuccessTicket(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0f1117]/95 px-6 py-4.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Request Tailored Dashboard Modules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                IT Department Governance & Verified Digital Signature Clearance
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {successTicket ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Request Successfully Submitted</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Ticket <span className="font-mono font-bold text-red-600 dark:text-red-400">#{successTicket}</span> has been dispatched to the IT Department for review.
              </p>
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your digital signature and justification have been cryptographically recorded. Once an IT Administrator authorizes your request, your dashboard will automatically refresh with your new modules.
            </p>
            <div className="pt-4">
              <Button onClick={resetAndClose} variant="primary">
                Done & Return to Workspace
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Requester Identity Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Requester: </span>
                <span className="font-bold">{currentUser.fullName}</span>{" "}
                <span className="text-slate-400">({currentUser.email})</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Department: </span>
                <span className="font-semibold">{currentUser.department || "General Operations"}</span>
                {currentUser.jobTitle && (
                  <span className="text-slate-400"> • {currentUser.jobTitle}</span>
                )}
              </div>
            </div>

            {/* Module Selection Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Select Requested Modules</h3>
                  <p className="text-xs text-slate-500">
                    Choose the specialized capabilities required for your organizational role.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {selectedModules.length} selected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_DASHBOARD_MODULES.map((mod) => {
                  const Icon = mod.icon;
                  const isCurrentlyActive = activeModules.includes(mod.id);
                  const isSelected = selectedModules.includes(mod.id);

                  return (
                    <div
                      key={mod.id}
                      onClick={() => !isCurrentlyActive && toggleModule(mod.id)}
                      className={`relative flex items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                        isCurrentlyActive
                          ? "border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10 cursor-not-allowed opacity-80"
                          : isSelected
                          ? "border-red-600 bg-red-50/50 dark:border-red-500/80 dark:bg-red-950/20 cursor-pointer shadow-xs"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#151720] hover:border-slate-300 dark:hover:border-white/20 cursor-pointer"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isCurrentlyActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : isSelected
                            ? "bg-red-600 text-white"
                            : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold truncate">{mod.name}</p>
                          {mod.sensitive && (
                            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              Sensitive
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                          {mod.description}
                        </p>
                        {isCurrentlyActive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            <CheckCircle2 className="h-3 w-3" /> Currently Active
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3.5 right-3.5">
                        <input
                          type="checkbox"
                          checked={isCurrentlyActive || isSelected}
                          disabled={isCurrentlyActive}
                          onChange={() => {}}
                          className="h-4 w-4 rounded accent-red-600 pointer-events-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Business Justification */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Business & Operational Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Detail why your role requires access to these modules (e.g., managing commercial concession dispatches, regional infrastructure budgets, or investor communications)..."
                className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#151720] p-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>

            {/* Digital Signature Pad */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Digital Signature Verification <span className="text-red-500">*</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Affix your legally binding digital signature to authorize this credential request.
                  </p>
                </div>
                {signatureData && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Signature Captured
                  </span>
                )}
              </div>

              <DigitalSignaturePad
                signerName={currentUser.fullName}
                onSignatureCapture={(sig) =>
                  handleSignatureCapture(sig.signatureDataUrl, sig.signatureType)
                }
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
              <Button type="button" variant="secondary" onClick={resetAndClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || selectedModules.length === 0 || !signatureData}
                leftIcon={<Send className="h-4 w-4" />}
              >
                {isSubmitting ? "Dispatching to IT..." : "Submit Signed Request to IT"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
