import { TRPCError } from '@trpc/server';

import { baseProcedure } from '@/trpc/init';
import { createTRPCRouter } from '@/trpc/init';
import { TChatSession } from '@/types/session';
import { GetSessionsResponse } from '@/types/db';
import { getSessionsInputSchema } from '@/validators/session';
import { getPaginatedSessions } from '@/features/sessions/server/queries';

export const sessionsRouter = createTRPCRouter({
    getSessions: baseProcedure
        .input(getSessionsInputSchema)
        .query(
            async ({
                ctx,
                input,
            }): Promise<GetSessionsResponse> => {
                const { supabase } = ctx;
                const { limit, cursor } = input;

                // Request one extra item to determine if there are more results
                const { data, error } =
                    await getPaginatedSessions(
                        supabase,
                        limit + 1,
                        cursor?.activityRank || null,
                        cursor?.id || null,
                    );

                if (error) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message:
                            'Failed to fetch sessions.',
                        cause: error,
                    });
                }

                if (!data || data.length === 0) {
                    return {
                        sessions: [],
                        sessionIds: [],
                        hasMore: false,
                        cursor: null,
                    };
                }

                // Check if we got more items than requested limit
                const hasMore = data.length > limit;

                // Only process up to the requested limit
                const sessionsToProcess = hasMore
                    ? data.slice(0, limit)
                    : data;

                const sessionIds = sessionsToProcess.map(
                    (session) => session.session_id,
                );

                const sessions = sessionsToProcess.map(
                    (session) =>
                        ({
                            character: session.character_id,
                            createdAt: new Date(
                                session.created_at,
                            ),
                            latestMessageAt:
                                session.latest_message_at
                                    ? new Date(
                                          session.latest_message_at,
                                      )
                                    : null,
                            characterIcon:
                                session.character_icon_url,
                            characterNames: new Map(
                                Object.entries(
                                    session.character_names,
                                ),
                            ),
                        }) as TChatSession,
                );

                // Set the cursor for the next page if we have more results
                const nextCursor =
                    hasMore && sessions.length > 0
                        ? {
                              activityRank:
                                  sessionsToProcess[
                                      sessionsToProcess.length -
                                          1
                                  ].activity_rank,
                              id: sessionsToProcess[
                                  sessionsToProcess.length -
                                      1
                              ].session_id,
                          }
                        : null;

                return {
                    sessions,
                    sessionIds,
                    hasMore,
                    cursor: nextCursor,
                };
            },
        ),
});
