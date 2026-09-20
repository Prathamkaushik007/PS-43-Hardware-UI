/**
 * Frontend Cloudflare R2 direct video upload service.
 * Requests a temporary presigned PUT URL from the backend,
 * then streams the video Blob directly into Cloudflare R2.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

export interface R2UploadResult {
  success: boolean;
  key: string;
  storage: 'cloudflare-r2';
  uploadedAt: string;
}

export interface UploadVideoOptions {
  fileName?: string;
  onProgress?: (progressPercent: number) => void;
}

/**
 * Uploads a video Blob directly to Cloudflare R2 via presigned PUT URL.
 * Throws descriptive errors if backend is unavailable or upload fails.
 */
export async function uploadVideoToR2(
  blob: Blob,
  options: UploadVideoOptions = {}
): Promise<R2UploadResult> {
  if (!blob || blob.size === 0) {
    throw new Error('Cannot upload empty or invalid video recording.');
  }

  const contentType = blob.type || 'video/webm';
  const fileName = options.fileName || 'recording.webm';

  // Step 1: Request presigned upload URL from backend
  let presignedData: { success: boolean; uploadUrl: string; key: string; error?: string };
  try {
    const res = await fetch(`${API_BASE_URL}/api/videos/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        contentType,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Server responded with status ${res.status}`);
    }

    presignedData = data;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to upload server. Your recording will be saved locally.');
    }
    throw new Error(err.message || 'Failed to request upload authorization from server.');
  }

  const { uploadUrl, key } = presignedData;
  if (!uploadUrl || !key) {
    throw new Error('Server returned an incomplete upload signature.');
  }

  // Step 2: Upload Blob directly to Cloudflare R2 using PUT
  try {
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: blob,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text().catch(() => '');
      throw new Error(`Cloudflare R2 rejected upload with status ${uploadRes.status}: ${errorText || uploadRes.statusText}`);
    }
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Direct upload to Cloudflare R2 failed due to network connectivity or CORS restriction.');
    }
    throw err;
  }

  return {
    success: true,
    key,
    storage: 'cloudflare-r2',
    uploadedAt: new Date().toISOString(),
  };
}
