import { prisma } from "@/lib/prisma";
import { backendApi } from "@/lib/backend-api";
import { emailTransporter, isEmailConfigured } from "@/lib/email/dispatcher";
import {
  generateVisitorPassCode,
  todayISODate,
  VisitorPayload,
} from "./constants";

export interface VisitorDTO {
  id: string;
  passCode: string;
  fullName: string;
  phone: string;
  email: string;
  company: string;
  position: string;
  purpose: string;
  purposeOther: string;
  hostName: string;
  department: string;
  hasAppointment: boolean;
  invitedBy: string;
  visitDescription: string;
  visitDate: string;
  checkInAt: string;
  checkOutAt: string | null;
  status: "checked_in" | "checked_out";
  agreedGuidelines: boolean;
  consentedData: boolean;
  declaredAt: string;
  checkedOutBy: string;
  createdAt: string;
}

function toDTO(row: any): VisitorDTO {
  return {
    id: row.id,
    passCode: row.passCode,
    fullName: row.fullName,
    phone: row.phone,
    email: row.email,
    company: row.company || "",
    position: row.position || "",
    purpose: row.purpose,
    purposeOther: row.purposeOther || "",
    hostName: row.hostName,
    department: row.department,
    hasAppointment: Boolean(row.hasAppointment),
    invitedBy: row.invitedBy || "",
    visitDescription: row.visitDescription || "",
    visitDate:
      typeof row.visitDate === "string"
        ? row.visitDate.slice(0, 10)
        : new Date(row.visitDate).toISOString().slice(0, 10),
    checkInAt:
      typeof row.checkInAt === "string"
        ? row.checkInAt
        : new Date(row.checkInAt).toISOString(),
    checkOutAt: row.checkOutAt
      ? typeof row.checkOutAt === "string"
        ? row.checkOutAt
        : new Date(row.checkOutAt).toISOString()
      : null,
    status: row.status === "checked_out" ? "checked_out" : "checked_in",
    agreedGuidelines: Boolean(row.agreedGuidelines),
    consentedData: Boolean(row.consentedData),
    declaredAt:
      typeof row.declaredAt === "string"
        ? row.declaredAt
        : new Date(row.declaredAt).toISOString(),
    checkedOutBy: row.checkedOutBy || "",
    createdAt:
      typeof row.createdAt === "string"
        ? row.createdAt
        : new Date(row.createdAt).toISOString(),
  };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendVisitorPassEmail(visitor: VisitorDTO) {
  if (!isEmailConfigured || !emailTransporter || !visitor.email) return;
  try {
    const arrivalTime = new Date(visitor.checkInAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const safeName = escapeHtml(visitor.fullName);
    const safePass = escapeHtml(visitor.passCode);
    const safeHost = escapeHtml(visitor.hostName);
    const safeDept = escapeHtml(visitor.department);
    const safePurpose = escapeHtml(
      visitor.purpose === "Other" && visitor.purposeOther
        ? visitor.purposeOther
        : visitor.purpose
    );
    const safeDate = escapeHtml(visitor.visitDate);
    const fromAddr =
      process.env.EMAIL_FROM || "Dexta Africa Reception <operations@dextaafrica.com>";
    await emailTransporter.sendMail({
      from: fromAddr,
      to: visitor.email,
      subject: `Dexta Africa Visitor Pass: ${safePass}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #0d1017; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
          <div style="background: linear-gradient(135deg, #ED2618 0%, #991b1b 100%); padding: 24px 28px;">
            <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #fecaca; font-weight: 700;">Dexta Africa Reception</p>
            <h1 style="margin: 6px 0 0; font-size: 22px; color: #ffffff;">Digital Visitor Pass</h1>
          </div>
          <div style="padding: 28px;">
            <p style="margin: 0 0 16px; color: #cbd5e1; font-size: 14px;">Welcome, <strong style="color: #ffffff;">${safeName}</strong>. Your check-in has been recorded.</p>
            <div style="background: #141923; border: 1px solid #263042; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 20px;">
              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #94a3b8;">Visitor Pass Code</span>
              <span style="display: block; font-size: 26px; font-weight: 800; letter-spacing: 0.1em; color: #ffffff; margin-top: 4px; font-family: monospace;">${safePass}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
              <tr><td style="padding: 6px 0; color: #94a3b8;">Host</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #ffffff;">${safeHost}</td></tr>
              <tr><td style="padding: 6px 0; color: #94a3b8;">Department</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #ffffff;">${safeDept}</td></tr>
              <tr><td style="padding: 6px 0; color: #94a3b8;">Purpose</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #ffffff;">${safePurpose}</td></tr>
              <tr><td style="padding: 6px 0; color: #94a3b8;">Date &amp; Arrival</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #ffffff;">${safeDate} • ${arrivalTime}</td></tr>
            </table>
            <p style="margin: 20px 0 0; font-size: 12px; color: #94a3b8; border-top: 1px solid #1e293b; padding-top: 16px;">Please keep this Pass Code handy to check out upon departure.</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.warn("[Visitor Pass Email] Non-blocking dispatch failure:", err);
  }
}

export async function checkInVisitor(
  payload: VisitorPayload,
  meta: { ipAddress?: string; userAgent?: string } = {}
): Promise<VisitorDTO> {
  // 1. Attempt primary persistence in Go Core Backend
  let backendRecord: any = null;
  try {
    const res = await backendApi.visitors.checkIn(payload);
    backendRecord = res?.data ?? res;
  } catch (err: any) {
    console.warn("[Visitors] Go Backend unavailable, persisting to local database:", err?.message);
  }

  const now = new Date();
  const passCode = backendRecord?.passCode || generateVisitorPassCode();

  // 2. Mirror / persist into Prisma VisitorLog
  const created = await prisma.visitorLog.create({
    data: {
      id: backendRecord?.id || undefined,
      passCode,
      fullName: payload.fullName.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim().toLowerCase(),
      company: (payload.company || "").trim(),
      position: (payload.position || "").trim(),
      purpose: payload.purpose.trim(),
      purposeOther: (payload.purposeOther || "").trim(),
      hostName: payload.hostName.trim(),
      department: payload.department.trim(),
      hasAppointment: Boolean(payload.hasAppointment),
      invitedBy: (payload.invitedBy || "").trim(),
      visitDescription: (payload.visitDescription || "").trim(),
      visitDate: backendRecord?.visitDate || todayISODate(),
      checkInAt: backendRecord?.checkInAt ? new Date(backendRecord.checkInAt) : now,
      status: "checked_in",
      agreedGuidelines: Boolean(payload.agreedGuidelines),
      consentedData: Boolean(payload.consentedData),
      declaredAt: backendRecord?.declaredAt ? new Date(backendRecord.declaredAt) : now,
      ipAddress: meta.ipAddress || "",
      userAgent: meta.userAgent || "",
    },
  });

  const dto = toDTO(created);
  void sendVisitorPassEmail(dto);
  return dto;
}

export async function getVisitorByPassCode(passCode: string): Promise<VisitorDTO | null> {
  const clean = passCode.trim().toUpperCase();
  if (!clean) return null;

  try {
    const res = await backendApi.visitors.getByPassCode(clean);
    if (res?.data) return toDTO(res.data);
  } catch {
    // Fallback to Prisma
  }

  const row = await prisma.visitorLog.findUnique({
    where: { passCode: clean },
  });
  return row ? toDTO(row) : null;
}

export async function selfCheckOutVisitor(identifier: string): Promise<VisitorDTO | null> {
  const clean = identifier.trim();
  if (!clean) return null;

  let backendRecord: any = null;
  try {
    const res = await backendApi.visitors.selfCheckOut(clean);
    backendRecord = res?.data ?? res;
  } catch {
    // Fallback to local Prisma lookup
  }

  const existing = await prisma.visitorLog.findFirst({
    where: {
      status: "checked_in",
      OR: [
        { passCode: clean.toUpperCase() },
        { email: clean.toLowerCase() },
        { phone: clean },
      ],
    },
    orderBy: { checkInAt: "desc" },
  });

  if (!existing && !backendRecord) {
    return null;
  }

  if (existing) {
    const updated = await prisma.visitorLog.update({
      where: { id: existing.id },
      data: {
        status: "checked_out",
        checkOutAt: backendRecord?.checkOutAt
          ? new Date(backendRecord.checkOutAt)
          : new Date(),
        checkedOutBy: "self-checkout",
      },
    });
    return toDTO(updated);
  }

  return toDTO(backendRecord);
}

export async function adminCheckOutVisitor(
  id: string,
  adminEmail: string
): Promise<VisitorDTO | null> {
  let backendRecord: any = null;
  try {
    const res = await backendApi.visitors.adminCheckOut(id, adminEmail);
    backendRecord = res?.data ?? res;
  } catch {
    // Local Prisma update fallback
  }

  const existing = await prisma.visitorLog.findUnique({ where: { id } });
  if (!existing && !backendRecord) return null;

  if (existing) {
    const updated = await prisma.visitorLog.update({
      where: { id },
      data: {
        status: "checked_out",
        checkOutAt: backendRecord?.checkOutAt
          ? new Date(backendRecord.checkOutAt)
          : existing.checkOutAt || new Date(),
        checkedOutBy: existing.checkedOutBy || adminEmail || "reception-admin",
      },
    });
    return toDTO(updated);
  }

  return toDTO(backendRecord);
}

export async function listVisitors(filters: {
  status?: string;
  department?: string;
  purpose?: string;
  date?: string;
  q?: string;
}) {
  try {
    const res = await backendApi.visitors.list({
      status: filters.status,
      department: filters.department,
      purpose: filters.purpose,
      date: filters.date,
      q: filters.q,
      perPage: 200,
    });
    if (res?.data && Array.isArray(res.data)) {
      return res.data.map(toDTO);
    }
  } catch {
    // Fallback to Prisma
  }

  const where: any = {};
  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }
  if (filters.department && filters.department !== "all") {
    where.department = filters.department;
  }
  if (filters.purpose && filters.purpose !== "all") {
    where.purpose = filters.purpose;
  }
  if (filters.date) {
    where.visitDate = filters.date;
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { fullName: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { company: { contains: q } },
      { hostName: { contains: q } },
      { passCode: { contains: q } },
    ];
  }

  const rows = await prisma.visitorLog.findMany({
    where,
    orderBy: [{ status: "asc" }, { checkInAt: "desc" }],
    take: 300,
  });

  return rows.map(toDTO);
}

export async function getVisitorAnalytics() {
  try {
    const res = await backendApi.visitors.analytics();
    if (res?.data) return res.data;
  } catch {
    // Compute from Prisma
  }

  const all = await prisma.visitorLog.findMany({
    orderBy: { checkInAt: "desc" },
    take: 1000,
  });

  const today = todayISODate();
  let totalToday = 0;
  let currentlyOnSite = 0;
  let checkedOutToday = 0;
  let scheduledToday = 0;
  let walkInToday = 0;

  const deptCounts = new Map<string, number>();
  const purposeCounts = new Map<string, number>();
  const hourCounts = new Map<string, number>();

  for (const v of all) {
    if (v.status === "checked_in") currentlyOnSite++;
    if (v.visitDate === today) {
      totalToday++;
      if (v.status === "checked_out") checkedOutToday++;
      if (v.hasAppointment) scheduledToday++;
      else walkInToday++;
    }
    deptCounts.set(v.department, (deptCounts.get(v.department) || 0) + 1);
    purposeCounts.set(v.purpose, (purposeCounts.get(v.purpose) || 0) + 1);

    const hr = `${String(new Date(v.checkInAt).getHours()).padStart(2, "0")}:00`;
    hourCounts.set(hr, (hourCounts.get(hr) || 0) + 1);
  }

  const toSortedArray = (m: Map<string, number>) =>
    Array.from(m.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

  return {
    totalToday,
    currentlyOnSite,
    checkedOutToday,
    scheduledToday,
    walkInToday,
    totalAllTime: all.length,
    byDepartment: toSortedArray(deptCounts),
    byPurpose: toSortedArray(purposeCounts),
    hourlyArrivals: Array.from(hourCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}
