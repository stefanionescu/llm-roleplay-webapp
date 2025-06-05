import React from 'react';
import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { useShallow } from 'zustand/react/shallow';
import { VideoReplayIcon } from '@hugeicons/core-free-icons';

import { Store } from '@/types/zustand';
import { useStore } from '@/lib/zustand/store';
import { Button } from '@/components/ui/button';

export type ToggleMemoriesButtonProps = {
    showInspiration: boolean;
    onToggle: (() => void) | null;
};

export const ToggleMemoriesButton = ({
    onToggle,
    showInspiration,
}: ToggleMemoriesButtonProps) => {
    const t = useTranslations('chat');

    const {
        isGenerating,
        isDoingRAG,
        isCheckingRAGUsage,
        isPreparingToGenerate,
    } = useStore(
        useShallow((state: Store) => ({
            isPreparingToGenerate:
                state.isPreparingToGenerate,
            isDoingRAG: state.isDoingRAG,
            isCheckingRAGUsage: state.isCheckingRAGUsage,
            isGenerating: state.isGenerating,
        })),
    );

    const isDoingRAGOrGenerating =
        isDoingRAG ||
        isPreparingToGenerate ||
        isCheckingRAGUsage ||
        isGenerating;

    return (
        <Button
            variant="secondary"
            size="sm"
            rounded="lg"
            disabled={isDoingRAGOrGenerating}
            onClick={onToggle || undefined}
        >
            <HugeiconsIcon
                icon={VideoReplayIcon}
                size={16}
                strokeWidth={2}
            />
            {showInspiration
                ? t('hideMemories')
                : t('showMemories')}
        </Button>
    );
};

export default ToggleMemoriesButton;
