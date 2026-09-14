import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Creates an admin client using the Supabase Service Role Key.
 * Bypasses RLS - strictly for server-side trusted operations.
 */
export function getAdminSupabaseClient() {
  const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
  const safeKey = supabaseServiceRoleKey || 'placeholder-service-role-key';

  return createClient(safeUrl, safeKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a server client with the caller's JWT token.
 * Evaluates queries against Supabase Row Level Security (RLS).
 */
export function getAuthenticatedSupabaseClient(accessToken?: string) {
  const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
  const safeKey = supabaseAnonKey || 'placeholder-anon-key';

  return createClient(safeUrl, safeKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });
}
