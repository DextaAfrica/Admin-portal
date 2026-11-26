import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";

// ── Configuration Variables ───────────────────────────────────────────────
// Cloudflare R2 Credentials
const r2AccountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || "";
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "";
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "";
const r2BucketName = process.env.R2_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || "dexta-assets";
const r2PublicUrl = process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL || "";

// AWS S3 / Custom S3 Credentials
const awsRegion = process.env.AWS_REGION || "us-east-1";
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const awsBucketName = process.env.AWS_S3_BUCKET_NAME || "dexta-assets-storage";
const customS3Endpoint = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT || "";

function isValidCredential(val: string | undefined): boolean {
  if (!val) return false;
  const lower = val.toLowerCase().trim();
  if (
    lower.includes("your_") ||
    lower.includes("placeholder") ||
    lower.includes("test") ||
    lower.includes("example") ||
    lower.includes("change_me") ||
    lower.length < 8
  ) {
    return false;
  }
  return true;
}

export const isR2Configured = Boolean(
  isValidCredential(r2AccountId) &&
  isValidCredential(r2AccessKeyId) &&
  isValidCredential(r2SecretAccessKey)
);

export const isS3Configured = Boolean(
  isR2Configured ||
  (isValidCredential(awsAccessKeyId) && isValidCredential(awsSecretAccessKey))
);

export const storageProvider: "cloudflare_r2" | "aws_s3" | "custom_s3" | "local" = (() => {
  if (isR2Configured) return "cloudflare_r2";
  if (customS3Endpoint && awsAccessKeyId) return "custom_s3";
  if (awsAccessKeyId && awsSecretAccessKey && !awsAccessKeyId.includes("test")) return "aws_s3";
  return "local";
})();

export const activeBucketName = isR2Configured ? r2BucketName : awsBucketName;

export const s3Client = (() => {
  if (storageProvider === "cloudflare_r2") {
    return new S3Client({
      region: "auto",
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    });
  }

  if (storageProvider === "custom_s3") {
    return new S3Client({
      region: awsRegion,
      endpoint: customS3Endpoint,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  if (storageProvider === "aws_s3") {
    return new S3Client({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });
  }

  return null;
})();

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://admin.dextaafrica.com";
}

/**
 * Resolves the permanent, production-grade public URL for any uploaded asset.
 * - For Cloudflare R2 with public domain: https://assets.dextaafrica.com/key
 * - For Cloudflare R2 default: https://<bucket>.<account>.r2.cloudflarestorage.com/key
 * - For AWS S3: https://<bucket>.s3.<region>.amazonaws.com/key
 * - For Local Storage: absolute URL e.g. https://admin.dextaafrica.org/uploads/key
 */
export function resolvePublicAssetUrl(key: string, forceAbsolute = true): string {
  const cleanKey = key.replace(/^\/+/, "");

  // If a public Cloudflare R2 CDN URL is configured (e.g. https://assets.dextaafrica.com or https://pub-xxx.r2.dev)
  if (r2PublicUrl) {
    return `${r2PublicUrl.replace(/\/$/, "")}/${cleanKey}`;
  }

  // If R2 or S3 is active but no public CDN domain is mapped, route through the streaming proxy endpoint
  // This guarantees public visibility for email clients & mobile browsers without S3 authentication errors
  if (storageProvider === "cloudflare_r2" || storageProvider === "custom_s3" || storageProvider === "aws_s3") {
    return `${getAppBaseUrl()}/api/storage/file?key=${encodeURIComponent(cleanKey)}`;
  }

  // Local disk storage fallback
  if (forceAbsolute) {
    return `${getAppBaseUrl()}/uploads/${cleanKey}`;
  }
  return `/uploads/${cleanKey}`;
}

/**
 * Uploads a raw buffer directly to Cloudflare R2 or S3 bucket,
 * with automatic local disk fallback.
 */
export async function uploadBufferToStorage({
  buffer,
  key,
  mimeType,
  cacheControl = "public, max-age=31536000, immutable",
  contentDisposition = "inline",
}: {
  buffer: Buffer;
  key: string;
  mimeType: string;
  cacheControl?: string;
  contentDisposition?: string;
}): Promise<{ success: boolean; url: string; key: string; bucket: string; provider: string }> {
  const cleanKey = key.replace(/^\/+/, "");

  if (s3Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: activeBucketName,
        Key: cleanKey,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: cacheControl,
        ContentDisposition: contentDisposition,
      });

      await s3Client.send(command);
      const finalUrl = resolvePublicAssetUrl(cleanKey, true);

      return {
        success: true,
        url: finalUrl,
        key: cleanKey,
        bucket: activeBucketName,
        provider: storageProvider,
      };
    } catch (s3Err) {
      console.warn("⚠️  [Storage] Remote S3/R2 upload failed, falling back to local storage:", s3Err);
    }
  }

  // Local storage fallback for offline / development environments
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const targetDir = path.dirname(path.join(uploadsDir, cleanKey));

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, cleanKey);
    fs.writeFileSync(filePath, buffer);

    const finalUrl = resolvePublicAssetUrl(cleanKey, true);

    return {
      success: true,
      url: finalUrl,
      key: cleanKey,
      bucket: "local_disk",
      provider: "local",
    };
  } catch (fsErr) {
    console.warn("⚠️  [Storage] Local disk storage write failed, providing high-res inline fallback:", fsErr);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return {
      success: true,
      url: dataUrl,
      key: cleanKey,
      bucket: "memory_buffer",
      provider: "memory",
    };
  }
}

export async function getPresignedUploadUrl({
  key,
  mimeType,
  expiresInSeconds = 300,
}: {
  key: string;
  mimeType: string;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; finalUrl: string; isDirectLocal: boolean; provider: string }> {
  const cleanKey = key.replace(/^\/+/, "");

  if (s3Client) {
    const command = new PutObjectCommand({
      Bucket: activeBucketName,
      Key: cleanKey,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000, immutable",
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    const finalUrl = resolvePublicAssetUrl(cleanKey, true);
    return { uploadUrl, finalUrl, isDirectLocal: false, provider: storageProvider };
  }

  // Local storage fallback
  const localUploadApi = `/api/storage/local-upload?key=${encodeURIComponent(cleanKey)}`;
  const finalUrl = resolvePublicAssetUrl(cleanKey, true);
  return { uploadUrl: localUploadApi, finalUrl, isDirectLocal: true, provider: "local" };
}

export async function getPresignedDownloadUrl({
  key,
  expiresInSeconds = 3600,
}: {
  key: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const cleanKey = key.replace(/^\/+/, "");

  if (s3Client) {
    const command = new GetObjectCommand({
      Bucket: activeBucketName,
      Key: cleanKey,
    });
    return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  }

  return resolvePublicAssetUrl(cleanKey, true);
}

export async function deleteS3Asset(key: string): Promise<boolean> {
  const cleanKey = key.replace(/^\/+/, "").replace(/\.\./g, "");
  if (!cleanKey) return false;

  if (s3Client) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: activeBucketName,
        Key: cleanKey,
      });
      await s3Client.send(command);
    } catch (err) {
      console.warn("[deleteS3Asset R2/S3 warning]:", err);
    }
  }

  // Also clean up any local fallback files in public/uploads or uploads
  const candidateRoots = [
    path.join(process.cwd(), "public", "uploads"),
    path.join(process.cwd(), "uploads"),
  ];
  for (const root of candidateRoots) {
    const resolved = path.resolve(root, cleanKey);
    if (resolved.startsWith(root + path.sep) && fs.existsSync(resolved)) {
      try {
        fs.unlinkSync(resolved);
      } catch (e) {
        console.warn("[deleteS3Asset local unlink warning]:", e);
      }
    }
  }
  return true;
}
