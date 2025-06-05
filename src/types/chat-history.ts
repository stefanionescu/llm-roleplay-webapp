import { TContext } from '@/types/context';
import { TChatMessage } from '@/types/message';
import { LinkedMapList } from '@/components/custom/lists/linked-map-list';

/**
 * TChatHistory represents a single chat history entry
 * Contains optional context and message lists
 */
export type TChatHistory = {
    /** The total number of tokens in the context. */
    totalContextTokens: number;

    /** The messages of the chat history. */
    messages: LinkedMapList<string>;

    /** The context of the chat history. */
    context: LinkedMapList<TContext>;
};

/**
 * TChatHistories represents a collection of chat histories
 * Contains a map of chat character IDs to their TChatHistory data
 */
export type TChatHistories = {
    /** The message counts. */
    messageCounts: Map<string, number>;

    /** The context counts. */
    contextCounts: Map<string, number>;

    /** Message data. **/
    messageData: Map<string, TChatMessage>;

    /** The chat histories. */
    chatHistories: LinkedMapList<TChatHistory>;
};

/**
 * TChatHistoryActions defines the actions that can be performed on a collection of chat histories
 * These actions are used to manage the TChatHistories collection
 */
export type TChatHistoryActions = {
    /** Clears all chat histories from the collection. */
    clearHistories: () => void;

    /** Deletes a chat history from the collection. */
    deleteHistory: (id: string) => void;

    /** Gets the number of messages in the chat history. */
    getMessageCount: (id: string) => number;

    /** Gets the context count from the chat history. */
    getContextCount: (id: string) => number;

    /** Removes the latest message from the chat history. */
    deleteLatestMessage: (id: string) => void;

    /** Removes the latest context from the chat history. */
    deleteLatestContext: (id: string) => void;

    /** Removes the oldest context from the chat history. */
    deleteOldestFromContext: (id: string) => void;

    /** Gets the last message from the chat history. */
    getLastMessagePosition: (id: string) => number;

    /** Gets the context from the chat history. */
    getContexts: (id: string) => TContext[] | undefined;

    /** Gets a chat history from the collection. */
    getHistory: (id: string) => TChatHistory | undefined;

    /** Adds a new chat history to the collection. */
    addHistory: (id: string, history: TChatHistory) => void;

    /** Gets the first message from the chat history. */
    getFirstMessage: (
        id: string,
    ) => TChatMessage | undefined;

    /** Gets the role of the latest context in the chat history. */
    getLatestContextRole: (
        id: string,
    ) => 'user' | 'assistant' | undefined;

    /** Gets a message ID from the chat history. */
    getMessageId: (
        id: string,
        index: number,
    ) => string | undefined;

    /** Removes multiple oldest contexts from the chat history. */
    deleteManyOldestFromContext: (
        id: string,
        entries: number,
    ) => void;

    /** Gets a message from the chat history. */
    getMessage: (
        id: string,
        index: number,
    ) => TChatMessage | undefined;

    /** Sets the total number of tokens in the context. */
    setTotalContextTokens: (
        id: string,
        totalContextTokens: number,
    ) => void;

    /** Updates a message in the chat history. */
    updateMessage: (
        id: string,
        messageId: string,
        message: TChatMessage,
    ) => void;

    /** Gets messages from the chat history. */
    getMessages: (
        id: string,
        start: number,
        end: number,
    ) => TChatMessage[] | undefined;

    /** Adds a new context to the chat history. */
    addContext: (
        id: string,
        contextId: string,
        context: TContext,
        end?: boolean,
    ) => void;

    /** Adds a new message to the chat history. */
    addMessage: (
        id: string,
        messageId: string,
        message: TChatMessage,
        end: boolean,
    ) => void;

    /** Adds multiple contexts to the chat history. */
    addContexts: (
        id: string,
        contextIds: string[],
        contexts: TContext[],
        end?: boolean,
    ) => void;

    /** Adds multiple messages to the chat history. */
    addMessages: (
        id: string,
        messageIds: string[],
        messages: TChatMessage[],
        end: boolean,
    ) => void;

    /** Gets the contexts with deletable entries from the chat history. */
    getContextsWithDeletableEntries: (
        id: string,
        maxTokens: number,
    ) =>
        | {
              contexts: TContext[];
              leftoverCount: number;
          }
        | undefined;
};

/**
 * ChatHistoriesSlice combines the TChatHistories data with its actions
 * Provides a complete state slice for managing chat histories
 */
export type ChatHistoriesSlice = TChatHistories &
    TChatHistoryActions;
