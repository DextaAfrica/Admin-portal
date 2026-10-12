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

    const { assetId } = await req.json();
    if (!assetId) {
      return NextResponse.json({ error: "assetId is required" }, { status: 400 });
    }

    const asset = await prisma.storageAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    await deleteS3Asset(asset.key);
    await prisma.storageAsset.delete({ where: { id: assetId } });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "ASSET_DELETED",
      entity: "StorageAsset",
      entityId: assetId,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { key: asset.key, fileName: asset.fileName },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete asset" },
      { status: 500 }
    );
  }
}

