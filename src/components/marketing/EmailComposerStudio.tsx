"use client";
/* eslint-disable @next/next/no-img-element */

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
  Link2,
  Palette,
  Layout,
  Type,
  Code2,
  Plus,
  ArrowUp,
  ArrowDown,
  AlignLeft,
  AlignCenter,
  Eye,
  RotateCcw,
  Layers,
  Wand2,
  Users,
  Radio,
  Check,
  AlertCircle,
  Loader2,
  FolderOpen,
  CalendarClock,
  FileSpreadsheet,
  UploadCloud,
  Globe,
  FileText,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export type EmailOccasionId =
  | "birthday"
  | "invitation"
  | "newsletter"
  | "project_update"
  | "seasonal"
  | "blank";

export interface CustomEmailBlock {
  id: string;
  type: "text" | "image" | "two_column" | "divider";
  heading?: string;
  content?: string;
  leftTitle?: string;
  leftBody?: string;
  rightTitle?: string;
  rightBody?: string;
  imageUrl?: string;
  imageCaption?: string;
}

export interface EmailStudioState {
  occasion: EmailOccasionId;
  title: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  previewRecipientName: string;
  categoryBadge: string;
  showCategoryBadge: boolean;
  headline: string;
  salutation: string;
  bodyText: string;
  showHighlightBox: boolean;
  highlightTitle: string;
  highlightDetails: string;
  showCta: boolean;
  ctaLabel: string;
  ctaUrl: string;
  ctaStyle: "rounded" | "pill" | "sharp" | "outline";
  heroImageUrl: string;
  heroLayout: "top_full" | "below_header" | "inset_card" | "none";
  heroHeight: "compact" | "standard" | "tall" | "auto";
  heroObjectFit: "cover" | "contain";
  attachmentImageUrl: string;
  attachmentCaption: string;
  accentColor: string;
  cardBackgroundColor: string;
  canvasBackgroundColor: string;
  textColor: string;
  fontFamily: "sans" | "serif" | "clean";
  contentAlignment: "left" | "center";
  headlineSize: "md" | "lg" | "xl";
  showBrandHeader: boolean;
  brandLogoUrl: string;
  brandHeaderAlignment: "split" | "center" | "left";
  brandHeaderBg: "white" | "soft" | "dark" | "tinted";
  brandLogoHeight: number;
  brandRightLabel: string;
  showFooter: boolean;
  signOffName: string;
  signOffRole: string;
  footerAddress: string;
  customBlocks: CustomEmailBlock[];
  useCustomHtmlOverride: boolean;
  customHtmlCode: string;
}

export interface EmailPresetDefinition {
  id: EmailOccasionId;
  label: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  defaults: Omit<EmailStudioState, "occasion">;
}

const BASE_DESIGN_DEFAULTS = {
  senderName: "Dexta Africa",
  senderEmail: "communications@dextaafrica.com",
  previewRecipientName: "Olamide",
  showCategoryBadge: true,
  showHighlightBox: true,
  showCta: true,
  ctaStyle: "rounded" as const,
  heroLayout: "top_full" as const,
  heroHeight: "auto" as const,
  heroObjectFit: "contain" as const,
  cardBackgroundColor: "#FFFFFF",
  canvasBackgroundColor: "#F8FAFC",
  textColor: "#0F172A",
  fontFamily: "sans" as const,
  contentAlignment: "left" as const,
  headlineSize: "lg" as const,
  showBrandHeader: true,
  brandLogoUrl: "/images/dexta-logo-dark.png",
  brandHeaderAlignment: "split" as const,
  brandHeaderBg: "white" as const,
  brandLogoHeight: 32,
  brandRightLabel: "Official Dispatch",
  showFooter: true,
  footerAddress: "Dexta Africa • Victoria Island, Lagos",
  customBlocks: [] as CustomEmailBlock[],
  useCustomHtmlOverride: false,
  customHtmlCode: "",
};

export const EMAIL_OCCASION_PRESETS: EmailPresetDefinition[] = [
  {
    id: "birthday",
    label: "Birthday Celebration",
    tagline: "Warm, personalized birthday wishes for clients & team members",
    icon: Cake,
    defaults: {
      ...BASE_DESIGN_DEFAULTS,
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
      ctaLabel: "View Your Birthday Message",
      ctaUrl: "https://dextaafrica.com",
      heroImageUrl: "/images/team-dexta.jpg",
      attachmentImageUrl: "",
      attachmentCaption: "",
      accentColor: "#DC2626",
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
      ...BASE_DESIGN_DEFAULTS,
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
      ...BASE_DESIGN_DEFAULTS,
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
      ...BASE_DESIGN_DEFAULTS,
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
      ...BASE_DESIGN_DEFAULTS,
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
      signOffName: "The Dexta Africa Family",
      signOffRole: "Lagos, Nigeria",
    },
  },
  {
    id: "blank",
    label: "Blank Custom Design",
    tagline: "Start from a clean slate and build your own layout or HTML",
    icon: Wand2,
    defaults: {
      ...BASE_DESIGN_DEFAULTS,
      title: "Custom Email Design",
      subject: "A Message from Dexta Africa",
      categoryBadge: "ANNOUNCEMENT",
      headline: "Write Your Custom Headline Here",
      salutation: "Dear {{firstName}},",
      bodyText:
        "Click directly on any part of the preview or use the design controls on the left to customize your layout, colors, images, and content.",
      highlightTitle: "",
      highlightDetails: "",
      showHighlightBox: false,
      ctaLabel: "Learn More",
      ctaUrl: "https://dextaafrica.com",
      heroImageUrl: "",
      heroLayout: "none",
      attachmentImageUrl: "",
      attachmentCaption: "",
      accentColor: "#DC2626",
      signOffName: "Dexta Africa",
      signOffRole: "Executive Communications",
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
  { label: "Royal Cobalt", color: "#1D4ED8" },
];

const STUDIO_STATE_PREFIX = "<!-- DEXTA_STUDIO_STATE:";
const STUDIO_STATE_SUFFIX = " :DEXTA_STUDIO_STATE -->";

function getFontStack(fontFamily: EmailStudioState["fontFamily"]): string {
  if (fontFamily === "serif") {
    return "Georgia, 'Times New Roman', Times, serif";
  }
  if (fontFamily === "clean") {
    return "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  }
  return "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
}

function getHeroHeightPx(heroHeight: EmailStudioState["heroHeight"]): string {
  if (heroHeight === "compact") return "210px";
  if (heroHeight === "tall") return "420px";
  if (heroHeight === "auto") return "none";
  return "300px";
}

/**
 * Compiles the visual studio state into a self-contained, responsive HTML email string.
 * Also embeds the serialized studio state in an HTML comment so reopening a draft
 * or template restores every visual setting 100% faithfully.
 */
export function compileStudioEmailHtml(
  state: EmailStudioState,
  previewSampleName = false,
  includeMetadataComment = true
): string {
  const sampleName = state.previewRecipientName || "Olamide";

  if (state.useCustomHtmlOverride && state.customHtmlCode.trim()) {
    const raw = previewSampleName
      ? state.customHtmlCode.replace(/\{\{firstName\}\}/g, sampleName)
      : state.customHtmlCode;
    if (!includeMetadataComment) return raw;
    const encoded = encodeURIComponent(JSON.stringify(state));
    return `${STUDIO_STATE_PREFIX}${encoded}${STUDIO_STATE_SUFFIX}\n${raw}`;
  }

  const replaceVars = (str: string) =>
    previewSampleName ? str.replace(/\{\{firstName\}\}/g, sampleName) : str;

  const isCardDark =
    (state.cardBackgroundColor || "#ffffff").toLowerCase() === "#0f172a" ||
    (state.cardBackgroundColor || "#ffffff").toLowerCase() === "#000000" ||
    (state.cardBackgroundColor || "").toLowerCase().startsWith("#1");

  const isHeaderDark =
    state.brandHeaderBg === "dark" ||
    (state.brandHeaderBg === "tinted" && isCardDark);

  const getLogoAbsoluteUrl = (isDark: boolean): string => {
    const base =
      typeof window !== "undefined" && window.location.origin.includes("dexta")
        ? window.location.origin
        : "https://admin.dextaafrica.com";

    // If the user specified an external URL (e.g. S3 upload or http/https)
    if (
      state.brandLogoUrl &&
      (state.brandLogoUrl.startsWith("http://") ||
        state.brandLogoUrl.startsWith("https://") ||
        state.brandLogoUrl.startsWith("data:"))
    ) {
      if (
        state.brandLogoUrl.endsWith("/dexta.svg") ||
        state.brandLogoUrl.endsWith("dexta.svg") ||
        state.brandLogoUrl.toLowerCase().endsWith(".svg")
      ) {
        return isDark
          ? "https://admin.dextaafrica.com/images/dexta-logo-light.png"
          : "https://admin.dextaafrica.com/images/dexta-logo-dark.png";
      }
      return state.brandLogoUrl;
    }

    if (
      !state.brandLogoUrl ||
      state.brandLogoUrl === "/dexta.svg" ||
      state.brandLogoUrl.toLowerCase().endsWith(".svg") ||
      state.brandLogoUrl.includes("dexta")
    ) {
      return isDark
        ? `${base}/images/dexta-logo-light.png`
        : `${base}/images/dexta-logo-dark.png`;
    }
    return `${base}/${state.brandLogoUrl.replace(/^\/+/, "")}`;
  };

  const toEmailSafeUrl = (url: string | undefined): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("data:")) return url;
    const base =
      typeof window !== "undefined" && window.location.origin.includes("dexta")
        ? window.location.origin
        : "https://admin.dextaafrica.com";
    return `${base.replace(/\/$/, "")}/${url.replace(/^\/+/, "")}`;
  };

  const displaySalutation = replaceVars(state.salutation);
  const textAlign = state.contentAlignment === "center" ? "center" : "left";
  const fontStack = getFontStack(state.fontFamily);
  const maxHeroH = getHeroHeightPx(state.heroHeight);

  const paragraphs = state.bodyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const processed = replaceVars(p);
      return `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.75;color:#334155;text-align:${textAlign};">${processed.replace(
        /\n/g,
        "<br/>"
      )}</p>`;
    })
    .join("");

  const heroBg = isCardDark
    ? (state.cardBackgroundColor || "#0f172a")
    : (state.cardBackgroundColor || "#ffffff");

  const heroImgStyle =
    maxHeroH !== "none"
      ? `width:100%;max-width:100%;max-height:${maxHeroH};object-fit:${state.heroObjectFit};object-position:top center;display:block;margin:0 auto;border:0;outline:none;`
      : `width:100%;max-width:100%;height:auto;display:block;margin:0 auto;border:0;outline:none;text-decoration:none;`;

  const heroHtml =
    state.heroImageUrl && state.heroLayout !== "none"
      ? `<div style="${
          state.heroLayout === "inset_card"
            ? "padding:20px 28px 0 28px;text-align:center;"
            : `width:100%;overflow:hidden;background-color:${heroBg};text-align:center;`
        }">
           <img src="${toEmailSafeUrl(state.heroImageUrl)}" alt="${state.headline}" width="640" style="${heroImgStyle}${
          state.heroLayout === "inset_card" ? "border-radius:12px;" : ""
        }" />
         </div>`
      : "";

  const accentBar = `<div style="height:5px;width:100%;background:${state.accentColor};"></div>`;

  const headerBgColor =
    state.brandHeaderBg === "dark"
      ? "#0f172a"
      : state.brandHeaderBg === "soft"
      ? "#f8fafc"
      : state.brandHeaderBg === "tinted"
      ? `${state.accentColor}12`
      : "#ffffff";

  const headerLabelColor = state.brandHeaderBg === "dark" ? "#cbd5e1" : "#64748b";

  const brandHeader = state.showBrandHeader
    ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${headerBgColor};border-bottom:1px solid #f1f5f9;border-collapse:collapse;">
         <tr>
           <td style="padding:22px 28px;vertical-align:middle;text-align:${
             state.brandHeaderAlignment === "center"
               ? "center"
               : "left"
           };">
             <img src="${getLogoAbsoluteUrl(isHeaderDark)}" alt="${
               state.senderName
             }" width="${Math.round((state.brandLogoHeight || 30) * 2.3)}" height="${state.brandLogoHeight || 30}" style="height:${
               state.brandLogoHeight || 30
             }px;width:${Math.round((state.brandLogoHeight || 30) * 2.3)}px;max-width:100%;border:0;display:${
               state.brandHeaderAlignment === "center" ? "inline-block" : "block"
             };line-height:100%;outline:none;text-decoration:none;" />
           </td>
           ${
             state.brandHeaderAlignment === "split" && state.brandRightLabel
               ? `<td style="padding:22px 28px;vertical-align:middle;text-align:right;">
                    <span style="font-family:${fontStack};font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.16em;color:${headerLabelColor};">${state.brandRightLabel}</span>
                  </td>`
               : ""
           }
         </tr>
       </table>`
    : "";

  const categoryPill =
    state.showCategoryBadge && state.categoryBadge
      ? `<div style="margin-bottom:18px;text-align:${textAlign};">
           <span style="display:inline-block;padding:5px 14px;border-radius:9999px;background:${state.accentColor}14;border:1px solid ${state.accentColor}28;color:${state.accentColor};font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;">
             ${state.categoryBadge}
           </span>
         </div>`
      : "";

  const headlineFontSize =
    state.headlineSize === "xl" ? "32px" : state.headlineSize === "md" ? "22px" : "27px";

  const highlightBox =
    state.showHighlightBox && (state.highlightTitle || state.highlightDetails)
      ? `<div style="margin:24px 0;padding:18px 20px;border-radius:12px;background:#f8fafc;border-left:4px solid ${state.accentColor};text-align:left;">
           ${
             state.highlightTitle
               ? `<div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:6px;">${replaceVars(
                   state.highlightTitle
                 )}</div>`
               : ""
           }
           ${
             state.highlightDetails
               ? `<div style="font-size:13px;line-height:1.6;color:#475569;">${replaceVars(
                   state.highlightDetails
                 ).replace(/\n/g, "<br/>")}</div>`
               : ""
           }
         </div>`
      : "";

  const customBlocksHtml = (state.customBlocks || [])
    .map((block) => {
      if (block.type === "divider") {
        return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;
      }
      if (block.type === "text") {
        return `<div style="margin:20px 0;text-align:${textAlign};">
          ${
            block.heading
              ? `<h3 style="margin:0 0 8px 0;font-size:17px;font-weight:700;color:#0f172a;">${replaceVars(
                  block.heading
                )}</h3>`
              : ""
          }
          ${
            block.content
              ? `<p style="margin:0;font-size:14px;line-height:1.7;color:#334155;">${replaceVars(
                  block.content
                ).replace(/\n/g, "<br/>")}</p>`
              : ""
          }
        </div>`;
      }
      if (block.type === "image" && block.imageUrl) {
        return `<div style="margin:22px 0;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;background:#f8fafc;">
          <img src="${toEmailSafeUrl(block.imageUrl)}" alt="${block.imageCaption || "Email visual"}" style="width:100%;max-height:320px;object-fit:cover;display:block;" />
          ${
            block.imageCaption
              ? `<div style="padding:10px 14px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;text-align:${textAlign};">${replaceVars(
                  block.imageCaption
                )}</div>`
              : ""
          }
        </div>`;
      }
      if (block.type === "two_column") {
        return `<div style="margin:22px 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;text-align:left;">
          <div style="padding:14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;">
            <div style="font-size:12px;font-weight:700;color:${state.accentColor};margin-bottom:4px;">${replaceVars(
          block.leftTitle || "Highlight One"
        )}</div>
            <div style="font-size:12px;line-height:1.5;color:#475569;">${replaceVars(
              block.leftBody || ""
            )}</div>
          </div>
          <div style="padding:14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;">
            <div style="font-size:12px;font-weight:700;color:${state.accentColor};margin-bottom:4px;">${replaceVars(
          block.rightTitle || "Highlight Two"
        )}</div>
            <div style="font-size:12px;line-height:1.5;color:#475569;">${replaceVars(
              block.rightBody || ""
            )}</div>
          </div>
        </div>`;
      }
      return "";
    })
    .join("");

  const secondaryAttachment = state.attachmentImageUrl
    ? `<div style="margin:24px 0;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;background:#f8fafc;">
         <img src="${toEmailSafeUrl(state.attachmentImageUrl)}" alt="Attached media" style="width:100%;max-height:280px;object-fit:cover;display:block;" />
         ${
           state.attachmentCaption
             ? `<div style="padding:10px 14px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">${replaceVars(
                 state.attachmentCaption
               )}</div>`
             : ""
         }
       </div>`
    : "";

  const btnBorderRadius =
    state.ctaStyle === "pill" ? "9999px" : state.ctaStyle === "sharp" ? "4px" : "10px";
  const btnStyle =
    state.ctaStyle === "outline"
      ? `display:inline-block;padding:13px 26px;border-radius:${btnBorderRadius};background:transparent;border:2px solid ${state.accentColor};color:${state.accentColor};font-size:14px;font-weight:700;text-decoration:none;`
      : `display:inline-block;padding:13px 26px;border-radius:${btnBorderRadius};background:${state.accentColor};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;`;

  const ctaSection =
    state.showCta && state.ctaLabel
      ? `<div style="margin:28px 0 24px 0;text-align:${textAlign};">
           <a href="${state.ctaUrl || "#"}" style="${btnStyle}">
             ${replaceVars(state.ctaLabel)}
           </a>
         </div>`
      : "";

  const unsubscribeHref = previewSampleName ? "#unsubscribe" : "{{unsubscribeLink}}";
  const footerLogoUrl = getLogoAbsoluteUrl(isCardDark);
  const footerTextColor = isCardDark ? "#e2e8f0" : "#0f172a";
  const footerMutedColor = isCardDark ? "#94a3b8" : "#64748b";
  const footerBorderColor = isCardDark ? "#334155" : "#e2e8f0";

  const footerHtml = state.showFooter
    ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;border-top:1px solid ${footerBorderColor};padding-top:22px;border-collapse:collapse;">
         <tr>
           <td style="vertical-align:top;text-align:left;padding-bottom:18px;width:72%;">
             <p style="margin:0;font-size:14px;font-weight:700;color:${footerTextColor};font-family:${fontStack};line-height:1.4;">${replaceVars(
               state.signOffName
             )}</p>
             <p style="margin:3px 0 0 0;font-size:12px;color:${footerMutedColor};font-family:${fontStack};">${replaceVars(
               state.signOffRole
             )}</p>
           </td>
           <td style="vertical-align:top;text-align:right;padding-bottom:18px;width:28%;min-width:65px;">
             <img src="${footerLogoUrl}" alt="Dexta Africa" width="70" height="28" style="height:28px;width:auto;max-width:100%;border:0;display:inline-block;outline:none;vertical-align:middle;" />
           </td>
         </tr>
         <tr>
           <td colspan="2" style="border-top:1px solid ${footerBorderColor};padding-top:16px;text-align:left;">
             <p style="margin:0 0 6px 0;font-size:11px;color:${footerMutedColor};line-height:1.5;font-family:${fontStack};">
               ${state.footerAddress || "Dexta Africa Limited • Victoria Island, Lagos, Nigeria • communications@dextaafrica.com"}
             </p>
             <p style="margin:0 0 8px 0;font-size:10px;color:#94a3b8;line-height:1.5;font-family:${fontStack};">
               This official communication was transmitted via Dexta Africa Enterprise Systems. NDPR &amp; GDPR compliant data processing.
             </p>
             <p style="margin:0;font-size:11px;color:${footerMutedColor};font-family:${fontStack};">
               You received this because you are an authorized contact or registered stakeholder.
               <a href="${unsubscribeHref}" style="color:#DC2626;text-decoration:underline;margin-left:4px;">Unsubscribe</a>
               <span style="color:#cbd5e1;margin:0 6px;">|</span>
               <a href="https://dextaafrica.com/privacy" style="color:${footerMutedColor};text-decoration:none;">Privacy Policy</a>
             </p>
           </td>
         </tr>
       </table>`
    : "";

  const topOrderedHero =
    state.heroLayout === "top_full" ? `${heroHtml}\n  ${accentBar}\n  ${brandHeader}` : "";
  const belowHeaderOrderedHero =
    state.heroLayout === "below_header" || state.heroLayout === "inset_card"
      ? `${accentBar}\n  ${brandHeader}\n  ${heroHtml}`
      : "";
  const noHeroHeader = state.heroLayout === "none" ? `${accentBar}\n  ${brandHeader}` : "";

  const bodyMarkup = `<div style="font-family:${fontStack};max-width:640px;margin:0 auto;background:${
    state.cardBackgroundColor || "#ffffff"
  };border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;color:${
    state.textColor || "#0f172a"
  };">
  ${topOrderedHero}${belowHeaderOrderedHero}${noHeroHeader}
  <div style="padding:28px;">
    ${categoryPill}
    <h1 style="margin:0 0 18px 0;font-size:${headlineFontSize};line-height:1.24;font-weight:800;color:${
    state.textColor || "#0f172a"
  };letter-spacing:-0.03em;text-align:${textAlign};word-break:break-word;overflow-wrap:break-word;">
      ${replaceVars(state.headline)}
    </h1>
    ${
      displaySalutation
        ? `<p style="margin:0 0 16px 0;font-size:15px;font-weight:600;color:#1e293b;text-align:${textAlign};">${displaySalutation}</p>`
        : ""
    }
    ${paragraphs}
    ${highlightBox}
    ${customBlocksHtml}
    ${secondaryAttachment}
    ${ctaSection}
    ${footerHtml}
  </div>
</div>`;

  if (!includeMetadataComment) return bodyMarkup;
  const encoded = encodeURIComponent(JSON.stringify(state));
  return `${STUDIO_STATE_PREFIX}${encoded}${STUDIO_STATE_SUFFIX}\n${bodyMarkup}`;
}

/**
 * Extracts a saved EmailStudioState from an HTML string if it was created by the Studio,
 * or converts raw legacy HTML into an editable studio state so any draft/template can be edited!
 */
export function parseStudioStateFromHtml(
  html: string,
  fallbackTitle = "Saved Email Design",
  fallbackSubject = "Message from Dexta Africa"
): EmailStudioState {
  if (html && html.includes(STUDIO_STATE_PREFIX) && html.includes(STUDIO_STATE_SUFFIX)) {
    try {
      const start = html.indexOf(STUDIO_STATE_PREFIX) + STUDIO_STATE_PREFIX.length;
      const end = html.indexOf(STUDIO_STATE_SUFFIX);
      const encoded = html.slice(start, end).trim();
      const parsed = JSON.parse(decodeURIComponent(encoded)) as Partial<EmailStudioState>;
      return {
        occasion: "birthday",
        ...EMAIL_OCCASION_PRESETS[0].defaults,
        ...parsed,
        title: fallbackTitle || parsed.title || "Saved Email Design",
        subject: fallbackSubject || parsed.subject || "Message from Dexta Africa",
      };
    } catch {
      // Fallback below
    }
  }

  // If legacy HTML without embedded state, load it in Custom HTML mode AND populate defaults
  const cleanHtml = (html || "").trim();
  return {
    occasion: "blank",
    ...EMAIL_OCCASION_PRESETS[0].defaults,
    title: fallbackTitle,
    subject: fallbackSubject,
    headline: fallbackSubject,
    useCustomHtmlOverride: Boolean(cleanHtml),
    customHtmlCode: cleanHtml,
  };
}

interface EmailComposerStudioProps {
  mode: "campaign" | "template";
  initialPreset?: EmailOccasionId;
  initialData?: {
    id?: string;
    title: string;
    subject: string;
    contentHtml: string;
  } | null;
  targetAudience?: string;
  onTargetAudienceChange?: (audience: string) => void;
  onSaveDraft: (payload: {
    id?: string;
    title: string;
    subject: string;
    contentHtml: string;
    occasion: EmailOccasionId;
  }) => Promise<void>;
  onSchedule?: (payload: {
    id?: string;
    title: string;
    subject: string;
    contentHtml: string;
    occasion: EmailOccasionId;
    targetAudience: string;
    scheduledAt: string;
    customRecipients?: Array<{ email: string; fullName?: string }>;
  }) => Promise<void>;
  onDispatchNow?: (payload: {
    id?: string;
    title: string;
    subject: string;
    contentHtml: string;
    occasion: EmailOccasionId;
    targetAudience: string;
    customRecipients?: Array<{ email: string; fullName?: string }>;
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function EmailComposerStudio({
  mode,
  initialPreset = "birthday",
  initialData = null,
  targetAudience = "ALL",
  onTargetAudienceChange,
  onSaveDraft,
  onSchedule,
  onDispatchNow,
  onCancel,
  isSubmitting = false,
}: EmailComposerStudioProps) {
  const [state, setState] = React.useState<EmailStudioState>(() => {
    if (initialData && initialData.contentHtml) {
      return parseStudioStateFromHtml(
        initialData.contentHtml,
        initialData.title,
        initialData.subject
      );
    }
    const initialDef =
      EMAIL_OCCASION_PRESETS.find((p) => p.id === initialPreset) ||
      EMAIL_OCCASION_PRESETS[0];
    return {
      occasion: initialDef.id,
      ...initialDef.defaults,
    };
  });

  const [studioTab, setStudioTab] = React.useState<"content" | "design" | "audience" | "html">("content");
  const [previewTab, setPreviewTab] = React.useState<"visual" | "html_code" | "details" | "plaintext">("visual");
  const [mobileView, setMobileView] = React.useState<"editor" | "preview">("editor");

  const heroInputRef = React.useRef<HTMLInputElement>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const attachmentInputRef = React.useRef<HTMLInputElement>(null);
  const recipientsFileInputRef = React.useRef<HTMLInputElement>(null);
  const headlineCanvasRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (headlineCanvasRef.current) {
      headlineCanvasRef.current.style.height = "auto";
      headlineCanvasRef.current.style.height = `${headlineCanvasRef.current.scrollHeight}px`;
    }
  }, [state.headline, state.headlineSize]);

  const [selectedAudience, setSelectedAudience] = React.useState<string>(targetAudience);
  const [recipientSource, setRecipientSource] = React.useState<"directory" | "custom_list" | "external_link">("directory");
  const [customRecipients, setCustomRecipients] = React.useState<Array<{ email: string; fullName?: string }>>([]);
  const [pastedEmailsText, setPastedEmailsText] = React.useState<string>("");
  const [externalUrl, setExternalUrl] = React.useState<string>("");
  const [isFetchingExternal, setIsFetchingExternal] = React.useState<boolean>(false);
  const [externalFetchFeedback, setExternalFetchFeedback] = React.useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState<boolean>(false);
  const [scheduledDateTime, setScheduledDateTime] = React.useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    return new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [isScheduling, setIsScheduling] = React.useState<boolean>(false);
  const [availableForms, setAvailableForms] = React.useState<
    Array<{ id: string; title: string; slug: string; submissionsCount: number }>
  >([]);
  const [testEmailAddress, setTestEmailAddress] = React.useState<string>("");
  const [isSendingTest, setIsSendingTest] = React.useState<boolean>(false);
  const [testSendResult, setTestSendResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = React.useState<boolean>(false);
  const [isDispatching, setIsDispatching] = React.useState<boolean>(false);
  const [audienceCounts, setAudienceCounts] = React.useState<{ total: number; categories: Record<string, number> }>({
    total: 0,
    categories: {},
  });

  React.useEffect(() => {
    setSelectedAudience(targetAudience);
  }, [targetAudience]);

  React.useEffect(() => {
    fetch("/api/forms")
      .then((res) => res.json())
      .then((data) => {
        if (data.forms && Array.isArray(data.forms)) {
          setAvailableForms(
            data.forms.map((f: any) => ({
              id: f.id,
              title: f.title,
              slug: f.slug,
              submissionsCount: f.submissionsCount || 0,
            }))
          );
        }
      })
      .catch(() => {});

    fetch("/api/marketing/audience")
      .then((res) => res.json())
      .then((data) => {
        if (data.subscribers) {
          const active = data.subscribers.filter((s: any) => s.status === "SUBSCRIBED");
          setAudienceCounts({
            total: active.length,
            categories: data.categoryCounts || {},
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleAudienceChange = (val: string) => {
    setSelectedAudience(val);
    if (onTargetAudienceChange) {
      onTargetAudienceChange(val);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      setTestSendResult({ success: false, message: "Please provide a valid test recipient email address." });
      return;
    }
    setIsSendingTest(true);
    setTestSendResult(null);
    try {
      const compiledHtml = compileStudioEmailHtml(state, false, true);
      const res = await fetch("/api/marketing/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmailAddress.trim(),
          subject: state.subject || state.title || "Email Preview",
          contentHtml: compiledHtml,
        }),
      });
      const contentType = res.headers.get("content-type") || "";
      let data: any = {};
      try {
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          data = { error: `Server returned ${res.status}: ${res.statusText || "Service error"}` };
        }
      } catch {
        data = { error: `Server returned ${res.status}` };
      }

      if (res.ok) {
        setTestSendResult({
          success: true,
          message: `Preview delivered to ${testEmailAddress.trim()} via corporate SMTP.`,
        });
      } else {
        setTestSendResult({
          success: false,
          message: data.error || "Failed to send test preview email.",
        });
      }
    } catch {
      setTestSendResult({ success: false, message: "Network connection error while sending test email." });
    } finally {
      setIsSendingTest(false);
    }
  };

  const parseRawEmailsText = (rawText: string) => {
    const lines = rawText.split(/[\r\n,;]+/);
    const parsed: Array<{ email: string; fullName?: string }> = [];
    const seen = new Set<string>();

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      // Format: "Full Name <email@example.com>" or "email@example.com"
      const bracketMatch = line.match(/^(.*?)[<\[]([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})[>\]]$/);
      if (bracketMatch) {
        const name = bracketMatch[1].trim().replace(/^["']|["']$/g, "");
        const email = bracketMatch[2].toLowerCase();
        if (!seen.has(email)) {
          seen.add(email);
          parsed.push({ email, fullName: name || undefined });
        }
        continue;
      }
      const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        const email = emailMatch[0].toLowerCase();
        if (!seen.has(email)) {
          seen.add(email);
          parsed.push({ email });
        }
      }
    }
    return parsed;
  };

  const handleParsePastedEmails = () => {
    if (!pastedEmailsText.trim()) return;
    const parsed = parseRawEmailsText(pastedEmailsText);
    if (parsed.length > 0) {
      setCustomRecipients((prev) => {
        const map = new Map<string, { email: string; fullName?: string }>();
        for (const item of [...prev, ...parsed]) {
          map.set(item.email.toLowerCase(), item);
        }
        return Array.from(map.values());
      });
      setExternalFetchFeedback({
        success: true,
        message: `Parsed & validated ${parsed.length} unique email recipient(s).`,
        count: parsed.length,
      });
      setPastedEmailsText("");
    } else {
      setExternalFetchFeedback({
        success: false,
        message: "No valid email addresses found. Please paste valid emails.",
      });
    }
  };

  const handleFileUploadRecipients = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const parsed = parseRawEmailsText(text);
      if (parsed.length > 0) {
        setCustomRecipients((prev) => {
          const map = new Map<string, { email: string; fullName?: string }>();
          for (const item of [...prev, ...parsed]) {
            map.set(item.email.toLowerCase(), item);
          }
          return Array.from(map.values());
        });
        setExternalFetchFeedback({
          success: true,
          message: `Successfully parsed ${parsed.length} recipient(s) from "${file.name}".`,
          count: parsed.length,
        });
      } else {
        setExternalFetchFeedback({
          success: false,
          message: `No valid email addresses found in "${file.name}".`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleFetchExternalLink = async () => {
    if (!externalUrl.trim()) {
      setExternalFetchFeedback({ success: false, message: "Please provide a valid external URL (HTTP/HTTPS)." });
      return;
    }
    setIsFetchingExternal(true);
    setExternalFetchFeedback(null);
    try {
      const res = await fetch("/api/marketing/fetch-external-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: externalUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch contacts from link");
      }
      const fetched: Array<{ email: string; fullName?: string }> = data.contacts || [];
      if (fetched.length === 0) {
        setExternalFetchFeedback({
          success: false,
          message: "No email contacts could be extracted from that URL or endpoint.",
        });
      } else {
        setCustomRecipients((prev) => {
          const map = new Map<string, { email: string; fullName?: string }>();
          for (const item of [...prev, ...fetched]) {
            map.set(item.email.toLowerCase(), item);
          }
          return Array.from(map.values());
        });
        setExternalFetchFeedback({
          success: true,
          message: `Imported ${fetched.length} contact(s) from external link successfully.`,
          count: fetched.length,
        });
      }
    } catch (err: unknown) {
      setExternalFetchFeedback({
        success: false,
        message: err instanceof Error ? err.message : "Error contacting external link endpoint.",
      });
    } finally {
      setIsFetchingExternal(false);
    }
  };

  const handleConfirmBroadcast = async () => {
    if (!onDispatchNow) return;
    setIsDispatching(true);
    try {
      const compiledHtml = compileStudioEmailHtml(state, false, true);
      const customList =
        recipientSource === "custom_list" || recipientSource === "external_link"
          ? customRecipients
          : undefined;

      await onDispatchNow({
        id: initialData?.id,
        title: state.title,
        subject: state.subject,
        contentHtml: compiledHtml,
        occasion: state.occasion,
        targetAudience: selectedAudience,
        customRecipients: customList,
      });
      setIsDispatchModalOpen(false);
    } catch {
      // Handled by parent
    } finally {
      setIsDispatching(false);
    }
  };

  const handleConfirmSchedule = async () => {
    if (!onSchedule) return;
    setIsScheduling(true);
    try {
      const compiledHtml = compileStudioEmailHtml(state, false, true);
      const customList =
        recipientSource === "custom_list" || recipientSource === "external_link"
          ? customRecipients
          : undefined;

      await onSchedule({
        id: initialData?.id,
        title: state.title,
        subject: state.subject,
        contentHtml: compiledHtml,
        occasion: state.occasion,
        targetAudience: selectedAudience,
        scheduledAt: new Date(scheduledDateTime).toISOString(),
        customRecipients: customList,
      });
      setIsScheduleModalOpen(false);
    } catch {
      // Handled by parent
    } finally {
      setIsScheduling(false);
    }
  };

  const selectOccasion = (preset: EmailPresetDefinition) => {
    setState((prev) => ({
      occasion: preset.id,
      ...preset.defaults,
      title: prev.title && initialData?.id ? prev.title : preset.defaults.title,
      useCustomHtmlOverride: false,
    }));
  };

  const updateField = <K extends keyof EmailStudioState>(
    key: K,
    value: EmailStudioState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const [isUploadingImage, setIsUploadingImage] = React.useState<string | null>(null);
  const [isAssetVaultOpen, setIsAssetVaultOpen] = React.useState(false);
  const [assetVaultTarget, setAssetVaultTarget] = React.useState<string | null>(null);
  const [vaultAssets, setVaultAssets] = React.useState<
    Array<{ id: string; url: string; fileName: string; fileSize: number; folder: string }>
  >([]);
  const [isLoadingVault, setIsLoadingVault] = React.useState(false);

  const fetchVaultAssets = async () => {
    setIsLoadingVault(true);
    try {
      const res = await fetch("/api/storage/assets?folder=all");
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        setVaultAssets(data.assets || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingVault(false);
    }
  };

  const openAssetVault = (target: string) => {
    setAssetVaultTarget(target);
    setIsAssetVaultOpen(true);
    fetchVaultAssets();
  };

  const selectVaultAsset = (url: string) => {
    if (!assetVaultTarget) return;
    if (
      assetVaultTarget === "heroImageUrl" ||
      assetVaultTarget === "attachmentImageUrl" ||
      assetVaultTarget === "brandLogoUrl"
    ) {
      updateField(assetVaultTarget, url);
      if (assetVaultTarget === "heroImageUrl" && state.heroLayout === "none") {
        updateField("heroLayout", "top_full");
      }
    } else {
      updateCustomBlock(assetVaultTarget, { imageUrl: url });
    }
    setIsAssetVaultOpen(false);
    setAssetVaultTarget(null);
  };

/**
 * Downscales oversized images client-side before network transmission.
 * Prevents net::ERR_HTTP2_PROTOCOL_ERROR from reverse proxy body size limits (e.g. 5-15MB phone photos)
 * and keeps email payloads fast and crisp.
 */
async function optimizeImageBeforeUpload(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/") || file.type.includes("svg") || file.type.includes("gif")) {
    return file;
  }

  if (file.size <= 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_DIMENSION = 1600;
      let { width, height } = img;

      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION && file.size < 1.8 * 1024 * 1024) {
        resolve(file);
        return;
      }

      if (width > height && width > MAX_DIMENSION) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else if (height > MAX_DIMENSION) {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const optimizedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(optimizedFile);
        },
        "image/jpeg",
        0.88
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

  const uploadFileToStorage = async (rawFile: File, folder = "campaigns"): Promise<string> => {
    const file = await optimizeImageBeforeUpload(rawFile);
    // 1. Primary Attempt: /api/storage/upload (Cloudflare R2 / AWS S3 / StorageAsset DB)
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        if (data?.url) return data.url;
      }
    } catch {
      // Primary route network error handled, proceeding to secondary fallback
    }

    // 2. Secondary Attempt: /api/storage/local-upload (Universal disk/buffer fallback)
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`);

      const res = await fetch("/api/storage/local-upload", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        if (data?.url || data?.path) return data.url || data.path;
      }
    } catch (e) {
      console.warn("Local storage fallback route unavailable, reading as inline data URI:", e);
    }

    // 3. Resilient Client-Side Fallback: Read as high-resolution base64 data URI
    // Guarantees zero alert dialogs, uninterrupted workflow, and instant visual feedback
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          resolve(URL.createObjectURL(file));
        }
      };
      reader.onerror = () => {
        resolve(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetKey: "heroImageUrl" | "attachmentImageUrl" | "brandLogoUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(targetKey);
    try {
      const folder = targetKey === "brandLogoUrl" ? "branding" : "campaigns";
      const uploadedUrl = await uploadFileToStorage(file, folder);

      setState((prev) => ({
        ...prev,
        [targetKey]: uploadedUrl,
        ...(targetKey === "heroImageUrl" && prev.heroLayout === "none"
          ? { heroLayout: "top_full" }
          : {}),
      }));
    } catch (err: unknown) {
      console.error("Storage upload failed, falling back to local file preview:", err);
      try {
        const localPreview = URL.createObjectURL(file);
        setState((prev) => ({
          ...prev,
          [targetKey]: localPreview,
          ...(targetKey === "heroImageUrl" && prev.heroLayout === "none"
            ? { heroLayout: "top_full" }
            : {}),
        }));
      } catch {
        // Silent recovery
      }
    } finally {
      setIsUploadingImage(null);
      e.target.value = "";
    }
  };

  // Custom Blocks Management
  const addCustomBlock = (type: CustomEmailBlock["type"]) => {
    const newBlock: CustomEmailBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      heading: type === "text" ? "Additional Section Heading" : undefined,
      content:
        type === "text"
          ? "Add extra details, agenda items, or notes for your recipients here."
          : undefined,
      leftTitle: type === "two_column" ? "Date & Time" : undefined,
      leftBody: type === "two_column" ? "Saturday, 10:00 AM WAT" : undefined,
      rightTitle: type === "two_column" ? "Location / Stream" : undefined,
      rightBody: type === "two_column" ? "Victoria Island, Lagos" : undefined,
      imageUrl: type === "image" ? "/images/team-dexta.jpg" : undefined,
      imageCaption: type === "image" ? "Dexta Africa Project Highlight" : undefined,
    };
    updateField("customBlocks", [...state.customBlocks, newBlock]);
  };

  const updateCustomBlock = (id: string, patch: Partial<CustomEmailBlock>) => {
    updateField(
      "customBlocks",
      state.customBlocks.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  };

  const removeCustomBlock = (id: string) => {
    updateField(
      "customBlocks",
      state.customBlocks.filter((b) => b.id !== id)
    );
  };

  const moveCustomBlock = (index: number, direction: -1 | 1) => {
    const next = [...state.customBlocks];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(targetIdx, 0, item);
    updateField("customBlocks", next);
  };

  const handleCustomBlockImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    blockId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(blockId);
    try {
      const uploadedUrl = await uploadFileToStorage(file, "campaigns");
      updateCustomBlock(blockId, { imageUrl: uploadedUrl });
    } catch (err: unknown) {
      console.error("Custom block image upload failed, falling back to local file preview:", err);
      try {
        const localPreview = URL.createObjectURL(file);
        updateCustomBlock(blockId, { imageUrl: localPreview });
      } catch {
        // Silent recovery
      }
    } finally {
      setIsUploadingImage(null);
      e.target.value = "";
    }
  };

  const insertPersonalization = (placeholder: string) => {
    updateField("bodyText", `${state.bodyText} ${placeholder}`);
  };

  const syncVisualToCustomHtml = () => {
    const generated = compileStudioEmailHtml(
      { ...state, useCustomHtmlOverride: false },
      false,
      false
    );
    setState((prev) => ({
      ...prev,
      customHtmlCode: generated,
      useCustomHtmlOverride: true,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const compiledHtml = compileStudioEmailHtml(state, false, true);
    await onSaveDraft({
      id: initialData?.id,
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

  const sampleName = state.previewRecipientName || "Olamide";
  const replaceSample = (txt: string) => txt.replace(/\{\{firstName\}\}/g, sampleName);
  const isCardDark =
    (state.cardBackgroundColor || "#ffffff").toLowerCase() === "#0f172a" ||
    (state.cardBackgroundColor || "#ffffff").toLowerCase() === "#000000" ||
    (state.cardBackgroundColor || "").toLowerCase().startsWith("#1");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Occasion & Starter Layout Selector */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {initialData?.id
              ? `Editing Saved ${mode === "campaign" ? "Campaign Draft" : "Template"}: ${state.title}`
              : "1. Choose a Starter Occasion or Blank Canvas (100% Customizable)"}
          </label>
          <span className="text-xs text-slate-400">
            Click any element in the live preview on the right to edit it directly
          </span>
        </div>

        <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 xl:grid-cols-6 gap-2.5 pb-2 -mx-1 px-1 no-scrollbar">
          {EMAIL_OCCASION_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = state.occasion === preset.id && !state.useCustomHtmlOverride;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectOccasion(preset)}
                className={`flex flex-col items-start justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer min-h-[96px] min-w-[150px] sm:min-w-0 shrink-0 sm:shrink ${
                  isSelected
                    ? "border-red-600 bg-red-50/70 dark:bg-red-950/25 shadow-xs ring-1 ring-red-600/30"
                    : "border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#14151b] hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                <div className="w-full">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg mb-2 ${
                      isSelected
                        ? "bg-red-600 text-white"
                        : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate w-full">
                    {preset.label}
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {preset.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile View Toggle: Switch between Inspector & Canvas Preview */}
      <div className="lg:hidden flex items-center justify-center p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10">
        <button
          type="button"
          onClick={() => setMobileView("editor")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mobileView === "editor"
              ? "bg-white dark:bg-[#1a1c24] text-red-600 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Editor &amp; Blocks</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView("preview")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mobileView === "preview"
              ? "bg-white dark:bg-[#1a1c24] text-red-600 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Live Email Canvas</span>
        </button>
      </div>

      {/* Main Two-Column Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Multi-Tab Design & Content Inspector (6 cols) */}
        <div className={`lg:col-span-6 space-y-5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121318] p-3.5 sm:p-6 shadow-xs ${mobileView === "editor" ? "block" : "hidden lg:block"}`}>
          {/* Studio Mode Switcher Tabs */}
          <div className="border-b border-slate-100 dark:border-white/[0.06] pb-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04]">
              <button
                type="button"
                onClick={() => setStudioTab("content")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all cursor-pointer ${
                  studioTab === "content"
                    ? "bg-white dark:bg-[#1d1f29] text-red-600 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Content</span>
              </button>
              <button
                type="button"
                onClick={() => setStudioTab("design")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all cursor-pointer ${
                  studioTab === "design"
                    ? "bg-white dark:bg-[#1d1f29] text-red-600 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Palette className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Design</span>
              </button>
              {mode === "campaign" && (
                <button
                  type="button"
                  onClick={() => setStudioTab("audience")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all cursor-pointer ${
                    studioTab === "audience"
                      ? "bg-white dark:bg-[#1d1f29] text-red-600 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Audience</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 shrink-0">
                    {recipientSource === "custom_list" || recipientSource === "external_link"
                      ? `${customRecipients.length}`
                      : selectedAudience.startsWith("FORM:")
                      ? `${availableForms.find((f) => `FORM:${f.slug}` === selectedAudience)?.submissionsCount || 0}`
                      : `${selectedAudience === "ALL" ? audienceCounts.total : (audienceCounts.categories[selectedAudience] || 0)}`}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!state.customHtmlCode) {
                    const compiled = compileStudioEmailHtml(
                      { ...state, useCustomHtmlOverride: false },
                      false,
                      false
                    );
                    updateField("customHtmlCode", compiled);
                  }
                  setStudioTab("html");
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all cursor-pointer ${
                  studioTab === "html"
                    ? "bg-white dark:bg-[#1d1f29] text-red-600 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Code2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">HTML Code</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 px-1">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Live Editable
              </span>
            </div>
          </div>

          {/* TAB 1: CONTENT & BLOCKS */}
          {studioTab === "content" && (
            <div className="space-y-5 animate-fade-in">
              {/* Title & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {mode === "campaign" ? "Draft / Campaign Title" : "Template Name"}
                  </label>
                  <input
                    type="text"
                    value={state.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-white focus:border-red-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preview Recipient Name
                  </label>
                  <input
                    type="text"
                    value={state.previewRecipientName}
                    onChange={(e) => updateField("previewRecipientName", e.target.value)}
                    placeholder="e.g. Olamide, Amara, Chief Adeyemi"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-red-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={state.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3.5 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:border-red-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Hero Flyer Image Controls */}
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Hero Flyer / Banner Image
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Upload any image, paste an image URL, or choose from your gallery
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
                      disabled={isUploadingImage === "heroImageUrl"}
                      onClick={() => heroInputRef.current?.click()}
                      leftIcon={
                        isUploadingImage === "heroImageUrl" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                        ) : (
                          <ImagePlus className="h-3.5 w-3.5 text-red-600" />
                        )
                      }
                    >
                      {isUploadingImage === "heroImageUrl" ? "Uploading to Storage..." : "Upload Flyer"}
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => openAssetVault("heroImageUrl")}
                      leftIcon={<FolderOpen className="h-3.5 w-3.5 text-slate-500" />}
                    >
                      Browse Vault
                    </Button>
                    {state.heroImageUrl && (
                      <button
                        type="button"
                        onClick={() => updateField("heroImageUrl", "")}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remove flyer image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  value={state.heroImageUrl.startsWith("data:") ? "" : state.heroImageUrl}
                  onChange={(e) => {
                    updateField("heroImageUrl", e.target.value);
                    if (e.target.value && state.heroLayout === "none") {
                      updateField("heroLayout", "top_full");
                    }
                  }}
                  placeholder={
                    state.heroImageUrl.startsWith("data:")
                      ? "Custom uploaded image active (or paste a new image URL here)"
                      : "Or paste any image URL (e.g. /images/team-dexta.jpg or https://...)"
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                />

                <div className="flex flex-wrap items-center gap-2">
                  {CURATED_BANNERS.map((banner) => (
                    <button
                      key={banner.url}
                      type="button"
                      onClick={() => {
                        updateField("heroImageUrl", banner.url);
                        if (state.heroLayout === "none") updateField("heroLayout", "top_full");
                      }}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                        state.heroImageUrl === banner.url
                          ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={banner.url}
                        alt={banner.label}
                        className="h-4 w-4 rounded object-cover"
                      />
                      {banner.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Badge, Headline, Greeting */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Category Badge
                    </label>
                    <input
                      type="checkbox"
                      checked={state.showCategoryBadge}
                      onChange={(e) => updateField("showCategoryBadge", e.target.checked)}
                      className="accent-red-600 cursor-pointer"
                      title="Show/Hide Category Pill"
                    />
                  </div>
                  <input
                    type="text"
                    value={state.categoryBadge}
                    onChange={(e) => updateField("categoryBadge", e.target.value)}
                    disabled={!state.showCategoryBadge}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white disabled:opacity-40"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Main Headline
                  </label>
                  <textarea
                    rows={2}
                    value={state.headline}
                    onChange={(e) => updateField("headline", e.target.value)}
                    placeholder="Enter high-impact email headline..."
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3.5 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none leading-snug"
                  />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Salutation & Main Message
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => insertPersonalization("{{firstName}}")}
                      className="rounded-md bg-red-50 dark:bg-red-950/30 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 cursor-pointer"
                    >
                      + Insert First Name
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={state.salutation}
                  onChange={(e) => updateField("salutation", e.target.value)}
                  placeholder="Dear {{firstName}}, (leave blank to hide)"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-white mb-2.5"
                />
                <textarea
                  rows={5}
                  value={state.bodyText}
                  onChange={(e) => updateField("bodyText", e.target.value)}
                  placeholder="Write your email message here..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] p-3.5 text-sm leading-relaxed text-slate-900 dark:text-white focus:border-red-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Featured Callout Box (Toggleable) */}
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.02] p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Featured Callout Box (Event Details, Schedule, or Highlight)
                  </span>
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.showHighlightBox}
                      onChange={(e) => updateField("showHighlightBox", e.target.checked)}
                      className="accent-red-600"
                    />
                    Show Box
                  </label>
                </div>
                {state.showHighlightBox && (
                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    <input
                      type="text"
                      value={state.highlightTitle}
                      onChange={(e) => updateField("highlightTitle", e.target.value)}
                      placeholder="Callout Heading (e.g. Event Schedule & Venue)"
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                    <textarea
                      rows={2}
                      value={state.highlightDetails}
                      onChange={(e) => updateField("highlightDetails", e.target.value)}
                      placeholder="Callout details..."
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Custom Sections Builder */}
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.02] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Extra Custom Sections ({state.customBlocks.length})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Add extra paragraphs, photos, two-column schedules, or dividers anywhere
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      size="xs"
                      variant="secondary"
                      onClick={() => addCustomBlock("text")}
                      leftIcon={<Plus className="h-3 w-3" />}
                    >
                      Text Block
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="secondary"
                      onClick={() => addCustomBlock("image")}
                      leftIcon={<Plus className="h-3 w-3" />}
                    >
                      Image Card
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="secondary"
                      onClick={() => addCustomBlock("two_column")}
                      leftIcon={<Plus className="h-3 w-3" />}
                    >
                      2-Column Grid
                    </Button>
                  </div>
                </div>

                {state.customBlocks.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {state.customBlocks.map((block, idx) => (
                      <div
                        key={block.id}
                        className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] p-3.5 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                            {block.type === "text"
                              ? "Custom Text Section"
                              : block.type === "image"
                              ? "Custom Photo / Flyer Block"
                              : block.type === "two_column"
                              ? "Two-Column Info Grid"
                              : "Divider Line"}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveCustomBlock(idx, -1)}
                              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveCustomBlock(idx, 1)}
                              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCustomBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                              title="Remove Block"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {block.type === "text" && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={block.heading || ""}
                              onChange={(e) =>
                                updateCustomBlock(block.id, { heading: e.target.value })
                              }
                              placeholder="Section Subheading"
                              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121318] px-3 py-1.5 text-xs font-bold"
                            />
                            <textarea
                              rows={2}
                              value={block.content || ""}
                              onChange={(e) =>
                                updateCustomBlock(block.id, { content: e.target.value })
                              }
                              placeholder="Section text..."
                              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121318] px-3 py-1.5 text-xs"
                            />
                          </div>
                        )}

                        {block.type === "image" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={
                                  block.imageUrl?.startsWith("data:")
                                    ? ""
                                    : block.imageUrl || ""
                                }
                                onChange={(e) =>
                                  updateCustomBlock(block.id, { imageUrl: e.target.value })
                                }
                                placeholder="Paste image URL or upload file ->"
                                className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121318] px-3 py-1.5 text-xs"
                              />
                              <label className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 px-2.5 py-1.5 text-xs font-semibold cursor-pointer hover:bg-slate-200 flex items-center gap-1.5">
                                {isUploadingImage === block.id ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <ImagePlus className="h-3.5 w-3.5" />
                                    <span>Upload Photo</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={isUploadingImage === block.id}
                                  onChange={(e) => handleCustomBlockImageUpload(e, block.id)}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => openAssetVault(block.id)}
                                className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 px-2 py-1.5 text-xs font-semibold hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                                title="Browse corporate media vault"
                              >
                                <FolderOpen className="h-3.5 w-3.5 text-slate-500" />
                                <span>Vault</span>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={block.imageCaption || ""}
                              onChange={(e) =>
                                updateCustomBlock(block.id, { imageCaption: e.target.value })
                              }
                              placeholder="Optional image caption..."
                              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121318] px-3 py-1.5 text-xs"
                            />
                          </div>
                        )}

                        {block.type === "two_column" && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={block.leftTitle || ""}
                                onChange={(e) =>
                                  updateCustomBlock(block.id, { leftTitle: e.target.value })
                                }
                                placeholder="Left Column Title"
                                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121318] px-2.5 py-1 text-xs font-bold"
                              />
                              <input
                                type="text"
                                value={block.leftBody || ""}
                                onChange={(e) =>
                                  updateCustomBlock(block.id, { leftBody: e.target.value })
                                }
                                placeholder="Left Column Details"
                                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121318] px-2.5 py-1 text-xs"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={block.rightTitle || ""}
                                onChange={(e) =>
                                  updateCustomBlock(block.id, { rightTitle: e.target.value })
                                }
                                placeholder="Right Column Title"
                                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121318] px-2.5 py-1 text-xs font-bold"
                              />
                              <input
                                type="text"
                                value={block.rightBody || ""}
                                onChange={(e) =>
                                  updateCustomBlock(block.id, { rightBody: e.target.value })
                                }
                                placeholder="Right Column Details"
                                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121318] px-2.5 py-1 text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button & Sign-Off Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Call-to-Action Button
                    </label>
                    <input
                      type="checkbox"
                      checked={state.showCta}
                      onChange={(e) => updateField("showCta", e.target.checked)}
                      className="accent-red-600 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={state.ctaLabel}
                    onChange={(e) => updateField("ctaLabel", e.target.value)}
                    disabled={!state.showCta}
                    placeholder="Button Text"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3 py-2 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Button Destination Link
                  </label>
                  <div className="relative">
                    <Link2 className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={state.ctaUrl}
                      onChange={(e) => updateField("ctaUrl", e.target.value)}
                      disabled={!state.showCta}
                      placeholder="https://dextaafrica.com"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              {/* Sign-Off & Footer Signature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Signature Name / Team
                  </label>
                  <input
                    type="text"
                    value={state.signOffName}
                    onChange={(e) => updateField("signOffName", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Signature Title / Department
                  </label>
                  <input
                    type="text"
                    value={state.signOffRole}
                    onChange={(e) => updateField("signOffRole", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#171821] px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DESIGN, COLORS, BRANDING & LAYOUT */}
          {studioTab === "design" && (
            <div className="space-y-5 animate-fade-in">
              {/* Custom Color Studio */}
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 space-y-3">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Brand & Theme Color Studio
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {ACCENT_PALETTE.map((swatch) => (
                    <button
                      key={swatch.color}
                      type="button"
                      onClick={() => updateField("accentColor", swatch.color)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all ${
                        state.accentColor.toLowerCase() === swatch.color.toLowerCase()
                          ? "border-slate-900 dark:border-white bg-white dark:bg-white/10 shadow-2xs"
                          : "border-slate-200 dark:border-white/10 bg-white/60 dark:bg-transparent"
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: swatch.color }}
                      />
                      {swatch.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Custom Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={state.accentColor}
                        onChange={(e) => updateField("accentColor", e.target.value)}
                        className="h-8 w-10 rounded cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={state.accentColor}
                        onChange={(e) => updateField("accentColor", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Email Card Background
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={state.cardBackgroundColor}
                        onChange={(e) => updateField("cardBackgroundColor", e.target.value)}
                        className="h-8 w-10 rounded cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={state.cardBackgroundColor}
                        onChange={(e) => updateField("cardBackgroundColor", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={state.textColor}
                        onChange={(e) => updateField("textColor", e.target.value)}
                        className="h-8 w-10 rounded cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={state.textColor}
                        onChange={(e) => updateField("textColor", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Flyer Placement & Sizing */}
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 space-y-3">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Flyer & Banner Placement
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Banner Position
                    </label>
                    <select
                      value={state.heroLayout}
                      onChange={(e) =>
                        updateField(
                          "heroLayout",
                          e.target.value as EmailStudioState["heroLayout"]
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-2 text-xs font-semibold"
                    >
                      <option value="top_full">Top Full-Width (Above Logo)</option>
                      <option value="below_header">Below Logo Header</option>
                      <option value="inset_card">Inset Rounded Card</option>
                      <option value="none">No Top Banner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Banner Height
                    </label>
                    <select
                      value={state.heroHeight}
                      onChange={(e) =>
                        updateField(
                          "heroHeight",
                          e.target.value as EmailStudioState["heroHeight"]
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-2 text-xs font-semibold"
                    >
                      <option value="compact">Compact (210px)</option>
                      <option value="standard">Standard (300px)</option>
                      <option value="tall">Tall Poster (420px)</option>
                      <option value="auto">Full Uncropped Flyer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Image Scaling
                    </label>
                    <select
                      value={state.heroObjectFit}
                      onChange={(e) =>
                        updateField(
                          "heroObjectFit",
                          e.target.value as EmailStudioState["heroObjectFit"]
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-2 text-xs font-semibold"
                    >
                      <option value="cover">Fill Width (Cover)</option>
                      <option value="contain">Show Entire Image (Contain)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Official Logo & Brand Header Bar Customization */}
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Brand Logo Header Customization
                  </p>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.showBrandHeader}
                      onChange={(e) => updateField("showBrandHeader", e.target.checked)}
                      className="accent-red-600"
                    />
                    Show Brand Header
                  </label>
                </div>

                {state.showBrandHeader && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Header Alignment
                        </label>
                        <select
                          value={state.brandHeaderAlignment}
                          onChange={(e) =>
                            updateField(
                              "brandHeaderAlignment",
                              e.target.value as EmailStudioState["brandHeaderAlignment"]
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-2 text-xs font-semibold"
                        >
                          <option value="split">Logo Left + Tagline Right</option>
                          <option value="center">Centered Logo</option>
                          <option value="left">Logo Left Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Header Background
                        </label>
                        <select
                          value={state.brandHeaderBg}
                          onChange={(e) =>
                            updateField(
                              "brandHeaderBg",
                              e.target.value as EmailStudioState["brandHeaderBg"]
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-2 text-xs font-semibold"
                        >
                          <option value="white">Pure White</option>
                          <option value="soft">Soft Porcelain</option>
                          <option value="tinted">Tinted Accent</option>
                          <option value="dark">Dark Executive Slate</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Right Header Tagline
                        </label>
                        <input
                          type="text"
                          value={state.brandRightLabel}
                          onChange={(e) => updateField("brandRightLabel", e.target.value)}
                          placeholder="Official Dispatch"
                          className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileSelect(e, "brandLogoUrl")}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          size="xs"
                          variant="secondary"
                          disabled={isUploadingImage === "brandLogoUrl"}
                          onClick={() => logoInputRef.current?.click()}
                          leftIcon={
                            isUploadingImage === "brandLogoUrl" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                            ) : undefined
                          }
                        >
                          {isUploadingImage === "brandLogoUrl" ? "Uploading to Storage..." : "Upload Custom Logo"}
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => openAssetVault("brandLogoUrl")}
                          leftIcon={<FolderOpen className="h-3.5 w-3.5 text-slate-500" />}
                        >
                          Browse Vault
                        </Button>
                        {state.brandLogoUrl !== "/dexta.svg" && (
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            onClick={() => updateField("brandLogoUrl", "/dexta.svg")}
                          >
                            Reset to Dexta Logo
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">
                          Logo Size:
                        </span>
                        <input
                          type="range"
                          min={22}
                          max={56}
                          value={state.brandLogoHeight}
                          onChange={(e) =>
                            updateField("brandLogoHeight", Number(e.target.value))
                          }
                          className="accent-red-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Typography, Alignment & Button Shape */}
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 space-y-3">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Typography, Text Alignment & Button Style
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Font Style
                    </label>
                    <select
                      value={state.fontFamily}
                      onChange={(e) =>
                        updateField(
                          "fontFamily",
                          e.target.value as EmailStudioState["fontFamily"]
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-2 text-xs font-semibold"
                    >
                      <option value="sans">Modern Sans</option>
                      <option value="serif">Editorial Serif</option>
                      <option value="clean">Clean Corporate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Text Alignment
                    </label>
                    <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] p-1">
                      <button
                        type="button"
                        onClick={() => updateField("contentAlignment", "left")}
                        className={`flex items-center justify-center gap-1 rounded py-1 text-xs font-semibold cursor-pointer ${
                          state.contentAlignment === "left"
                            ? "bg-red-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        <AlignLeft className="h-3.5 w-3.5" />
                        Left
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("contentAlignment", "center")}
                        className={`flex items-center justify-center gap-1 rounded py-1 text-xs font-semibold cursor-pointer ${
                          state.contentAlignment === "center"
                            ? "bg-red-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        <AlignCenter className="h-3.5 w-3.5" />
                        Center
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Headline Size
                    </label>
                    <select
                      value={state.headlineSize}
                      onChange={(e) =>
                        updateField(
                          "headlineSize",
                          e.target.value as EmailStudioState["headlineSize"]
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-2 text-xs font-semibold"
                    >
                      <option value="md">Medium (22px)</option>
                      <option value="lg">Large (27px)</option>
                      <option value="xl">Extra Bold (32px)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Button Shape
                    </label>
                    <select
                      value={state.ctaStyle}
                      onChange={(e) =>
                        updateField("ctaStyle", e.target.value as EmailStudioState["ctaStyle"])
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-2 text-xs font-semibold"
                    >
                      <option value="rounded">Modern Rounded</option>
                      <option value="pill">Full Pill</option>
                      <option value="sharp">Executive Square</option>
                      <option value="outline">Framed Outline</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT HTML & CODE EDITOR */}
          {studioTab === "html" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3.5 border border-slate-200/80 dark:border-white/10">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Direct HTML Design Editor
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Edit the HTML markup directly for unrestricted custom styling — changes render live on the right
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    onClick={syncVisualToCustomHtml}
                    leftIcon={<RotateCcw className="h-3 w-3" />}
                  >
                    Refresh from Visual Builder
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.useCustomHtmlOverride}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked && !state.customHtmlCode.trim()) {
                        syncVisualToCustomHtml();
                      } else {
                        updateField("useCustomHtmlOverride", checked);
                      }
                    }}
                    className="accent-red-600 h-4 w-4"
                  />
                  Enable Custom HTML Override Mode
                </label>
                {state.useCustomHtmlOverride && (
                  <span className="text-[11px] font-semibold text-red-600">
                    Custom HTML Active
                  </span>
                )}
              </div>

              <textarea
                rows={16}
                value={
                  state.useCustomHtmlOverride
                    ? state.customHtmlCode
                    : compileStudioEmailHtml(state, false, false)
                }
                onChange={(e) => {
                  setState((prev) => ({
                    ...prev,
                    useCustomHtmlOverride: true,
                    customHtmlCode: e.target.value,
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-950 text-slate-100 p-4 font-mono text-xs leading-relaxed focus:border-red-500 focus:outline-none"
                spellCheck={false}
              />
            </div>
          )}

          {/* TAB 4: AUDIENCE & RECIPIENT DISPATCH (Campaign Mode) */}
          {mode === "campaign" && studioTab === "audience" && (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-white/[0.04] dark:to-white/[0.02] p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-red-600" />
                      Recipient &amp; Audience Targeting
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose your email delivery source: platform directory, attached custom list, or live external link
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/40">
                    {recipientSource === "custom_list" || recipientSource === "external_link"
                      ? `${customRecipients.length} Recipient(s)`
                      : selectedAudience.startsWith("FORM:")
                      ? `${availableForms.find((f) => `FORM:${f.slug}` === selectedAudience)?.submissionsCount || 0} Registrant(s)`
                      : `${selectedAudience === "ALL" ? audienceCounts.total : (audienceCounts.categories[selectedAudience] || 0)} Contact(s)`}
                  </span>
                </div>

                {/* 3 Source Options Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRecipientSource("directory")}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      recipientSource === "directory"
                        ? "border-red-600 bg-white dark:bg-[#1a1c24] text-red-600 dark:text-red-400 shadow-xs ring-1 ring-red-600/30"
                        : "border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-red-600" />
                    <div>
                      <div className="leading-tight">Platform Directory</div>
                      <div className="text-[10px] font-normal text-slate-400">Database &amp; Forms</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientSource("custom_list")}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      recipientSource === "custom_list"
                        ? "border-red-600 bg-white dark:bg-[#1a1c24] text-red-600 dark:text-red-400 shadow-xs ring-1 ring-red-600/30"
                        : "border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <FileSpreadsheet className="h-4 w-4 shrink-0 text-red-600" />
                    <div>
                      <div className="leading-tight">Attach Custom List</div>
                      <div className="text-[10px] font-normal text-slate-400">CSV, TXT, or Paste</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientSource("external_link")}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      recipientSource === "external_link"
                        ? "border-red-600 bg-white dark:bg-[#1a1c24] text-red-600 dark:text-red-400 shadow-xs ring-1 ring-red-600/30"
                        : "border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <Globe className="h-4 w-4 shrink-0 text-red-600" />
                    <div>
                      <div className="leading-tight">Fetch External Link</div>
                      <div className="text-[10px] font-normal text-slate-400">API, Webhook, URL</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Source Panel 1: Platform Directory & Forms */}
              {recipientSource === "directory" && (
                <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#171821] p-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-red-600" />
                      Select Audience Segment or Registration Form
                    </label>
                    <select
                      value={selectedAudience}
                      onChange={(e) => handleAudienceChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1c24] px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-red-500 focus:outline-none"
                    >
                      <optgroup label="General Platform Directory">
                        <option value="ALL">All Contacts (Subscribers &amp; Form Registrants)</option>
                        <option value="CLIENT">Clients &amp; Corporate Partners</option>
                        <option value="LEAD">Prospective Inquiries &amp; Commercial Leads</option>
                        <option value="NEWSLETTER">Official Newsletter Subscribers</option>
                      </optgroup>
                      {availableForms.length > 0 && (
                        <optgroup label="Active Forms &amp; Landing Pages">
                          {availableForms.map((form) => (
                            <option key={form.id} value={`FORM:${form.slug}`}>
                              Form: {form.title} ({form.submissionsCount} registrants)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      {selectedAudience.startsWith("FORM:")
                        ? "Delivers this broadcast exclusively to all respondents who completed this registration form."
                        : "Delivers this campaign to all verified contacts matching this audience segment."}
                    </p>
                  </div>
                </div>
              )}

              {/* Source Panel 2: Attach Custom List (CSV / TXT / Paste) */}
              {recipientSource === "custom_list" && (
                <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#171821] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <UploadCloud className="h-3.5 w-3.5 text-red-600" />
                        Upload or Paste Custom Email List
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Accepts CSV, TXT, or direct pasted text. Duplicates and invalid formats are cleaned automatically.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => recipientsFileInputRef.current?.click()}
                      leftIcon={<UploadCloud className="h-3.5 w-3.5" />}
                    >
                      Upload CSV / TXT
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={pastedEmailsText}
                      onChange={(e) => setPastedEmailsText(e.target.value)}
                      placeholder="Paste emails separated by commas or line breaks:&#10;investor@dexta.com&#10;John Doe <john.doe@partner.org>&#10;procurement@enterprise.com"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1a1c24] p-3 text-xs font-mono leading-relaxed focus:border-red-500 focus:outline-none"
                    />
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        size="xs"
                        variant="secondary"
                        onClick={handleParsePastedEmails}
                        disabled={!pastedEmailsText.trim()}
                        leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      >
                        Parse &amp; Validate Emails
                      </Button>
                      {customRecipients.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setCustomRecipients([])}
                          className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                        >
                          Clear Attached List ({customRecipients.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Attached Custom Recipients Live List */}
                  {customRecipients.length > 0 && (
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>Attached Recipients ({customRecipients.length})</span>
                        <span className="text-[10px] font-normal text-slate-400">Showing first 25 entries</span>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                        {customRecipients.slice(0, 25).map((rec, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-1 px-2 rounded-md bg-white dark:bg-[#121318] border border-slate-100 dark:border-white/5"
                          >
                            <span className="text-slate-800 dark:text-slate-200 truncate">
                              {rec.fullName ? `${rec.fullName} <${rec.email}>` : rec.email}
                            </span>
                            <button
                              type="button"
                              onClick={() => setCustomRecipients((prev) => prev.filter((_, idx) => idx !== i))}
                              className="text-slate-400 hover:text-red-600 ml-2"
                              title="Remove recipient"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        {customRecipients.length > 25 && (
                          <p className="text-[10px] text-slate-400 text-center pt-1">
                            ...and {customRecipients.length - 25} more verified recipient(s)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Source Panel 3: Fetch from External Link */}
              {recipientSource === "external_link" && (
                <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#171821] p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-red-600" />
                      Fetch Contacts from External URL / Webhook
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enter any public or authenticated endpoint, Google Sheet CSV export link, or webhook returning contacts.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        placeholder="https://api.domain.com/contacts or Google Sheet CSV link"
                        className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1c24] px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-red-500 focus:outline-none"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        isLoading={isFetchingExternal}
                        onClick={handleFetchExternalLink}
                        leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                        className="bg-red-600 hover:bg-red-700 text-white shrink-0 font-bold"
                      >
                        Fetch Contacts
                      </Button>
                    </div>

                    {externalFetchFeedback && (
                      <div
                        className={`flex items-start gap-1.5 text-[11px] p-2.5 rounded-xl border ${
                          externalFetchFeedback.success
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                            : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40"
                        }`}
                      >
                        {externalFetchFeedback.success ? (
                          <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        )}
                        <span>{externalFetchFeedback.message}</span>
                      </div>
                    )}
                  </div>

                  {customRecipients.length > 0 && (
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>Imported Contacts ({customRecipients.length})</span>
                        <button
                          type="button"
                          onClick={() => setCustomRecipients([])}
                          className="text-[11px] text-red-600 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px]">
                        {customRecipients.slice(0, 15).map((rec, i) => (
                          <div
                            key={i}
                            className="py-1 px-2 rounded-md bg-white dark:bg-[#121318] border border-slate-100 dark:border-white/5 truncate"
                          >
                            {rec.fullName ? `${rec.fullName} <${rec.email}>` : rec.email}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Instant Test Preview Dispatch */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#171821] p-5 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Send Test Preview to Your Inbox</span>
                    <span className="text-[10px] text-slate-400 font-normal">Direct Corporate SMTP Check</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Verify visual layout, white-on-dark logo visibility, and footer formatting before broadcast.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="e.g. it.admin@dextaafrica.com"
                    className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1c24] px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-red-500 focus:outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    isLoading={isSendingTest}
                    onClick={handleSendTestEmail}
                    className="text-xs shrink-0 font-bold"
                  >
                    Send Test Email
                  </Button>
                </div>
                {testSendResult && (
                  <div
                    className={`flex items-start gap-1.5 text-[11px] p-2.5 rounded-xl border ${
                      testSendResult.success
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                        : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40"
                    }`}
                  >
                    {testSendResult.success ? (
                      <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    )}
                    <span>{testSendResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Audience Summary Pill (When on Content/Design/HTML tabs in Campaign mode) */}
          {mode === "campaign" && studioTab !== "audience" && (
            <div className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>
                      {recipientSource === "custom_list"
                        ? `Custom List (${customRecipients.length} attached)`
                        : recipientSource === "external_link"
                        ? `External Link (${customRecipients.length} imported)`
                        : selectedAudience.startsWith("FORM:")
                        ? `Form: ${availableForms.find((f) => `FORM:${f.slug}` === selectedAudience)?.title || selectedAudience}`
                        : selectedAudience === "ALL"
                        ? "All Platform Contacts"
                        : `${selectedAudience}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {recipientSource !== "directory"
                      ? `${customRecipients.length} custom recipient(s) ready`
                      : selectedAudience.startsWith("FORM:")
                      ? `${availableForms.find((f) => `FORM:${f.slug}` === selectedAudience)?.submissionsCount || 0} registered attendee(s)`
                      : `${selectedAudience === "ALL" ? audienceCounts.total : (audienceCounts.categories[selectedAudience] || 0)} verified contact(s)`}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => setStudioTab("audience")}
                leftIcon={<Users className="h-3 w-3" />}
              >
                Change Audience / Attach List
              </Button>
            </div>
          )}

          {/* Action Bar: 2-Tier High-Grade Responsive Control Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
            {/* Row 1: Secondary Media Attachments & Vault Tools */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileSelect(e, "attachmentImageUrl")}
                  className="hidden"
                />
                <input
                  ref={recipientsFileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUploadRecipients}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  disabled={isUploadingImage === "attachmentImageUrl"}
                  onClick={() => attachmentInputRef.current?.click()}
                  leftIcon={
                    isUploadingImage === "attachmentImageUrl" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                    ) : (
                      <Paperclip className="h-3.5 w-3.5" />
                    )
                  }
                  className="whitespace-nowrap"
                >
                  {isUploadingImage === "attachmentImageUrl"
                    ? "Uploading..."
                    : state.attachmentImageUrl
                    ? "Change Bottom Photo"
                    : "Attach Bottom Photo"}
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => openAssetVault("attachmentImageUrl")}
                  leftIcon={<FolderOpen className="h-3.5 w-3.5 text-slate-500" />}
                  className="whitespace-nowrap"
                >
                  Browse Vault
                </Button>
                {state.attachmentImageUrl && (
                  <button
                    type="button"
                    onClick={() => updateField("attachmentImageUrl", "")}
                    className="text-xs text-red-600 hover:underline cursor-pointer font-medium ml-1"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {state.attachmentImageUrl ? "✓ Bottom photo attached" : "Optional attachment"}
              </div>
            </div>

            {/* Row 2: Primary Draft, Schedule, & Dispatch Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-dashed border-slate-100 dark:border-white/[0.04]">
              <div className="flex items-center gap-2">
                {onCancel && (
                  <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="whitespace-nowrap">
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="secondary"
                  size="md"
                  isLoading={isSubmitting}
                  leftIcon={<Save className="h-4 w-4" />}
                  className="whitespace-nowrap font-semibold shadow-2xs"
                >
                  {initialData?.id
                    ? mode === "campaign"
                      ? "Update Draft"
                      : "Update Saved Template"
                    : mode === "campaign"
                    ? "Save Campaign Draft"
                    : "Save New Template"}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {mode === "campaign" && onSchedule && (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setIsScheduleModalOpen(true)}
                    leftIcon={<Clock className="h-4 w-4 text-amber-600" />}
                    className="font-bold border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 whitespace-nowrap shrink-0"
                  >
                    📅 Schedule
                  </Button>
                )}
                {mode === "campaign" && onDispatchNow && (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => setIsDispatchModalOpen(true)}
                    leftIcon={<Send className="h-4 w-4" />}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm whitespace-nowrap shrink-0 px-4"
                  >
                    🚀 Send Broadcast
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Live Canvas & HTML Preview (6 cols) */}
        <div className={`lg:col-span-6 space-y-3 lg:sticky lg:top-20 ${mobileView === "preview" ? "block" : "hidden lg:block"}`}>
          <div
            className="rounded-2xl border border-slate-200/90 dark:border-white/10 p-4 sm:p-6 shadow-sm transition-colors"
            style={{ backgroundColor: state.canvasBackgroundColor || "#F8FAFC" }}
          >
            {/* Top Email Envelope Header Bar (Editable directly!) */}
            <div className="mb-5 space-y-2.5 border-b border-slate-200/80 pb-4 text-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-white shrink-0"
                    style={{ backgroundColor: state.accentColor }}
                  >
                    <User className="h-3 w-3" />
                  </span>
                  <span className="text-slate-600 font-medium">
                    From{" "}
                    <input
                      type="text"
                      value={state.senderName}
                      onChange={(e) => updateField("senderName", e.target.value)}
                      className="font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-red-600 focus:outline-none w-28"
                      title="Click to edit Sender Name"
                    />{" "}
                    on {currentTimestamp}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200/80 px-2.5 py-0.5 text-[11px] font-bold text-red-600 shadow-2xs">
                    <Sparkles className="h-3 w-3 text-red-500" />
                    Interactive Canvas
                  </span>
                </div>
              </div>

              {/* Full-Width Subject Line Input (Multi-Line Auto-Wrapping) */}
              <div className="pt-1">
                <textarea
                  rows={1}
                  value={state.subject}
                  onChange={(e) => {
                    updateField("subject", e.target.value);
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                  }}
                  placeholder="Click to edit email subject line..."
                  className="w-full bg-transparent text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug focus:outline-none focus:ring-2 focus:ring-red-500/30 rounded px-1 -mx-1 resize-none overflow-hidden block break-words"
                  title="Click to edit Subject Line directly"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 text-red-600 font-semibold">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("visual")}
                    className={`cursor-pointer hover:underline ${
                      previewTab === "visual" ? "underline font-bold" : "opacity-75"
                    }`}
                  >
                    Visual Canvas
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!state.customHtmlCode) {
                        updateField(
                          "customHtmlCode",
                          compileStudioEmailHtml(state, false, false)
                        );
                      }
                      setPreviewTab("html_code");
                    }}
                    className={`cursor-pointer hover:underline ${
                      previewTab === "html_code" ? "underline font-bold" : "opacity-75"
                    }`}
                  >
                    HTML Code
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("details")}
                    className={`cursor-pointer hover:underline ${
                      previewTab === "details" ? "underline font-bold" : "opacity-75"
                    }`}
                  >
                    Details
                  </button>
                  <span className="text-slate-300">|</span>
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
                <div className="mt-3 rounded-xl bg-white p-3.5 text-xs border border-slate-200/80 space-y-2 text-slate-600">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="font-bold text-slate-900">Sender Name: </span>
                      <input
                        type="text"
                        value={state.senderName}
                        onChange={(e) => updateField("senderName", e.target.value)}
                        className="border-b border-slate-200 px-1 py-0.5 text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Sender Email: </span>
                      <input
                        type="text"
                        value={state.senderEmail}
                        onChange={(e) => updateField("senderEmail", e.target.value)}
                        className="border-b border-slate-200 px-1 py-0.5 text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Previewing For Recipient: </span>
                    <input
                      type="text"
                      value={state.previewRecipientName}
                      onChange={(e) => updateField("previewRecipientName", e.target.value)}
                      className="border-b border-slate-200 px-1 py-0.5 font-semibold text-red-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Preview Body Switcher */}
            {previewTab === "plaintext" ? (
              <div className="rounded-2xl bg-white p-6 border border-slate-200 font-sans text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {`${state.showCategoryBadge ? `${state.categoryBadge}\n` : ""}${replaceSample(
                  state.headline
                )}\n\n${replaceSample(state.salutation)}\n\n${replaceSample(state.bodyText)}\n\n${
                  state.showHighlightBox && state.highlightTitle
                    ? `${replaceSample(state.highlightTitle)}\n${replaceSample(
                        state.highlightDetails
                      )}\n\n`
                    : ""
                }${state.showCta && state.ctaLabel ? `${state.ctaLabel}: ${state.ctaUrl}\n\n` : ""}${
                  state.showFooter ? `${state.signOffName}\n${state.signOffRole}` : ""
                }`}
              </div>
            ) : previewTab === "html_code" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-900 text-slate-200 px-4 py-2.5 rounded-t-xl text-xs">
                  <span className="font-semibold">Live Editable HTML Source</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={syncVisualToCustomHtml}
                      className="rounded bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                    >
                      Reset from Visual Canvas
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab("visual")}
                      className="rounded bg-red-600 hover:bg-red-700 px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                    >
                      View Rendered Design
                    </button>
                  </div>
                </div>
                <textarea
                  rows={20}
                  value={
                    state.useCustomHtmlOverride
                      ? state.customHtmlCode
                      : compileStudioEmailHtml(state, false, false)
                  }
                  onChange={(e) => {
                    setState((prev) => ({
                      ...prev,
                      useCustomHtmlOverride: true,
                      customHtmlCode: e.target.value,
                    }));
                  }}
                  className="w-full rounded-b-xl border border-slate-800 bg-slate-950 text-emerald-300 p-4 font-mono text-xs leading-relaxed focus:outline-none"
                  spellCheck={false}
                />
              </div>
            ) : state.useCustomHtmlOverride ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200">
                  <span className="font-semibold">
                    Previewing Custom HTML Mode — you can edit the HTML or switch back to Visual Blocks
                  </span>
                  <button
                    type="button"
                    onClick={() => updateField("useCustomHtmlOverride", false)}
                    className="font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Switch to Visual Blocks
                  </button>
                </div>
                <div
                  className="mx-auto max-w-[620px] rounded-2xl overflow-hidden shadow-md"
                  dangerouslySetInnerHTML={{
                    __html: replaceSample(state.customHtmlCode),
                  }}
                />
              </div>
            ) : (
              /* INTERACTIVE CLICK-TO-EDIT VISUAL EMAIL CANVAS */
              <div
                className="mx-auto max-w-[600px] overflow-hidden rounded-2xl shadow-md border border-slate-200/90 transition-all"
                style={{
                  backgroundColor: state.cardBackgroundColor || "#FFFFFF",
                  color: state.textColor || "#0F172A",
                  fontFamily: getFontStack(state.fontFamily),
                }}
              >
                {/* Hero Banner if Top Full-Width */}
                {state.heroImageUrl && state.heroLayout === "top_full" && (
                  <div
                    className="relative w-full overflow-hidden group"
                    style={{ backgroundColor: state.cardBackgroundColor || "#ffffff" }}
                  >
                    <img
                      src={state.heroImageUrl}
                      alt={state.headline}
                      style={{
                        maxHeight: getHeroHeightPx(state.heroHeight),
                        objectFit: state.heroObjectFit,
                      }}
                      className="w-full object-top block"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => heroInputRef.current?.click()}
                        className="rounded-lg bg-slate-900/85 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer hover:bg-red-600 transition-colors"
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                        Replace Flyer
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            "heroHeight",
                            state.heroHeight === "auto" ? "standard" : "auto"
                          )
                        }
                        className="rounded-lg bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 text-xs font-semibold text-white cursor-pointer hover:bg-slate-800"
                      >
                        {state.heroHeight === "auto" ? "Crop Standard" : "Full Height"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Colored Accent Bar (Click to open color picker!) */}
                <div className="relative group">
                  <div
                    className="h-1.5 w-full transition-colors"
                    style={{ backgroundColor: state.accentColor }}
                  />
                </div>

                {/* Official Brand Logo Header Row */}
                {state.showBrandHeader && (
                  <div
                    className={`flex items-center px-7 py-5 border-b border-slate-100 transition-colors ${
                      state.brandHeaderAlignment === "center"
                        ? "justify-center"
                        : state.brandHeaderAlignment === "left"
                        ? "justify-start"
                        : "justify-between"
                    }`}
                    style={{
                      backgroundColor:
                        state.brandHeaderBg === "dark"
                          ? "#0f172a"
                          : state.brandHeaderBg === "soft"
                          ? "#f8fafc"
                          : state.brandHeaderBg === "tinted"
                          ? `${state.accentColor}12`
                          : "#ffffff",
                    }}
                  >
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="flex items-center gap-3 cursor-pointer group"
                      title="Click to replace or customize brand logo"
                    >
                      <img
                        src={
                          state.brandLogoUrl && !state.brandLogoUrl.includes("dexta")
                            ? state.brandLogoUrl
                            : state.brandHeaderBg === "dark"
                            ? "/images/dexta-logo-light.png"
                            : "/images/dexta-logo-dark.png"
                        }
                        alt={state.senderName}
                        style={{ height: `${state.brandLogoHeight || 32}px` }}
                        className="w-auto object-contain group-hover:opacity-80 transition-opacity"
                      />
                    </div>
                    {state.brandHeaderAlignment === "split" && (
                      <div className="flex items-center gap-1.5 pl-3">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: state.accentColor }}
                        />
                        <input
                          type="text"
                          value={state.brandRightLabel}
                          onChange={(e) => updateField("brandRightLabel", e.target.value)}
                          className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-right bg-transparent focus:outline-none focus:ring-1 focus:ring-red-500/40 rounded px-1.5 py-0.5 transition-all"
                          style={{
                            color: state.brandHeaderBg === "dark" ? "#cbd5e1" : "#64748b",
                            width: `${Math.max(16, Math.ceil((state.brandRightLabel || "").length * 1.4 + 3))}ch`,
                          }}
                          title="Click to edit header tagline"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Hero Banner if Below Header or Inset Card */}
                {state.heroImageUrl &&
                  (state.heroLayout === "below_header" || state.heroLayout === "inset_card") && (
                    <div
                      className={`relative group ${
                        state.heroLayout === "inset_card" ? "px-7 pt-6" : "w-full"
                      }`}
                      style={{ backgroundColor: state.cardBackgroundColor || "#ffffff" }}
                    >
                      <img
                        src={state.heroImageUrl}
                        alt={state.headline}
                        style={{
                          maxHeight: getHeroHeightPx(state.heroHeight),
                          objectFit: state.heroObjectFit,
                        }}
                        className={`w-full object-top block ${
                          state.heroLayout === "inset_card" ? "rounded-xl" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => heroInputRef.current?.click()}
                        className="absolute bottom-3 right-9 rounded-lg bg-slate-900/85 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                        Replace Flyer
                      </button>
                    </div>
                  )}

                {/* Main Editable Email Body Area */}
                <div
                  className={`p-7 sm:p-8 space-y-5 ${
                    state.contentAlignment === "center" ? "text-center" : "text-left"
                  }`}
                >
                  {/* Editable Category Pill Badge */}
                  {state.showCategoryBadge && (
                    <div className={state.contentAlignment === "center" ? "text-center" : "text-left"}>
                      <span
                        className="inline-flex items-center rounded-full px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] border shadow-xs transition-all"
                        style={{
                          backgroundColor: `${state.accentColor}14`,
                          borderColor: `${state.accentColor}30`,
                          color: state.accentColor,
                        }}
                      >
                        <input
                          type="text"
                          value={state.categoryBadge}
                          onChange={(e) => updateField("categoryBadge", e.target.value)}
                          style={{
                            color: state.accentColor,
                            width: `${Math.max(8, Math.ceil((state.categoryBadge || "").length * 1.35 + 2))}ch`,
                          }}
                          className="bg-transparent focus:outline-none text-center font-extrabold tracking-[0.14em]"
                          title="Click to edit Category Badge"
                        />
                      </span>
                    </div>
                  )}

                  {/* Editable Large Bold Headline - Auto-resizing, Multi-line Wrapping */}
                  <div className="relative group">
                    <textarea
                      ref={headlineCanvasRef}
                      rows={1}
                      value={state.headline}
                      onChange={(e) => {
                        updateField("headline", e.target.value);
                        e.currentTarget.style.height = "auto";
                        e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                      }}
                      style={{
                        color: state.textColor || "#0F172A",
                        fontFamily: getFontStack(state.fontFamily),
                      }}
                      className={`w-full bg-transparent font-extrabold tracking-[-0.03em] leading-[1.24] focus:outline-none focus:ring-2 focus:ring-red-500/20 rounded-lg px-2 -mx-2 py-1 -my-1 resize-none overflow-hidden block break-words whitespace-pre-wrap transition-colors ${
                        state.headlineSize === "xl"
                          ? "text-2xl sm:text-[32px]"
                          : state.headlineSize === "md"
                          ? "text-xl sm:text-[22px]"
                          : "text-2xl sm:text-[27px]"
                      } ${state.contentAlignment === "center" ? "text-center" : "text-left"}`}
                      title="Click to edit Headline directly (multi-line supported)"
                    />
                  </div>

                  {/* Editable Personalized Salutation */}
                  {state.salutation && (
                    <p className="text-[15px] font-semibold text-slate-800">
                      {replaceSample(state.salutation)}
                    </p>
                  )}

                  {/* Editable Body Paragraphs */}
                  <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
                    {state.bodyText
                      .split(/\n\s*\n/)
                      .map((p) => p.trim())
                      .filter(Boolean)
                      .map((paragraph, idx) => (
                        <p key={idx} className="whitespace-pre-line">
                          {replaceSample(paragraph)}
                        </p>
                      ))}
                  </div>

                  {/* Editable Highlight Callout Box */}
                  {state.showHighlightBox &&
                    (state.highlightTitle || state.highlightDetails) && (
                      <div
                        className="rounded-xl bg-slate-50 p-4 border-l-4 space-y-1 text-left"
                        style={{ borderLeftColor: state.accentColor }}
                      >
                        <input
                          type="text"
                          value={state.highlightTitle}
                          onChange={(e) => updateField("highlightTitle", e.target.value)}
                          placeholder="Callout Title..."
                          className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                          title="Click to edit Callout Title"
                        />
                        <textarea
                          rows={2}
                          value={state.highlightDetails}
                          onChange={(e) => updateField("highlightDetails", e.target.value)}
                          placeholder="Callout details..."
                          className="w-full bg-transparent text-xs leading-relaxed text-slate-600 focus:outline-none resize-none"
                          title="Click to edit Callout Details"
                        />
                      </div>
                    )}

                  {/* Custom Dynamic Sections Rendered Live */}
                  {state.customBlocks.map((block) => (
                    <div key={block.id} className="relative group">
                      {block.type === "divider" && (
                        <hr className="border-t border-slate-200 my-4" />
                      )}
                      {block.type === "text" && (
                        <div className="space-y-1.5">
                          {block.heading && (
                            <h3 className="text-base font-bold text-slate-900">
                              {replaceSample(block.heading)}
                            </h3>
                          )}
                          {block.content && (
                            <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                              {replaceSample(block.content)}
                            </p>
                          )}
                        </div>
                      )}
                      {block.type === "image" && block.imageUrl && (
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                          <img
                            src={block.imageUrl}
                            alt={block.imageCaption || "Visual"}
                            className="w-full max-h-[280px] object-cover block"
                          />
                          {block.imageCaption && (
                            <div className="px-3.5 py-2 text-xs text-slate-500 border-t border-slate-200">
                              {replaceSample(block.imageCaption)}
                            </div>
                          )}
                        </div>
                      )}
                      {block.type === "two_column" && (
                        <div className="grid grid-cols-2 gap-3 text-left">
                          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                            <p
                              className="text-xs font-bold mb-1"
                              style={{ color: state.accentColor }}
                            >
                              {replaceSample(block.leftTitle || "")}
                            </p>
                            <p className="text-xs text-slate-600">
                              {replaceSample(block.leftBody || "")}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                            <p
                              className="text-xs font-bold mb-1"
                              style={{ color: state.accentColor }}
                            >
                              {replaceSample(block.rightTitle || "")}
                            </p>
                            <p className="text-xs text-slate-600">
                              {replaceSample(block.rightBody || "")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Secondary Supporting Photo Attachment */}
                  {state.attachmentImageUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img
                        src={state.attachmentImageUrl}
                        alt="Attached visual"
                        className="w-full max-h-[260px] object-cover block"
                      />
                    </div>
                  )}

                  {/* Editable Call to Action Button */}
                  {state.showCta && state.ctaLabel && (
                    <div className="pt-2">
                      <span
                        className={`inline-block px-6 py-3 text-sm font-bold shadow-xs transition-all ${
                          state.ctaStyle === "pill"
                            ? "rounded-full"
                            : state.ctaStyle === "sharp"
                            ? "rounded-md"
                            : "rounded-xl"
                        }`}
                        style={
                          state.ctaStyle === "outline"
                            ? {
                                backgroundColor: "transparent",
                                border: `2px solid ${state.accentColor}`,
                                color: state.accentColor,
                              }
                            : {
                                backgroundColor: state.accentColor,
                                color: "#FFFFFF",
                              }
                        }
                      >
                        {replaceSample(state.ctaLabel)}
                      </span>
                    </div>
                  )}

                  {/* Editable Sign-off Footer */}
                  {state.showFooter && (
                    <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-left">
                      <div className="space-y-0.5">
                        <input
                          type="text"
                          value={state.signOffName}
                          onChange={(e) => updateField("signOffName", e.target.value)}
                          className="block bg-transparent text-sm font-bold text-slate-900 focus:outline-none"
                          title="Click to edit Sign-off Name"
                        />
                        <input
                          type="text"
                          value={state.signOffRole}
                          onChange={(e) => updateField("signOffRole", e.target.value)}
                          className="block bg-transparent text-xs text-slate-500 focus:outline-none"
                          title="Click to edit Sign-off Role"
                        />
                      </div>
                      <img
                        src={
                          state.brandLogoUrl && !state.brandLogoUrl.includes("dexta")
                            ? state.brandLogoUrl
                            : isCardDark
                            ? "/images/dexta-logo-light.png"
                            : "/images/dexta-logo-dark.png"
                        }
                        alt="Dexta Africa"
                        className="h-5 w-auto opacity-75"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Broadcast Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => !isScheduling && setIsScheduleModalOpen(false)}
        title="Schedule Email Broadcast"
        description="Configure automated future delivery time via Dexta Africa Enterprise SMTP engine"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isScheduling}
              onClick={() => setIsScheduleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isScheduling}
              onClick={handleConfirmSchedule}
              leftIcon={<Clock className="h-4 w-4" />}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {isScheduling ? "Scheduling..." : "Confirm & Schedule Broadcast"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 pt-1 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Campaign Subject:</span>
              <span className="font-bold text-slate-900 dark:text-white truncate max-w-[240px]">
                {state.subject || state.title || "(Untitled Campaign)"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Target Segment:</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {recipientSource === "custom_list"
                  ? `Custom Attached List (${customRecipients.length} recipients)`
                  : recipientSource === "external_link"
                  ? `Imported External Link (${customRecipients.length} contacts)`
                  : selectedAudience.startsWith("FORM:")
                  ? `Form: ${availableForms.find((f) => `FORM:${f.slug}` === selectedAudience)?.title || selectedAudience}`
                  : selectedAudience === "ALL"
                  ? `All Verified Contacts (${audienceCounts.total})`
                  : `${selectedAudience} (${audienceCounts.categories[selectedAudience] || 0})`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Sender Identity:</span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                {state.senderName} &lt;{state.senderEmail}&gt;
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Select Scheduled Date &amp; Time (WAT / GMT+1)
            </label>
            <input
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1c24] px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-red-500 focus:outline-none"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(Date.now() + 60 * 60 * 1000);
                  const tz = d.getTimezoneOffset() * 60000;
                  setScheduledDateTime(new Date(d.getTime() - tz).toISOString().slice(0, 16));
                }}
                className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                +1 Hour
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(9, 0, 0, 0);
                  const tz = d.getTimezoneOffset() * 60000;
                  setScheduledDateTime(new Date(d.getTime() - tz).toISOString().slice(0, 16));
                }}
                className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Tomorrow 09:00 AM
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 3);
                  d.setHours(10, 0, 0, 0);
                  const tz = d.getTimezoneOffset() * 60000;
                  setScheduledDateTime(new Date(d.getTime() - tz).toISOString().slice(0, 16));
                }}
                className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                In 3 Days
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Automated SMTP Queue Notice
            </p>
            <p>
              This broadcast will be queued. At the specified time, our delivery engine will automatically transmit personalized individual emails with delivery logging.
            </p>
          </div>
        </div>
      </Modal>

      {/* Broadcast Dispatch Confirmation Modal */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => !isDispatching && setIsDispatchModalOpen(false)}
        title="Confirm Campaign Broadcast Dispatch"
        description="Verify recipient target and dispatch details before transmitting via corporate SMTP."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDispatching}
              onClick={() => setIsDispatchModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isDispatching}
              disabled={
                isDispatching ||
                (recipientSource === "custom_list" || recipientSource === "external_link"
                  ? customRecipients.length === 0
                  : selectedAudience.startsWith("FORM:")
                  ? (availableForms.find((f) => `FORM:${f.slug}` === selectedAudience)?.submissionsCount ?? 0) === 0
                  : selectedAudience === "ALL"
                  ? (audienceCounts.total || 0) === 0
                  : (audienceCounts.categories[selectedAudience] ?? 0) === 0)
              }
              onClick={handleConfirmBroadcast}
              leftIcon={<Send className="h-4 w-4" />}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
            >
              {isDispatching ? "Transmitting..." : "Confirm & Send Broadcast Now"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Campaign Subject:</span>
              <span className="font-bold text-slate-900 dark:text-white truncate max-w-[240px]">
                {state.subject || state.title || "(Untitled Campaign)"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Target Segment:</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {recipientSource === "custom_list"
                  ? `Custom Attached List (${customRecipients.length} recipients)`
                  : recipientSource === "external_link"
                  ? `Imported External Link (${customRecipients.length} contacts)`
                  : selectedAudience.startsWith("FORM:")
                  ? `Form: ${availableForms.find((f) => `FORM:${f.slug}` === selectedAudience)?.title || selectedAudience} (${availableForms.find((f) => `FORM:${f.slug}` === selectedAudience)?.submissionsCount ?? 0})`
                  : selectedAudience === "ALL"
                  ? `All Verified Contacts (${audienceCounts.total || 0} recipients)`
                  : `${selectedAudience} (${audienceCounts.categories[selectedAudience] ?? 0} recipients)`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Sender Identity:</span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                {state.senderName} &lt;{state.senderEmail}&gt;
              </span>
            </div>
          </div>

          {(recipientSource === "custom_list" || recipientSource === "external_link"
            ? customRecipients.length === 0
            : selectedAudience.startsWith("FORM:")
            ? (availableForms.find((f) => `FORM:${f.slug}` === selectedAudience)?.submissionsCount ?? 0) === 0
            : selectedAudience === "ALL"
            ? (audienceCounts.total || 0) === 0
            : (audienceCounts.categories[selectedAudience] ?? 0) === 0) ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                Target Audience Has 0 Active Recipients
              </p>
              <p className="text-[11px] leading-relaxed">
                No subscribed contacts were found in this segment. Please select &quot;All Contacts&quot;, attach a CSV/TXT email list under Audience &amp; Dispatch, or import contacts from an external URL before broadcasting.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Direct Transmission Notice
              </p>
              <p>
                Each contact in the selected audience will receive a personalized individual email.
                The broadcast record will be saved in your Sent Campaigns archive for analytics and delivery verification.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Corporate Asset Vault Selector Modal */}
      <Modal
        isOpen={isAssetVaultOpen}
        onClose={() => {
          setIsAssetVaultOpen(false);
          setAssetVaultTarget(null);
        }}
        title="Dexta Storage & Media Vault"
        description="Select an approved corporate asset or photo from your Cloudflare R2 / S3 storage vault."
        maxWidth="lg"
      >
        <div className="space-y-4">
          {isLoadingVault ? (
            <div className="flex flex-col items-center justify-center p-10 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-red-600 mb-2" />
              <p className="text-xs">Loading media vault assets...</p>
            </div>
          ) : vaultAssets.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
              <FolderOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No storage assets found yet
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload files using the upload button to automatically archive them in your bucket.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {vaultAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => selectVaultAsset(asset.url)}
                  className="group relative rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-white/[0.02] text-left hover:border-red-500 transition-all cursor-pointer"
                >
                  <div className="aspect-video bg-slate-900 overflow-hidden">
                    <img
                      src={asset.url}
                      alt={asset.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {asset.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {(asset.fileSize / 1024).toFixed(0)} KB • {asset.folder}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </form>
  );
}
