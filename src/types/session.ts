import { SortedSessionsList } from '@/components/custom/lists/sorted-sessions-list';

/**
 * TChatSession defines the structure of an individual chat session
 * This represents a conversation between the user and a specific character
 */
export type TChatSession = {
    // Timestamp when this session was created
    // Used for sorting and tracking session age
    createdAt: Date;

    // The character associated with this chat session
    character: string;

    // URL to the character's icon/avatar image
    characterIcon: string;

    // Timestamp of the most recent message in this session
    // Used for sorting sessions by recency (null if no messages yet)
    latestMessageAt: Date | null;

    // Mapping of language codes to character's names
    characterNames: Map<string, string>;
};

/**
 * Parameters for processing sessions data
 * @param data - The data to process
 * @param characterSessions - The character sessions map
 * @param setCharacterSessionLink - Function to set a character-session link
 * @param addSessions - Function to add sessions
 * @param setHasMoreSessions - Function to set hasMoreSessions to false
 */
export type ProcessSessionsDataParams = {
    /** The character sessions map */
    characterSessions: Map<string, string>;
    /** Function to set hasMoreSessions */
    setHasMoreSessions: (value: boolean) => void;
    /** Function to add sessions */
    addSessions: (
        sessionIds: string[],
        sessions: TChatSession[],
    ) => void;
    /** Function to set a character-session link */
    setCharacterSessionLink: (
        characterId: string,
        sessionId: string,
    ) => void;
    /** The data to process */
    data: {
        hasMore: boolean;
        sessionIds: string[];
        sessions: TChatSession[];
    };
};

/**
 * Represents the collection of all chat sessions.
 * Uses a LinkedMapList to maintain session order and allow efficient access/manipulation.
 */
export type TChatSessions = {
    /** The number of sessions in the collection. */
    sessionsCount: number;

    /** Whether there are more sessions to fetch. */
    hasMoreSessions: boolean;

    /** Mapping of character => session */
    characterSessions: Map<string, string>;

    /** Mapping of session => character */
    sessionCharacters: Map<string, string>;

    /** The data structure holding all chat sessions, maintaining insertion order. */
    sessions: SortedSessionsList<TChatSession>;
};

/**
 * Defines the actions that can be performed on the chat sessions state.
 * These functions are used to manage the TChatSessions collection.
 */
export type ChatSessionsActions = {
    /** Removes all chat sessions from the collection. */
    clearSessions: () => void;
    /** Gets the number of sessions in the collection. */
    getSessionCount: () => number;
    /** Deletes a chat session from the collection by its ID. */
    deleteSession: (id: string) => void;
    /** Moves a chat session to the top (most recent position) in the list. */
    moveSessionToTop: (id: string) => void;
    /** Sets the hasMore flag to false. */
    setHasMoreSessions: (value: boolean) => void;
    /** Gets the latest activity date (either createdAt or latestMessageAt) from the last session */
    getLastSessionActivityRank: () => Date | null;
    /** Gets the latest activity date (either createdAt or latestMessageAt) from the first session */
    getFirstSessionActivityRank: () => Date | null;
    /** Retrieves a specific chat session by its ID. */
    getSession: (id: string) => TChatSession | undefined;
    /** Removes a character => session and session => character mapping. */
    removeCharacterSessionLink: (
        characterId: string,
    ) => void;
    /** Retrieves a specific chat session by its index. */
    getSessionByIndex: (
        index: number,
    ) => TChatSession | undefined;
    /** Updates a chat session in the collection. */
    updateSession: (
        id: string,
        session: TChatSession,
    ) => void;
    /** Adds multiple chat sessions to the collection efficiently. */
    addSessions: (
        ids: string[],
        sessions: TChatSession[],
    ) => void;
    /** Sets the latest message timestamp for a chat session. */
    setLatestMessageAt: (
        id: string,
        latestMessageAt: Date,
    ) => void;
    /** Inserts a new chat session into the collection at the specified insertion point. */
    insertSessionSorted: (
        id: string,
        session: TChatSession,
    ) => void;
    /** Adds a character => session and session => character mapping. */
    setCharacterSessionLink: (
        characterId: string,
        sessionId: string,
    ) => void;
    /** Adds a single new chat session to the collection. */
    addSession: (
        id: string,
        session: TChatSession,
        end: boolean,
    ) => void;
    /** Finds the insertion point for a new chat session. */
    findSessionInsertionPoint: (
        id: string,
        session: TChatSession,
    ) => string | null;
};

/**
 * Represents the complete state slice for chat sessions.
 * Combines the chat sessions data (TChatSessions) with its management actions (ChatSessionsActions).
 */
export type ChatSessionsSlice = TChatSessions &
    ChatSessionsActions;
