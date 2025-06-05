'use client';

import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { trpc } from '@/trpc/client';
import { useStore } from '@/lib/zustand/store';
import { dbConstants, uiConstants } from '@/config';
import { processSessionsData } from '@/lib/utils/session';

export const useSessionsData = (enabled = true) => {
    const [isLoading, setIsLoading] = useState(enabled);
    const [error, setError] = useState<Error | null>(null);
    const [dataProcessed, setDataProcessed] =
        useState(false);

    const {
        characterSessions,
        setCharacterSessionLink,
        addSessions,
        setHasMoreSessions,
    } = useStore(
        useShallow((state) => ({
            characterSessions: state.characterSessions,
            setCharacterSessionLink:
                state.setCharacterSessionLink,
            addSessions: state.addSessions,
            setHasMoreSessions: state.setHasMoreSessions,
        })),
    );

    const {
        data,
        error: fetchError,
        isLoading: isFetching,
        isSuccess,
    } = trpc.sessions.getSessions.useQuery(
        {
            limit: dbConstants.sessionLimit,
            cursor: null,
        },
        {
            enabled: enabled,
        },
    );

    useEffect(() => {
        if (fetchError) {
            setError(new Error(fetchError.message));
            setIsLoading(false);
            setDataProcessed(true);
        }
    }, [fetchError]);

    useEffect(() => {
        if (
            !isFetching &&
            isSuccess &&
            data &&
            !dataProcessed
        ) {
            processSessionsData({
                data,
                characterSessions,
                setCharacterSessionLink,
                addSessions,
                setHasMoreSessions,
            });

            setTimeout(() => {
                setIsLoading(false);
                setDataProcessed(true);
            }, uiConstants.sessionLoadingDelay);
        }
    }, [data, isFetching, isSuccess, dataProcessed]);

    return {
        isLoading: enabled && isLoading && !dataProcessed,
        error,
        success: !isLoading && !error && dataProcessed,
    };
};
