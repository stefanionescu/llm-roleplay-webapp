import {
    PostgrestError,
    SupabaseClient,
} from '@supabase/supabase-js';

import { llmConstants } from '@/config';
import {
    CharacterWithCategoryAndTranslationsResponse,
    Database,
    LatestSessionForCharacterResponse,
    PaginatedMessageItem,
    FetchContextMessagesResponseItem,
} from '@/types/db';

export const getLatestSessionForCharacter = async (
    supabase: SupabaseClient<Database>,
    characterId: string,
) => {
    const { data, error } = (await supabase
        .schema('chat_data')
        .rpc('get_latest_session_for_character', {
            p_character_id: characterId,
        })) as {
        error: PostgrestError | null;
        data: LatestSessionForCharacterResponse | null;
    };

    return {
        data,
        error,
    };
};

export const getCharacterWithTranslations = async (
    supabase: SupabaseClient<Database>,
    characterId: string,
) => {
    return supabase
        .from('characters')
        .select(
            `
            *,
            translations:character_translations (*),
            category:character_categories (
                *,
                translations:character_category_translations (*)
            )
        `,
        )
        .eq('id', characterId)
        .single<CharacterWithCategoryAndTranslationsResponse>();
};

export const getInitialContext = async (
    supabase: SupabaseClient<Database>,
    sessionId: string,
) => {
    const rpcResponse: {
        error: PostgrestError | null;
        data: FetchContextMessagesResponseItem[] | null;
    } = await supabase
        .schema('chat_data')
        .rpc('fetch_context_messages', {
            p_session_id: sessionId,
            p_max_tokens: llmConstants.maxContextTokens,
        });

    // Access data and error from the response object
    const { data, error } = rpcResponse;

    return {
        data,
        error,
    };
};

export const getPaginatedMessages = async (
    supabase: SupabaseClient<Database>,
    sessionId: string,
    limit: number,
    lastPosition: number | null,
) => {
    const rpcResponse: {
        error: PostgrestError | null;
        data: PaginatedMessageItem[] | null;
    } = await supabase
        .schema('chat_data')
        .rpc('get_paginated_messages', {
            p_session_id: sessionId,
            p_limit: limit + 1,
            p_last_position: lastPosition ?? null,
        });

    // Access data and error from the response object
    const { data, error } = rpcResponse;

    return {
        data,
        error,
    };
};
