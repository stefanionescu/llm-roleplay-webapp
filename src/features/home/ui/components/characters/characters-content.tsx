'use client';

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { trpc } from '@/trpc/client';
import { useStore } from '@/lib/zustand/store';
import { transformCharacters } from '@/trpc/transformers/character-transformer';
import { CharactersSkeleton } from '@/features/home/ui/components/skeletons/characters-skeleton';

import { CharacterItems } from './character-items';

export const CharactersContent = () => {
    const {
        activeCategory,
        addCharacters,
        addCharactersCategory,
        getCharactersCount,
        getCharacters,
    } = useStore(
        useShallow((state) => ({
            activeCategory: state.activeCategory,
            addCharacters: state.addCharacters,
            addCharactersCategory:
                state.addCharactersCategory,
            getCharactersCount: state.getCharactersCount,
            getCharacters: state.getCharacters,
        })),
    );

    const [charactersFetched, setCharactersFetched] =
        useState(false);

    const {
        data,
        isSuccess,
        isLoading,
        isFetching,
        error,
    } = trpc.home.getCharacters.useQuery(
        {
            categoryId: activeCategory!, // Assert non-null because 'enabled' guarantees it
        },
        {
            // Only run the query if activeCategory is defined and we don't have the data yet
            enabled: !!activeCategory,
        },
    );

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        setCharactersFetched(false);
    }, [activeCategory]);

    useEffect(() => {
        if (!activeCategory) {
            return;
        }

        // Otherwise wait for the query to succeed
        if (isSuccess && data) {
            // Transform the data to match TCharacter format
            const transformedCharacters =
                transformCharacters(data.characters);

            // If we already have data in the store, mark as fetched
            const count =
                getCharactersCount(activeCategory) ?? 0;

            if (transformedCharacters.length > count) {
                addCharacters(
                    activeCategory,
                    data.characterIds,
                    transformedCharacters,
                );

                addCharactersCategory(
                    activeCategory,
                    data.characterIds,
                );
            }

            setCharactersFetched(true);
        }
    }, [isSuccess, activeCategory]);
    /* eslint-enable react-hooks/exhaustive-deps */

    if (error) {
        throw new Error(
            'Failed to fetch characters for category ' +
                activeCategory,
        );
    }

    // Show skeleton if:
    // 1. Loading for the first time (isLoading)
    // 2. Refetching due to category change (isFetching)
    // 3. No category selected OR fetch hasn't successfully completed for the current category (!charactersFetched)
    const shouldShowSkeleton =
        isLoading || isFetching || !charactersFetched;

    if (shouldShowSkeleton) {
        return <CharactersSkeleton />;
    }

    // At this point we know we have data, either from the store or from the query
    const characters = activeCategory
        ? getCharacters(activeCategory)
        : undefined;
    if (!characters) {
        return <CharactersSkeleton />;
    }

    return <CharacterItems />;
};
