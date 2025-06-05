import { useShallow } from 'zustand/react/shallow';
import { useCallback, useMemo, useState } from 'react';

import { useStore } from '@/lib/zustand/store';
import { stopGenerationProcess } from '@/lib/utils/inference/inference';

export const useStopInference = (
    characterId: string,
    currentCharacterId?: string,
) => {
    const [isStopComplete, setIsStopComplete] =
        useState(false);

    const {
        getMessageCount,
        getMessage,
        getMessageId,
        updateMessage,
        addContext,
        cancelAbortController,
        cleanAppState,
        getLatestContextRole,
        getContextCount,
        deleteLatestContext,
        isPreparingToGenerate,
        isDoingRAG,
        isCheckingRAGUsage,
        isGenerating,
    } = useStore(
        useShallow((state) => ({
            getMessageCount: state.getMessageCount,
            getMessage: state.getMessage,
            getMessageId: state.getMessageId,
            updateMessage: state.updateMessage,
            addContext: state.addContext,
            cancelAbortController:
                state.cancelAbortController,
            cleanAppState: state.cleanAppState,
            getLatestContextRole:
                state.getLatestContextRole,
            getContextCount: state.getContextCount,
            deleteLatestContext: state.deleteLatestContext,
            isPreparingToGenerate:
                state.isPreparingToGenerate,
            isDoingRAG: state.isDoingRAG,
            isCheckingRAGUsage: state.isCheckingRAGUsage,
            isGenerating: state.isGenerating,
        })),
    );

    const isDoingRAGOrInference = useMemo(() => {
        return (
            isDoingRAG ||
            isCheckingRAGUsage ||
            isGenerating ||
            isPreparingToGenerate
        );
    }, [
        isDoingRAG,
        isCheckingRAGUsage,
        isGenerating,
        isPreparingToGenerate,
    ]);

    const stopGeneration = useCallback(() => {
        return () => {
            setIsStopComplete(false);

            if (!isDoingRAGOrInference) {
                return;
            }

            const targetCharacterId =
                currentCharacterId &&
                currentCharacterId !== '' &&
                currentCharacterId !== characterId
                    ? currentCharacterId
                    : characterId;

            stopGenerationProcess(
                targetCharacterId,
                getMessageCount,
                getMessage,
                getMessageId,
                updateMessage,
                addContext,
                cancelAbortController,
                cleanAppState,
                getLatestContextRole,
                getContextCount,
                deleteLatestContext,
            );
            setIsStopComplete(true);
        };
    }, [characterId, currentCharacterId]);

    return {
        isDoingRAGOrInference,
        stopGeneration,
        isStopComplete,
    };
};
