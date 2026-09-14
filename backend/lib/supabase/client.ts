import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl && process.env.NODE_ENV === 'production') {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL is not set.');
}

/**
 * Public Supabase client using Anon Key for client-side or public operations.
 * Subject to Row Level Security (RLS) policies.
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
