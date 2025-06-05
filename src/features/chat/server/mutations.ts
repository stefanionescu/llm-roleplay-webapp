import { SupabaseClient } from '@supabase/supabase-js';

import { TChatMessage } from '@/types/message';
import {
    Database,
    CreateSessionResponse,
} from '@/types/db';

export async function createSession(
    supabase: SupabaseClient<Database>,
    characterId: string,
    userId: string,
): Promise<CreateSessionResponse> {
    return await supabase
        .schema('chat_data')
        .from('active_chat_sessions')
        .insert({
            character_id: characterId,
            user_id: userId,
            set_for_migration: false,
        })
        .select('id, created_at')
        .single();
}

export async function applyPenalties(
    supabase: SupabaseClient<Database>,
    chunkIds: string[],
) {
    return await supabase
        .schema('content_data')
        .rpc('apply_penalties_to_documents', {
            p_document_ids: chunkIds,
        });
}

export async function addMessageToSession(
    supabase: SupabaseClient<Database>,
    sessionId: string,
    message: Omit<TChatMessage, 'createdAt' | 'position'>,
) {
    return await supabase
        .schema('chat_data')
        .from('active_chat_messages')
        .insert({
            session_id: sessionId,
            raw_human: message.rawHuman,
            raw_ai: message.rawAI,
            stop_reason: message.stopReason,
            error_message: message.errorMessage,
            llm_model_used: message.llmModelUsed,
            relevant_content: message.relevantContent,
            ai_token_count: message.aiTokenCount,
            human_token_count: message.humanTokenCount,
        })
        .select('id, created_at')
        .single();
}

export async function deleteSession(
    supabase: SupabaseClient<Database>,
    sessionId: string,
) {
    return await supabase
        .schema('chat_data')
        .from('active_chat_sessions')
        .update({ set_for_migration: true })
        .eq('id', sessionId)
        .select('id')
        .single();
}
