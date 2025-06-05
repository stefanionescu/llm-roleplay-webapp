import { Editor } from '@tiptap/react';

import { TContext } from '@/types/context';
import { TCharacter } from '@/types/character';
import { getUserId } from '@/lib/utils/inference/session';
import {
    shouldPerformRag,
    getRelevantContent,
} from '@/lib/utils/rag';
import {
    validateInputAndContext,
    handleInvalidState,
    filterRefusalContexts,
} from '@/lib/utils/inference/context';

/**
 * Prepares for message generation by handling RAG and validation
 */
export const prepareMessageGeneration = async (
    editor: Editor | null,
    input: string,
    characterId: string,
    language: string,
    character: TCharacter,
    isNewSession: boolean,
    getContextsWithDeletableEntries: (
        characterId: string,
        maxTokens: number,
    ) =>
        | {
              contexts: TContext[];
              leftoverCount: number;
          }
        | undefined,
    deleteLatestMessage: (characterId: string) => void,
    deleteOldestFromContext: (characterId: string) => void,
    cleanAppState: () => void,
    toastError: (message: string) => void,
    errorMessage: string,
    signal: AbortSignal,
    setIsDoingRAG: (isDoingRAG: boolean) => void,
    deleteManyOldestFromContext: (
        characterId: string,
        count: number,
    ) => void,
    previousAiText?: string | null,
): Promise<{
    success: boolean;
    contentUrls: string[];
    fullContentIds: string[];
    relevantContent: string[];
    contextData?: {
        contexts: TContext[];
        leftoverCount: number;
    };
}> => {
    // Step 1: Validate input and context
    const validationResult = validateInputAndContext(
        editor,
        input,
        characterId,
        getContextsWithDeletableEntries,
    );

    if (
        !validationResult.isValid ||
        !validationResult.contextData
    ) {
        // Handle invalid input or context
        handleInvalidState(
            isNewSession,
            deleteLatestMessage,
            deleteOldestFromContext,
            cleanAppState,
            toastError,
            errorMessage,
            characterId,
        );
        return {
            success: false,
            relevantContent: [],
            contentUrls: [],
            fullContentIds: [],
        };
    }

    const { contextData } = validationResult;

    // Filter out refusal contexts
    contextData.contexts = filterRefusalContexts(
        contextData.contexts,
    );

    // If all contexts were filtered out, handle as invalid state
    if (contextData.contexts.length === 0) {
        handleInvalidState(
            isNewSession,
            deleteLatestMessage,
            deleteOldestFromContext,
            cleanAppState,
            toastError,
            errorMessage,
            characterId,
        );
        return {
            success: false,
            relevantContent: [],
            contentUrls: [],
            fullContentIds: [],
        };
    }

    // Step 2: Handle token limits
    if (contextData.leftoverCount > 0) {
        deleteManyOldestFromContext(
            characterId,
            contextData.leftoverCount,
        );
    }

    // Step 3: Verify user authentication
    const userId = await getUserId();

    if (!userId) {
        handleInvalidState(
            isNewSession,
            deleteLatestMessage,
            deleteOldestFromContext,
            cleanAppState,
            toastError,
            errorMessage,
            characterId,
        );
        return {
            success: false,
            relevantContent: [],
            contentUrls: [],
            fullContentIds: [],
        };
    }

    // Step 4: Perform RAG if needed
    let relevantContent: string[] = [];
    let contentUrls: string[] = [];
    let fullContentIds: string[] = [];

    if (shouldPerformRag(input)) {
        setIsDoingRAG(true);

        try {
            const content = await getRelevantContent(
                input,
                language,
                character,
                userId,
                signal,
                previousAiText,
            );

            relevantContent = content.contents;
            contentUrls = content.urls;
            fullContentIds = content.fullContentIds;
        } catch (error: unknown) {
            // Check if this was a cancellation
            if (
                error instanceof Error &&
                error.name === 'AbortError'
            ) {
                return {
                    success: false,
                    relevantContent: [],
                    contentUrls: [],
                    fullContentIds: [],
                };
            }

            // Handle other errors
            handleInvalidState(
                isNewSession,
                deleteLatestMessage,
                deleteOldestFromContext,
                cleanAppState,
                toastError,
                errorMessage,
                characterId,
            );
            return {
                success: false,
                relevantContent: [],
                contentUrls: [],
                fullContentIds: [],
            };
        } finally {
            setIsDoingRAG(false);
        }
    }

    return {
        success: true,
        contextData,
        relevantContent,
        contentUrls,
        fullContentIds,
    };
};
