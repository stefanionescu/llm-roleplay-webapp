import { z } from 'zod';

export const getSessionsInputSchema = z.object({
    limit: z.number().int().positive().default(10),
    cursor: z
        .object({
            activityRank: z
                .string()
                .datetime()
                .optional()
                .nullable(),
            id: z.string().uuid().optional().nullable(),
        })
        .optional()
        .nullable(),
});

export type GetSessionsInput = z.infer<
    typeof getSessionsInputSchema
>;
