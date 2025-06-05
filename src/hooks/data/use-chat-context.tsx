'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useStore } from '@/lib/zustand/store';
import { useCharacterId } from '@/hooks/data/use-character-id';

export type UseChatContextResult = {
    messageCount: number;
    hasMessages: boolean;
    isOnChatPage: boolean;
    characterId: string | undefined;
};

export const useChatContext = (): UseChatContextResult => {
    const characterId = useCharacterId() ?? '';

    const messageCount = useStore(
        useShallow((state) =>
            characterId
                ? (state.messageCounts.get(characterId) ??
                  0)
                : 0,
        ),
    );

    return useMemo(() => {
        const isOnChatPage = !!characterId;
        const hasMessages = messageCount > 1;

        return {
            characterId,
            isOnChatPage,
            messageCount,
            hasMessages,
        };
    }, [characterId, messageCount]);
};
