/* eslint-disable max-lines */

import { TRPCError } from '@trpc/server';
import { PostgrestError } from '@supabase/supabase-js';

import { TContext } from '@/types/context';
import { TChatMessage } from '@/types/message';
import { TChatSession } from '@/types/session';
import { API_LANGUAGES } from '@/config/language';
import { TZustandCategory } from '@/types/category';
import { createSession } from '@/features/chat/server/mutations';
import { deleteSession } from '@/features/chat/server/mutations';
import { applyPenalties } from '@/features/chat/server/mutations';
import { addMessageToSession } from '@/features/chat/server/mutations';
import {
    baseProcedure,
    createTRPCRouter,
} from '@/trpc/init';
import {
    CharacterWithTranslationsResponse,
    GetCurrentContentSettingsResponse,
} from '@/types/db';
import {
    transformCategory,
    transformPaginatedMessages,
    transformContext,
} from '@/features/chat/server/transformers';
import {
    validateCategoryTranslations,
    validateCharacterTranslations,
    addMessageInputSchema,
} from '@/features/chat/server/validators';
import {
    getCharacterWithTranslations,
    getInitialContext,
    getLatestSessionForCharacter,
    getPaginatedMessages,
} from '@/features/chat/server/queries';
import {
    getCharacterInputSchema,
    getInitialContextInputSchema,
    getLatestSessionForCharacterInputSchema,
    getMessagesInputSchema,
    createSessionInputSchema,
    applyPenaltiesInputSchema,
    deleteSessionInputSchema,
} from '@/validators/chat';

export const chatRouter = createTRPCRouter({
    applyPenalties: baseProcedure
        .input(applyPenaltiesInputSchema)
        .mutation(async ({ ctx, input }) => {
            const { supabase } = ctx;
            const { chunkIds } = input;

            const { error } = await applyPenalties(
                supabase,
                chunkIds,
            );

            if (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to apply penalties.',
                    cause: error,
                });
            }

            return true;
        }),

    createSession: baseProcedure
        .input(createSessionInputSchema)
        .mutation(
            async ({
                ctx,
                input,
            }): Promise<{
                sessionId: string;
                createdAt: string;
            }> => {
                const { supabase } = ctx;
                const { characterId } = input;

                // Get the current user's ID
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError || !user) {
                    throw new TRPCError({
                        code: 'UNAUTHORIZED',
                        message: 'User not authenticated.',
                        cause: userError,
                    });
                }

                const { data, error } = await createSession(
                    supabase,
                    characterId,
                    user.id,
                );

                if (error) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message:
                            'Failed to create chat session.',
                        cause: error,
                    });
                }

                if (!data) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message:
                            'Failed to create chat session - no data returned.',
                    });
                }

                return {
                    sessionId: data.id,
                    createdAt: data.created_at,
                };
            },
        ),

    getAnonUserLimits: baseProcedure.query(
        async ({
            ctx,
        }): Promise<{
            maxSessions: number;
            maxMessagesPerSession: number;
        }> => {
            const { supabase } = ctx;

            const { data, error } = (await supabase
                .schema('content_data')
                .rpc('get_current_content_settings')) as {
                error: PostgrestError | null;
                data: GetCurrentContentSettingsResponse | null;
            };

            if (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message:
                        'Failed to fetch anonymous user limits.',
                    cause: error,
                });
            }

            if (!data) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Content settings not found.',
                });
            }

            return {
                maxMessagesPerSession:
                    data.max_anonymous_session_messages,
                maxSessions: data.max_anonymous_sessions,
            };
        },
    ),

    getLatestSessionForCharacter: baseProcedure
        .input(getLatestSessionForCharacterInputSchema)
        .query(
            async ({
                ctx,
                input,
            }): Promise<{
                sessionId: string | null;
                session: TChatSession | null;
            }> => {
                const { supabase } = ctx;
                const { characterId } = input;

                const { data, error } =
                    await getLatestSessionForCharacter(
                        supabase,
                        characterId,
                    );

                if (error) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message:
                            'Failed to fetch latest session for character.',
                        cause: error,
                    });
                }

                if (!data || data.length === 0) {
                    return {
                        session: null,
                        sessionId: null,
                    };
                }

                const session = data[0];

                if (
                    !session.character_id ||
                    !session.created_at
                ) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Invalid session data.',
                    });
                }

                const transformedSession: TChatSession = {
                    character: session.character_id,
                    createdAt: new Date(session.created_at),
                    latestMessageAt:
                        session.latest_message_at
                            ? new Date(
                                  session.latest_message_at,
                              )
                            : null,
                    characterIcon: '',
                    characterNames: new Map(),
                };

                return {
                    session: transformedSession,
                    sessionId: session.id,
                };
            },
        ),

    getCharacter: baseProcedure
        .input(getCharacterInputSchema)
        .query(
            async ({
                ctx,
                input: characterId,
            }): Promise<{
                categoryId: string;
                category: TZustandCategory;
                character: CharacterWithTranslationsResponse;
            }> => {
                const { supabase } = ctx;
                // Filter out English ('en') from the required languages
                const requiredLanguages = Object.values(
                    API_LANGUAGES,
                ).filter(
                    (lang) =>
                        lang !== API_LANGUAGES.ENGLISH,
                );

                const {
                    data: characterDataWithCategory,
                    error,
                } = await getCharacterWithTranslations(
                    supabase,
                    characterId,
                );

                if (error) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message:
                            'Failed to fetch character data.',
                        cause: error,
                    });
                }

                if (!characterDataWithCategory) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Character not found.',
                    });
                }

                validateCharacterTranslations(
                    characterDataWithCategory,
                    requiredLanguages,
                );
                validateCategoryTranslations(
                    characterDataWithCategory.category,
                    requiredLanguages,
                );

                const transformedCategory =
                    transformCategory(
                        characterDataWithCategory.category,
                        characterDataWithCategory.id,
                    );

                const {
                    category: _category,
                    ...characterData
                } = characterDataWithCategory;

                return {
                    character: characterData,
                    categoryId:
                        characterDataWithCategory.category
                            .id,
                    category: transformedCategory,
                };
            },
        ),

    getInitialContext: baseProcedure
        .input(getInitialContextInputSchema)
        .query(
            async ({
                ctx,
                input: sessionId,
            }): Promise<{
                ids: string[];
                totalTokens: number;
                context: TContext[];
            }> => {
                const { supabase } = ctx;

                const { data, error } =
                    await getInitialContext(
                        supabase,
                        sessionId,
                    );

                if (error) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message:
                            'Failed to fetch context messages.',
                        cause: error,
                    });
                }

                if (!data) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message:
                            'No context messages found for this session.',
                    });
                }

                if (data.length === 0) {
                    return {
                        context: [],
                        totalTokens: 0,
                        ids: [],
                    };
                }

                return transformContext(data);
            },
        ),

    getMessages: baseProcedure
        .input(getMessagesInputSchema)
        .query(
            async ({
                ctx,
                input,
            }): Promise<{
                ids: string[];
                hasMore: boolean;
                messages: TChatMessage[];
            }> => {
                const { supabase } = ctx;
                const { sessionId, limit, lastPosition } =
                    input;

                const { data, error } =
                    await getPaginatedMessages(
                        supabase,
                        sessionId,
                        limit,
                        lastPosition ?? null,
                    );

                // Check for errors or null data
                if (error || !data) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message:
                            'Failed to fetch messages.',
                        cause: error,
                    });
                }

                if (data.length === 0) {
                    return {
                        ids: [],
                        messages: [],
                        hasMore: false,
                    };
                }

                let hasMore = false;
                let startIndex = data.length - 1;

                if (data.length > limit) {
                    hasMore = true;
                    startIndex -= 1;
                }

                const messages = transformPaginatedMessages(
                    data,
                    startIndex,
                );

                return {
                    messages: messages.messages,
                    ids: messages.ids,
                    hasMore,
                };
            },
        ),

    addMessage: baseProcedure
        .input(addMessageInputSchema)
        .mutation(async ({ ctx, input }) => {
            const { supabase } = ctx;
            const { sessionId, message } = input;

            // Get the current user's ID
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User not authenticated.',
                    cause: userError,
                });
            }

            // Add the message to the session
            const { data, error } =
                await addMessageToSession(
                    supabase,
                    sessionId,
                    message,
                );

            if (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message:
                        'Failed to add message to session.',
                    cause: error,
                });
            }

            return {
                messageId: data.id as string,
                createdAt: data.created_at as string,
            };
        }),

    deleteSession: baseProcedure
        .input(deleteSessionInputSchema)
        .mutation(async ({ ctx, input: sessionId }) => {
            const { supabase } = ctx;

            const { data, error } = await deleteSession(
                supabase,
                sessionId,
            );

            if (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to delete session.',
                    cause: error,
                });
            }

            if (!data) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Session not found.',
                });
            }

            return true;
        }),
});
