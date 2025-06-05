'use client';

import { marked } from 'marked';
import { useState, useEffect, useCallback } from 'react';

import { Flex } from '@/components/ui/flex';
import { Type } from '@/components/ui/type';
import { useStore } from '@/lib/zustand/store';
import { AIErrorMessage } from '@/features/chat/ui/components/chat-history/messages/ai/ai-message-error';
import { AIMessageActions } from '@/features/chat/ui/components/chat-history/messages/ai/ai-message-actions';

type AIMessageContentProps = {
    isLast: boolean;
    messageId: string;
    stopReason: string;
    memories: string[];
    rawAI: string | null;
    characterName: string;
    showInspiration: boolean;
};

export const AIMessageContent = ({
    rawAI,
    characterName,
    stopReason,
    isLast,
    showInspiration,
    memories,
    messageId,
}: AIMessageContentProps) => {
    const [processedHtml, setProcessedHtml] = useState('');
    const messageText = rawAI ?? '';

    // Only read these from store when we need them, don't create a subscription for every message
    const toggledMessage = useStore(
        (state) => state.toggledMessage,
    );
    const setToggledMessage = useStore(
        (state) => state.setToggledMessage,
    );

    // Memoize the toggle function to prevent recreation on every render
    const toggleMemories = useCallback(() => {
        const isCurrentlyToggled =
            toggledMessage === messageId;
        setToggledMessage(
            isCurrentlyToggled ? undefined : messageId,
        );
    }, [messageId, toggledMessage, setToggledMessage]);

    /* eslint-disable @typescript-eslint/no-floating-promises */
    useEffect(() => {
        const parseMarkdown = async () => {
            // Replace double newlines with <br><br> before parsing
            const processedText = (rawAI ?? '').replace(
                /\n\n/g,
                '<br><br>',
            );
            const html = await marked.parse(processedText);
            setProcessedHtml(html);
        };

        parseMarkdown();
    }, [rawAI]);
    /* eslint-enable @typescript-eslint/no-floating-promises */

    return (
        <>
            <Type
                size="sm"
                textColor="primary"
                weight="bold"
                multiline={false}
                title={characterName}
            >
                {characterName}
            </Type>

            <Flex
                direction="col"
                items="start"
                gap="sm"
                className="w-full"
            >
                <Type
                    size="base"
                    textColor="secondary"
                    multiline
                    className="w-full text-left"
                    dangerouslySetInnerHTML={{
                        __html: processedHtml,
                    }}
                />

                {stopReason && stopReason !== 'finish' && (
                    <AIErrorMessage
                        stopReason={stopReason}
                        rawAI={messageText}
                    />
                )}

                <AIMessageActions
                    hasMemories={memories.length > 0}
                    rawAI={messageText}
                    stopReason={stopReason}
                    showInspiration={showInspiration}
                    isLast={isLast}
                    toggleMemories={toggleMemories}
                />
            </Flex>
        </>
    );
};
