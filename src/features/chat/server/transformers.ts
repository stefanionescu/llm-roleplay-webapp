import { v4 as uuidv4 } from 'uuid';

import { TContext } from '@/types/context';
import { API_LANGUAGES } from '@/config/language';
import { TZustandCategory } from '@/types/category';
import { TChatMessage, TStopReason } from '@/types/message';
import {
    CategoryRow,
    CategoryTranslationRow,
    PaginatedMessageItem,
} from '@/types/db';

export const transformPaginatedMessages = (
    data: PaginatedMessageItem[],
    startIndex: number,
): { ids: string[]; messages: TChatMessage[] } => {
    const messages: TChatMessage[] = [];
    const ids: string[] = [];

    for (let i = startIndex; i >= 0; i--) {
        const item: PaginatedMessageItem = data[i];

        if (
            item.message_id === null ||
            item.message_created_at === null ||
            item.message_position === null ||
            item.message_raw_ai === null ||
            item.message_ai_token_count === null
        ) {
            continue;
        }

        const message: TChatMessage = {
            createdAt: new Date(item.message_created_at),
            position: item.message_position,
            rawHuman: item.message_raw_human ?? undefined,
            rawAI: item.message_raw_ai,
            stopReason:
                (item.message_stop_reason as TStopReason) ??
                undefined,
            errorMessage:
                item.message_error_message ?? undefined,
            llmModelUsed: item.message_llm_model_used ?? '',
            relevantContent:
                item.message_relevant_content ?? undefined,
            aiTokenCount: item.message_ai_token_count,
            humanTokenCount:
                item.message_human_token_count ?? 0,
        };

        messages.push(message);
        ids.push(item.message_id);
    }

    return { messages, ids };
};

export const transformCategory = (
    category: CategoryRow & {
        translations: CategoryTranslationRow[];
    },
    characterId: string,
): TZustandCategory => {
    const translations = category.translations.reduce(
        (
            acc: TZustandCategory['translations'],
            trans: CategoryTranslationRow,
        ) => ({
            ...acc,
            [trans.language_code]: trans.name,
        }),
        {} as Record<
            (typeof API_LANGUAGES)[keyof typeof API_LANGUAGES],
            string
        >,
    );

    return {
        name: category.name,
        translations,
        characters: [characterId],
    };
};

export const transformContext = (
    data: {
        role: string;
        content: string;
        token_count: number;
    }[],
): {
    ids: string[];
    context: TContext[];
    totalTokens: number;
} => {
    // Map the database response directly to TContext format
    const context: TContext[] = data.map((item) => ({
        role: item.role as 'user' | 'assistant',
        content: item.content,
        tokenCount: item.token_count,
    }));

    // Calculate total tokens
    const totalTokens = data.reduce(
        (sum, item) => sum + item.token_count,
        0,
    );

    // Generate a UUID for each context item
    const ids: string[] = data.map(() => uuidv4());

    return {
        context,
        totalTokens,
        ids,
    };
};
