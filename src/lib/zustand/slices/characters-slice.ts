/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { StoreSlice } from '@/lib/zustand/store-slice';
import { LinkedMapList } from '@/components/custom/lists/linked-map-list';
import {
    CharactersSlice,
    TBaseCharacter,
    TCharacter,
    TCharacters,
} from '@/types/character';

const initialState: TCharacters = {
    characters: new Map<
        string,
        LinkedMapList<TCharacter>
    >(),
    characterCategories: new Map<string, string>(),
};

export const createCharactersSlice: StoreSlice<
    CharactersSlice
> = (set, get) => ({
    ...initialState,
    addCharacter: (
        categoryId: string,
        characterId: string,
        character: TCharacter,
    ) => {
        set((state) => {
            let categoryList =
                state.characters.get(categoryId);
            if (!categoryList) {
                categoryList =
                    new LinkedMapList<TCharacter>();
                state.characters.set(
                    categoryId,
                    categoryList,
                );
            }
            categoryList.pushEnd(characterId, character);
        });
    },
    addCharacters: (
        categoryId: string,
        characterIds: string[],
        characters: TCharacter[],
    ) => {
        set((state) => {
            let categoryList =
                state.characters.get(categoryId);
            if (!categoryList) {
                categoryList =
                    new LinkedMapList<TCharacter>();
                state.characters.set(
                    categoryId,
                    categoryList,
                );
            }
            characterIds.forEach((id, index) => {
                categoryList.pushEnd(id, characters[index]);
            });
        });
    },
    addCharacterCategory: (
        categoryId: string,
        characterId: string,
    ) => {
        set((state) => {
            state.characterCategories.set(
                characterId,
                categoryId,
            );
        });
    },
    addCharactersCategory: (
        categoryId: string,
        characterIds: string[],
    ) => {
        set((state) => {
            characterIds.forEach((id) => {
                state.characterCategories.set(
                    id,
                    categoryId,
                );
            });
        });
    },
    getCharacter: (
        categoryId: string,
        characterId: string,
    ) => {
        const categoryList =
            get().characters.get(categoryId);
        return categoryList?.get(characterId);
    },
    getCharacterCategory: (characterId: string) => {
        return get().characterCategories.get(characterId);
    },
    getCharacters: (categoryId: string) => {
        return get().characters.get(categoryId)?.toArray();
    },
    getCharactersCount: (categoryId: string) => {
        return get().characters.get(categoryId)?.length;
    },
    getCharactersIds: (categoryId: string) => {
        return get().characters.get(categoryId)?.ids();
    },
    addCharacterTranslation: (
        categoryId: string,
        characterId: string,
        language: string,
        translation: TBaseCharacter,
    ) => {
        set((state) => {
            const categoryList =
                state.characters.get(categoryId);
            const character =
                categoryList?.get(characterId);
            if (!character) return;
            character.translations.pushEnd(
                language,
                translation,
            );
        });
    },
    addCharacterTranslations: (
        categoryId: string,
        characterId: string,
        languages: string[],
        translations: TBaseCharacter[],
    ) => {
        set((state) => {
            const categoryList =
                state.characters.get(categoryId);
            const character =
                categoryList?.get(characterId);
            if (!character) return;
            languages.forEach((language, index) => {
                character.translations.pushEnd(
                    language,
                    translations[index],
                );
            });
        });
    },
});
