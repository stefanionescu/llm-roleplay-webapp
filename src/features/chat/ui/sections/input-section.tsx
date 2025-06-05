'use client';

import { useSessionData } from '@/hooks/data/use-session-data';
import { useHistoryData } from '@/hooks/data/use-history-data';
import { useInputSection } from '@/hooks/input/use-input-section';
import { useCharacterData } from '@/hooks/data/use-character-data';
import { InputSectionSkeleton } from '@/features/chat/ui/components/skeletons/input-section-skeleton';
import { InputSectionContent } from '@/features/chat/ui/components/input-section/input-section-content';

export const InputSection = () => {
    // Extract all the character data fetching and management
    const {
        characterLoading,
        characterSuccess,
        characterId,
    } = useCharacterData();

    // Handle session data and state
    const {
        sessionData,
        sessionError,
        sessionLoading,
        sessionSuccess,
        historyLoaded,
        setHistoryLoaded,
    } = useSessionData(characterId);

    // Handle input section data and state
    const {
        characterData,
        characterError,
        isCharacterLoading,
        isCharacterSuccess,
        characterLoaded,
        anonLimitsError,
        isAnonLimitsLoading,
        isAnonLimitsSuccess,
        anonLimitsLoaded,
        getCharacter,
    } = useInputSection();

    // Create characterNames map from characterData's raw translations
    const characterNames = new Map<string, string>(
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
    } = useHistoryData(
        characterId,
        sessionData,
        historyLoaded,
        setHistoryLoaded,
        characterData?.character.icon_url || '',
        characterNames,
    );

    if (
        characterError ||
        contextError ||
        messagesError ||
        sessionError
    ) {
        throw new Error(
            `Couldn't fetch data for character: ${characterId}`,
        );
    }

    if (anonLimitsError) {
        throw new Error(
            'Failed to fetch anonymous user limits',
        );
    }

    if (
        contextLoading ||
        messagesLoading ||
        isCharacterLoading ||
        !isCharacterSuccess ||
        !characterLoaded ||
        isAnonLimitsLoading ||
        !isAnonLimitsSuccess ||
        !anonLimitsLoaded ||
        !characterData ||
        sessionLoading ||
        !sessionSuccess ||
        characterLoading ||
        !characterSuccess
    ) {
        return <InputSectionSkeleton />;
    }

    const characterFromStore = getCharacter(
        characterData.categoryId,
        characterId,
    );

    if (!characterFromStore) {
        throw new Error(
            `Inserted character not found in Zustand store: ${characterId}`,
        );
    }

    return <InputSectionContent />;
};
