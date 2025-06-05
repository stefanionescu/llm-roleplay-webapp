import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useStore } from '@/lib/zustand/store';
import { useCharacterData } from '@/hooks/data/use-character-data';

export const useCharacterLoading = () => {
    const [characterLoaded, setCharacterLoaded] =
        useState(false);

    const { getCategory, getCharacter } = useStore(
        useShallow((state) => ({
            getCategory: state.getCategory,
            getCharacter: state.getCharacter,
        })),
    );

    const {
        characterData,
        characterError,
        characterLoading,
        characterSuccess,
        characterId,
    } = useCharacterData();

    useEffect(() => {
        if (
            characterError ||
            characterLoading ||
            !characterData ||
            !characterSuccess
        )
            return;

        // Check if character is loaded in store
        const existingCategory = getCategory(
            characterData.categoryId,
        );
        const existingCharacter = getCharacter(
            characterData.categoryId,
            characterData.character.id,
        );

        if (existingCategory && existingCharacter) {
            setCharacterLoaded(true);
        }
    }, [
        characterSuccess,
        characterError,
        characterLoading,
    ]);

    return {
        characterLoaded,
        characterData,
        characterError,
        characterLoading,
        characterSuccess,
        characterId,
    };
};
