import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function createClient() {
    const cookieStore = cookies();

    /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(
                            ({ name, value, options }) =>
                                cookieStore.set(
                                    name,
                                    value,
                                    options,
                                ),
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        },
    );
    /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
    /* eslint-enable @typescript-eslint/no-unsafe-argument */
}
