import React from 'react';
import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon } from '@hugeicons/core-free-icons';
import { Tick01Icon } from '@hugeicons/core-free-icons';

import { Flex } from '@/components/ui/flex';
import { Button } from '@/components/ui/button';
import ToggleMemoriesButton from '@/features/chat/ui/components/chat-history/messages/ai/toggle-memories-button';

type AIMessageButtonsProps = {
    rawAI: string;
    isLast: boolean;
    stopReason: string;
    showCopied: boolean;
    hasMemories: boolean;
    showInspiration: boolean;
    handleCopyContent: () => void;
    handleToggleInspirationClick: () => void;
};

export const AIMessageButtons = ({
    stopReason,
    rawAI,
    showCopied,
    handleCopyContent,
    handleToggleInspirationClick,
    showInspiration,
    isLast,
    hasMemories,
}: AIMessageButtonsProps) => {
    const t = useTranslations();

    // Only show copy button when message is finished and has content
    const showCopyButton =
        (stopReason === 'finish' ||
            stopReason === 'cancel') &&
        rawAI &&
        rawAI.length > 0;

    // Show memories button only for non-last messages that have memories
    const showMemoriesButton = !isLast && hasMemories;

    return (
        <Flex gap="sm" items="center" className="w-full">
            {showCopyButton && (
                <Button
                    variant="secondary"
                    size="sm"
                    rounded="lg"
                    className="min-w-[80px] max-w-[120px]"
                    onClick={handleCopyContent}
                >
                    {showCopied ? (
                        <HugeiconsIcon
                            icon={Tick01Icon}
                            size={16}
                            strokeWidth={2}
                        />
                    ) : (
                        <HugeiconsIcon
                            icon={Copy01Icon}
                            size={16}
                            strokeWidth={2}
                        />
                    )}
                    {t('chat.copy')}
                </Button>
            )}
            {showMemoriesButton && (
                <ToggleMemoriesButton
                    onToggle={handleToggleInspirationClick}
                    showInspiration={showInspiration}
                />
            )}
        </Flex>
    );
};
