import { NextRequest, NextResponse } from "next/server";
import { s3Client, activeBucketName, storageProvider } from "@/lib/storage/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// MIME type mapping for high-performance streaming
const MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".csv": "text/csv",
  ".txt": "text/plain",
};

/**
 * Public Asset Delivery Proxy
 * Serves Cloudflare R2 / AWS S3 assets directly to browsers and email clients
 * with immutable edge caching, eliminating private S3 authorization errors.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing asset key" }, { status: 400 });
    }

    const cleanKey = key.replace(/^\/+/, "");
    const ext = path.extname(cleanKey).toLowerCase();
    const defaultMime = MIME_MAP[ext] || "application/octet-stream";

    // 1. Fetch from Cloudflare R2 / AWS S3
    if (s3Client && storageProvider !== "local") {
      try {
        const command = new GetObjectCommand({
          Bucket: activeBucketName,
          Key: cleanKey,
        });

        const response = await s3Client.send(command);
        if (response.Body) {
          const byteArray = await response.Body.transformToByteArray();
          const buffer = Buffer.from(byteArray);
          const mimeType = response.ContentType || defaultMime;

          return new NextResponse(buffer, {
            status: 200,
            headers: {
              "Content-Type": mimeType,
              "Content-Length": String(buffer.length),
              "Cache-Control": "public, max-age=31536000, immutable",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } catch (s3Err) {
        console.warn(`[Storage Proxy] Remote R2 fetch failed for '${cleanKey}', trying local:`, s3Err);
      }
    }

    // 2. Fallback to Local Disk Storage
    const localFilePath = path.join(process.cwd(), "public", "uploads", cleanKey);
    if (fs.existsSync(localFilePath)) {
      const fileBuffer = fs.readFileSync(localFilePath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": defaultMime,
          "Content-Length": String(fileBuffer.length),
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return NextResponse.json({ error: "File not found" }, { status: 404 });
  } catch (err: unknown) {
    console.error("[Storage Proxy] Error streaming asset:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to stream asset" },
      { status: 500 }
    );
  }
}
