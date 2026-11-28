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
  return new Date().toISOString().slice(0, 10);
}

export function validateVisitorPayload(body: Partial<VisitorPayload>): string | null {
  if (!body.fullName?.trim()) return "Full Name is required.";
  if (!body.phone?.trim()) return "Phone Number is required.";
  if (!body.email?.trim() || !body.email.includes("@")) {
    return "A valid Email Address is required.";
  }
  if (!body.purpose?.trim()) return "Please select the purpose of your visit.";
  if (body.purpose === "Other" && !body.purposeOther?.trim()) {
    return "Please specify your purpose of visit.";
  }
  if (!body.hostName?.trim()) return "Please enter who you are here to see.";
  if (!body.department?.trim()) return "Please select the department you are visiting.";
  if (!body.agreedGuidelines) {
    return "You must agree to comply with the company's visitor guidelines and office regulations to check in.";
  }
  if (!body.consentedData) {
    return "You must consent to the collection and processing of your registration information.";
  }
  return null;
}
