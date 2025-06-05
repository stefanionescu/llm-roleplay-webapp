import { SupabaseClient } from '@supabase/supabase-js';

import { dbConstants } from '@/config';
import { API_LANGUAGES } from '@/config/language';
import {
    CategoryWithCountResponse,
    CategoryWithTranslationsResponse,
    CharacterRow,
    CharacterTranslationRow,
    Database,
} from '@/types/db';

export const getCategories = async (
    supabase: SupabaseClient<Database>,
) => {
    const [categoriesResponse, characterCountsResponse] =
        await Promise.all([
            supabase
                .schema('public')
                .from('character_categories')
                .select<
                    string,
                    CategoryWithTranslationsResponse
                >(
                    `
            *,
            translations:character_category_translations(*)
        `,
                )
                .in(
                    'character_category_translations.language_code',
                    Object.values(API_LANGUAGES).filter(
                        (lang) =>
                            lang !== API_LANGUAGES.ENGLISH,
                    ),
                )
                .limit(dbConstants.queryLimit),
            supabase
                .schema('public')
                .from('character_categories')
                .select<string, CategoryWithCountResponse>(
                    `
            id,
            name,
            character_count:characters(count)
        `,
                )
                .order('name'),
        ]);

    return {
        categoriesResponse,
        characterCountsResponse,
    };
};

export const getCharacters = async (
    supabase: SupabaseClient<Database>,
    categoryId: string,
) => {
    // Fetch characters for the specific category
    const charactersResponse = await supabase
        .schema('public')
        .from('characters')
        .select<'*', CharacterRow>('*')
        .eq('character_category', categoryId)
        .eq('paused', false)
        .limit(dbConstants.queryLimit);

    return charactersResponse;
};

export const getCharacterTranslations = async (
    supabase: SupabaseClient<Database>,
    characterIds: string[],
    nonEnglishLanguages: string[],
) => {
    // Fetch translations only for the retrieved characters
    const translationsResponse = await supabase
        .schema('public')
        .from('character_translations')
        .select<'*', CharacterTranslationRow>('*')
        .in('character_id', characterIds)
        .in('language_code', nonEnglishLanguages)
        .limit(
            characterIds.length *
                nonEnglishLanguages.length,
        );

    return translationsResponse;
};
