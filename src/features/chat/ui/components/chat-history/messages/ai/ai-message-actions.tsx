import React from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Store } from '@/types/zustand';
import { Flex } from '@/components/ui/flex';
import { useStore } from '@/lib/zustand/store';
import { useClipboard } from '@/hooks/ui/use-clipboard';
import { AIMessageButtons } from '@/features/chat/ui/components/chat-history/messages/ai/ai-message-buttons';
import { InferenceProgressIndicator } from '@/features/chat/ui/components/chat-history/messages/ai/inference-progress-indicator';

type TAIMessageActions = {
    rawAI: string;
    isLast: boolean;
    stopReason: string;
    hasMemories: boolean;
    showInspiration: boolean;
    toggleMemories: (() => void) | null;
};

export const AIMessageActions = ({
    hasMemories,
    rawAI,
    stopReason,
    showInspiration,
    isLast,
    toggleMemories,
}: TAIMessageActions) => {
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

    // Use clipboard hook to copy message content and show confirmation UI
    const { showCopied, copy } = useClipboard();

    // Function to copy the message content to clipboard
    const handleCopyContent = async () => {
        await copy(rawAI);
    };

    const handleToggleInspirationClick = () => {
        if (toggleMemories) {
            toggleMemories();
        }
    };

    const isDoingRAGOrGenerating =
        isDoingRAG ||
        isPreparingToGenerate ||
        isCheckingRAGUsage ||
        isGenerating;

    const showIndicatorCondition =
        isDoingRAGOrGenerating && isLast && !stopReason;

    return (
        <>
            {showIndicatorCondition && (
                <div className="mb-2 w-full">
                    <InferenceProgressIndicator
                        rawAI={rawAI}
                        isDoingRAG={isDoingRAG}
                        isPreparingToGenerate={
                            isPreparingToGenerate
                        }
                        isCheckingRAGUsage={
                            isCheckingRAGUsage
                        }
                        isGenerating={isGenerating}
                    />
                </div>
            )}

            <Flex
                justify="end"
                items="start"
                className="w-full pb-4 opacity-100 transition-opacity"
            >
                <AIMessageButtons
                    stopReason={stopReason}
                    rawAI={rawAI}
                    showCopied={showCopied}
                    showInspiration={showInspiration}
                    isLast={isLast}
                    hasMemories={hasMemories}
                    handleCopyContent={handleCopyContent}
                    handleToggleInspirationClick={
                        handleToggleInspirationClick
                    }
                />
            </Flex>
        </>
    );
};
