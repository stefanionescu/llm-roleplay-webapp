/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { StoreSlice } from '@/lib/zustand/store-slice';
import { LinkedMapList } from '@/components/custom/lists/linked-map-list';
import {
    CategoriesSlice,
    TZustandCategories,
    TZustandCategory,
} from '@/types/category';

const initialState: TZustandCategories = {
    categories: new LinkedMapList<TZustandCategory>(),
};

export const createCategoriesSlice: StoreSlice<
    CategoriesSlice
> = (set, get) => ({
    ...initialState,
    addCategory: (
        id: string,
        category: TZustandCategory,
    ) => {
        set((state) => {
            state.categories.pushEnd(id, category);
        });
    },
    addCategories: (
        ids: string[],
        categories: TZustandCategory[],
    ) => {
        set((state) => {
            ids.forEach((id, index) => {
                state.categories.pushEnd(
                    id,
                    categories[index],
                );
            });
        });
    },
    addCategoryTranslation: (
        id: string,
        language: string,
        value: string,
    ) => {
        set((state) => {
            // Get the category from the Immer draft state
            const categoryDraft = state.categories.get(id);
            if (categoryDraft) {
                // Mutate the draft directly - Immer handles the immutable update
                categoryDraft.translations[language] =
                    value;
            }
        });
    },
    addCharacterToCategory: (
        id: string,
        characterId: string,
    ) => {
        set((state) => {
            const category = state.categories.get(id);
            if (category) {
                category.characters.push(characterId);
            }
        });
    },
    addCharactersToCategory: (
        id: string,
        characterIds: string[],
    ) => {
        set((state) => {
            const category = state.categories.get(id);
            if (category) {
                category.characters.push(...characterIds);
            }
        });
    },
    getCategory: (id: string) => {
        return get().categories.get(id);
    },
    getCategories: () => {
        return get().categories.toArray();
    },
    getCategoriesIds: () => {
        return get().categories.ids();
    },
    getCategoriesCount: () => {
        return get().categories.length;
    },
    resetCategories: () => {
        set((state) => {
            state.categories =
                new LinkedMapList<TZustandCategory>();
        });
    },
});
