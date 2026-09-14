import { NextRequest, NextResponse } from 'next/server';
import { kioskService } from '../../../../services/kioskService';
import { updateKioskSchema } from '../../../../schemas/kiosk';
import { verifyAdminAuth } from '../../../../lib/auth/adminAuth';
import { APIResponse } from '../../../../types/api';
import { Kiosk } from '../../../../types/kiosk';
import { z } from 'zod';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Kiosk identifier is required.',
          },
        },
        { status: 400 }
      );
    }

    const kiosk = await kioskService.getKioskById(id);
    if (!kiosk) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Kiosk with identifier '${id}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    const response: APIResponse<Kiosk> = {
      success: true,
      data: kiosk,
      meta: {
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
          message: errorObj.message || 'Failed to retrieve kiosk.',
        },
      },
      { status: statusCode }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Enforce Admin Authentication
    await verifyAdminAuth(request);

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Kiosk ID parameter is required.',
          },
        },
        { status: 400 }
      );
    }

    // 2. Parse and validate update body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Valid JSON request body is required.',
          },
        },
        { status: 400 }
      );
    }

    const validatedData = updateKioskSchema.parse(body);

    // 3. Update only the targeted kiosk
    const updatedKiosk = await kioskService.updateKiosk(id, validatedData);

    const response: APIResponse<Kiosk> = {
      success: true,
      data: updatedKiosk,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update payload provided.',
            details: err.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const errorObj = err as { status?: number; code?: string; message?: string };
    if (errorObj.code === 'NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: errorObj.message || 'Kiosk not found.',
          },
        },
        { status: 404 }
      );
    }

    const statusCode = errorObj.status || 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorObj.code || 'INTERNAL_SERVER_ERROR',
          message: errorObj.message || 'Failed to update kiosk.',
        },
      },
      { status: statusCode }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Enforce Admin Authentication
    await verifyAdminAuth(request);

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Kiosk ID is required.',
          },
        },
        { status: 400 }
      );
    }

    // 2. Perform safe soft-delete
    await kioskService.softDeleteKiosk(id);

    const response: APIResponse<{ id: string; deleted: boolean }> = {
      success: true,
      data: {
        id,
        deleted: true,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    const errorObj = err as { status?: number; code?: string; message?: string };
    if (errorObj.code === 'NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: errorObj.message || 'Kiosk not found.',
          },
        },
        { status: 404 }
      );
    }

    const statusCode = errorObj.status || 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorObj.code || 'INTERNAL_SERVER_ERROR',
          message: errorObj.message || 'Failed to delete kiosk.',
        },
      },
      { status: statusCode }
    );
  }
}
