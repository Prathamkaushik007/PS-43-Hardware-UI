import { NextRequest, NextResponse } from 'next/server';
import { kioskService } from '../../../services/kioskService';
import { createKioskSchema } from '../../../schemas/kiosk';
import { verifyAdminAuth } from '../../../lib/auth/adminAuth';
import { APIResponse } from '../../../types/api';
import { Kiosk, KioskStatus } from '../../../types/kiosk';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as KioskStatus) || undefined;
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam !== null ? isActiveParam === 'true' : undefined;

    const result = await kioskService.getKiosks({
      page,
      limit,
      search,
      status,
      isActive,
    });

    const response: APIResponse<Kiosk[]> = {
      success: true,
      data: result.kiosks,
      meta: {
        total: result.total,
        page,
        limit,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    const errorObj = err as { status?: number; code?: string; message?: string };
    const statusCode = errorObj.status || 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorObj.code || 'INTERNAL_SERVER_ERROR',
          message: errorObj.message || 'An unexpected error occurred.',
        },
      },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce Admin Authentication
    await verifyAdminAuth(request);

    // 2. Parse and validate request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Request body must be a valid JSON object.',
          },
        },
        { status: 400 }
      );
    }

    const validatedData = createKioskSchema.parse(body);

    // 3. Create kiosk via service
    const createdKiosk = await kioskService.createKiosk(validatedData);

    const response: APIResponse<Kiosk> = {
      success: true,
      data: createdKiosk,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (err: unknown) {
    // Handle Zod validation error
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid kiosk payload provided.',
            details: err.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const errorObj = err as { status?: number; code?: string; message?: string };

    // Handle duplicate conflict
    if (errorObj.code === 'CONFLICT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: errorObj.message || 'Kiosk code already exists.',
          },
        },
        { status: 409 }
      );
    }

    const statusCode = errorObj.status || 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorObj.code || 'INTERNAL_SERVER_ERROR',
          message: errorObj.message || 'Failed to process request.',
        },
      },
      { status: statusCode }
    );
  }
}
