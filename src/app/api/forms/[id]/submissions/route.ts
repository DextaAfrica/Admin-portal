import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Handles retrieving and adding/uploading submissions for a specific CustomForm.
 * Supports single entry as well as high-volume batch upload (CSV / Excel parsed rows).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    const form = await prisma.customForm.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true, fields: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const where: any = { formId: id };
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    const submissions = await prisma.formSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      form,
      submissions: submissions.map((s) => {
        let answersObj = {};
        try {
          answersObj = typeof s.answers === "string" ? JSON.parse(s.answers || "{}") : s.answers || {};
        } catch {
          answersObj = {};
        }
        return {
          ...s,
          answers: answersObj,
        };
      }),
    });
  } catch (err: any) {
    console.error("[Form Submissions GET Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch submissions" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const form = await prisma.customForm.findUnique({ where: { id } });
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const body = await req.json();

    // Body can be a single object or an array of items { items: [...] } or { submissions: [...] }
    const rawItems = Array.isArray(body)
      ? body
      : Array.isArray(body?.items)
      ? body.items
      : Array.isArray(body?.submissions)
      ? body.submissions
      : [body];

    if (!rawItems || rawItems.length === 0) {
      return NextResponse.json({ error: "No submission details provided" }, { status: 400 });
    }

    let addedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rawItems.length; i++) {
      const row = rawItems[i];
      const fullName = (row.fullName || row.name || row["Full Name"] || row["Name"] || "").trim();
      const email = (row.email || row["Email"] || row["Email Address"] || "").toLowerCase().trim();

      if (!fullName || !email) {
        errors.push(`Row ${i + 1}: Missing Full Name or Email`);
        continue;
      }

      const phone = (row.phone || row.telephone || row["Phone"] || row["Phone Number"] || "").trim();
      const company = (row.company || row.organization || row.agency || row["Company"] || row["Organization"] || "").trim();
      const jobTitle = (row.jobTitle || row.role || row["Job Title"] || row["Role"] || "").trim();
      const category = (row.category || row["Category"] || "Attendee").trim();
      const attendanceMode = (row.attendanceMode || row["Attendance Mode"] || "in-person").toLowerCase().trim();
      const status = (row.status || row["Status"] || "registered").toLowerCase().trim();
      const notes = (row.notes || row["Notes"] || `Uploaded via Admin Command by ${user.email}`).trim();

      // Extract custom answers (any fields not in the standard set)
      let answers: Record<string, any> = {};
      if (row.answers && typeof row.answers === "object") {
        answers = { ...row.answers };
      } else {
        const standardKeys = new Set([
          "fullName", "name", "Full Name", "Name",
          "email", "Email", "Email Address",
          "phone", "telephone", "Phone", "Phone Number",
          "company", "organization", "agency", "Company", "Organization",
          "jobTitle", "role", "Job Title", "Role",
          "category", "Category",
          "attendanceMode", "Attendance Mode",
          "status", "Status",
          "notes", "Notes",
          "answers"
        ]);
        for (const [k, v] of Object.entries(row)) {
          if (!standardKeys.has(k) && v !== undefined && v !== null && v !== "") {
            answers[k] = v;
          }
        }
      }

      // Check if submission already exists for this form and email
      const existing = await prisma.formSubmission.findFirst({
        where: {
          formId: id,
          email,
        },
      });

      if (existing) {
        let mergedAnswers = {};
        try {
          const oldAnswers = typeof existing.answers === "string" ? JSON.parse(existing.answers || "{}") : existing.answers || {};
          mergedAnswers = { ...oldAnswers, ...answers };
        } catch {
          mergedAnswers = answers;
        }

        await prisma.formSubmission.update({
          where: { id: existing.id },
          data: {
            fullName: fullName || existing.fullName,
            phone: phone || existing.phone,
            company: company || existing.company,
            jobTitle: jobTitle || existing.jobTitle,
            category: category || existing.category,
            attendanceMode: attendanceMode || existing.attendanceMode,
            status: status || existing.status,
            notes: notes || existing.notes,
            answers: JSON.stringify(mergedAnswers),
          },
        });
        updatedCount++;
      } else {
        await prisma.formSubmission.create({
          data: {
            formId: id,
            fullName,
            email,
            phone,
            company,
            jobTitle,
            category: category || "Attendee",
            attendanceMode: attendanceMode || "in-person",
            status: status || "registered",
            notes,
            answers: JSON.stringify(answers),
            consentAcknowledged: true,
            consentTimestamp: new Date(),
          },
        });
        addedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${addedCount + updatedCount} submission(s). (${addedCount} added, ${updatedCount} updated)`,
      totalProcessed: addedCount + updatedCount,
      added: addedCount,
      updated: updatedCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (err: any) {
    console.error("[Form Submissions Upload POST Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to process uploaded submissions" }, { status: 500 });
  }
}
