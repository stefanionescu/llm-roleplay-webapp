import { SupabaseClient } from '@supabase/supabase-js';

import {
    PaginatedSessionsResponse,
    Database,
} from '@/types/db';

export const getPaginatedSessions = async (
    supabase: SupabaseClient<Database>,
    limit: number,
    cursorActivityRank: string | null = null,
    cursorId: string | null = null,
) => {
    return (await supabase
        .schema('chat_data')
        .rpc('get_paginated_sessions', {
            p_limit: limit,
            p_cursor_activity_rank: cursorActivityRank,
            p_cursor_id: cursorId,
        })) as {
        data: PaginatedSessionsResponse | null;
        error:
            | import('@supabase/supabase-js').PostgrestError
            | null;
    };
};
