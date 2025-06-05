import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useLocale } from 'next-intl';
import { Editor } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';

import { trpc } from '@/trpc/client';
import { Store } from '@/types/zustand';
import { useStore } from '@/lib/zustand/store';
import { TChatMessage } from '@/types/message';
import { getTokenCount } from '@/lib/utils/tokens';
import { authConstants, llmConstants } from '@/config';
import { useInference } from '@/hooks/inference/use-inference';
import { useCharacterData } from '@/hooks/data/use-character-data';
import { useSaveMessage } from '@/hooks/inference/use-save-message';
import {
    trackSendMessage,
    trackCreateSession,
} from '@/lib/mixpanel/events';
import {
    validateChatState,
    createNewSession,
    prepareUserMessage,
} from '@/lib/utils/inference/inference';
import {
    anonUserCanChat,
    increaseAnonSessionMessages,
    increaseAnonSessions,
} from '@/lib/utils/auth/auth-main';

export const useInputHandler = () => {
    const locale = useLocale();
    const t = useTranslations();
    const { generateMessage } = useInference();
    const { saveMessage } = useSaveMessage();
    const { characterId, categoryId } = useCharacterData();

    const createSessionMutation =
        trpc.chat.createSession.useMutation();

    const {
        getCharacter,
        getCategory,
        getMessageCount,
        getContextCount,
        setIsPreparingToGenerate,
        maxMessagesPerSession,
        maxSessions,
        savedSessionId,
        addSession,
        addContext,
        addMessage,
        setCharacterSessionLink,
        getLastMessagePosition,
        getMessageId,
        getMessage,
        setLatestMessageAt,
        moveSessionToTop,
        setIsAuthModalOpen,
    } = useStore(
        useShallow((state: Store) => ({
            getCharacter: state.getCharacter,
            getCategory: state.getCategory,
            getMessageCount: state.getMessageCount,
            getContextCount: state.getContextCount,
            setIsPreparingToGenerate:
                state.setIsPreparingToGenerate,
            maxMessagesPerSession:
                state.maxMessagesPerSession,
            maxSessions: state.maxSessions,
            savedSessionId:
                state.characterSessions.get(characterId) ??
                undefined,
            addSession: state.addSession,
            addContext: state.addContext,
            addMessage: state.addMessage,
            setCharacterSessionLink:
                state.setCharacterSessionLink,
            getLastMessagePosition:
                state.getLastMessagePosition,
            getMessageId: state.getMessageId,
            getMessage: state.getMessage,
            setLatestMessageAt: state.setLatestMessageAt,
            moveSessionToTop: state.moveSessionToTop,
            setIsAuthModalOpen: state.setIsAuthModalOpen,
        })),
    );

    if (!categoryId) {
        throw new Error('Character category not found');
    }

    const character = getCharacter(categoryId, characterId);

    if (!character) {
        throw new Error('Character not found');
    }

    const getSessionLimits = () => {
        return {
            sessionLimit: Math.min(
                authConstants.maxAllowedAnonSessions,
                maxSessions,
            ),
            messageLimit: Math.max(
                1,
                Math.min(
                    authConstants.maxAnonMessagesPerSession,
                    maxMessagesPerSession,
                ) - 1,
            ),
        };
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

    const handleInitialMessageSave =
        async (): Promise<void> => {
            const initialMessages =
                getMessageCount(characterId);
            if (initialMessages === 1) {
                // Get the initial message that was already added to Zustand by ChatHistoryContent
                const initialMessageId = getMessageId(
                    characterId,
                    0,
                );
                const initialMessage = getMessage(
                    characterId,
                    0,
                );

                if (initialMessageId && initialMessage) {
                    // Add the initial message context to Zustand
                    const contextId = uuidv4();
                    const tokenCount =
                        getInitialMessageTokenCount();
                    addContext(characterId, contextId, {
                        content: initialMessage.rawAI,
                        role: 'assistant',
                        tokenCount: tokenCount,
                    });

                    // Save to DB
                    try {
                        await saveMessage(
                            characterId,
                            initialMessage,
                            () => {
                                // Don't show toast here as this is part of session creation
                                throw new Error(
                                    'Failed to save initial message',
                                );
                            },
                        );
                    } catch (error) {
                        // Propagate the error up to be handled by the session creation flow
                        throw error;
                    }
                }
            }
        };

    const createUserMessage = (
        input: string,
        isNewSession: boolean,
    ) => {
        const lastMessagePosition = isNewSession
            ? 2 // Position 2 if new session (position 1 is the initial system message)
            : getLastMessagePosition(characterId);

        return prepareUserMessage(
            input,
            lastMessagePosition,
            (text: string) => getTokenCount(text) || 0,
            llmConstants.languageModel,
        );
    };

    const addUserMessageToStore = (
        newMessageId: string,
        newMessage: TChatMessage,
    ) => {
        addMessage(
            characterId,
            newMessageId,
            newMessage,
            true,
        );
    };

    const addUserContextToStore = (
        input: string,
        humanTokenCount: number,
    ) => {
        const contextId = uuidv4();
        const contextTokenCount =
            humanTokenCount || getTokenCount(input) || 0;

        addContext(characterId, contextId, {
            role: 'user' as const,
            content: input,
            tokenCount: contextTokenCount,
        });
    };

    const handleSendMessage = async (
        editor: Editor,
        input: string,
    ) => {
        if (!input?.trim()) return;

        setIsPreparingToGenerate(true);

        let sessionId = savedSessionId;

        try {
            const { sessionLimit, messageLimit } =
                getSessionLimits();

            // Check if user can chat
            const canChat = await anonUserCanChat(
                sessionId,
                sessionLimit,
                messageLimit,
            );

            if (!canChat) {
                setIsPreparingToGenerate(false);
                setIsAuthModalOpen(true);
                return;
            }
        } catch {
            setIsPreparingToGenerate(false);
            return;
        }

        // Determine if this is a new session based on DB records
        // Use the store's isNewSession value that was set by useHistoryData
        let isNewSession = useStore
            .getState()
            .isNewSession(characterId);

        // If we have no sessionId yet, it's definitely new regardless of the store value
        if (!sessionId) {
            isNewSession = true;
        }

        // Create a new session if one doesn't exist
        if (!sessionId) {
            try {
                const sessionResult =
                    await createNewSession(
                        characterId,
                        character,
                        createSessionMutation,
                        addSession,
                        setCharacterSessionLink,
                        increaseAnonSessions,
                        (message: string) =>
                            toast.error(message),
                        t('error.startChatError'),
                        setIsPreparingToGenerate,
                    );

                isNewSession = sessionResult.isNewSession;
                sessionId = sessionResult.sessionId;

                if (!sessionId) {
                    return;
                }

                // Track create session event
                try {
                    // Get character name in English (fallback to default if English not available)
                    const characterNameEn =
                        character.translations?.get('en')
                            ?.name || character.name;

                    await trackCreateSession(
                        sessionId,
                        characterId,
                        characterNameEn,
                        locale,
                    );
                } catch {}

                // If we successfully created a session, check if we need to save initial message
                try {
                    await handleInitialMessageSave();
                } catch {
                    // If saving initial message fails, show error and return
                    toast.error(
                        t('error.cannotSaveMessage'),
                    );
                    return;
                }
            } catch {
                // Session creation error is already handled by the callback in createNewSession
                return;
            }
        }

        // Verify chat state is valid
        const contextCount = getContextCount(characterId);
        const messageCount = getMessageCount(characterId);

        if (
            !validateChatState(
                contextCount,
                messageCount,
                (message: string) => toast.error(message),
                t('error.generalUnexpectedError'),
            )
        ) {
            return;
        }

        // Track session message count
        increaseAnonSessionMessages(sessionId);

        // Prepare user's message
        const {
            messageId: newMessageId,
            message: newMessage,
        } = createUserMessage(input, isNewSession);

        // Add user message to Zustand
        addUserMessageToStore(newMessageId, newMessage);

        // Add user context to Zustand
        addUserContextToStore(
            input,
            newMessage.humanTokenCount,
        );

        // Update the session's latest message timestamp and move session to top (if not a new session)
        const currentTimestamp = new Date();
        setLatestMessageAt(sessionId, currentTimestamp);

        // Only move session to top if it's not a new session
        if (!isNewSession) {
            moveSessionToTop(sessionId);
        }

        // Track send message event
        try {
            // Get character name in English (fallback to default if English not available)
            const characterNameEn =
                character.translations?.get('en')?.name ||
                character.name;

            // Get category information
            const category = getCategory(categoryId);
            const categoryNameEn =
                category?.translations?.en ||
                category?.name ||
                'Unknown';

            await trackSendMessage(
                characterNameEn,
                characterId,
                sessionId,
                input.length,
                categoryNameEn,
                locale,
            );
        } catch {}

        // Generate AI response
        if (editor) {
            await generateMessage(
                editor,
                input,
                characterId,
                locale,
                character,
                isNewSession,
                messageCount,
                (message: string) => toast.error(message),
            );
        }
    };

    const handleSelectStarterMessage = (
        editor: Editor | null,
        content: string,
    ) => {
        if (!editor) return;
        try {
            editor
                .chain()
                .setContent(content)
                .focus('end')
                .run();
            editor.emit('update', {
                editor,
                transaction: editor.state.tr,
            });
        } catch {
            toast.error(t('error.cannotUseStarterMessage'));
        }
    };

    return {
        handleSendMessage,
        handleSelectStarterMessage,
        character,
        characterId,
    };
};
