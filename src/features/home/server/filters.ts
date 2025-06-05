import {
    CategoryWithCountResponse,
    CategoryWithTranslationsResponse,
} from '@/types/db';

export const filterCategories = (
    categoriesResponse: CategoryWithTranslationsResponse[],
    characterCountsResponse: CategoryWithCountResponse[],
): CategoryWithTranslationsResponse[] => {
    // Filter out categories with zero characters
    const nonEmptyCategoryIds = new Set(
        characterCountsResponse
            .filter(
                (cat) =>
                    Number(cat.character_count[0].count) >
                    0,
            )
            .map((cat) => cat.id),
    );

    // Filter categories, preserving the original structure
    const categories = categoriesResponse.filter((item) =>
        nonEmptyCategoryIds.has(item.id),
    );

    return categories;
};
