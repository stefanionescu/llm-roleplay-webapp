import { TRPCError } from '@trpc/server';

import { API_LANGUAGES } from '@/config/language';
import { getCharactersInputSchema } from '@/validators/home';
import { filterCategories } from '@/features/home/server/filters';
import {
    baseProcedure,
    createTRPCRouter,
} from '@/trpc/init';
import { validateCategories } from '@/features/home/server/validators';
import { transformCategories } from '@/features/home/server/transformers';
import {
    CategoriesResponse,
    CharactersResponse,
    CharacterTranslationRow,
} from '@/types/db';
import {
    getCategories,
    getCharacters,
    getCharacterTranslations,
} from '@/features/home/server/queries';

export const homeRouter = createTRPCRouter({
    getCategories: baseProcedure.query(
        async ({ ctx }): Promise<CategoriesResponse> => {
            const { supabase } = ctx;

            const {
                categoriesResponse,
                characterCountsResponse,
            } = await getCategories(supabase);

            if (
                categoriesResponse.error ||
                characterCountsResponse.error
            ) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to fetch categories',
                });
            }

            if (
                !categoriesResponse.data ||
                !characterCountsResponse.data ||
                categoriesResponse.data.length === 0 ||
                characterCountsResponse.data.length === 0
            ) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message:
                        'No or incomplete data for categories',
                });
            }

            const categories = filterCategories(
                categoriesResponse.data,
                characterCountsResponse.data,
            );

            if (categories.length === 0) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message:
                        'No categories with characters found',
                });
            }

            const { categoryIds, zustandCategories } =
                transformCategories(
                    categories,
                    categoriesResponse.data,
                );

            return {
                categoryIds,
                zustandCategories,
            };
        },
    ),

    getCharacters: baseProcedure
        .input(getCharactersInputSchema)
        .query(
            async ({
                ctx,
                input,
            }): Promise<CharactersResponse> => {
                const { supabase } = ctx;
                const { categoryId } = input;

                const charactersResponse =
                    await getCharacters(
                        supabase,
                        categoryId,
                    );

                if (charactersResponse.error) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to fetch characters for category ${categoryId}`,
                    });
                }

                if (
                    !charactersResponse.data ||
                    charactersResponse.data.length === 0
                ) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: `No characters found for category ${categoryId}`,
                    });
                }

                const characterIds =
                    charactersResponse.data.map(
                        (char) => char.id,
                    );

                // Get all non-English languages
                const nonEnglishLanguages = Object.values(
                    API_LANGUAGES,
                ).filter(
                    (lang) =>
                        lang !== API_LANGUAGES.ENGLISH,
                );

                const translationsResponse =
                    await getCharacterTranslations(
                        supabase,
                        characterIds,
                        nonEnglishLanguages,
                    );

                if (translationsResponse.error) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to fetch character translations for category ${categoryId}`,
                    });
                }

                if (
                    !translationsResponse.data ||
                    translationsResponse.data.length === 0
                ) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: `No translations found for category ${categoryId}`,
                    });
                }

                // Group translations by character
                const characterTranslations = new Map<
                    string,
                    CharacterTranslationRow[]
                >();

                for (const translation of translationsResponse.data) {
                    if (
                        !characterTranslations.has(
                            translation.character_id,
                        )
                    ) {
                        characterTranslations.set(
                            translation.character_id,
                            [],
                        );
                    }
                    characterTranslations
                        .get(translation.character_id)!
                        .push(translation);
                }

                // Validate that each character has translations for all required non-English languages
                validateCategories(
                    charactersResponse.data,
                    characterTranslations,
                    nonEnglishLanguages,
                );

                // Return characters with their translations, and the list of IDs
                return {
                    characterIds,
                    characters: charactersResponse.data.map(
                        (character) => ({
                            ...character,
                            translations:
                                characterTranslations.get(
                                    character.id,
                                ) || [],
                        }),
                    ),
                };
            },
        ),
});
