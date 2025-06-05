'use client';

import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocale } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';

import { llmConstants } from '@/config';
import { TStopReason } from '@/types/message';
import { useStore } from '@/lib/zustand/store';
import { useCharacterId } from '@/hooks/data/use-character-id';
import { LinkedMapList } from '@/components/custom/lists/linked-map-list';
import { MessagesList } from '@/features/chat/ui/components/chat-history/messages/messages-list';

export const ChatHistoryContent = () => {
    const locale = useLocale();
    const characterId = useCharacterId();

    if (!characterId) {
        throw new Error('Character ID not found');
    }

    const {
        getCharacter,
        getCharacterCategory,
        messageCount,
        contextCount,
        addMessage,
        addHistory,
        setIsNewSession,
        getMessageCount,
        updateMessage,
        getMessage,
        getMessageId,
    } = useStore(
        useShallow((state) => ({
            getCharacter: state.getCharacter,
            getCharacterCategory:
                state.getCharacterCategory,
            messageCount:
                state.getMessageCount(characterId),
            contextCount:
                state.getContextCount(characterId),
            addMessage: state.addMessage,
            addHistory: state.addHistory,
            setIsNewSession: state.setIsNewSession,
            getMessageCount: state.getMessageCount,
            updateMessage: state.updateMessage,
            getMessage: state.getMessage,
            getMessageId: state.getMessageId,
        })),
    );

    const categoryId = getCharacterCategory(characterId);
    if (!categoryId) {
        throw new Error('Character category not found');
    }

    const character = getCharacter(categoryId, characterId);

    if (!character) {
        throw new Error('Character not found locally');
    }

    const getInitialMessageContent = () => {
        const translation =
            character.translations.get(locale);
        return (
            translation?.initial_message ??
            character.initial_message ??
            ''
        );
    };

    const getInitialMessageTokenCount = () => {
        const translation =
            character.translations.get(locale);
        return (
            translation?.initial_message_token_count ??
            character.initial_message_token_count ??
            0
        );
    };

    const getInitialMessageRelevantContent = () => {
        const translation =
            character.translations.get(locale);
        return (
            translation?.initial_message_content ??
            character.initial_message_content ??
            []
        );
    };

    const initializeHistory = () => {
        addHistory(characterId, {
            context: new LinkedMapList(),
            messages: new LinkedMapList(),
            totalContextTokens: 0,
        });
    };

    const createInitialMessage = (
        initialMessageRawAI: string,
    ) => {
        const initialMessageId = uuidv4();
        const tokenCount = getInitialMessageTokenCount();

        const initialMessage = {
            rawAI: initialMessageRawAI,
            createdAt: new Date(),
            position: 1,
            humanTokenCount: 0,
            aiTokenCount: tokenCount,
            llmModelUsed: llmConstants.languageModel,
            stopReason: 'finish' as TStopReason,
            relevantContent:
                getInitialMessageRelevantContent(),
        };

        return {
            id: initialMessageId,
            message: initialMessage,
        };
    };

    // Initialize Zustand state with initial message if needed
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        // Only initialize if:
        // 1. There are no messages/contexts yet
        // 2. We haven't already initialized this character's history
        if (messageCount === 0 && contextCount === 0) {
            const initialMessageRawAI =
                getInitialMessageContent();

            // Double-check we don't already have a first message for this character
            // This prevents duplicate initial messages when navigating
            const existingMessageCount =
                getMessageCount(characterId);
            if (existingMessageCount > 0) {
                return;
            }

            // Initialize chat history
            initializeHistory();

            // Create and add initial message
            const {
                id: initialMessageId,
                message: initialMessage,
            } = createInitialMessage(initialMessageRawAI);
            addMessage(
                characterId,
                initialMessageId,
                initialMessage,
                true,
            );

            // Mark this as a new session in Zustand
            setIsNewSession(characterId, true);
        }
    }, [messageCount, contextCount]);

    // Update the initial message when locale changes
    useEffect(() => {
        // Only update if we have exactly one message (the initial message)
        if (messageCount === 1) {
            const messageId = getMessageId(characterId, 0);
            const message = getMessage(characterId, 0);

            if (
                messageId &&
                message &&
                message.position === 1
            ) {
                const initialMessageRawAI =
                    getInitialMessageContent();
                const tokenCount =
                    getInitialMessageTokenCount();

                // Create updated message with new content
                const updatedMessage = {
                    ...message,
                    rawAI: initialMessageRawAI,
                    aiTokenCount: tokenCount,
                    relevantContent:
                        getInitialMessageRelevantContent(),
                };

                // Update the message in Zustand
                updateMessage(
                    characterId,
                    messageId,
                    updatedMessage,
                );
            }
        }
    }, [locale]);
    /* eslint-enable react-hooks/exhaustive-deps */

    // Only render MessagesList if we have messages
    if (messageCount === 0) {
        return null;
    }

    return <MessagesList />;
};
