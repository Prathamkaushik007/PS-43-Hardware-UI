import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'ps43-videos';

export function isR2Configured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

// Create S3Client instance targeting Cloudflare R2
export function getR2Client(): S3Client {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 credentials are not configured in backend/.env');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

export interface PresignedUrlOptions {
  fileName?: string;
  contentType?: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
}

/**
 * Generates a Cloudflare R2 presigned PUT URL for direct client-side upload.
 * Key follows the structure: videos/YYYY/MM/<uuid>.webm
 */
export async function generatePresignedUploadUrl(
  options: PresignedUrlOptions = {}
): Promise<PresignedUrlResult> {
  const s3Client = getR2Client();

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const uniqueId = crypto.randomUUID();

  // Enforce/normalize contentType
  const contentType = options.contentType || 'video/webm';

  // Determine file extension
  let ext = 'webm';
  if (options.fileName && options.fileName.includes('.')) {
    const userExt = options.fileName.split('.').pop()?.toLowerCase();
    if (userExt && ['webm', 'mp4', 'mkv'].includes(userExt)) {
      ext = userExt;
    }
  }

  const key = `videos/${year}/${month}/${uniqueId}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // Presigned PUT URL valid for 1 hour (3600 seconds)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return {
    uploadUrl,
    key,
  };
}
