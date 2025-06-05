'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { HugeiconsIcon } from '@hugeicons/react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslations, useLocale } from 'next-intl';
import { Delete01Icon } from '@hugeicons/core-free-icons';

import { trpc } from '@/trpc/client';
import { cn } from '@/lib/utils/shad';
import { Flex } from '@/components/ui/flex';
import { useStore } from '@/lib/zustand/store';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { removeSession } from '@/lib/utils/session';
import { PopoverContent } from '@/components/ui/popover';
import { useCharacterId } from '@/hooks/data/use-character-id';
import {
    Popover,
    PopoverTrigger,
} from '@/components/ui/popover';

type DeleteSessionPopupProps = {
    characterId: string;
    isCurrentSession: boolean;
    openDeleteConfirm: boolean;
    characterNames: Map<string, string>;
    setOpenDeleteConfirm: (open: boolean) => void;
};

export const DeleteSessionPopup = ({
    openDeleteConfirm,
    setOpenDeleteConfirm,
    characterId,
    characterNames,
    isCurrentSession,
}: DeleteSessionPopupProps) => {
    const currentCharacterId = useCharacterId();
    const t = useTranslations();
    const locale = useLocale();
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteSessionMutation =
        trpc.chat.deleteSession.useMutation();

    const {
        deleteSession,
        removeCharacterSessionLink,
        deleteHistory,
        setIsNewSession,
        characterSessions,
        isPreparingToGenerate,
        isGenerating,
        isDoingRAG,
        isCheckingRAGUsage,
    } = useStore(
        useShallow((state) => ({
            deleteSession: state.deleteSession,
            removeCharacterSessionLink:
                state.removeCharacterSessionLink,
            deleteHistory: state.deleteHistory,
            setIsNewSession: state.setIsNewSession,
            sessions: state.sessions,
            characterSessions: state.characterSessions,
            isPreparingToGenerate:
                state.isPreparingToGenerate,
            isGenerating: state.isGenerating,
            isDoingRAG: state.isDoingRAG,
            isCheckingRAGUsage: state.isCheckingRAGUsage,
        })),
    );

    // Show spinner if current session and doing inference/RAG
    const showSpinner =
        isCurrentSession &&
        (isPreparingToGenerate ||
            isGenerating ||
            isDoingRAG ||
            isCheckingRAGUsage);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleting(true);

        const errorMessage = t('error.deleteChatError', {
            characterName: characterNames.get(locale) || '',
        });

        try {
            // Get the container element for scrolling
            const container = document.querySelector(
                '[data-vlist-container]',
            );

            // Get the characterSession right before deletion
            const characterSession =
                characterSessions.get(characterId);

            if (!characterSession) {
                toast.error(errorMessage);
                setIsDeleting(false);
                return;
            }

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
                scrollToTop:
                    currentCharacterId === characterId,
            });

            if (!success) {
                toast.error(errorMessage);
            } else {
                setOpenDeleteConfirm(false);
            }
        } catch {
            toast.error(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Flex className={cn('flex items-center')}>
            <Popover
                open={openDeleteConfirm}
                onOpenChange={setOpenDeleteConfirm}
            >
                <PopoverTrigger asChild>
                    <Button
                        variant={
                            openDeleteConfirm
                                ? 'secondary'
                                : 'ghost'
                        }
                        size="iconXS"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        aria-label={t('chat.deleteChat')}
                        className={cn(
                            'transition-opacity duration-150',
                            'bg-transparent focus:bg-transparent active:bg-transparent md:hover:bg-transparent',
                            'ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0',
                            {
                                'pointer-events-auto opacity-100':
                                    openDeleteConfirm ||
                                    showSpinner,
                                'pointer-events-auto opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto xl:opacity-0 xl:group-hover:opacity-100':
                                    !openDeleteConfirm &&
                                    !showSpinner,
                            },
                        )}
                    >
                        {showSpinner ? (
                            <Spinner className="mx-auto size-4" />
                        ) : (
                            <HugeiconsIcon
                                icon={Delete01Icon}
                                size={16}
                                fontVariant="stroke"
                                strokeWidth={2}
                            />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className={`ml-1.5 max-md:z-[100002] max-md:mr-3 max-md:w-[240px] md:z-[1000] md:w-[400px]`}
                    side="bottom"
                    align="start"
                    sideOffset={5}
                >
                    <p
                        className={`pb-2 text-sm font-medium md:text-base`}
                    >
                        {t('chat.deleteChatConfirm')}
                    </p>
                    <div className="flex flex-row gap-1">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            aria-label={t(
                                'chat.deleteChat',
                            )}
                            className="min-w-[100px]"
                        >
                            {isDeleting ? (
                                <Spinner className="mx-auto size-4" />
                            ) : (
                                t('chat.deleteChat')
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                setOpenDeleteConfirm(false);
                                e.stopPropagation();
                            }}
                            disabled={isDeleting}
                            aria-label={t('common.cancel')}
                        >
                            {t('common.cancel')}
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </Flex>
    );
};
