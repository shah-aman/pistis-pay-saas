import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
  console.error('Required variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Client for use in browser/client components
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any; // Will throw error when used if not configured

// Admin client for server-side operations (requires service role key)
export const createSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable.\n' +
      'Please add it to your .env.local file.\n' +
      'You can find it in Supabase Dashboard > Project Settings > API > Project URL'
    );
  }
  
  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable.\n' +
      'Please add it to your .env.local file.\n' +
      'You can find it in Supabase Dashboard > Project Settings > API > service_role key\n' +
      'Note: This should NOT have NEXT_PUBLIC_ prefix'
    );
  }
  
  return createClient(supabaseUrl, serviceRoleKey);
};
