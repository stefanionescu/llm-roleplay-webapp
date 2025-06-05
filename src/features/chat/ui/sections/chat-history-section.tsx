'use client';

import { useSessionData } from '@/hooks/data/use-session-data';
import { useHistoryData } from '@/hooks/data/use-history-data';
import { useCharacterLoading } from '@/hooks/data/use-character-loading';
import { ChatHistoryContent } from '@/features/chat/ui/components/chat-history/chat-history-content';
import { ChatVirtualListSkeleton } from '@/features/chat/ui/components/skeletons/chat-virtual-list-skeleton';

export const ChatHistorySection = () => {
    // Use the new character loading hook
    const {
        characterLoaded,
        characterData,
        characterError,
        characterLoading,
        characterSuccess,
        characterId,
    } = useCharacterLoading();

    // Handle session data and state
    const {
        sessionData,
        sessionError,
        sessionLoading,
        sessionSuccess,
        historyLoaded,
        setHistoryLoaded,
        baseDataLoaded,
    } = useSessionData(characterId);

    // Create characterNames map from characterData
    const characterNames = new Map(
        characterData?.character.translations.map(
            (translation) => [
                translation.language_code,
                translation.name,
            ],
        ) || [],
    );

    // Handle history fetching and population
    const {
        contextError,
        messagesError,
        contextLoading,
        messagesLoading,
        shouldFetchHistory,
    } = useHistoryData(
        characterId,
        sessionData,
        historyLoaded,
        setHistoryLoaded,
        characterData?.character.icon_url || '',
        characterNames,
    );

    // --- Error Handling ---
    if (
        characterError ||
        sessionError ||
        (shouldFetchHistory &&
            (contextError || messagesError))
    ) {
        // Construct a more informative error message
        const errors = [
            characterError
                ? `Character fetch failed: ${characterError.message}`
                : null,
            sessionError
                ? `Session fetch failed: ${sessionError.message}`
                : null,
            contextError
                ? `Context fetch failed: ${contextError.message}`
                : null,
            messagesError
                ? `Messages fetch failed: ${messagesError.message}`
                : null,
        ]
            .filter(Boolean)
            .join('; ');
        throw new Error(
            `Failed to load chat data: ${errors}`,
        );
    }

    // --- Loading State ---
    const isLoading =
        characterLoading ||
        !characterData ||
        !characterLoaded ||
        !characterSuccess ||
        sessionLoading ||
        !sessionSuccess ||
        !baseDataLoaded ||
        (shouldFetchHistory &&
            (!historyLoaded ||
                contextLoading ||
                messagesLoading));

    if (isLoading) {
        return <ChatVirtualListSkeleton />;
    }

    // --- Render Content (if not loading and no errors) ---
    return (
        <div className="no-scrollbar flex size-full overflow-hidden">
            <div className="size-full overflow-hidden">
                <ChatHistoryContent />
            </div>
        </div>
    );
};
