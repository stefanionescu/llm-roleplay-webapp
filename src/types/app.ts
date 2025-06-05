/**
 * TApp represents the general application state
 * Contains information about the current chat session,
 * the status of message generation, and other application-wide flags
 */
export type TApp = {
    // Flag indicating if Retrieval Augmented Generation is in progress
    // RAG is the process of retrieving relevant documents to enhance responses
    isDoingRAG: boolean;

    // The maximum number of sessions allowed for an anon user
    maxSessions: number;

    // Flag indicating if a message is currently being generated
    // Used to disable input and show generation indicators
    isGenerating: boolean;

    // Flag indicating if the feedback modal is open
    isFeedbackOpen: boolean;

    // Flag indicating if RAG usage/quota is being checked
    // Used to track when the system is checking if RAG is available
    isCheckingRAGUsage: boolean;

    // Flag indicating if the mobile sidebar is collapsed
    isSidebarCollapsed: boolean;

    // The maximum number of messages per session for an anon user
    maxMessagesPerSession: number;

    // Flag indicating if a message is currently being generated
    // Used to disable input and show generation indicators
    isPreparingToGenerate: boolean;

    // Flag indicating if language flags have been preloaded for the sidebar
    isSidebarFlagsPreloaded: boolean;

    // Track which character sessions are considered "new" (no messages in DB)
    newSessions: Map<string, boolean>;

    // The active category
    activeCategory: string | undefined;

    // The message that is currently being toggled
    toggledMessage: string | undefined;

    // Controller to abort ongoing requests
    // Used to cancel message generation when users click "stop"
    abortController: AbortController | undefined;
};

/**
 * Defines the actions that can be performed on the application state.
 * These functions are used to update the TApp state.
 */
export type AppActions = {
    /** Cleans the state of the application. */
    cleanAppState: () => void;
    /** Cancels the AbortController. */
    cancelAbortController: () => void;
    /** Updates the flag indicating if RAG is in progress. */
    setIsDoingRAG: (isDoingRAG: boolean) => void;
    /** Sets the maximum number of sessions allowed for an anon user. */
    setMaxSessions: (maxSessions: number) => void;
    /** Checks if a session for a character is considered new. */
    isNewSession: (characterId: string) => boolean;
    /** Updates the flag indicating if a message is being generated. */
    setIsGenerating: (isGenerating: boolean) => void;
    /** Updates the feedback modal open state. */
    setIsFeedbackOpen: (isFeedbackOpen: boolean) => void;
    /** Updates the sidebar collapse state. */
    setIsSidebarCollapsed: (
        isSidebarCollapsed: boolean,
    ) => void;
    /** Updates the flag indicating if RAG usage is being checked. */
    setIsCheckingRAGUsage: (
        isCheckingRAGUsage: boolean,
    ) => void;
    /** Sets the currently active category. */
    setActiveCategory: (
        activeCategory: string | undefined,
    ) => void;
    /** Sets the message that is currently being toggled. */
    setToggledMessage: (
        toggledMessage: string | undefined,
    ) => void;
    /** Sets the maximum number of messages per session for an anon user. */
    setMaxMessagesPerSession: (
        maxMessagesPerSession: number,
    ) => void;
    /** Updates the flag indicating if a message is being prepared for generation. */
    setIsPreparingToGenerate: (
        isPreparingToGenerate: boolean,
    ) => void;
    /** Sets whether a session for a character is considered new. */
    setIsNewSession: (
        characterId: string,
        isNew: boolean,
    ) => void;
    /** Sets the AbortController used to cancel ongoing requests. */
    setAbortController: (
        abortController: AbortController | undefined,
    ) => void;
};

/**
 * Represents the complete state slice for the application.
 * Combines the application state (TApp) with its actions (AppActions).
 */
export type AppSlice = TApp & AppActions;
