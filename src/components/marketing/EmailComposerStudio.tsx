"use client";

import * as React from "react";
import {
  Cake,
  Newspaper,
  CalendarHeart,
  Building2,
  Sparkles,
  ImagePlus,
  Send,
  Save,
  User,
  CheckCircle2,
  Paperclip,
  Trash2,
  Eye,
  FileText,
  Info,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export type EmailOccasionId =
  | "birthday"
  | "invitation"
  | "newsletter"
  | "project_update"
  | "seasonal";

export interface EmailStudioState {
  occasion: EmailOccasionId;
  title: string;
  subject: string;
  categoryBadge: string;
  headline: string;
  salutation: string;
  bodyText: string;
  highlightTitle: string;
  highlightDetails: string;
  ctaLabel: string;
  ctaUrl: string;
  heroImageUrl: string;
  attachmentImageUrl: string;
  attachmentCaption: string;
  accentColor: string;
  showBrandHeader: boolean;
  signOffName: string;
  signOffRole: string;
}

export interface EmailPresetDefinition {
  id: EmailOccasionId;
  label: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  defaults: Omit<EmailStudioState, "occasion">;
}

export const EMAIL_OCCASION_PRESETS: EmailPresetDefinition[] = [
  {
    id: "birthday",
    label: "Birthday Celebration",
    tagline: "Warm, personalized birthday wishes for clients & team members",
    icon: Cake,
    defaults: {
      title: "Client & Partner Birthday Wishes",
      subject: "Happy Birthday from the Dexta Africa Family! 🎉",
      categoryBadge: "BIRTHDAY CELEBRATION",
      headline: "Celebrating You Today & Always",
      salutation: "Dear {{firstName}},",
      bodyText:
        "On behalf of everyone at Dexta Africa, we wish you a truly wonderful birthday filled with joy, good health, and remarkable achievements.\n\nThank you for your continued trust and partnership with us. We are honored to walk alongside you and look forward to celebrating many more milestones together in the year ahead.",
      highlightTitle: "A Special Birthday Wish from Our Team",
      highlightDetails:
        "May this new year bring you inspiring opportunities, lasting peace, and continued success in every endeavor.",
      ctaLabel: "View Your Birthday Card",
      ctaUrl: "https://dextaafrica.com",
      heroImageUrl: "/images/team-dexta.jpg",
      attachmentImageUrl: "",
      attachmentCaption: "",
      accentColor: "#DC2626",
      showBrandHeader: true,
      signOffName: "The Dexta Africa Executive Team",
      signOffRole: "Client Relations & Operations",
    },
  },
  {
    id: "invitation",
    label: "Special Invitation",
    tagline: "Event flyers, client forums, open houses & executive gatherings",
    icon: CalendarHeart,
    defaults: {
      title: "Executive Client Forum Invitation",
      subject: "Special Invitation: Dexta Africa Annual Partners Showcase",
      categoryBadge: "SPECIAL INVITATION",
      headline: "Building Lasting Partnerships Across Africa",
      salutation: "Dear {{firstName}},",
      bodyText:
        "We are delighted to invite you to our upcoming Dexta Africa Partners & Client Experience Showcase. Join our leadership team for an inspiring session dedicated to upcoming developments, architecture insights, and strategic opportunities.\n\nYour presence means a great deal to us, and we have reserved a special seat for you.",
      highlightTitle: "Event Schedule & Venue Details",
      highlightDetails:
        "Date: Saturday, November 14, 2026 • Time: 10:00 AM WAT\nVenue: Dexta Africa Executive Gallery, Victoria Island, Lagos (Live Stream Available)",
      ctaLabel: "Confirm Your Attendance",
      ctaUrl: "https://dextaafrica.com/events",
      heroImageUrl: "/images/sadia-dexta.png",
      attachmentImageUrl: "",
      attachmentCaption: "",
      accentColor: "#B45309",
      showBrandHeader: true,
      signOffName: "Sadia & The Client Experience Team",
      signOffRole: "Dexta Africa Communications",
    },
  },
  {
    id: "newsletter",
    label: "Monthly Newsletter",
    tagline: "Company highlights, stories, and monthly community digests",
    icon: Newspaper,
    defaults: {
      title: "Monthly Executive Newsletter",
      subject: "Dexta Africa Digest: Milestones, Stories & New Horizons",
      categoryBadge: "MONTHLY NEWSLETTER",
      headline: "Delivering Excellence Across Every Milestone",
      salutation: "Dear {{firstName}},",
      bodyText:
        "Welcome to this month's edition of the Dexta Africa Newsletter. Over the past four weeks, our teams have reached exciting new construction and client service milestones across our portfolio.\n\nFrom expanding our on-site engineering capabilities to welcoming new partners into the Dexta community, every step reflects our commitment to enduring quality and transparent service.",
      highlightTitle: "This Month's Key Highlight",
      highlightDetails:
        "100% on-schedule delivery across active development sites and expanded dedicated client support hours.",
      ctaLabel: "Read Full Monthly Report",
      ctaUrl: "https://dextaafrica.com/news",
      heroImageUrl: "/images/olufemi-dexta.png",
      attachmentImageUrl: "",
      attachmentCaption: "",
      accentColor: "#DC2626",
      showBrandHeader: true,
      signOffName: "Olufemi & Leadership Team",
      signOffRole: "Dexta Africa",
    },
  },
  {
    id: "project_update",
    label: "Project & Site Update",
    tagline: "Construction progress reports, inspections, and handover notices",
    icon: Building2,
    defaults: {
      title: "Quarterly Project Progress Update",
      subject: "Project Milestone Update: Engineering & Site Progress",
      categoryBadge: "PROJECT UPDATE",
      headline: "Precision Engineering & Transparent Progress",
      salutation: "Dear {{firstName}},",
      bodyText:
        "We are pleased to share the latest progress update on our ongoing developments. Our field engineers and quality assurance specialists have completed the scheduled structural and finishing inspections for this phase.\n\nBelow is a summary of our current status and the upcoming schedule for the next stage of work.",
      highlightTitle: "Current Phase Summary",
      highlightDetails:
        "Structural Verification: Completed • Quality Assurance: Passed • Next Milestone: Exterior Finishing & Landscaping",
      ctaLabel: "View Project Gallery",
      ctaUrl: "https://dextaafrica.com/projects",
      heroImageUrl: "/images/olufemi-dexta.png",
      attachmentImageUrl: "",
      attachmentCaption: "",
      accentColor: "#0F172A",
      showBrandHeader: true,
      signOffName: "Engineering & Project Delivery",
      signOffRole: "Dexta Africa",
    },
  },
  {
    id: "seasonal",
    label: "Seasonal & Appreciation",
    tagline: "Holiday greetings, client appreciation, and milestone thank-yous",
    icon: Sparkles,
    defaults: {
      title: "Client Appreciation Broadcast",
      subject: "Thank You for Being Part of the Dexta Africa Story",
      categoryBadge: "CLIENT APPRECIATION",
      headline: "Putting People & Partnerships First",
      salutation: "Dear {{firstName}},",
      bodyText:
        "At Dexta Africa, we believe that great projects begin with great relationships. We want to take a moment to thank you for your trust, collaboration, and confidence in our team.\n\nEvery conversation and milestone we share inspires us to raise the bar higher every single day.",
      highlightTitle: "Our Commitment to You",
      highlightDetails:
        "Dedicated support, transparent communication, and uncompromising quality on every project.",
      ctaLabel: "Connect With Our Team",
      ctaUrl: "https://dextaafrica.com/contact",
      heroImageUrl: "/images/team-dexta.jpg",
      attachmentImageUrl: "",
      attachmentCaption: "",
      accentColor: "#991B1B",
      showBrandHeader: true,
      signOffName: "The Dexta Africa Family",
      signOffRole: "Lagos, Nigeria",
    },
  },
];

const CURATED_BANNERS = [
  { label: "Engineering & Leadership", url: "/images/olufemi-dexta.png" },
  { label: "Client Experience & Events", url: "/images/sadia-dexta.png" },
  { label: "Team & Celebration", url: "/images/team-dexta.jpg" },
];

const ACCENT_PALETTE = [
  { label: "Dexta Crimson", color: "#DC2626" },
  { label: "Warm Amber / Gold", color: "#B45309" },
  { label: "Executive Slate", color: "#0F172A" },
  { label: "Deep Burgundy", color: "#991B1B" },
  { label: "Emerald Trust", color: "#047857" },
];

/**
 * Compiles the visual studio state into a self-contained, responsive HTML email string
 * that matches the live preview card 1:1.
 */
export function compileStudioEmailHtml(state: EmailStudioState, previewSampleName = false): string {
  const displaySalutation = previewSampleName
    ? state.salutation.replace(/\{\{firstName\}\}/g, "Olamide")
    : state.salutation;

  const paragraphs = state.bodyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const processed = previewSampleName
        ? p.replace(/\{\{firstName\}\}/g, "Olamide")
        : p;
      return `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.75;color:#334155;">${processed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");

  const heroSection = state.heroImageUrl
    ? `<div style="width:100%;overflow:hidden;background:#0f172a;">
         <img src="${state.heroImageUrl}" alt="${state.headline}" style="width:100%;max-height:320px;object-fit:cover;object-position:top center;display:block;" />
       </div>`
    : "";

  const accentBar = `<div style="height:5px;width:100%;background:${state.accentColor};"></div>`;

  const brandHeader = state.showBrandHeader
    ? `<div style="padding:22px 28px 18px 28px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:14px;">
         <img src="/dexta.svg" alt="Dexta Africa" style="height:34px;width:auto;display:block;" />
       </div>`
    : "";

  const categoryPill = state.categoryBadge
    ? `<div style="margin-bottom:16px;">
         <span style="display:inline-block;padding:6px 14px;border-radius:9999px;background:${state.accentColor}14;color:${state.accentColor};font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">
           ${state.categoryBadge}
         </span>
       </div>`
    : "";

  const highlightBox =
    state.highlightTitle || state.highlightDetails
      ? `<div style="margin:24px 0;padding:18px 20px;border-radius:12px;background:#f8fafc;border-left:4px solid ${state.accentColor};">
           ${
             state.highlightTitle
               ? `<div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:6px;">${state.highlightTitle}</div>`
               : ""
           }
           ${
             state.highlightDetails
               ? `<div style="font-size:13px;line-height:1.6;color:#475569;">${state.highlightDetails.replace(/\n/g, "<br/>")}</div>`
               : ""
           }
         </div>`
      : "";

  const secondaryAttachment = state.attachmentImageUrl
    ? `<div style="margin:24px 0;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;background:#f8fafc;">
         <img src="${state.attachmentImageUrl}" alt="Attached media" style="width:100%;max-height:260px;object-fit:cover;display:block;" />
         ${
           state.attachmentCaption
             ? `<div style="padding:10px 14px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">${state.attachmentCaption}</div>`
             : ""
         }
       </div>`
    : "";

  const ctaSection =
    state.ctaLabel && state.ctaUrl
      ? `<div style="margin:28px 0 24px 0;">
           <a href="${state.ctaUrl}" style="display:inline-block;padding:13px 26px;border-radius:10px;background:${state.accentColor};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">
             ${state.ctaLabel}
           </a>
         </div>`
      : "";

  return `<div style="font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;color:#0f172a;">
  ${heroSection}
  ${accentBar}
  ${brandHeader}
  <div style="padding:28px;">
    ${categoryPill}
    <h1 style="margin:0 0 18px 0;font-size:26px;line-height:1.25;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">
      ${state.headline}
    </h1>
    <p style="margin:0 0 16px 0;font-size:15px;font-weight:600;color:#1e293b;">
      ${displaySalutation}
    </p>
    ${paragraphs}
    ${highlightBox}
    ${secondaryAttachment}
    ${ctaSection}
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">${state.signOffName}</p>
      <p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">${state.signOffRole}</p>
    </div>
  </div>
</div>`;
}

interface EmailComposerStudioProps {
  mode: "campaign" | "template";
  initialPreset?: EmailOccasionId;
  onSaveDraft: (payload: {
    title: string;
    subject: string;
    contentHtml: string;
    occasion: EmailOccasionId;
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function EmailComposerStudio({
  mode,
  initialPreset = "birthday",
  onSaveDraft,
  onCancel,
  isSubmitting = false,
}: EmailComposerStudioProps) {
  const initialDef =
    EMAIL_OCCASION_PRESETS.find((p) => p.id === initialPreset) ||
    EMAIL_OCCASION_PRESETS[0];

  const [state, setState] = React.useState<EmailStudioState>({
    occasion: initialDef.id,
    ...initialDef.defaults,
  });

  const [previewTab, setPreviewTab] = React.useState<"visual" | "details" | "plaintext">("visual");
  const heroInputRef = React.useRef<HTMLInputElement>(null);
  const attachmentInputRef = React.useRef<HTMLInputElement>(null);

  const selectOccasion = (preset: EmailPresetDefinition) => {
    setState({
      occasion: preset.id,
      ...preset.defaults,
    });
  };

  const updateField = <K extends keyof EmailStudioState>(
    key: K,
    value: EmailStudioState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetKey: "heroImageUrl" | "attachmentImageUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField(targetKey, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const insertPersonalization = (placeholder: string) => {
    updateField("bodyText", `${state.bodyText} ${placeholder}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const compiledHtml = compileStudioEmailHtml(state, false);
    await onSaveDraft({
      title: state.title,
      subject: state.subject,
      contentHtml: compiledHtml,
      occasion: state.occasion,
    });
  };

  const currentTimestamp = React.useMemo(() => {
    const now = new Date();
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(now);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Occasion & Template Type Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            1. Choose Email Occasion & Ready-Made Layout
          </label>
          <span className="text-xs text-slate-400">
            Click any card to load a complete, structured design
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {EMAIL_OCCASION_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = state.occasion === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectOccasion(preset)}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-red-600 bg-red-50/70 dark:bg-red-950/25 shadow-xs ring-1 ring-red-600/30"
                    : "border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#14151b] hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg mb-2 ${
                    isSelected
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {preset.label}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {preset.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Visual Builder + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Guided No-Code Controls (7 cols) */}
        <div className="lg:col-span-6 space-y-5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121318] p-5 sm:p-6 shadow-xs">
          <div className="border-b border-slate-100 dark:border-white/[0.06] pb-3.5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                2. Customize Message & Visuals
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simple guided fields — no coding or technical formatting required
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Visual Builder
            </span>
          </div>

          {/* Campaign Name & Subject Line */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {mode === "campaign" ? "Campaign Name (Internal)" : "Template Name"}
              </label>
              <input
                type="text"
                value={state.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g., October Birthday Wishes"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-red-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category Pill Tag
              </label>
              <input
                type="text"
                value={state.categoryBadge}
                onChange={(e) => updateField("categoryBadge", e.target.value)}
                placeholder="e.g., BIRTHDAY CELEBRATION"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3.5 py-2.5 text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white focus:border-red-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Subject Line (What recipients see in their inbox)
            </label>
            <input
              type="text"
              value={state.subject}
              onChange={(e) => updateField("subject", e.target.value)}
              placeholder="e.g., Happy Birthday from the Dexta Africa Family!"
              required
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-red-600 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Hero Flyer / Banner Image Attachment */}
          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Top Flyer / Banner Image
                </p>
                <p className="text-[11px] text-slate-500">
                  Upload your own event flyer, birthday card, or select a Dexta Africa banner
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={heroInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileSelect(e, "heroImageUrl")}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  onClick={() => heroInputRef.current?.click()}
                  leftIcon={<ImagePlus className="h-3.5 w-3.5 text-red-600" />}
                >
                  Upload Image
                </Button>
                {state.heroImageUrl && (
                  <button
                    type="button"
                    onClick={() => updateField("heroImageUrl", "")}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove banner image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {CURATED_BANNERS.map((banner) => (
                <button
                  key={banner.url}
                  type="button"
                  onClick={() => updateField("heroImageUrl", banner.url)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    state.heroImageUrl === banner.url
                      ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                      : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] text-slate-600 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <img
                    src={banner.url}
                    alt={banner.label}
                    className="h-5 w-5 rounded object-cover"
                  />
                  {banner.label}
                </button>
              ))}
            </div>
          </div>

          {/* Headline & Salutation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Main Headline Inside Email
              </label>
              <input
                type="text"
                value={state.headline}
                onChange={(e) => updateField("headline", e.target.value)}
                placeholder="e.g., Celebrating You Today & Always"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:border-red-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Recipient Greeting
              </label>
              <input
                type="text"
                value={state.salutation}
                onChange={(e) => updateField("salutation", e.target.value)}
                placeholder="Dear {{firstName}},"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-red-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Message Body */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Main Message Content
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Personalize with:</span>
                <button
                  type="button"
                  onClick={() => insertPersonalization("{{firstName}}")}
                  className="rounded-md bg-red-50 dark:bg-red-950/30 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  + Recipient First Name
                </button>
              </div>
            </div>
            <textarea
              rows={5}
              value={state.bodyText}
              onChange={(e) => updateField("bodyText", e.target.value)}
              placeholder="Write your message here in plain English. Separate paragraphs with a blank line..."
              required
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] p-3.5 text-sm leading-relaxed text-slate-900 dark:text-white focus:border-red-600 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Highlight / Event Details Box */}
          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.02] p-4 space-y-3">
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Featured Callout Box (Optional — Great for Event Dates, Venues, or Special Notes)
            </p>
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                value={state.highlightTitle}
                onChange={(e) => updateField("highlightTitle", e.target.value)}
                placeholder="Callout Title (e.g., Event Schedule & Venue Details)"
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
              />
              <textarea
                rows={2}
                value={state.highlightDetails}
                onChange={(e) => updateField("highlightDetails", e.target.value)}
                placeholder="Callout details (e.g., Date, Time, Location, or Special Message)"
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-3 py-2 text-xs text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>

          {/* Secondary Inline Picture Attachment & Action Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Button Label (Optional)
              </label>
              <input
                type="text"
                value={state.ctaLabel}
                onChange={(e) => updateField("ctaLabel", e.target.value)}
                placeholder="e.g., Confirm Your Attendance"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3.5 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Button Web Link
              </label>
              <div className="relative">
                <Link2 className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={state.ctaUrl}
                  onChange={(e) => updateField("ctaUrl", e.target.value)}
                  placeholder="https://dextaafrica.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] pl-8 pr-3.5 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Additional Image Attachment + Brand Accent Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <input
                ref={attachmentInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageFileSelect(e, "attachmentImageUrl")}
                className="hidden"
              />
              <Button
                type="button"
                size="xs"
                variant="secondary"
                onClick={() => attachmentInputRef.current?.click()}
                leftIcon={<Paperclip className="h-3.5 w-3.5" />}
              >
                {state.attachmentImageUrl ? "Change Attached Photo" : "Attach Supporting Photo"}
              </Button>
              {state.attachmentImageUrl && (
                <button
                  type="button"
                  onClick={() => updateField("attachmentImageUrl", "")}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Theme Accent:</span>
              {ACCENT_PALETTE.map((swatch) => (
                <button
                  key={swatch.color}
                  type="button"
                  onClick={() => updateField("accentColor", swatch.color)}
                  title={swatch.label}
                  style={{ backgroundColor: swatch.color }}
                  className={`h-5 w-5 rounded-full transition-transform cursor-pointer ${
                    state.accentColor === swatch.color
                      ? "scale-125 ring-2 ring-offset-2 ring-slate-400"
                      : "opacity-75 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
            {onCancel && (
              <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={
                mode === "campaign" ? (
                  <Send className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )
              }
            >
              {mode === "campaign" ? "Save & Prepare Campaign" : "Save Reusable Template"}
            </Button>
          </div>
        </div>

        {/* Right Column: Live Email Client Preview (Matching Reference Image 1:1) */}
        <div className="lg:col-span-6 space-y-3 lg:sticky lg:top-20">
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#14161d] p-4 sm:p-6 shadow-sm">
            {/* Top Email Client Header Bar (Modeled on user's screenshot) */}
            <div className="mb-5 space-y-2 border-b border-slate-200/80 dark:border-white/10 pb-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {state.subject || "Untitled Email Subject"}
                </h2>
                <span className="shrink-0 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Live Preview
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white">
                    <User className="h-3 w-3" />
                  </span>
                  <span>
                    From <strong className="text-slate-900 dark:text-white">Dexta Africa</strong> on{" "}
                    {currentTimestamp}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("visual")}
                    className={`cursor-pointer hover:underline ${
                      previewTab === "visual" ? "underline font-bold" : "opacity-75"
                    }`}
                  >
                    Visual
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("details")}
                    className={`cursor-pointer hover:underline ${
                      previewTab === "details" ? "underline font-bold" : "opacity-75"
                    }`}
                  >
                    Details
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("plaintext")}
                    className={`cursor-pointer hover:underline ${
                      previewTab === "plaintext" ? "underline font-bold" : "opacity-75"
                    }`}
                  >
                    Plain text
                  </button>
                </div>
              </div>

              {previewTab === "details" && (
                <div className="mt-3 rounded-xl bg-white dark:bg-[#1a1c24] p-3.5 text-xs border border-slate-200/80 dark:border-white/10 space-y-1 text-slate-600 dark:text-slate-300">
                  <p>
                    <strong className="text-slate-900 dark:text-white">Sender:</strong> Dexta Africa
                    Communications &lt;communications@dextaafrica.com&gt;
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">Sample Recipient:</strong>{" "}
                    Olamide &lt;olamide@clientpartner.com&gt;
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">Occasion Category:</strong>{" "}
                    {state.categoryBadge}
                  </p>
                </div>
              )}
            </div>

            {/* Email Body Container */}
            {previewTab === "plaintext" ? (
              <div className="rounded-2xl bg-white dark:bg-[#101116] p-6 border border-slate-200 dark:border-white/10 font-sans text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {`${state.categoryBadge}\n${state.headline}\n\n${state.salutation.replace(
                  /\{\{firstName\}\}/g,
                  "Olamide"
                )}\n\n${state.bodyText.replace(/\{\{firstName\}\}/g, "Olamide")}\n\n${
                  state.highlightTitle ? `${state.highlightTitle}\n${state.highlightDetails}\n\n` : ""
                }${state.ctaLabel ? `${state.ctaLabel}: ${state.ctaUrl}\n\n` : ""}${
                  state.signOffName
                }\n${state.signOffRole}`}
              </div>
            ) : (
              <div className="mx-auto max-w-[600px] overflow-hidden rounded-2xl bg-white text-slate-900 shadow-md border border-slate-200/90">
                {/* 1. Full-Width Hero Flyer / Attached Image */}
                {state.heroImageUrl && (
                  <div className="relative w-full bg-slate-900 overflow-hidden group">
                    <img
                      src={state.heroImageUrl}
                      alt={state.headline}
                      className="w-full max-h-[300px] object-cover object-top block"
                    />
                    <button
                      type="button"
                      onClick={() => heroInputRef.current?.click()}
                      className="absolute bottom-3 right-3 rounded-lg bg-slate-900/80 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      Change Flyer Image
                    </button>
                  </div>
                )}

                {/* 2. Colored Accent Bar (Directly under Hero Image, matching screenshot) */}
                <div
                  className="h-1.5 w-full transition-colors"
                  style={{ backgroundColor: state.accentColor }}
                />

                {/* 3. Official Brand Logo Header Row */}
                {state.showBrandHeader && (
                  <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <img
                        src="/dexta.svg"
                        alt="Dexta Africa"
                        className="h-8 w-auto object-contain"
                      />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Official Dispatch
                    </span>
                  </div>
                )}

                {/* 4. Email Content Area */}
                <div className="p-7 sm:p-8 space-y-5">
                  {/* Category Pill Badge */}
                  {state.categoryBadge && (
                    <div>
                      <span
                        className="inline-block rounded-full px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em]"
                        style={{
                          backgroundColor: `${state.accentColor}15`,
                          color: state.accentColor,
                        }}
                      >
                        {state.categoryBadge}
                      </span>
                    </div>
                  )}

                  {/* Large Bold Headline */}
                  <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 leading-tight">
                    {state.headline}
                  </h1>

                  {/* Personalized Salutation */}
                  <p className="text-[15px] font-semibold text-slate-800">
                    {state.salutation.replace(/\{\{firstName\}\}/g, "Olamide")}
                  </p>

                  {/* Body Paragraphs */}
                  <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
                    {state.bodyText
                      .split(/\n\s*\n/)
                      .map((p) => p.trim())
                      .filter(Boolean)
                      .map((paragraph, idx) => (
                        <p key={idx} className="whitespace-pre-line">
                          {paragraph.replace(/\{\{firstName\}\}/g, "Olamide")}
                        </p>
                      ))}
                  </div>

                  {/* Highlight Callout Box */}
                  {(state.highlightTitle || state.highlightDetails) && (
                    <div
                      className="rounded-xl bg-slate-50 p-4 border-l-4 space-y-1"
                      style={{ borderLeftColor: state.accentColor }}
                    >
                      {state.highlightTitle && (
                        <p className="text-xs font-bold text-slate-900">
                          {state.highlightTitle}
                        </p>
                      )}
                      {state.highlightDetails && (
                        <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                          {state.highlightDetails}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Secondary Supporting Photo Attachment */}
                  {state.attachmentImageUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img
                        src={state.attachmentImageUrl}
                        alt="Attached visual"
                        className="w-full max-h-[240px] object-cover block"
                      />
                    </div>
                  )}

                  {/* Call to Action Button */}
                  {state.ctaLabel && (
                    <div className="pt-2">
                      <span
                        className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white shadow-xs"
                        style={{ backgroundColor: state.accentColor }}
                      >
                        {state.ctaLabel}
                      </span>
                    </div>
                  )}

                  {/* Sign-off Footer */}
                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{state.signOffName}</p>
                      <p className="text-xs text-slate-500">{state.signOffRole}</p>
                    </div>
                    <img
                      src="/dexta.svg"
                      alt="Dexta Africa"
                      className="h-5 w-auto opacity-60"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
