import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
if (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
    supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    );

    // Just check for existing session but don't create anon users
    // This is now handled by the server
    void supabase.auth.getSession();
}

export { supabase };
