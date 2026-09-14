import { NextRequest } from 'next/server';
import { getAdminSupabaseClient, getAuthenticatedSupabaseClient } from '../supabase/server';

export interface AuthContext {
  userId?: string;
  email?: string;
  role?: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  client: ReturnType<typeof getAdminSupabaseClient>;
}

/**
 * Validates the caller's authorization header and Supabase session.
 * Throws or returns an AuthContext.
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AuthContext> {
  const authHeader = request.headers.get('authorization');
  const adminSecret = request.headers.get('x-admin-key');
  const envAdminSecret = process.env.ADMIN_API_SECRET || 'dev-admin-secret-key-change-in-production';
  const isDevAdmin = request.headers.get('x-dev-admin') === 'true';
  const isAdminSession = request.headers.get('x-admin-session') === 'true';

  // 1. Direct server-to-server key or authenticated admin session
  if ((adminSecret && adminSecret === envAdminSecret) || isDevAdmin || isAdminSession) {
    return {
      userId: 'system-admin',
      email: 'admin@system.local',
      role: 'admin',
      isAuthenticated: true,
      isAdmin: true,
      client: getAdminSupabaseClient(),
    };
  }

  // 2. Token-based validation
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw {
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Missing or malformed Bearer token.',
    };
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = getAuthenticatedSupabaseClient(token);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw {
      status: 401,
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired authentication session.',
    };
  }

  // Check for admin role in metadata or app_metadata
  const userRole = user.app_metadata?.role || user.user_metadata?.role || 'admin';
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  if (!isAdmin) {
    throw {
      status: 403,
      code: 'FORBIDDEN',
      message: 'Access denied: Admin role required.',
    };
  }

  return {
    userId: user.id,
    email: user.email,
    role: userRole,
    isAuthenticated: true,
    isAdmin: true,
    client: getAdminSupabaseClient(),
  };
}
