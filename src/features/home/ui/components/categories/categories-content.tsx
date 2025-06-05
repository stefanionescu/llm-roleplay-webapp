'use client';

import { useShallow } from 'zustand/react/shallow';
import { RefObject, useEffect, useState } from 'react';

import { trpc } from '@/trpc/client';
import { useStore } from '@/lib/zustand/store';
import { CategoriesSkeleton } from '@/features/home/ui/components/skeletons/categories-skeleton';

import { CategoriesSectionItems } from './categories-items';

type CategoriesContentProps = {
    containerRef: RefObject<HTMLDivElement>;
};

export const CategoriesContent = ({
    containerRef,
}: CategoriesContentProps) => {
    const [categoriesLoaded, setCategoriesLoaded] =
        useState(false);

    const {
        addCategories,
        getCategoriesCount,
        resetCategories,
    } = useStore(
        useShallow((state) => ({
            addCategories: state.addCategories,
            getCategoriesCount: state.getCategoriesCount,
            resetCategories: state.resetCategories,
        })),
    );

    const { data, isLoading, error, isSuccess } =
        trpc.home.getCategories.useQuery(undefined);

    const notFinishedFetching =
        error || isLoading || !isSuccess;

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (notFinishedFetching) return;

        if (
            getCategoriesCount() < data.categoryIds.length
        ) {
            resetCategories();
            addCategories(
                data.categoryIds,
                data.zustandCategories,
            );
        }

        setCategoriesLoaded(true);
    }, [isSuccess]);
    /* eslint-enable react-hooks/exhaustive-deps */

    if (error) {
        throw new Error('Failed to fetch categories');
    }

    if (!categoriesLoaded) {
        return <CategoriesSkeleton />;
    }

    return (
        <CategoriesSectionItems
            containerRef={containerRef}
        />
    );
};
