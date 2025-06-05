import { z } from 'zod';

import { chatConstants } from '@/config';

export const chatIdSchema = z.string().uuid();

export const getLatestSessionForCharacterInputSchema =
    z.object({
        characterId: z.string().uuid(),
    });

export const getCharacterInputSchema = z.string().uuid();

export const getInitialContextInputSchema = z
    .string()
    .uuid();

export const getMessagesInputSchema = z.object({
    sessionId: z.string().uuid(),
    limit: z
        .number()
        .int()
        .min(1)
        .max(chatConstants.maxMessagesToFetch)
        .default(chatConstants.messagesToFetch),
    lastPosition: z
        .number()
        .int()
        .min(1)
        .optional()
        .nullable(),
});

export const createSessionInputSchema = z.object({
    characterId: z.string().uuid(),
});

export const applyPenaltiesInputSchema = z.object({
    chunkIds: z.array(z.string().uuid()),
});

export const deleteSessionInputSchema = chatIdSchema;
