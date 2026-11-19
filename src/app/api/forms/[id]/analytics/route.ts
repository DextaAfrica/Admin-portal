import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const form = await prisma.customForm.findUnique({
      where: { id },
      include: {
        submissions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const submissions = form.submissions;
    const totalCount = submissions.length;

    // Breakdown by Category
    const categoryCounts: Record<string, number> = {};
    // Breakdown by Attendance Mode
    const attendanceCounts: Record<string, number> = {
      "in-person": 0,
      "virtual": 0,
    };
    // Breakdown by Organization
    const companyCounts: Record<string, number> = {};
    // Breakdown by Date (Timeline)
    const timelineMap: Record<string, number> = {};

    submissions.forEach((sub) => {
      // Category
      const cat = sub.category || "Attendee";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      // Mode
      const mode = (sub.attendanceMode || "in-person").toLowerCase();
      attendanceCounts[mode] = (attendanceCounts[mode] || 0) + 1;

      // Company
      if (sub.company && sub.company.trim()) {
        const comp = sub.company.trim();
        companyCounts[comp] = (companyCounts[comp] || 0) + 1;
      }

      // Timeline (YYYY-MM-DD)
      const day = sub.createdAt.toISOString().slice(0, 10);
      timelineMap[day] = (timelineMap[day] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryCounts).map(([label, count]) => ({
      label,
      count,
      pct: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
    }));

    const attendanceBreakdown = Object.entries(attendanceCounts).map(([mode, count]) => ({
      mode: mode === "virtual" ? "Virtual Mode" : "In-Person Attendance",
      count,
      pct: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
    }));

    const topOrganizations = Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([company, count]) => ({ company, count }));

    const timeline = Object.entries(timelineMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return NextResponse.json({
      form: {
        id: form.id,
        slug: form.slug,
        title: form.title,
        description: form.description,
        formType: form.formType,
        status: form.status,
        eventDate: form.eventDate ? form.eventDate.toISOString() : null,
        eventLocation: form.eventLocation,
        fields: JSON.parse(form.fields || "[]"),
        sendConfirmationEmail: form.sendConfirmationEmail,
        requireConsent: form.requireConsent,
        consentNotice: form.consentNotice,
      },
      demographics: {
        totalCount,
        categoryBreakdown,
        attendanceBreakdown,
        topOrganizations,
        timeline,
      },
      submissions: submissions.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        phone: s.phone || "",
        company: s.company || "",
        jobTitle: s.jobTitle || "",
        category: s.category || "Attendee",
        attendanceMode: s.attendanceMode || "in-person",
        answers: JSON.parse(s.answers || "{}"),
        notes: s.notes || "",
        status: s.status || "registered",
        consentAcknowledged: s.consentAcknowledged,
        consentTimestamp: s.consentTimestamp ? s.consentTimestamp.toISOString() : null,
        ipAddress: s.ipAddress || "",
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (err: any) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Failed to generate demographics" }, { status: 500 });
  }
}
