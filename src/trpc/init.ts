import { cache } from 'react';
import superjson from 'superjson';
import { initTRPC } from '@trpc/server';
import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/types/db';

import { createClient } from '../lib/supabase/server';

export const createTRPCContext = cache(async () => {
    const supabase = createClient();

    // First try to get existing user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        // If no user exists, create an anonymous one
        const {
            data: { user: anonUser },
            error,
        } = await supabase.auth.signInAnonymously();
        if (error || !anonUser) {
            throw new Error(
                'Failed to create anonymous user',
            );
        }
    }

    return { supabase: supabase, userId: user?.id };
});

export type Context = {
    userId: string | undefined;
    supabase: SupabaseClient<Database>;
};

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
    /**
     * @see https://trpc.io/docs/server/data-transformers
     */
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                message:
                    error.message || 'An error occurred',
                code: error.code,
            },
        };
    },
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
