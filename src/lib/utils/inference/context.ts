// src/lib/utils/inference/context.ts
import { Editor } from '@tiptap/react';

import { llmConstants } from '@/config';
import { TContext } from '@/types/context';
import { getTokenCount } from '@/lib/utils/tokens';
import { TChatHistory } from '@/types/chat-history';
import { LinkedMapList } from '@/components/custom/lists/linked-map-list';

export type ValidationResult = {
    isValid: boolean;
    contextData?: {
        contexts: TContext[];
        leftoverCount: number;
    };
};

/**
 * Filters out assistant contexts that start with refusal messages and any preceding user contexts
 */
export const filterRefusalContexts = (
    contexts: TContext[],
): TContext[] => {
    if (!contexts || contexts.length === 0) return contexts;

    // Use the refusal patterns array directly
    const refusalPatterns =
        llmConstants.refusalMessageDetector;

    // Create a new array to hold filtered contexts
    const filteredContexts: TContext[] = [];

    // Keep track of the last role to avoid consecutive user contexts
    let lastAddedRole: 'user' | 'assistant' | null = null;

    // Process each context
    for (const context of contexts) {
        // Check if current context is from assistant and contains refusal message
        if (context.role === 'assistant') {
            let isRefusal = false;

            // Check against all refusal patterns
            for (const pattern of refusalPatterns) {
                // Check for the original pattern or the pattern with * prefix
                if (
                    context.content
                        .trim()
                        .startsWith(pattern) ||
                    context.content
                        .trim()
                        .startsWith('*' + pattern)
                ) {
                    isRefusal = true;
                    break;
                }
            }

            if (isRefusal) {
                // This is a refusal message - skip it
                // If the previous context was added and was from a user, remove it
                if (
                    lastAddedRole === 'user' &&
                    filteredContexts.length > 0
                ) {
                    filteredContexts.pop();
                    lastAddedRole =
                        filteredContexts.length > 0
                            ? filteredContexts[
                                  filteredContexts.length -
                                      1
                              ].role
                            : null;
                }
                continue;
            }
        }

        // If we get here, add the context to our filtered list
        filteredContexts.push(context);
        lastAddedRole = context.role;
    }

    return filteredContexts;
};

/**
 * Validates input and context data
 */
export const validateInputAndContext = (
    editor: Editor | null,
    input: string,
    characterId: string,
    getContextsWithDeletableEntries: (
        characterId: string,
        maxTokens: number,
    ) =>
        | {
              contexts: TContext[];
              leftoverCount: number;
          }
        | undefined,
): ValidationResult => {
    // Calculate token count for the input
    const inputTokens = getTokenCount(input) || 0;

    // Get context data with token optimization
    const contextData = getContextsWithDeletableEntries(
        characterId,
        llmConstants.maxContextTokens - inputTokens,
    );

    // Validate required components
    if (
        !contextData?.contexts ||
        contextData.contexts.length === 0 ||
        !editor ||
        !input ||
        input.trim() === ''
    ) {
        return { isValid: false };
    }

    return { isValid: true, contextData };
};

/**
 * Initializes chat history if needed
 */
export const initializeChatHistory = (
    characterId: string,
    contextCount: number,
    messageCount: number,
    addHistory: (
        characterId: string,
        history: TChatHistory,
    ) => void,
): void => {
    if (contextCount === 0 && messageCount === 0) {
        const newHistory: TChatHistory = {
            context: new LinkedMapList<TContext>(),
            messages: new LinkedMapList<string>(),
            totalContextTokens: 0,
        };

        addHistory(characterId, newHistory);
    }
};

/**
 * Cleans up user context entries if needed when message generation is interrupted
 * This ensures we don't have dangling user contexts with no corresponding assistant response
 */
export const deleteLatestUserContext = (
    characterId: string,
    currentContent: string,
    getLatestContextRole: (
        id: string,
    ) => 'user' | 'assistant' | undefined,
    getContextCount: (id: string) => number,
    deleteLatestContext: (id: string) => void,
): void => {
    // Only clean up if there's no content already generated
    if (currentContent.trim()) {
        return;
    }

    // Check if last context is from user and we have an even number of contexts
    const lastRole = getLatestContextRole(characterId);
    const contextCount = getContextCount(characterId);

    if (lastRole === 'user' && contextCount % 2 === 0) {
        // Delete the last context entry
        deleteLatestContext(characterId);
    }
};

/**
 * Handles error state by cleaning up resources
 */
export const handleInvalidState = (
    isNewSession: boolean,
    deleteLatestMessage: (characterId: string) => void,
    deleteOldestFromContext: (characterId: string) => void,
    cleanAppState: () => void,
    toast: (message: string) => void,
    errorMessage: string,
    characterId: string,
) => {
    // Delete latest messages and context
    if (isNewSession) {
        deleteLatestMessage(characterId);
        deleteOldestFromContext(characterId);
    }

    // Clean up app state
    cleanAppState();

    // Show error message
    toast(errorMessage);
};
