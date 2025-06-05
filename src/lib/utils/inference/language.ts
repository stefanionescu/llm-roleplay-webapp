import { useTranslations } from 'next-intl';

import { prompts } from '@/lib/utils/prompts';
import { TCharacter } from '@/types/character';
import { llmConstants, ragConstants } from '@/config';

/**
 * Determines if a RAG query should be performed
 */
export const shouldPerformRag = (
    input: string,
): boolean => {
    return (
        input.trim().length >
        ragConstants.minInputLengthForRAG
    );
};

/**
 * Utility function to build the system prompt with all needed instructions
 */
export const buildEnhancedSystemPrompt = (
    systemPrompt: string,
    relevantContent: string[],
    maxTokens: number,
    translations: ReturnType<typeof useTranslations>,
): string => {
    let finalSystemPrompt =
        relevantContent.length > 0
            ? `${systemPrompt}\n\n${prompts(translations).ragChunkIntegrationPrompt(relevantContent)}`
            : systemPrompt;

    finalSystemPrompt = `
        ${prompts(translations).jailbreakPrompt()}\n\n
        ${prompts(translations).ignoreUserJailbreakPrompt()}\n\n
        ${prompts(translations).proseAndContinuityPrompt()}\n\n
        ${prompts(translations).formattingPrompt()}\n\n
        ${prompts(translations).instructChatMode(maxTokens)}\n\n
        ${finalSystemPrompt}\n\n
        ${prompts(translations).languageConsistencyPrompt()}
    `;

    return finalSystemPrompt;
};

/**
 * Get appropriate word limit for different languages
 */
export const getLanguageWordLimit = (
    language: string,
): number => {
    const longTokenLanguages = ['de', 'hi', 'th'];
    return longTokenLanguages.includes(language)
        ? llmConstants.maxInferenceResponseWordsLong
        : llmConstants.maxInferenceResponseWordsBase;
};

/**
 * Get appropriate token limit for different languages
 */
export const getLanguageTokenLimit = (
    language: string,
): number => {
    const longTokenLanguages = ['de', 'hi', 'th'];
    return longTokenLanguages.includes(language)
        ? llmConstants.maxInferenceResponseTokensLong
        : llmConstants.maxInferenceResponseTokensBase;
};

/**
 * Utility function to get the system prompt from character data
 */
export const getCharacterSystemPrompt = (
    character: TCharacter,
    language: string,
): string => {
    const translatedCharacter =
        character.translations.get(language);
    return (
        translatedCharacter?.system_prompt ||
        character.system_prompt
    );
};
