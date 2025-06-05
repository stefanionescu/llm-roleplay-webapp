import { z } from 'zod';

import { API_LANGUAGES } from '../config/language';

export const setLanguageSchema = z.object({
    language: z.nativeEnum(API_LANGUAGES),
});

export type LanguageSchema = z.infer<
    typeof setLanguageSchema
>;
