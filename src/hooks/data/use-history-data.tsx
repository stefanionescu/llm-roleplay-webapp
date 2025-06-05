import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { trpc } from '@/trpc/client';
import { TContext } from '@/types/context';
import { useStore } from '@/lib/zustand/store';
import { TChatSession } from '@/types/session';
import { LinkedMapList } from '@/components/custom/lists/linked-map-list';

// Define a type for the session data returned by the trpc call
type SessionDataResult = {
    sessionId: string | null;
    session: TChatSession | null;
};

export function useHistoryData(
    characterId: string,
    sessionData: SessionDataResult | undefined,
    historyLoaded: boolean,
    setHistoryLoaded: (loaded: boolean) => void,
    characterIcon: string,
    characterNames: Map<string, string>,
) {
    const {
        getMessageCount,
        getContextCount,
        characterSessions,
        addContexts,
        addMessages,
        setCharacterSessionLink,
        deleteHistory,
        insertSessionSorted,
        addHistory,
        setTotalContextTokens,
    } = useStore(
        useShallow((state) => ({
            getMessageCount: state.getMessageCount,
            getContextCount: state.getContextCount,
            characterSessions: state.characterSessions,
            addContexts: state.addContexts,
            addMessages: state.addMessages,
            setCharacterSessionLink:
                state.setCharacterSessionLink,
            deleteHistory: state.deleteHistory,
            insertSessionSorted: state.insertSessionSorted,
            addHistory: state.addHistory,
            setTotalContextTokens:
                state.setTotalContextTokens,
        })),
    );

    // --- Initial Context and Message Queries logic ---
    const sessionId = sessionData?.sessionId || null;
    // Only fetch history if:
    // 1. We have a session ID AND
    // 2. Either we have no messages/contexts OR
    //    the session ID doesn't match what's stored for this character
    const shouldFetchHistory =
        !!sessionId &&
        sessionId !== null &&
        (getMessageCount(characterId) === 0 ||
            getContextCount(characterId) === 0 ||
            characterSessions.get(characterId) !==
                sessionId);

    // We need a stable reference to sessionId *if* shouldFetchHistory is true
    const querySessionId =
        shouldFetchHistory && sessionData?.sessionId
            ? sessionData.sessionId
            : undefined;

    const [contextResult, messagesResult] = trpc.useQueries(
        (t) => [
            t.chat.getInitialContext(querySessionId || '', {
                enabled: !!querySessionId,
            }),
            t.chat.getMessages(
                { sessionId: querySessionId || '' },
                {
                    enabled: !!querySessionId,
                },
            ),
        ],
    );

    // Extract results directly
    const {
        data: contextDataRaw,
        error: contextError,
        isLoading: contextLoading,
        isSuccess: contextSuccessRaw,
    } = contextResult;
    const {
        data: messagesDataRaw,
        error: messagesError,
        isLoading: messagesLoading,
        isSuccess: messagesSuccessRaw,
    } = messagesResult;

    // Get the actual data arrays
    const contextIds = contextDataRaw?.ids;
    const contextData = contextDataRaw?.context;
    const totalTokens = contextDataRaw?.totalTokens;
    const messageIds = messagesDataRaw?.ids;
    const messageData = messagesDataRaw?.messages;

    // Determine success only if the queries were enabled and succeeded
    const contextQuerySuccess = shouldFetchHistory
        ? contextSuccessRaw
        : false;
    const messagesQuerySuccess = shouldFetchHistory
        ? messagesSuccessRaw
        : false;

    // Store in store for use by other hooks - only update if we actually fetched messages
    useEffect(() => {
        if (
            messagesQuerySuccess &&
            sessionId &&
            messageData &&
            messageData.length === 0
        ) {
            // Only mark as new if we have no messages
            useStore
                .getState()
                .setIsNewSession(characterId, true);
        } else if (
            messagesQuerySuccess &&
            sessionId &&
            messageData &&
            messageData.length > 0
        ) {
            // If we have messages, mark as not new
            useStore
                .getState()
                .setIsNewSession(characterId, false);
        }
    }, [
        messagesQuerySuccess,
        sessionId,
        characterId,
        messageData,
    ]);

    // --- Effect to add fetched history (context/messages) to Zustand ---
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (
            !shouldFetchHistory ||
            !contextQuerySuccess ||
            !messagesQuerySuccess ||
            !sessionData?.sessionId ||
            sessionData.sessionId === null ||
            !sessionData.session ||
            sessionData.session === null ||
            historyLoaded
        ) {
            return;
        }

        // At this point we're sure sessionId and session are not null
        const sessionId = sessionData.sessionId;
        const session = sessionData.session;
        const currentSessionId =
            characterSessions.get(characterId);

        // Only update the session link if needed
        if (!currentSessionId) {
            setCharacterSessionLink(characterId, sessionId);

            // Update session with characterIcon and characterNames before inserting
            const updatedSession: TChatSession = {
                ...session,
                characterIcon,
                characterNames,
            };

            // Use sessionId instead of characterId when inserting the session
            insertSessionSorted(sessionId, updatedSession);
        }

        // Only clear history if the sessionId is different AND we don't already have history
        // This prevents clearing existing history when navigating away and back
        const existingMessageCount =
            getMessageCount(characterId);
        const existingContextCount =
            getContextCount(characterId);

        // Only initialize history if we don't already have data
        if (
            existingMessageCount === 0 &&
            existingContextCount === 0
        ) {
            // Only clear if the sessionId doesn't match
            if (currentSessionId !== sessionId) {
                deleteHistory(characterId);
            }

            addHistory(characterId, {
                context: new LinkedMapList<TContext>(),
                messages: new LinkedMapList<string>(),
                totalContextTokens: 0,
            });
        }

        // Check counts again just before adding
        const contextCount = getContextCount(characterId);
        const messageCount = getMessageCount(characterId);

        // Only add contexts if we don't already have any
        if (
            contextCount === 0 &&
            contextData &&
            contextData.length > 0
        ) {
            if (
                !contextIds ||
                contextIds.length !== contextData.length
            ) {
                throw new Error(
                    'Invalid context ids or context data',
                );
            }

            addContexts(
                characterId,
                contextIds,
                contextData,
                false,
            );
            setTotalContextTokens(
                characterId,
                totalTokens ?? 0,
            );
        }

        // Only add messages if we don't already have any
        if (
            messageCount === 0 &&
            messageIds &&
            messageIds.length > 0 &&
            messageData &&
            messageData.length > 0
        ) {
            addMessages(
                characterId,
                messageIds,
                messageData,
                false,
            );
        }

        setHistoryLoaded(true);
    }, [
        shouldFetchHistory,
        contextQuerySuccess,
        messagesQuerySuccess,
        historyLoaded,
    ]);

    return {
        contextError,
        messagesError,
        contextLoading,
        messagesLoading,
        shouldFetchHistory,
    };
    /* eslint-enable react-hooks/exhaustive-deps */
}
