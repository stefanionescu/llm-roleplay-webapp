import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { trpc } from '@/trpc/client';
import { useStore } from '@/lib/zustand/store';

export function useSessionData(characterId: string) {
    const [baseDataLoaded, setBaseDataLoaded] =
        useState(false);
    const [historyLoaded, setHistoryLoaded] =
        useState(false);

    const {
        getMessageCount,
        getContextCount,
        characterSessions,
        deleteSession,
        deleteHistory,
        removeCharacterSessionLink,
    } = useStore(
        useShallow((state) => ({
            getMessageCount: state.getMessageCount,
            getContextCount: state.getContextCount,
            characterSessions: state.characterSessions,
            deleteSession: state.deleteSession,
            deleteHistory: state.deleteHistory,
            removeCharacterSessionLink:
                state.removeCharacterSessionLink,
        })),
    );

    const {
        data: sessionData,
        error: sessionError,
        isLoading: sessionLoading,
        isSuccess: sessionSuccess,
    } = trpc.chat.getLatestSessionForCharacter.useQuery({
        characterId,
    });

    // --- Derived State: Check if history is already loaded in Zustand ---
    const isHistoryInStore = sessionData
        ? getMessageCount(characterId) > 0 &&
          getContextCount(characterId) > 0 &&
          characterSessions.get(characterId) ===
              sessionData.sessionId
        : false;

    // --- Effect to set historyLoaded based on Zustand store ---
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (isHistoryInStore) {
            setHistoryLoaded(true);
        }
    }, [isHistoryInStore]);

    // Set baseDataLoaded when session data is successfully loaded
    useEffect(() => {
        if (sessionSuccess && !baseDataLoaded) {
            setBaseDataLoaded(true);
        }
    }, [sessionSuccess, baseDataLoaded]);

    // --- Effect to handle when NO session is found ---
    useEffect(() => {
        // Run only when base data is loaded, session query succeeded, but returned NO session ID
        if (
            !baseDataLoaded ||
            !sessionSuccess ||
            sessionData?.sessionId !== null ||
            historyLoaded
        ) {
            return;
        }

        const currentSessionIdInStore =
            characterSessions.get(characterId);

        // Check if we already have message/context data for this character
        const existingMessageCount =
            getMessageCount(characterId);
        const existingContextCount =
            getContextCount(characterId);

        // Only clear if we don't already have data
        if (
            existingMessageCount === 0 &&
            existingContextCount === 0
        ) {
            // If a session was previously stored for this character, clear it
            if (currentSessionIdInStore) {
                deleteSession(currentSessionIdInStore);
                removeCharacterSessionLink(characterId);
            }

            // Clear history in Zustand
            deleteHistory(characterId);
        }

        // Mark history as loaded because we confirmed there's no session/history to fetch
        setHistoryLoaded(true);
    }, [baseDataLoaded, sessionSuccess]);
    /* eslint-enable react-hooks/exhaustive-deps */

    return {
        sessionData,
        sessionError,
        sessionLoading,
        sessionSuccess,
        historyLoaded,
        setHistoryLoaded,
        baseDataLoaded,
        setBaseDataLoaded,
        isHistoryInStore,
    };
}
