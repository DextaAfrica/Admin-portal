import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensureCustomFormsSchema } from "@/lib/forms/schema";

export const dynamic = "force-dynamic";

function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureCustomFormsSchema();

    const groups = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        g.*,
        COUNT(DISTINCT f.id)::int AS "formsCount",
        COUNT(s.id)::int AS "submissionsCount"
      FROM "CustomFormGroup" g
      LEFT JOIN "CustomForm" f ON f."groupId" = g.id OR f."groupSlug" = g.slug
      LEFT JOIN "FormSubmission" s ON s."formId" = f.id
      GROUP BY g.id
      ORDER BY g."createdAt" ASC;
    `);

    return NextResponse.json({ success: true, groups });
  } catch (err: any) {
    console.error("[Form Groups GET Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to load form groups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureCustomFormsSchema();

    const body = await req.json();
    const name = String(body.name || "").trim();
    const rawSlug = String(body.slug || name);
    const cleanSlug = sanitizeSlug(rawSlug);

    if (!name || !cleanSlug) {
      return NextResponse.json({ error: "Group name and valid slug are required" }, { status: 400 });
    }

    const id = body.id || `grp-${cleanSlug}`;
    const description = String(body.description || "").trim();
    const routePrefix = String(body.routePrefix || "/f").trim() || "/f";
    const color = String(body.color || "#dc2626").trim();

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "CustomFormGroup" ("id", "name", "slug", "description", "routePrefix", "color", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT ("slug") DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "routePrefix" = EXCLUDED."routePrefix",
        "color" = EXCLUDED."color",
        "updatedAt" = NOW();
      `,
      id,
      name,
      cleanSlug,
      description,
      routePrefix,
      color
    );

    return NextResponse.json({
      success: true,
      group: { id, name, slug: cleanSlug, description, routePrefix, color },
    });
  } catch (err: any) {
    console.error("[Form Groups POST Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to save form group" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureCustomFormsSchema();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "CustomForm" SET "groupId" = '', "groupSlug" = 'general' WHERE "groupId" = $1;`,
      id
    );
    await prisma.$executeRawUnsafe(`DELETE FROM "CustomFormGroup" WHERE "id" = $1;`, id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Form Groups DELETE Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to delete group" }, { status: 500 });
  }
}
