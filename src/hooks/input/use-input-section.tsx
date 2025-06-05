import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { trpc } from '@/trpc/client';
import { useStore } from '@/lib/zustand/store';
import { useCharacterId } from '@/hooks/data/use-character-id';
import { transformCharacters } from '@/trpc/transformers/character-transformer';

export const useInputSection = () => {
    const [characterLoaded, setCharacterLoaded] =
        useState(false);
    const [anonLimitsLoaded, setAnonLimitsLoaded] =
        useState(false);

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
        setMaxMessagesPerSession,
        setMaxSessions,
    } = useStore(
        useShallow((state) => ({
            addCharacter: state.addCharacter,
            addCharacterCategory:
                state.addCharacterCategory,
            addCategory: state.addCategory,
            getCategory: state.getCategory,
            getCharacter: state.getCharacter,
            setMaxMessagesPerSession:
                state.setMaxMessagesPerSession,
            setMaxSessions: state.setMaxSessions,
        })),
    );

    const [
        {
            data: characterData,
            error: characterError,
            isLoading: isCharacterLoading,
            isSuccess: isCharacterSuccess,
        },
        {
            data: anonLimitsData,
            error: anonLimitsError,
            isLoading: isAnonLimitsLoading,
            isSuccess: isAnonLimitsSuccess,
        },
    ] = trpc.useQueries((t) => [
        t.chat.getCharacter(characterId),
        t.chat.getAnonUserLimits(),
    ]);

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (
            characterError ||
            isCharacterLoading ||
            !characterData ||
            !isCharacterSuccess
        )
            return;

        const existingCategory = getCategory(
            characterData.categoryId,
        );

        if (!existingCategory) {
            addCategory(
                characterData.categoryId,
                characterData.category,
            );
        }

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

        if (
            existingCategory ||
            getCharacter(
                characterData.categoryId,
                characterData.character.id,
            )
        ) {
            setCharacterLoaded(true);
        }
    }, [isCharacterSuccess]);

    useEffect(() => {
        if (
            anonLimitsError ||
            isAnonLimitsLoading ||
            !anonLimitsData ||
            !isAnonLimitsSuccess
        )
            return;

        setMaxMessagesPerSession(
            anonLimitsData.maxMessagesPerSession,
        );
        setMaxSessions(anonLimitsData.maxSessions);
        setAnonLimitsLoaded(true);
    }, [isAnonLimitsSuccess]);
    /* eslint-enable react-hooks/exhaustive-deps */

    return {
        characterId,
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
    };
};
