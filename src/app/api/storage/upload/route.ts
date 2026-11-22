import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { uploadBufferToStorage, activeBucketName } from "@/lib/storage/s3";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth/audit";
import path from "path";

// Allowed file extensions and MIME categories
const ALLOWED_MIME_PREFIXES = [
  "image/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "text/plain",
  "text/csv",
];

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderInput = (formData.get("folder") as string | null) || "campaigns";
    const customKeyInput = (formData.get("key") as string | null) || "";

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds maximum size limit of 25MB" },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    const isAllowed = ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
    if (!isAllowed) {
      return NextResponse.json(
        { error: `File type '${mimeType}' is not permitted` },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const timestamp = Date.now();

    const originalName = file.name || "upload.bin";
    const ext = path.extname(originalName) || ".jpg";
    const baseName = path.basename(originalName, ext);
    const sanitizedBase = baseName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 50);

    const folder = folderInput.toLowerCase().replace(/[^a-z0-9-_]/g, "");
    const key = customKeyInput
      ? customKeyInput.replace(/^\/+/, "")
      : `${folder}/${year}/${month}/${timestamp}-${sanitizedBase}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await uploadBufferToStorage({
      buffer,
      key,
      mimeType,
      cacheControl: "public, max-age=31536000, immutable",
      contentDisposition: mimeType.startsWith("image/") ? "inline" : "attachment",
    });

    let assetId: string | null = null;

    // Record asset in database if user session is present (with automated schema healing)
    if (user) {
      try {
        const asset = await prisma.storageAsset.create({
          data: {
            bucket: uploadResult.bucket || activeBucketName,
            key,
            fileName: originalName,
            fileSize: file.size,
            mimeType,
            url: uploadResult.url,
            folder,
            uploadedById: user.id,
          },
        });
        assetId = asset.id;

        await logAuditEvent({
          actorId: user.id,
          actorEmail: user.email,
          action: "ASSET_UPLOADED",
          entity: "StorageAsset",
          entityId: asset.id,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent"),
          metadata: { key, fileSize: file.size, mimeType, provider: uploadResult.provider },
        });
      } catch (dbErr: unknown) {
        console.warn("⚠️  [Storage] Initial asset DB log failed, attempting schema bootstrap:", dbErr);
        try {
          // Self-heal: ensure StorageAsset table exists
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "StorageAsset" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "bucket" TEXT NOT NULL,
              "key" TEXT NOT NULL,
              "fileName" TEXT NOT NULL,
              "fileSize" INTEGER NOT NULL,
              "mimeType" TEXT NOT NULL,
              "url" TEXT NOT NULL,
              "folder" TEXT NOT NULL DEFAULT 'general',
              "uploadedById" TEXT,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "StorageAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
            );
          `);
          await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "StorageAsset_key_key" ON "StorageAsset"("key");`);
          await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StorageAsset_folder_idx" ON "StorageAsset"("folder");`);
          await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StorageAsset_createdAt_idx" ON "StorageAsset"("createdAt");`);

          const retryAsset = await prisma.storageAsset.create({
            data: {
              bucket: uploadResult.bucket || activeBucketName,
              key,
              fileName: originalName,
              fileSize: file.size,
              mimeType,
              url: uploadResult.url,
              folder,
              uploadedById: user.id,
            },
          });
          assetId = retryAsset.id;
        } catch (retryErr) {
          console.warn("⚠️  [Storage] Database asset record skipped, proceeding with successful file upload:", retryErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
      fileName: originalName,
      fileSize: file.size,
      mimeType,
      provider: uploadResult.provider,
      bucket: uploadResult.bucket,
      assetId,
    });
  } catch (err: unknown) {
    console.error("Storage upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upload file to storage" },
      { status: 500 }
    );
  }
}

