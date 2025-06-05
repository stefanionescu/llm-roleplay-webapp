/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable max-lines */

import { TContext } from '@/types/context';
import { TChatMessage } from '@/types/message';
import { StoreSlice } from '@/lib/zustand/store-slice';
import { LinkedMapList } from '@/components/custom/lists/linked-map-list';
import {
    ChatHistoriesSlice,
    TChatHistories,
    TChatHistory,
} from '@/types/chat-history';

const initialState: TChatHistories = {
    chatHistories: new LinkedMapList<TChatHistory>(),
    messageData: new Map<string, TChatMessage>(),
    messageCounts: new Map<string, number>(),
    contextCounts: new Map<string, number>(),
};

export const createChatHistoriesSlice: StoreSlice<
    ChatHistoriesSlice
> = (set, get) => ({
    ...initialState,
    addHistory: (id: string, history: TChatHistory) => {
        set((state) => {
            state.chatHistories.pushEnd(id, history);
        });
    },
    deleteHistory: (id: string) => {
        set((state) => {
            state.chatHistories.delete(id);
            state.messageCounts.delete(id);
            state.contextCounts.delete(id);
        });
    },
    getHistory: (id: string) => {
        return get().chatHistories.get(id);
    },
    addMessage: (
        id: string,
        messageId: string,
        message: TChatMessage,
        end = true,
    ) => {
        set((state) => {
            const historyDraft =
                state.chatHistories.get(id);
            if (historyDraft) {
                if (!historyDraft.messages.get(messageId)) {
                    state.messageCounts.set(
                        id,
                        (state.messageCounts.get(id) ?? 0) +
                            1,
                    );
                }

                if (end) {
                    historyDraft.messages.pushEnd(
                        messageId,
                        messageId,
                    );
                } else {
                    historyDraft.messages.pushFront(
                        messageId,
                        messageId,
                    );
                }

                state.messageData.set(messageId, message);
            }
        });
    },
    addMessages: (
        id: string,
        messageIds: string[],
        messages: TChatMessage[],
        end = true,
    ) => {
        set((state) => {
            const historyDraft =
                state.chatHistories.get(id);
            if (historyDraft) {
                // Count how many messages are actually new
                let newMessagesCount = 0;
                for (const messageId of messageIds) {
                    if (
                        !historyDraft.messages.get(
                            messageId,
                        )
                    ) {
                        newMessagesCount++;
                    }
                }

                // Add the messages to the history
                if (end) {
                    historyDraft.messages.pushEndMultiple(
                        messageIds.map((messageId) => [
                            messageId,
                            messageId,
                        ]),
                    );
                } else {
                    historyDraft.messages.pushFrontMultiple(
                        messageIds.map((messageId) => [
                            messageId,
                            messageId,
                        ]),
                    );
                }

                // Save message data
                messageIds.forEach((messageId, index) => {
                    state.messageData.set(
                        messageId,
                        messages[index],
                    );
                });

                // Update the total message count only if there are new messages
                if (newMessagesCount > 0) {
                    state.messageCounts.set(
                        id,
                        (state.messageCounts.get(id) ?? 0) +
                            newMessagesCount,
                    );
                }
            }
        });
    },
    updateMessage: (
        id: string,
        messageId: string,
        message: TChatMessage,
    ) => {
        set((state) => {
            const historyDraft =
                state.chatHistories.get(id);
            if (historyDraft) {
                state.messageData.set(messageId, message);
            }
        });
    },
    getLastMessagePosition: (id: string) => {
        const history = get().chatHistories.get(id);
        if (!history) return 0;

        const lastMessageId = history.messages.getLast();
        if (!lastMessageId) return 0;

        return (
            get().messageData.get(lastMessageId)
                ?.position ?? 0
        );
    },
    getMessageId: (id: string, index: number) => {
        const messageId = get()
            .chatHistories.get(id)
            ?.messages.getRange(index, index + 1);
        if (!messageId) {
            return undefined;
        }
        return messageId[0];
    },
    getMessage: (
        id: string,
        index: number,
    ): TChatMessage | undefined => {
        const messagesInRange = get()
            .chatHistories.get(id)
            ?.messages.getRange(index, index + 1); // Get range [index, index + 1)

        // Return the first element if the range is valid and contains an item
        return messagesInRange && messagesInRange.length > 0
            ? get().messageData.get(messagesInRange[0])
            : undefined;
    },
    getMessages: (
        id: string,
        start: number,
        end: number,
    ): TChatMessage[] | undefined => {
        const messagesInRange = get()
            .chatHistories.get(id)
            ?.messages.getRange(start, end);

        if (!messagesInRange) {
            return undefined;
        }

        const messages = messagesInRange.map((messageId) =>
            get().messageData.get(messageId),
        );

        // If any message is undefined, return undefined
        if (
            messages.some(
                (message) => message === undefined,
            )
        ) {
            return undefined;
        }

        // At this point we know all messages are defined
        return messages as TChatMessage[];
    },
    getMessageCount: (id: string) => {
        return get().messageCounts.get(id) ?? 0;
    },
    addContext: (
        id: string,
        contextId: string,
        context: TContext,
        end = true,
    ) => {
        set((state) => {
            const historyDraft =
                state.chatHistories.get(id);
            if (historyDraft) {
                if (!historyDraft.context.get(contextId)) {
                    state.contextCounts.set(
                        id,
                        (state.contextCounts.get(id) ?? 0) +
                            1,
                    );
                }
                if (end) {
                    historyDraft.context.pushEnd(
                        contextId,
                        context,
                    );
                } else {
                    historyDraft.context.pushFront(
                        contextId,
                        context,
                    );
                }
            }
        });
    },
    addContexts: (
        id: string,
        contextIds: string[],
        contexts: TContext[],
        end = true,
    ) => {
        set((state) => {
            const historyDraft =
                state.chatHistories.get(id);
            if (historyDraft) {
                // Count how many contexts are actually new
                let newContextsCount = 0;
                for (const contextId of contextIds) {
                    if (
                        !historyDraft.context.get(contextId)
                    ) {
                        newContextsCount++;
                    }
                }

                // Add the contexts to the history
                contextIds.forEach((contextId, index) => {
                    if (end) {
                        historyDraft.context.pushEnd(
                            contextId,
                            contexts[index],
                        );
                    } else {
                        historyDraft.context.pushFront(
                            contextId,
                            contexts[index],
                        );
                    }
                });

                // Update the total context count only if there are new contexts
                if (newContextsCount > 0) {
                    state.contextCounts.set(
                        id,
                        (state.contextCounts.get(id) ?? 0) +
                            newContextsCount,
                    );
                }
            }
        });
    },
    setTotalContextTokens: (
        id: string,
        totalContextTokens: number,
    ) => {
        set((state) => {
            const historyDraft =
                state.chatHistories.get(id);
            if (historyDraft) {
                historyDraft.totalContextTokens =
                    totalContextTokens;
            }
        });
    },
    getContexts: (id: string) => {
        return get()
            .chatHistories.get(id)
            ?.context.toArray();
    },
    getContextsWithDeletableEntries: (
        id: string,
        maxTokens: number,
    ):
        | {
              contexts: TContext[];
              leftoverCount: number;
          }
        | undefined => {
        const history = get().chatHistories.get(id);
        if (!history) {
            return undefined;
        }

        const contextLength = history.context.length;
        if (contextLength === 0) {
            return { contexts: [], leftoverCount: 0 };
        }

        // Process all contexts from the end until we hit the token limit
        let currentTokenSum = 0;
        let processableCount = 0;
        const allContexts = history.context.getRange(
            0,
            contextLength,
        );

        // Process from the end until we hit the token limit
        for (let i = allContexts.length - 1; i >= 0; i--) {
            const context = allContexts[i];
            if (
                currentTokenSum + context.tokenCount <=
                maxTokens
            ) {
                currentTokenSum += context.tokenCount;
                processableCount++;
            } else {
                break;
            }
        }

        const startIndex = contextLength - processableCount;

        // Get the final range of contexts that fit within our token budget
        const contexts = history.context.getRange(
            startIndex,
            contextLength,
        );

        return {
            contexts,
            leftoverCount: startIndex,
        };
    },
    getContextCount: (id: string) => {
        return get().contextCounts.get(id) ?? 0;
    },
    getFirstMessage: (
        id: string,
    ): TChatMessage | undefined => {
        const firstMessageId = get()
            .chatHistories.get(id)
            ?.messages.getFirst();

        if (!firstMessageId) {
            return undefined;
        }

        return get().messageData.get(firstMessageId);
    },
    deleteOldestFromContext: (id: string) => {
        set((state) => {
            const historyDraft =
                state.chatHistories.get(id);
            if (
                historyDraft &&
                historyDraft.context.length > 0
            ) {
                const removedContext =
                    historyDraft.context.removeFirst();

                if (removedContext) {
                    state.contextCounts.set(
                        id,
                        (state.contextCounts.get(id) ?? 0) -
                            1,
                    );
                }

                if (
                    removedContext &&
                    historyDraft.totalContextTokens
                ) {
                    historyDraft.totalContextTokens -=
                        removedContext.tokenCount;
                }
            }
        });
    },
    deleteManyOldestFromContext: (
        id: string,
        entries: number,
    ) => {
        set((state) => {
            const historyDraft =
                state.chatHistories.get(id);
            if (!historyDraft || entries <= 0) return;

            let removedCount = 0;
            let removedTokens = 0;

            // Remove specified number of entries or until list is empty
            while (
                removedCount < entries &&
                historyDraft.context.length > 0
            ) {
                const removedContext =
                    historyDraft.context.removeFirst();
                if (removedContext) {
                    removedCount++;
                    removedTokens +=
                        removedContext.tokenCount;
                }
            }

            // Update context count if we removed any entries
            if (removedCount > 0) {
                state.contextCounts.set(
                    id,
                    (state.contextCounts.get(id) ?? 0) -
                        removedCount,
                );
            }

            // Update total token count if applicable
            if (
                removedTokens > 0 &&
                historyDraft.totalContextTokens
            ) {
                historyDraft.totalContextTokens -=
                    removedTokens;
            }
        });
    },
    deleteLatestMessage: (id: string) => {
        set((state) => {
            const history = state.chatHistories.get(id);
            if (!history || history.messages.length === 0)
                return;

            const lastMessage = history.messages.getLast();
            if (lastMessage) {
                history.messages.delete(lastMessage);
                state.messageData.delete(lastMessage);
                // Decrement the message count
                state.messageCounts.set(
                    id,
                    (state.messageCounts.get(id) ?? 1) - 1,
                );
            }
        });
    },
    deleteLatestContext: (id: string) => {
        set((state) => {
            const history = state.chatHistories.get(id);
            if (!history || history.context.length === 0)
                return;

            // Get the last context object directly
            const lastContext = history.context.getLast();
            if (lastContext) {
                const contextTokenCount =
                    lastContext.tokenCount || 0;

                // We need to find the ID of this context to delete it
                const contextIds = history.context.ids();
                const lastContextId =
                    contextIds[contextIds.length - 1];

                // Remove the context from the list
                history.context.delete(lastContextId);

                // Decrement the context count
                state.contextCounts.set(
                    id,
                    (state.contextCounts.get(id) ?? 1) - 1,
                );

                // Update the total context tokens if applicable
                if (history.totalContextTokens) {
                    history.totalContextTokens -=
                        contextTokenCount;
                }
            }
        });
    },
    getLatestContextRole: (
        id: string,
    ): 'user' | 'assistant' | undefined => {
        const history = get().chatHistories.get(id);
        if (!history || history.context.length === 0)
            return undefined;

        // Get the last context object directly
        const lastContext = history.context.getLast();
        return lastContext?.role;
    },
    clearHistories: () => {
        set((state) => {
            state.chatHistories.clear();
            state.messageCounts.clear();
            state.contextCounts.clear();
            state.messageData.clear();
        });
    },
});
