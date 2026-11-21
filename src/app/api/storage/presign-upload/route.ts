import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getPresignedUploadUrl, activeBucketName } from "@/lib/storage/s3";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth/audit";
import path from "path";

const FORBIDDEN_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".bash", ".zsh", ".php", ".php3", ".php4", ".phtml",
  ".cgi", ".pl", ".py", ".rb", ".js", ".mjs", ".html", ".htm", ".xhtml",
  ".jar", ".vbs", ".msi", ".dll", ".so", ".dylib", ".jsp", ".asp", ".aspx"
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

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

    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds enterprise maximum size limit of 50MB" },
        { status: 400 }
      );
    }

    const ext = (path.extname(fileName) || "").toLowerCase();
    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Executable or script format '${ext}' is prohibited.` },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 80);

    const cleanFolder = String(folder).toLowerCase().replace(/[^a-z0-9-_]/g, "");
    const storagePrefix = cleanFolder === "personal" ? `personal/${user.id}` : cleanFolder;
    const key = `${storagePrefix}/${year}/${month}/${timestamp}-${sanitizedName}`;

    const { uploadUrl, finalUrl, isDirectLocal, provider } = await getPresignedUploadUrl({
      key,
      mimeType,
    });

    // Record asset in database
    const asset = await prisma.storageAsset.create({
      data: {
        bucket: activeBucketName,
        key,
        fileName,
        fileSize,
        mimeType,
        url: finalUrl,
        folder: cleanFolder,
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
      metadata: { key, fileSize, mimeType, provider },
    });

    return NextResponse.json({
      assetId: asset.id,
      key,
      uploadUrl,
      finalUrl,
      isDirectLocal,
      provider,
    });
  } catch (err: unknown) {
    console.error("Presign upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Presign upload failed" },
      { status: 500 }
    );
  }
}
