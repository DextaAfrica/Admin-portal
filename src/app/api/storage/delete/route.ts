import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { deleteS3Asset } from "@/lib/storage/s3";
import { logAuditEvent } from "@/lib/auth/audit";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const rawIds: string[] = Array.isArray(body.assetIds)
      ? body.assetIds.filter(Boolean)
      : body.assetId
      ? [String(body.assetId)]
      : [];

    if (rawIds.length === 0) {
      return NextResponse.json({ error: "assetId or assetIds is required" }, { status: 400 });
    }

    const assets = await prisma.storageAsset.findMany({
      where: { id: { in: rawIds } },
    });

    if (assets.length === 0) {
      return NextResponse.json({ error: "No matching assets found" }, { status: 404 });
    }

    const userRole = (user.role || "").toUpperCase();
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "IT_ADMIN";

    // Strict RBAC check on every asset before deleting anything
    const unauthorized = assets.filter((a) => !isAdmin && a.uploadedById !== user.id);
    if (unauthorized.length > 0) {
      return NextResponse.json(
        {
          error:
            "Forbidden: You can only delete files you uploaded. Contact an Administrator to delete shared or other team members' files.",
        },
        { status: 403 }
      );
    }

    let reclaimedBytes = 0;
    for (const asset of assets) {
      await deleteS3Asset(asset.key);
      await prisma.storageAsset.delete({ where: { id: asset.id } });
      reclaimedBytes += Number(asset.fileSize || 0);

      try {
        await logAuditEvent({
          actorId: user.id,
          actorEmail: user.email,
          action: "ASSET_DELETED",
          entity: "StorageAsset",
          entityId: asset.id,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent"),
          metadata: { key: asset.key, fileName: asset.fileName, fileSize: asset.fileSize },
        });
      } catch (auditErr) {
        console.warn("[Storage Delete Audit Warning]:", auditErr);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: assets.length,
      reclaimedBytes,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete asset(s)" },
      { status: 500 }
    );
  }
}
