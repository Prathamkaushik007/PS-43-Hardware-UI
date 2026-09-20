import { Router, Request, Response } from 'express';
import { generatePresignedUploadUrl, isR2Configured } from '../services/r2.js';

export const videoRouter = Router();

/**
 * GET /api/videos/health
 * Checks if the backend and Cloudflare R2 configurations are active.
 */
videoRouter.get('/health', (_req: Request, res: Response) => {
  const configured = isR2Configured();
  res.json({
    status: 'ok',
    r2Configured: configured,
    message: configured
      ? 'Cloudflare R2 is configured.'
      : 'Cloudflare R2 credentials missing. Please configure backend/.env.',
  });
});

/**
 * POST /api/videos/upload-url
 * Generates a presigned Cloudflare R2 PUT URL for direct browser video upload.
 */
videoRouter.post('/upload-url', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName, contentType } = req.body || {};

    if (contentType && typeof contentType !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Invalid contentType provided.',
      });
      return;
    }

    if (!isR2Configured()) {
      res.status(500).json({
        success: false,
        error: 'Cloudflare R2 is not configured on the server. Please set R2 credentials in backend/.env',
      });
      return;
    }

    const { uploadUrl, key } = await generatePresignedUploadUrl({
      fileName: typeof fileName === 'string' ? fileName : 'video.webm',
      contentType: contentType || 'video/webm',
    });

    res.status(200).json({
      success: true,
      uploadUrl,
      key,
    });
  } catch (error: any) {
    console.error('Error generating presigned upload URL:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate presigned upload URL.',
    });
  }
});
