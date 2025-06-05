import { z } from 'zod';

export const getCharactersInputSchema = z.object({
    categoryId: z
        .string()
        .uuid('Invalid Category ID format'),
});
