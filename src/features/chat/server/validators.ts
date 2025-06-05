import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { ragConstants } from '@/config';
import { llmConstants } from '@/config';
import { API_LANGUAGES } from '@/config/language';
import { stopReasons, TChatMessage } from '@/types/message';
import {
    CategoryRow,
    CategoryTranslationRow,
    CharacterTranslationRow,
    CharacterWithTranslationsResponse,
} from '@/types/db';

export const hybridRAGWithHashtagsURLParamsSchema =
    z.object({
        text: z.string(),
        language_code: z.enum(
            Object.values(API_LANGUAGES) as [
                string,
                ...string[],
            ],
        ),
        hashtags: z
            .string()
            .transform((str) => str.split(',')),
        secondary_hashtags: z
            .string()
            .optional()
            .transform((str) =>
                str
                    ? str
                          .split('|')
                          .map((group) => group.split(','))
                    : null,
            ),
        similarity_threshold: z
            .string()
            .transform(Number)
            .refine(
                (val) =>
                    val ===
                        ragConstants.mainSimilarityThreshold ||
                    val ===
                        ragConstants.secondarySimilarityThreshold,
                {
                    message:
                        'Similarity threshold must match one of the predefined thresholds',
                },
            ),
        max_results: z
            .string()
            .transform(Number)
            .refine(
                (val) => val === ragConstants.maxResults,
                {
                    message:
                        'Max results must match the predefined constant',
                },
            ),
        user_id: z.string().uuid(),
    });

// Define the schema for TContext
const minimalContextSchema = z.object({
    content: z.string(),
    tokenCount: z.number(),
    role: z.enum(['user', 'assistant']),
});

// Define the schema for inference request parameters
export const inferenceRequestParamsSchema = z.object({
    systemPrompt: z
        .string()
        .min(1, 'systemPrompt cannot be empty'),
    messages: z.string().transform((str, ctx) => {
        try {
            const parsed = JSON.parse(str) as unknown;
            // Validate that the parsed data is an array of TContext
            const result = z
                .array(minimalContextSchema)
                .safeParse(parsed);
            if (!result.success) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Invalid messages format: ${result.error.message}`,
                });
                return z.NEVER;
            }
            return result.data;
            // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (e) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    'Messages parameter must be a valid JSON string',
            });
            return z.NEVER;
        }
    }),
    maxTokens: z
        .string()
        .optional()
        .transform((str, ctx) => {
            if (
                str === undefined ||
                str === null ||
                str === ''
            ) {
                return llmConstants.maxInferenceResponseTokensLong; // Default value
            }
            const num = parseInt(str, 10);
            if (isNaN(num)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'maxTokens must be a valid number',
                });
                return z.NEVER;
            }
            if (
                num >
                llmConstants.maxInferenceResponseTokensLong
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `maxTokens cannot exceed ${llmConstants.maxInferenceResponseTokensLong}`,
                });
                return z.NEVER;
            }
            return num;
        }),
});

export const validateCharacterTranslations = (
    character: CharacterWithTranslationsResponse,
    requiredLanguages: string[],
): void => {
    const existingLanguages = new Set(
        character.translations.map(
            (t: CharacterTranslationRow) => t.language_code,
        ),
    );

    for (const language of requiredLanguages) {
        if (!existingLanguages.has(language)) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Data integrity issue: Missing translation for language ${language} in character (${character.id}).`,
            });
        }
    }
};

export const validateCategoryTranslations = (
    category: CategoryRow & {
        translations: CategoryTranslationRow[];
    },
    requiredLanguages: string[],
): void => {
    const existingLanguages = new Set(
        category.translations.map(
            (t: CategoryTranslationRow) => t.language_code,
        ),
    );

    for (const language of requiredLanguages) {
        if (!existingLanguages.has(language)) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Data integrity issue: Missing translation for language ${language} in category (${category.id}).`,
            });
        }
    }
};

export const addMessageInputSchema = z.object({
    sessionId: z.string().uuid(),
    message: z.object({
        rawAI: z.string().min(1),
        rawHuman: z.string().optional(),
        stopReason: z.enum(stopReasons),
        errorMessage: z.string().optional(),
        llmModelUsed: z.string().min(1),
        relevantContent: z.array(z.string()).optional(),
        aiTokenCount: z.number().int().positive(),
        humanTokenCount: z.number().int(),
    }) satisfies z.ZodType<
        Omit<TChatMessage, 'createdAt' | 'position'>
    >,
});
