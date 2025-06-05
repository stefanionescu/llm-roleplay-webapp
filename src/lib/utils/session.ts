import { ProcessSessionsDataParams } from '@/types/session';
import { VirtualListContainer } from '@/types/virtual-list';

export const processSessionsData = ({
    data,
    characterSessions,
    setCharacterSessionLink,
    addSessions,
    setHasMoreSessions,
}: ProcessSessionsDataParams) => {
    const newSessionIds: string[] = [];
    const newSessions = [];

    for (let i = 0; i < data.sessions.length; i++) {
        const session = data.sessions[i];
        const sessionId = data.sessionIds[i];
        const characterId = session.character;

        // Add to the arrays for bulk addition
        newSessionIds.push(sessionId);
        newSessions.push(session);

        if (!characterSessions.has(characterId)) {
            // Create the character-session link
            setCharacterSessionLink(characterId, sessionId);
        }
    }

    // Add all new sessions to Zustand store
    if (newSessionIds.length > 0) {
        addSessions(newSessionIds, newSessions);
    }

    // Set hasMore state in Zustand store if it's false
    if (!data.hasMore) {
        setHasMoreSessions(false);
    }
};

export const removeSession = async ({
    characterId,
    characterSession,
    deleteSessionMutation,
    deleteSession,
    removeCharacterSessionLink,
    deleteHistory,
    setIsNewSession,
    container,
    scrollToTop = false,
}: {
    characterId: string;
    scrollToTop?: boolean;
    characterSession: string;
    container?: Element | null;
    deleteSession: (session: string) => void;
    deleteHistory: (characterId: string) => void;
    removeCharacterSessionLink: (
        characterId: string,
    ) => void;
    setIsNewSession: (
        characterId: string,
        isNew: boolean,
    ) => void;
    deleteSessionMutation: {
        mutateAsync: (
            sessionId: string,
        ) => Promise<boolean>;
    };
}) => {
    try {
        const result =
            await deleteSessionMutation.mutateAsync(
                characterSession,
            );
        if (!result) {
            return false;
        }

        deleteSession(characterSession);
        removeCharacterSessionLink(characterId);
        deleteHistory(characterId);
        setIsNewSession(characterId, true);

        if (scrollToTop && container) {
            setTimeout(() => {
                const virtualContainer =
                    container as VirtualListContainer;
                if (
                    virtualContainer?._virtualizerRef
                        ?.current
                ) {
                    virtualContainer._virtualizerRef.current.scrollToIndex(
                        0,
                        {
                            align: 'start',
                        },
                    );
                }
            }, 100);
        }

        return true;
    } catch {
        return false;
    }
};
