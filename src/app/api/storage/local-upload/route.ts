import { NextRequest, NextResponse } from "next/server";
import { uploadBufferToStorage, resolvePublicAssetUrl } from "@/lib/storage/s3";

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const mimeType = req.headers.get("content-type") || "application/octet-stream";
    const buffer = Buffer.from(await req.arrayBuffer());

    const result = await uploadBufferToStorage({
      buffer,
      key,
      mimeType,
    });

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
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      let key = (formData.get("key") as string | null) || "";

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      if (!key) {
        const ext = file.name.split(".").pop() || "bin";
        const cleanName = file.name.replace(/[^a-zA-Z0-9_-]/g, "_");
        key = `forms/${Date.now()}_${cleanName}.${ext}`;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadBufferToStorage({
        buffer,
        key,
        mimeType: file.type || "application/octet-stream",
      });

      return NextResponse.json({
        success: true,
        path: result.url,
        url: result.url,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
    }

    // Direct buffer POST fallback
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const mimeType = req.headers.get("content-type") || "application/octet-stream";
    const buffer = Buffer.from(await req.arrayBuffer());
    const result = await uploadBufferToStorage({
      buffer,
      key,
      mimeType,
    });

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
