import { TChatSession } from '@/types/session';
import { supabase } from '@/lib/supabase/client';
import {
    TCharacter,
    TBaseCharacter,
} from '@/types/character';

/**
 * Gets the user ID from authentication
 */
export const getUserId = async (): Promise<
    string | null
> => {
    const sessionResponse =
        await supabase?.auth.getSession();
    return sessionResponse?.data.session?.user?.id || null;
};

/**
 * Validates session state by checking context and message counts
 */
export const validateChatState = (
    contextCount: number,
    messageCount: number,
    showError: (message: string) => void,
    errorMessage: string,
): boolean => {
    if (
        (contextCount > 0 && messageCount === 0) ||
        (messageCount > 0 && contextCount === 0)
    ) {
        showError(errorMessage);
        return false;
    }
    return true;
};

/**
 * Creates a new session for a character
 */
export const createNewSession = async (
    characterId: string,
    character: TCharacter,
    createSessionMutation: {
        mutateAsync: (params: {
            characterId: string;
        }) => Promise<{
            sessionId: string;
            createdAt: string | number | Date;
        }>;
    },
    addSession: (
        characterId: string,
        session: TChatSession,
        shouldPersist: boolean,
    ) => void,
    setCharacterSessionLink: (
        characterId: string,
        sessionId: string,
    ) => void,
    increaseAnonSessions: () => void,
    showError: (message: string) => void,
    errorMessage: string,
    setIsPreparingToGenerate: (
        isGenerating: boolean,
    ) => void,
): Promise<{
    isNewSession: boolean;
    sessionId: string | undefined;
}> => {
    try {
        const result =
            await createSessionMutation.mutateAsync({
                characterId,
            });

        if (!result.sessionId) {
            throw new Error('Failed to create session');
        }

        // Create a Map of language codes to character names from the translations
        const characterNames = new Map<string, string>();
        // Add the default English name
        characterNames.set('en', character.name);
        const translations =
            character.translations.toArray();
        translations.forEach(
            (
                translation: TBaseCharacter,
                index: number,
            ) => {
                const languageCode =
                    character.translations.ids()[index];
                characterNames.set(
                    languageCode,
                    translation.name,
                );
            },
        );

        const newSession: TChatSession = {
            character: characterId,
            createdAt: new Date(result.createdAt),
            latestMessageAt: null,
            characterIcon: character.icon_url,
            characterNames,
        };

        addSession(result.sessionId, newSession, false);
        setCharacterSessionLink(
            characterId,
            result.sessionId,
        );
        increaseAnonSessions();

        return {
            sessionId: result.sessionId,
            isNewSession: true,
        };
        // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (error: unknown) {
        showError(errorMessage);
        setIsPreparingToGenerate(false);
        return {
            sessionId: undefined,
            isNewSession: false,
        };
    }
};
