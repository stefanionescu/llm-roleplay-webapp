/**
 * TSettings defines system configuration parameters that control various aspects
 * of the chat application's behavior, especially related to rate limiting, session management,
 * and retrieval augmented generation (RAG) functionality.
 */
export type TSettings = {
    // Maximum number of chat sessions allowed for anonymous users
    // Helps prevent abuse from auth anon users
    max_anonymous_sessions: number;

    // Maximum number of messages allowed in each anonymous session
    // Another rate limiting mechanism for auth anon users
    max_anonymous_session_messages: number;
};
