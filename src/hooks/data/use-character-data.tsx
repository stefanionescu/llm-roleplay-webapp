import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { trpc } from '@/trpc/client';
import { useStore } from '@/lib/zustand/store';
import { transformCharacters } from '@/trpc/transformers/character-transformer';

import { useCharacterId } from './use-character-id';

export function useCharacterData() {
    const characterId = useCharacterId();

    if (!characterId) {
        throw new Error('Could not get the character ID');
    }

    const {
        addCharacter,
        addCharacterCategory,
        addCategory,
        getCategory,
        getCharacter,
        getCharacterCategory,
        cleanAppState,
    } = useStore(
        useShallow((state) => ({
            addCharacter: state.addCharacter,
            addCharacterCategory:
                state.addCharacterCategory,
            addCategory: state.addCategory,
            getCategory: state.getCategory,
            getCharacter: state.getCharacter,
            getCharacterCategory:
                state.getCharacterCategory,
            cleanAppState: state.cleanAppState,
        })),
    );

    const {
        data: characterData,
        error: characterError,
        isLoading: characterLoading,
        isSuccess: characterSuccess,
    } = trpc.chat.getCharacter.useQuery(characterId);

    // --- Effect to clean state ---
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        cleanAppState();
    }, []);

    // --- Effect to add base character/category data to Zustand ---
    useEffect(() => {
        if (
            !characterSuccess ||
            !characterData ||
            characterError
        ) {
            return;
        }

        // Add Category if not exists
        const existingCategory = getCategory(
            characterData.categoryId,
        );
        if (!existingCategory) {
            addCategory(
                characterData.categoryId,
                characterData.category,
            );
        }

        // Add Character if not exists
        const existingCharacter = getCharacter(
            characterData.categoryId,
            characterData.character.id,
        );
        if (!existingCharacter) {
            const transformedChar = transformCharacters([
                characterData.character,
            ])[0];
            addCharacter(
                characterData.categoryId,
                characterData.character.id,
                transformedChar,
            );
            addCharacterCategory(
                characterData.categoryId,
                characterData.character.id,
            );
        }
    }, [characterSuccess]);
    /* eslint-enable react-hooks/exhaustive-deps */

    // Get the category ID from the Zustand store
    const categoryId = getCharacterCategory(characterId);

    return {
        characterData,
        characterError,
        characterLoading,
        characterSuccess,
        characterId,
        categoryId,
    };
}
