/**
 * TContext represents a minimal context entry in a conversation
 * This type is used to represent a context entry in a chat history and can be used in LLM calls
 */
export type TContext = {
    // Content of the context entry
    content: string;

    // Token count
    tokenCount: number;

    // Role of the context entry
    role: 'user' | 'assistant';
};
