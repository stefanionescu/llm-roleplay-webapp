import { TRPCError } from '@trpc/server';

import {
    CharacterRow,
    CharacterTranslationRow,
} from '@/types/db';

export const validateCategories = (
    characters: CharacterRow[],
    translations: Map<string, CharacterTranslationRow[]>,
    languages: string[],
) => {
    for (const character of characters) {
        const characterTranslationsList =
            translations.get(character.id) || [];
        for (const language of languages) {
            const hasLanguage =
                characterTranslationsList.some(
                    (
                        translation: CharacterTranslationRow,
                    ) =>
                        translation.language_code ===
                        language,
                );
            if (!hasLanguage) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Missing translation for language ${language} in character ${character.id}`,
                });
            }
        }
    }
};
