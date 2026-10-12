import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const targetDir = path.dirname(path.join(uploadsDir, key));

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const buffer = Buffer.from(await req.arrayBuffer());
    const filePath = path.join(uploadsDir, key);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, path: `/uploads/${key}` });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Local upload failed" },
      { status: 500 }
    );
  }
}

