import { NextResponse } from 'next/server';
import { APIResponse } from '../../../types/api';

export async function GET() {
  const response: APIResponse<{ status: string; service: string; uptime: number }> = {
    success: true,
    data: {
      status: 'healthy',
      service: 'kiosk-management-backend',
      uptime: process.uptime(),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(response, { status: 200 });
}
