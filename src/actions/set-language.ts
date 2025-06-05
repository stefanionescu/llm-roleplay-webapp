'use server';

import { cookies } from 'next/headers';

import { setLanguageSchema } from '@/validators/language';

type SetLanguageResponse = {
    error?: string;
    success: boolean;
};

export async function setLanguage(
    language: string,
): Promise<SetLanguageResponse> {
    try {
        const result = await Promise.resolve(
            setLanguageSchema.parse({
                language: language.toLowerCase(),
            }),
        );

        const parsedLanguage: string = result.language;

        await Promise.resolve(
            cookies().set('llm-roleplay-language', parsedLanguage),
        );

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Failed to set language',
        };
    }
}
