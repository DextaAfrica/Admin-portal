import crypto from "crypto";

export const VISIT_PURPOSES = [
  "Business Meeting",
  "Client/Customer Meeting",
  "Property Inspection",
  "Job Interview",
  "Partnership/Business Proposal",
  "Delivery/Dispatch",
  "Official/Administrative Visit",
  "Personal Visit",
  "Other",
] as const;

export const VISIT_DEPARTMENTS = [
  "Management",
  "Operations & Administration",
  "Human Resources",
  "Sales & Marketing",
  "Finance & Accounts",
  "Project/Development",
  "Customer Service",
  "Other",
] as const;

export type VisitPurpose = (typeof VISIT_PURPOSES)[number];
export type VisitDepartment = (typeof VISIT_DEPARTMENTS)[number];

export interface VisitorPayload {
  fullName: string;
  phone: string;
  email: string;
  company?: string;
  position?: string;
  purpose: string;
  purposeOther?: string;
  hostName: string;
  department: string;
  hasAppointment: boolean;
  invitedBy?: string;
  visitDescription?: string;
  agreedGuidelines: boolean;
  consentedData: boolean;
}

export function generateVisitorPassCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `DXV-${code}`;
}

export function todayISODate(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: process.env.APP_TIMEZONE || "Africa/Lagos",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function sanitizeCsvCell(val: unknown): string {
  let s = String(val ?? "");
  // Prevent CSV formula injection in Excel/Sheets while keeping phone numbers (+234...) intact
  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !/^\+\d[\d\s()-]+$/.test(s))) {
    s = `'${s}`;
  }
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function validateVisitorPayload(body: Partial<VisitorPayload>): string | null {
  if (!body || typeof body !== "object") return "Visitor registration details are required.";
  const text = (value: unknown, max: number) =>
    typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
  if (!text(body.fullName, 120)) return "Enter a name of 1–120 characters.";
  if (!text(body.phone, 40) || typeof body.phone !== "string" || body.phone.replace(/\D/g, "").length < 7) return "Enter a valid phone number.";
  if (!text(body.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email!.trim())) {
    return "A valid Email Address is required.";
  }
  if (!VISIT_PURPOSES.includes(body.purpose as VisitPurpose)) return "Please select a valid purpose of visit.";
  if (body.purpose === "Other" && !text(body.purposeOther, 200)) {
    return "Please specify your purpose of visit.";
  }
  if (!text(body.hostName, 120)) return "Enter the host name (up to 120 characters).";
  if (!VISIT_DEPARTMENTS.includes(body.department as VisitDepartment)) return "Please select a valid department.";
  if (body.company && (typeof body.company !== "string" || body.company.length > 160)) return "Company name must be 160 characters or fewer.";
  if (body.position && (typeof body.position !== "string" || body.position.length > 120)) return "Position must be 120 characters or fewer.";
  if (body.invitedBy && (typeof body.invitedBy !== "string" || body.invitedBy.length > 120)) return "Inviter name must be 120 characters or fewer.";
  if (body.visitDescription && (typeof body.visitDescription !== "string" || body.visitDescription.length > 1000)) return "Visit notes must be 1,000 characters or fewer.";
  if (typeof body.hasAppointment !== "boolean") return "Please indicate whether you have an appointment.";
  if (!body.agreedGuidelines) {
    return "You must agree to comply with the company's visitor guidelines and office regulations to check in.";
  }
  if (!body.consentedData) {
    return "You must consent to the collection and processing of your registration information.";
  }
  return null;
}
