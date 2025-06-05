import { API_LANGUAGES } from '@/config/language';
import { TZustandCategory } from '@/types/category';
import { IMPORTANT_CATEGORIES } from '@/config/categories';
import {
    CategoriesResponse,
    CategoryTranslationRow,
    CategoryWithTranslationsResponse,
} from '@/types/db';

export const transformCategories = (
    categories: CategoryWithTranslationsResponse[],
    allCategoriesData: CategoryWithTranslationsResponse[],
): CategoriesResponse => {
    // Sort categories to ensure IMPORTANT_CATEGORIES are in the middle and in exact order
    const importantCategories = categories.filter((cat) =>
        IMPORTANT_CATEGORIES.includes(
            cat.name.toLowerCase(),
        ),
    );
    const otherCategories = categories.filter(
        (cat) =>
            !IMPORTANT_CATEGORIES.includes(
                cat.name.toLowerCase(),
            ),
    );

    // Sort other categories alphabetically
    otherCategories.sort((a, b) =>
        a.name.localeCompare(b.name),
    );

    // Calculate how many categories should go before the important ones
    const beforeCount = Math.floor(
        otherCategories.length / 2,
    );

    // Split other categories into before and after
    const beforeCategories = otherCategories.slice(
        0,
        beforeCount,
    );
    const afterCategories =
        otherCategories.slice(beforeCount);

    // Sort important categories to match IMPORTANT_CATEGORIES order
    importantCategories.sort(
        (a, b) =>
            IMPORTANT_CATEGORIES.indexOf(
                a.name.toLowerCase(),
            ) -
            IMPORTANT_CATEGORIES.indexOf(
                b.name.toLowerCase(),
            ),
    );

    // Combine all categories in the desired order
    const sortedCategories = [
        ...beforeCategories,
        ...importantCategories,
        ...afterCategories,
    ];

    // Transform the data into the exact format needed by the frontend
    const categoryIds = sortedCategories.map(
        (cat) => cat.id,
    );
    const zustandCategories: TZustandCategory[] =
        sortedCategories.map((cat) => {
            const categoryTranslations =
                allCategoriesData.find(
                    (item) => item.id === cat.id,
                )?.translations || [];

            const translations =
                categoryTranslations.reduce(
                    (
                        acc: TZustandCategory['translations'],
                        trans: CategoryTranslationRow,
                    ) => ({
                        ...acc,
                        [trans.language_code]: trans.name,
                    }),
                    {} as Record<
                        (typeof API_LANGUAGES)[keyof typeof API_LANGUAGES],
                        string
                    >,
                );

            return {
                name: cat.name,
                translations,
                characters: [], // Initialize characters as empty, will be populated later
            };
        });

    return {
        categoryIds,
        zustandCategories,
    };
};
