import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getPresignedUploadUrl } from "@/lib/storage/s3";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth/audit";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileSize, mimeType, folder = "general" } = await req.json();

    if (!fileName || !fileSize || !mimeType) {
      return NextResponse.json(
        { error: "fileName, fileSize, and mimeType are required" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `${folder}/${timestamp}-${sanitizedName}`;

    const { uploadUrl, finalUrl, isDirectLocal } = await getPresignedUploadUrl({
      key,
      mimeType,
    });

    const bucketName = process.env.AWS_S3_BUCKET_NAME || "dexta-assets-storage";

    // Record asset in database
    const asset = await prisma.storageAsset.create({
      data: {
        bucket: bucketName,
        key,
        fileName,
        fileSize,
        mimeType,
        url: finalUrl,
        folder,
        uploadedById: user.id,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "ASSET_UPLOAD_INITIATED",
      entity: "StorageAsset",
      entityId: asset.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { key, fileSize, mimeType },
    });

    return NextResponse.json({
      assetId: asset.id,
      key,
      uploadUrl,
      finalUrl,
      isDirectLocal,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Presign upload failed" },
      { status: 500 }
    );
  }
}

