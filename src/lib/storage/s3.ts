import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";

const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const bucketName = process.env.AWS_S3_BUCKET_NAME || "dexta-assets-storage";

export const isS3Configured = Boolean(
  accessKeyId &&
  secretAccessKey &&
  !accessKeyId.includes("test") &&
  !accessKeyId.includes("placeholder")
);

export const s3Client = isS3Configured
  ? new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

export async function getPresignedUploadUrl({
  key,
  mimeType,
  expiresInSeconds = 300,
}: {
  key: string;
  mimeType: string;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; finalUrl: string; isDirectLocal: boolean }> {
  if (isS3Configured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: mimeType,
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    const finalUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    return { uploadUrl, finalUrl, isDirectLocal: false };
  }

  // Local storage fallback for development
  const localUploadApi = `/api/storage/local-upload?key=${encodeURIComponent(key)}`;
  const finalUrl = `/uploads/${key}`;
  return { uploadUrl: localUploadApi, finalUrl, isDirectLocal: true };
}

export async function getPresignedDownloadUrl({
  key,
  expiresInSeconds = 3600,
}: {
  key: string;
  expiresInSeconds?: number;
}): Promise<string> {
  if (isS3Configured && s3Client) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  }

  return `/uploads/${key}`;
}

export async function deleteS3Asset(key: string): Promise<boolean> {
  if (isS3Configured && s3Client) {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  }

  // Delete local file if exists
  const localPath = path.join(process.cwd(), "public", "uploads", key);
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
  }
  return true;
}

