import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { uploadBufferToStorage, activeBucketName } from "@/lib/storage/s3";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth/audit";
import path from "path";

// Explicitly blocked executable / malicious script extensions
const FORBIDDEN_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".bash", ".zsh", ".php", ".php3", ".php4", ".phtml",
  ".cgi", ".pl", ".py", ".rb", ".js", ".mjs", ".html", ".htm", ".xhtml",
  ".jar", ".vbs", ".msi", ".dll", ".so", ".dylib", ".jsp", ".asp", ".aspx"
]);

const FORBIDDEN_MIMES = [
  "text/html",
  "application/javascript",
  "application/x-javascript",
  "text/javascript",
  "application/x-msdownload",
  "application/x-sh",
  "application/x-php",
  "application/x-executable",
];

// Enterprise allowed MIME prefixes
const ALLOWED_MIME_PREFIXES = [
  "image/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "text/plain",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml",
  "application/rtf",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/x-7z-compressed",
  "application/gzip",
  "application/x-tar",
  "image/svg+xml",
  "application/acad",
  "image/vnd.dwg",
  "application/dxf",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Active session required" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderInput = (formData.get("folder") as string | null) || "general";
    const customKeyInput = (formData.get("key") as string | null) || "";

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds enterprise maximum size limit of 50MB" },
        { status: 400 }
      );
    }

    const originalName = file.name || "upload.bin";
    const ext = (path.extname(originalName) || "").toLowerCase();

    // Zero-Trust Security Gate: Block dangerous scripts & executables
    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Security Policy Violation: Executable or script file extension '${ext}' is strictly prohibited.` },
        { status: 400 }
      );
    }

    const mimeType = (file.type || "application/octet-stream").toLowerCase();
    if (FORBIDDEN_MIMES.some((m) => mimeType.includes(m))) {
      return NextResponse.json(
        { error: `Security Policy Violation: Content type '${mimeType}' is not allowed in enterprise storage.` },
        { status: 400 }
      );
    }

    const isAllowed = ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix)) ||
      Boolean(ext && [".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt", ".csv", ".txt", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".zip", ".rar", ".dwg", ".dxf"].includes(ext));

    if (!isAllowed) {
      return NextResponse.json(
        { error: `File type '${mimeType}' is not permitted in storage repository.` },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const timestamp = Date.now();

    const baseName = path.basename(originalName, ext);
    const sanitizedBase = baseName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 50);

    const folder = folderInput.toLowerCase().replace(/[^a-z0-9-_]/g, "");
    
    // User Dedicated Isolation: If personal folder selected, isolate by user.id
    const storagePrefix = folder === "personal" ? `personal/${user.id}` : folder;
    const key = customKeyInput
      ? customKeyInput.replace(/^\/+/, "").replace(/\.\./g, "")
      : `${storagePrefix}/${year}/${month}/${timestamp}-${sanitizedBase}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await uploadBufferToStorage({
      buffer,
      key,
      mimeType,
      cacheControl: "public, max-age=31536000, immutable",
      contentDisposition: mimeType.startsWith("image/") ? "inline" : "attachment",
    });

    // Record asset in database under the user's dedicated record
    const asset = await prisma.storageAsset.create({
      data: {
        bucket: activeBucketName,
        key,
        fileName: originalName,
        fileSize: file.size,
        mimeType,
        url: uploadResult.url,
        folder,
        uploadedById: user.id,
      },
    });

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

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
      fileName: originalName,
      fileSize: file.size,
      mimeType,
      provider: uploadResult.provider,
      bucket: uploadResult.bucket,
      assetId: asset.id,
    });
  } catch (err: unknown) {
    console.error("Storage upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upload file to storage" },
      { status: 500 }
    );
  }
}
