import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

async function saveFile(key: string, buffer: Buffer) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const targetDir = path.dirname(path.join(uploadsDir, key));

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, key);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${key}`;
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const buffer = Buffer.from(await req.arrayBuffer());
    const publicPath = await saveFile(key, buffer);

    return NextResponse.json({ success: true, path: publicPath });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Local upload failed" },
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
        const ext = path.extname(file.name) || ".bin";
        const cleanName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
        key = `forms/${Date.now()}_${cleanName}${ext}`;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const publicPath = await saveFile(key, buffer);

      return NextResponse.json({
        success: true,
        path: publicPath,
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
    const buffer = Buffer.from(await req.arrayBuffer());
    const publicPath = await saveFile(key, buffer);
    return NextResponse.json({ success: true, path: publicPath });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Local upload failed" },
      { status: 500 }
    );
  }
}


