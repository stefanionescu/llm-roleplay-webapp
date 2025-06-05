/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import { VList } from 'virtua';
import { toast } from 'react-hot-toast';
import { useShallow } from 'zustand/react/shallow';
import { useTranslations, useLocale } from 'next-intl';
import {
    useCallback,
    useState,
    useEffect,
    useRef,
} from 'react';

import { trpc } from '@/trpc/client';
import { chatConstants } from '@/config';
import { useStore } from '@/lib/zustand/store';
import { Spinner } from '@/components/ui/spinner';
import { VListContainerElement } from '@/types/virtual-list';
import { useCharacterId } from '@/hooks/data/use-character-id';
import { useVirtualizedList } from '@/hooks/ui/use-virtualized-list';
import { Message } from '@/features/chat/ui/components/chat-history/messages/message';
import { useAutoScrollDuringInference } from '@/hooks/inference/use-inference-auto-scroll';
import { CharacterInfoContent } from '@/features/chat/ui/components/character-info/character-info-content';

export const MessagesList = () => {
    const [isFetching, setIsFetching] = useState(false);
    const [errorFetching, setErrorFetching] =
        useState(false);

    const containerRef = useRef<HTMLDivElement | null>(
        null,
    );
    const prevMessageCountRef = useRef<number>(0);
    const prevOldestPositionRef = useRef<number | null>(
        null,
    );

    // Use the auto-scroll hook to keep scrolling during inference
    useAutoScrollDuringInference();

    const t = useTranslations();
    const locale = useLocale();
    const utils = trpc.useUtils();
    const characterId = useCharacterId();

    if (!characterId) {
        throw new Error('Could not get the character ID');
    }

    const {
        sessionId,
        addMessages,
        getMessageId,
        oldestMessagePosition,
        characterCategory,
        currentMessageCount,
    } = useStore(
        useShallow((state) => ({
            sessionId:
                state.characterSessions.get(characterId),
            addMessages: state.addMessages,
            getMessageId: state.getMessageId,
            oldestMessagePosition:
                state.getFirstMessage(characterId)
                    ?.position,
            characterCategory:
                state.getCharacterCategory(characterId) ??
                '',
            currentMessageCount:
                state.messageCounts.get(characterId) ?? 0,
        })),
    );

    // Determine if we should initialize with scroll at the top
    // Only stick to bottom if we have more than 1 message
    const initialStickToBottom = useRef(
        currentMessageCount > 1,
    );

    // Reset isPrepend flag when message count changes but not from loadMore
    useEffect(() => {
        if (!isFetching) {
            isPrepend.current = false;
        }
        // Update previous position after each fetch
        prevOldestPositionRef.current =
            oldestMessagePosition ?? null;
    }, [
        currentMessageCount,
        isFetching,
        oldestMessagePosition,
    ]);

    // Function to load more (older) messages
    const loadMore = useCallback(async () => {
        if (
            !oldestMessagePosition ||
            oldestMessagePosition <= 1 ||
            isFetching ||
            !sessionId ||
            errorFetching
        ) {
            return;
        }

        setIsFetching(true);

        try {
            const data = await utils.chat.getMessages.fetch(
                {
                    sessionId,
                    limit: chatConstants.messagesToFetch,
                    lastPosition: oldestMessagePosition,
                },
            );

            if (
                data?.messages &&
                data.messages.length > 0
            ) {
                isPrepend.current = true;

                addMessages(
                    characterId,
                    data.ids,
                    data.messages,
                    false,
                );
            }
        } catch {
            setErrorFetching(true);
            toast.error(t('error.notLoadMessages'));
        } finally {
            setIsFetching(false);
        }
    }, [oldestMessagePosition, isFetching]);

    // Use our new virtualized list hook
    const {
        virtualizerRef,
        scrollState,
        shouldStickToBottom,
        isPrepend,
        handleScroll,
        scrollToBottom,
    } = useVirtualizedList({
        currentMessageCount,
        loadMore,
        initialStickToBottom: initialStickToBottom.current,
    });

    // Auto-scroll to bottom when new messages are added (not from loading older messages)
    useEffect(() => {
        // Only handle auto-scrolling when:
        // 1. We have more than one message
        // 2. The message count has increased (a new message was added)
        // 3. We're not prepending older messages
        if (
            currentMessageCount > 1 &&
            currentMessageCount >
                prevMessageCountRef.current &&
            !isPrepend.current
        ) {
            // Use a small delay to ensure the DOM has updated
            setTimeout(() => {
                scrollToBottom();
            }, 0);
        }

        // Update the previous message count
        prevMessageCountRef.current = currentMessageCount;
    }, [currentMessageCount, scrollToBottom]);

    // Custom scroll handler that updates the shouldStickToBottom DOM element when the virtual list is scrolled
    const onScroll = useCallback(
        (offset: number) => {
            // First call the original scroll handler
            handleScroll(offset);

            // Then update the DOM data attribute to track the latest shouldStickToBottom value
            if (containerRef.current) {
                containerRef.current.dataset.shouldStickToBottom =
                    shouldStickToBottom.current
                        ? 'true'
                        : 'false';
            }
        },
        [handleScroll, shouldStickToBottom],
    );

    // Helper function to render a basic message
    const renderBasicMessage = useCallback(
        (messageId: string, index: number) => (
            <Message
                key={messageId}
                messageId={messageId}
                messageIndex={index}
            />
        ),
        [locale],
    );

    // Helper function to render the first message with loading state
    const renderFirstMessageWithLoading = useCallback(
        (messageId: string, index: number) => (
            <div key={messageId}>
                {isFetching && (
                    <div className="flex justify-center">
                        <Spinner />
                    </div>
                )}
                {renderBasicMessage(messageId, index)}
            </div>
        ),
        [isFetching, locale],
    );

    // Helper function to render the first message with character info
    const renderFirstMessageWithCharacterInfo = useCallback(
        (messageId: string, index: number) => (
            <div key={messageId}>
                <CharacterInfoContent
                    characterId={characterId}
                    categoryId={characterCategory}
                />
                <div className="mt-12">
                    <Message
                        messageId={messageId}
                        messageIndex={index}
                    />
                </div>
            </div>
        ),
        [locale],
    );

    // Main render message function that orchestrates which helper to use
    const shouldShowCharacterInfo =
        oldestMessagePosition && oldestMessagePosition <= 1;

    const renderMessage = useCallback(
        (index: number) => {
            const messageId = getMessageId(
                characterId,
                index,
            );

            if (!messageId) {
                return <></>;
            }

            const isFirstMessage = index === 0;
            const hasOlderMessages =
                oldestMessagePosition &&
                oldestMessagePosition > 1;

            if (isFirstMessage && hasOlderMessages) {
                return renderFirstMessageWithLoading(
                    messageId,
                    index,
                );
            }

            if (isFirstMessage && shouldShowCharacterInfo) {
                return renderFirstMessageWithCharacterInfo(
                    messageId,
                    index,
                );
            }

            return renderBasicMessage(messageId, index);
        },
        [renderFirstMessageWithLoading],
    );

    return (
        <div
            className="notranslate flex size-full flex-col overflow-hidden"
            data-vlist-container
            data-should-stick-to-bottom={
                shouldStickToBottom.current
                    ? 'true'
                    : 'false'
            }
            translate="no"
            ref={(el) => {
                if (el) {
                    containerRef.current = el;
                    const container =
                        el as VListContainerElement;
                    container._scrollState = {
                        current: scrollState.current,
                    };
                    container._virtualizerRef =
                        virtualizerRef;
                    container._shouldStickToBottom =
                        shouldStickToBottom;
                }
            }}
        >
            <div
                className="no-scrollbar flex-1 overflow-y-auto"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <VList
                    ref={virtualizerRef}
                    count={currentMessageCount}
                    overscan={
                        chatConstants.messagesToFetch + 2
                    } // Adding a 2 message virtualization buffer so we don't recycle as aggresively
                    shift={
                        isPrepend.current &&
                        currentMessageCount > 1 &&
                        prevOldestPositionRef.current !==
                            oldestMessagePosition
                    }
                    className="no-scrollbar"
                    data-vlist
                    data-item-count={
                        currentMessageCount + 1
                    }
                    onScroll={onScroll}
                    style={{ overscrollBehavior: 'none' }}
                >
                    {(index) => renderMessage(index)}
                </VList>
            </div>
        </div>
    );
};
