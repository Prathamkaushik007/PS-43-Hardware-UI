import { NextRequest, NextResponse } from 'next/server';
import { kioskService } from '../../../../../services/kioskService';
import { kioskHeartbeatSchema } from '../../../../../schemas/kiosk';
import { APIResponse } from '../../../../../types/api';
import { KioskHeartbeatResponse } from '../../../../../types/kiosk';

export async function POST(
  request: NextRequest,
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

    // Optional status override in body (e.g. 'online' or 'maintenance')
    const body = await request.json().catch(() => ({}));
    const parseResult = kioskHeartbeatSchema.safeParse(body);
    const desiredStatus = parseResult.success ? parseResult.data.status : 'online';

    // Record heartbeat and retrieve updated kiosk
    const updatedKiosk = await kioskService.recordHeartbeat(id, desiredStatus);

    const response: APIResponse<KioskHeartbeatResponse> = {
      success: true,
      data: {
        kiosk_id: updatedKiosk.id,
        kiosk_code: updatedKiosk.kiosk_code,
        status: updatedKiosk.status,
        last_seen: updatedKiosk.last_seen || new Date().toISOString(),
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
          message: errorObj.message || 'Failed to record kiosk heartbeat.',
        },
      },
      { status: statusCode }
    );
  }
}
