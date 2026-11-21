import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth/audit";
import { s3Client, activeBucketName, storageProvider, getPresignedDownloadUrl } from "@/lib/storage/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    const asset = await prisma.storageAsset.findUnique({
      where: { id },
      include: {
        uploader: { select: { fullName: true, email: true } },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Log the download event for zero-trust security audit trails
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "ASSET_DOWNLOADED",
      entity: "StorageAsset",
      entityId: asset.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { key: asset.key, fileName: asset.fileName, fileSize: asset.fileSize },
    });

    // 1. Cloudflare R2 / AWS S3 Cloud Storage
    if (s3Client && storageProvider !== "local") {
      try {
        const presignedUrl = await getPresignedDownloadUrl({
          key: asset.key,
          expiresInSeconds: 300,
        });

        // If redirect requested, send 302 directly to the signed URL
        const redirectParam = searchParams.get("redirect");
        if (redirectParam !== "false") {
          return NextResponse.redirect(presignedUrl);
        }

        return NextResponse.json({
          success: true,
          downloadUrl: presignedUrl,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          mimeType: asset.mimeType,
        });
      } catch (s3Err) {
        console.error("Presigned download generation error:", s3Err);
      }
    }

    // 2. Server Disk Storage Streaming Fallback
    const cleanKey = asset.key.replace(/^\/+/, "");
    const localFilePath = path.join(process.cwd(), "public", "uploads", cleanKey);

    if (fs.existsSync(localFilePath)) {
      const fileBuffer = fs.readFileSync(localFilePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${encodeURIComponent(asset.fileName)}"`,
          "Content-Type": asset.mimeType || "application/octet-stream",
          "Content-Length": String(fileBuffer.length),
        },
      });
    }

    // 3. Fallback: If asset URL is a public CDN link
    if (asset.url.startsWith("http")) {
      return NextResponse.redirect(asset.url);
    }

    return NextResponse.json({ error: "Storage file data unavailable" }, { status: 404 });
  } catch (err: unknown) {
    console.error("Download error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to download asset" },
      { status: 500 }
    );
  }
}
