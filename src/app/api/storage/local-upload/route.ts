import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { uploadBufferToStorage } from "@/lib/storage/s3";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const FORBIDDEN_MIMES = [
  "text/html",
  "application/javascript",
  "text/javascript",
  "application/x-sh",
  "application/x-php",
  "application/x-executable",
  "application/x-msdownload",
];

function sanitizeKey(raw: string): string {
  return raw
    .replace(/\.\./g, "")
    .replace(/^\/+/, "")
    .replace(/[^a-zA-Z0-9._/-]/g, "_");
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "AUDITOR") {
      return NextResponse.json({ error: "Read-only role cannot upload files." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const rawKey = searchParams.get("key");
    if (!rawKey) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }
    const key = sanitizeKey(rawKey);
    const mimeType = (req.headers.get("content-type") || "application/octet-stream").toLowerCase();
    if (FORBIDDEN_MIMES.some((f) => mimeType.includes(f))) {
      return NextResponse.json({ error: "Forbidden file type" }, { status: 400 });
    }

    const buffer = Buffer.from(await req.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 25MB limit" }, { status: 400 });
    }

    const result = await uploadBufferToStorage({ buffer, key, mimeType });
    return NextResponse.json({
      success: true,
      path: result.url,
      url: result.url,
      key: result.key,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "AUDITOR") {
      return NextResponse.json({ error: "Read-only role cannot upload files." }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "multipart/form-data required" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 25MB limit" }, { status: 400 });
    }
    const mimeType = (file.type || "application/octet-stream").toLowerCase();
    if (FORBIDDEN_MIMES.some((f) => mimeType.includes(f))) {
      return NextResponse.json({ error: "Forbidden file type" }, { status: 400 });
    }

    let key = sanitizeKey((formData.get("key") as string | null) || "");
    if (!key) {
      const ext = file.name.split(".").pop() || "bin";
      const cleanName = file.name.replace(/[^a-zA-Z0-9_-]/g, "_");
      key = `forms/${Date.now()}_${cleanName}.${ext}`;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBufferToStorage({ buffer, key, mimeType });

    return NextResponse.json({
      success: true,
      path: result.url,
      url: result.url,
      key: result.key,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
