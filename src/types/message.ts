/**
 * Constant array defining all possible reasons why a message stream might stop
 * These represent the different ways an AI message generation can terminate
 * Using 'as const' makes this a readonly tuple, enabling more precise TypeScript typing
 */
export const stopReasons = [
    'error', // Stopped due to an error during generation
    'cancel', // Stopped because the user canceled the generation
    'finish', // Stopped normally because generation completed successfully
    'stream_empty', // Stopped because the stream returned no content
] as const;

/**
 * Constant array defining standardized error messages for common failure scenarios
 * Using standardized messages helps with error handling and user feedback
 * Using 'as const' makes this a readonly tuple, enabling more precise TypeScript typing
 */
export const errorMessages = [
    'No response from session creation', // API returned no data when trying to create a session
    'No authenticated user found when creating a session', // User authentication was missing or invalid
    'No Supabase client available when creating a session', // Database client wasn't properly initialized
    'Maximum number of sessions reached for anonymous user', // User hit their session limit (rate limiting)
    'Maximum number of messages reached for this session', // Session hit its message limit (rate limiting)
] as const;

/**
 * TStopReason is a union type of all possible stop reasons
 * Using typeof with an indexed access type creates a union of all array values
 * This provides type safety when working with stop reasons
 */
export type TStopReason = (typeof stopReasons)[number];

/**
 * TChatMessage defines a single message in a chat conversation
 * Contains both message content and metadata about the message
 */
export type TChatMessage = {
    // Original text output from the AI model
    // Always required as all messages must have AI content (even if empty)
    rawAI: string;

    createdAt: Date; // timestamptz - When this message was created

    // Position/index of this message in the conversation sequence
    // Used to maintain proper conversation order
    position: number;

    rawHuman?: string; // optional - Original text input from the human user

    // Count of tokens for rawAI
    aiTokenCount: number;

    // Name/version of the LLM model used to generate this message
    // Useful for tracking which model generated which responses
    llmModelUsed: string;

    // Optional error message if message generation failed
    // Contains more detailed error information when stopReason is "error"
    errorMessage?: string;

    // Count of tokens for rawHuman
    humanTokenCount: number;

    // Optional reason why message generation stopped
    // Useful for debugging and error handling
    stopReason?: TStopReason;

    // Optional array of URLs pointing to videos whose data was used to generate the rawAI
    relevantContent?: string[];
};
