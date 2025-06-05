'use client';

import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { useShallow } from 'zustand/react/shallow';
import { SquareArrowReload01Icon } from '@hugeicons/core-free-icons';

import { trpc } from '@/trpc/client';
import { useStore } from '@/lib/zustand/store';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { removeSession } from '@/lib/utils/session';
import { useCharacterId } from '@/hooks/data/use-character-id';

export const RestartChatButton = () => {
    const t = useTranslations();
    const characterId = useCharacterId();
    const deleteSessionMutation =
        trpc.chat.deleteSession.useMutation();

    if (!characterId) {
        throw new Error('Character ID not found');
    }

    const {
        isGenerating,
        isPreparingToGenerate,
        isDoingRAG,
        isCheckingRAGUsage,
        characterSession,
        deleteSession,
        deleteHistory,
        removeCharacterSessionLink,
        setIsNewSession,
    } = useStore(
        useShallow((state) => ({
            isGenerating: state.isGenerating,
            isPreparingToGenerate:
                state.isPreparingToGenerate,
            isDoingRAG: state.isDoingRAG,
            isCheckingRAGUsage: state.isCheckingRAGUsage,
            characterSession:
                state.characterSessions.get(characterId),
            deleteSession: state.deleteSession,
            deleteHistory: state.deleteHistory,
            removeCharacterSessionLink:
                state.removeCharacterSessionLink,
            setIsNewSession: state.setIsNewSession,
        })),
    );

    const isRestartDisabled =
        isGenerating ||
        isPreparingToGenerate ||
        isDoingRAG ||
        isCheckingRAGUsage ||
        deleteSessionMutation.isPending;

    const handleRestart = async () => {
        if (!characterSession) return;

        try {
            // Get the container element for scrolling
            const container = document.querySelector(
                '[data-vlist-container]',
            );

            // Use the utility function to restart the session
            const success = await removeSession({
                characterId,
                characterSession,
                deleteSessionMutation,
                deleteSession,
                removeCharacterSessionLink,
                deleteHistory,
                setIsNewSession,
                container,
                scrollToTop: true,
            });

            if (!success) {
                toast.error(t('error.restartChatError'));
            }
        } catch {
            toast.error(t('error.restartChatError'));
        }
    };

    return (
        <Button
            variant="ghost"
            size="iconSm"
            disabled={isRestartDisabled}
            className="ml-auto gap-2 px-2 disabled:pointer-events-none disabled:opacity-50"
            onClick={handleRestart}
        >
            {deleteSessionMutation.isPending ? (
                <Spinner />
            ) : (
                <HugeiconsIcon
                    icon={SquareArrowReload01Icon}
                    className="size-menu-icon-desktop stroke-menu-icon"
                    fontVariant="stroke"
                />
            )}
            {t('chat.restartChat')}
        </Button>
    );
};
