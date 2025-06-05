/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { StoreSlice } from '@/lib/zustand/store-slice';
import { SortedSessionsList } from '@/components/custom/lists/sorted-sessions-list';
import {
    ChatSessionsSlice,
    TChatSession,
    TChatSessions,
} from '@/types/session';

const initialState: TChatSessions = {
    sessionsCount: 0,
    hasMoreSessions: true,
    sessions: new SortedSessionsList<TChatSession>(),
    characterSessions: new Map<string, string>(),
    sessionCharacters: new Map<string, string>(),
};

export const createChatSessionsSlice: StoreSlice<
    ChatSessionsSlice
> = (set, get) => ({
    ...initialState,
    addSession: (
        id: string,
        session: TChatSession,
        end = true,
    ) => {
        set((state) => {
            if (end) {
                state.sessions.pushEnd(id, session);
            } else {
                state.sessions.pushFront(id, session);
            }

            state.sessionsCount = state.sessions.length;
        });
    },
    addSessions: (
        ids: string[],
        sessions: TChatSession[],
    ) => {
        if (ids.length !== sessions.length) {
            throw new Error(
                'ids and sessions arrays must have the same length',
            );
        }

        set((state) => {
            state.sessions.pushEndMultiple(
                ids.map((id, index) => [
                    id,
                    sessions[index],
                ]),
            );

            state.sessionsCount = state.sessions.length;
        });
    },
    updateSession: (id: string, session: TChatSession) => {
        set((state) => {
            state.sessions.update(id, session);
        });
    },
    deleteSession: (id: string) => {
        set((state) => {
            state.sessions.delete(id);
            state.sessionsCount = state.sessions.length;
        });
    },
    removeCharacterSessionLink: (characterId: string) => {
        set((state) => {
            const sessionId =
                state.characterSessions.get(characterId);
            if (sessionId) {
                state.characterSessions.delete(characterId);
                state.sessionCharacters.delete(sessionId);
            }
        });
    },
    setCharacterSessionLink: (
        characterId: string,
        sessionId: string,
    ) => {
        set((state) => {
            state.characterSessions.set(
                characterId,
                sessionId,
            );
            state.sessionCharacters.set(
                sessionId,
                characterId,
            );
        });
    },
    moveSessionToTop: (id: string) => {
        set((state) => {
            const sessionDraft = state.sessions.get(id);
            if (sessionDraft) {
                const firstSession =
                    state.sessions.getFirst();
                if (firstSession !== sessionDraft) {
                    state.sessions.delete(id);
                    state.sessions.pushFront(
                        id,
                        sessionDraft,
                    );
                }
            }
        });
    },
    setLatestMessageAt: (
        id: string,
        latestMessageAt: Date,
    ) => {
        set((state) => {
            const sessionDraft = state.sessions.get(id);
            if (sessionDraft) {
                sessionDraft.latestMessageAt =
                    latestMessageAt;
            }
        });
    },
    getSession: (id: string) => {
        return get().sessions.get(id);
    },
    getSessionByIndex: (index: number) => {
        const sessions = get().sessions.getRange(
            index,
            index + 1,
        );
        return sessions[0];
    },
    getSessionCount: () => {
        return get().sessions.length;
    },
    getLastSessionActivityRank: () => {
        const lastSession = get().sessions.getLast();
        if (!lastSession) return null;

        const latestMessageAt = lastSession.latestMessageAt;
        const createdAt = lastSession.createdAt;

        if (!latestMessageAt) return createdAt;
        return latestMessageAt > createdAt
            ? latestMessageAt
            : createdAt;
    },
    getFirstSessionActivityRank: () => {
        const firstSession = get().sessions.getFirst();
        if (!firstSession) return null;

        const latestMessageAt =
            firstSession.latestMessageAt;
        const createdAt = firstSession.createdAt;

        if (!latestMessageAt) return createdAt;
        return latestMessageAt > createdAt
            ? latestMessageAt
            : createdAt;
    },
    findSessionInsertionPoint: (
        id: string,
        session: TChatSession,
    ) => {
        return get().sessions.findInsertionPointId(
            id,
            session,
        );
    },
    setHasMoreSessions: (value: boolean) => {
        set((state) => {
            state.hasMoreSessions = value;
        });
    },
    insertSessionSorted: (
        id: string,
        session: TChatSession,
    ) => {
        set((state) => {
            const beforeId =
                state.sessions.findInsertionPointId(
                    id,
                    session,
                );
            if (beforeId) {
                state.sessions.pushBefore(
                    id,
                    session,
                    beforeId,
                );
            } else {
                state.sessions.pushEnd(id, session);
            }
        });
    },
    clearSessions: () => {
        set((state) => {
            state.sessions.clear();
            state.characterSessions.clear();
            state.sessionCharacters.clear();
            state.sessionsCount = 0;
            state.hasMoreSessions = true;
        });
    },
});
