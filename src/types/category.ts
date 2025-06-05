import { API_LANGUAGES } from '@/config/language';
import { LinkedMapList } from '@/components/custom/lists/linked-map-list';

/**
 * TCategory represents a row in the character_categories table
 * Stores the base information for a character category
 */
export type TCategory = {
    // Unique identifier for the category
    id: string;
    // Display name of the category in the default language
    name: string;
};

/**
 * TCategoryTranslation represents a row in the character_category_translations table
 * Stores translations for character categories in different languages
 */
export type TCategoryTranslation = {
    // Unique identifier for the translation
    id: string;
    // Translated name of the category
    name: string;
    // Reference to the parent category
    category_id: string;
    // Language code for this translation (e.g., 'en', 'fr')
    language_code: string;
};

/**
 * TZustandCategory defines the structure of an individual category
 * Categories group related characters together for organizational purposes
 */
export type TZustandCategory = {
    // Display name of the category in the default language
    // Used in UI elements like category selectors or headers
    name: string;

    // Array of characters (identified by ID) that belong to this category
    // The main content of each category that users interact with
    characters: string[];

    // Map of translations for this category's name in different languages
    // Keys are language codes (e.g., 'en', 'fr') from API_LANGUAGES
    // Values are the translated category names
    // Enables internationalization (i18n) for the category display name
    translations: Partial<
        Record<
            (typeof API_LANGUAGES)[keyof typeof API_LANGUAGES],
            string
        >
    >;
};

/**
 * TZustandCategories defines the structure of a collection of categories
 * Categories group related characters together for organizational purposes
 */
export type TZustandCategories = {
    categories: LinkedMapList<TZustandCategory>;
};

/**
 * CategoriesActions defines the actions that can be performed on a collection of categories
 */
export type CategoriesActions = {
    /** Resets the categories collection to its initial state. */
    resetCategories: () => void;
    /** Retrieves the number of categories in the collection. */
    getCategoriesCount: () => number;
    /** Retrieves all categories IDs in the collection. */
    getCategoriesIds: () => string[];
    /** Retrieves all categories in the collection. */
    getCategories: () => TZustandCategory[];
    /** Retrieves a category by its ID. */
    getCategory: (
        id: string,
    ) => TZustandCategory | undefined;
    /** Adds a new category to the collection. */
    addCategory: (
        id: string,
        category: TZustandCategory,
    ) => void;
    /** Adds a character to a category. */
    addCharacterToCategory: (
        id: string,
        characterId: string,
    ) => void;
    /** Adds multiple characters to a category. */
    addCharactersToCategory: (
        id: string,
        characterIds: string[],
    ) => void;
    /** Adds multiple categories to the collection. */
    addCategories: (
        ids: string[],
        categories: TZustandCategory[],
    ) => void;
    /** Adds a translation for a category in a specific language. */
    addCategoryTranslation: (
        id: string,
        language: string,
        value: string,
    ) => void;
};

/**
 * CategoriesSlice defines the complete state of a collection of categories
 * Combines the categories data (TZustandCategories) with its actions (CategoriesActions)
 */
export type CategoriesSlice = TZustandCategories &
    CategoriesActions;
