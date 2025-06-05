import { LinkedMapList } from '@/components/custom/lists/linked-map-list';

/**
 * TBaseCharacter defines the core data for a character
 * This includes the character's name, biography, hashtags, and system prompt
 */
export type TBaseCharacter = {
    // Translated character biography/description in the specified language
    // Provides background and personality information about the character
    bio: string;

    // Translated character name in the specified language
    // This is the primary identifier shown to users in the UI
    name: string;

    // Translated system prompt that defines the character's behavior for the AI model
    // This is the instructions sent to the AI model to shape its responses
    system_prompt: string;

    // Translated initial message the character sends at the start of a conversation
    // This is the first message users see from the character
    initial_message: string;

    // Array of hashtags to display with this character in the specified language
    // These help users quickly understand the character's topics or personality
    display_hashtags: string[];

    // Pre-calculated token count for the system prompt
    // Used for tracking token usage against API limits without recounting
    system_prompt_token_count: number;

    // Optional array of content fragments for the initial message
    // Allows the initial message to be structured in segments for more complex formatting
    initial_message_content?: string[];

    // Pre-calculated token count for the initial message
    // Used for tracking token usage against API limits without recounting
    initial_message_token_count: number;

    // Optional array of conversation starters for this character in the specified language
    // These give users ideas for how to begin a conversation with this character
    // Can be either a tuple of [title, content] or an object with title and content properties
    chat_starters?: (
        | [string, string]
        | { title: string; content: string }
    )[];
};

/**
 * TCharacter defines a character's main data
 * Contains all the data needed to render and interact with a character
 * Includes both default language content and translations
 */
export type TCharacter = TBaseCharacter & {
    // Flag indicating if this character is temporarily unavailable
    // When true, the character should not be offered for new conversations
    paused: boolean;

    // URL to the character's icon/avatar image
    // Used in UI elements to visually represent the character
    icon_url: string;

    // Primary hashtags associated with this character
    // These are the most important tags that define the character's main themes
    main_hashtags: string[];

    // Grouped secondary hashtags that further define the character
    // Each inner array represents a group of related secondary hashtags
    // This nested structure enables more organized display of related hashtags
    secondary_hashtags: string[][];

    // Array of translations for all character text content
    // Contains complete sets of translated content for each supported language
    translations: LinkedMapList<TBaseCharacter>;
};

/**
 * TCharacters defines a collection of characters
 * This is a map of character IDs to their TCharacter data
 * It uses the LinkedMapList utility to store characters in a linked list
 * This allows for efficient insertion and removal of characters
 */
export type TCharacters = {
    characterCategories: Map<string, string>;
    characters: Map<string, LinkedMapList<TCharacter>>;
};

/**
 * TCharacterActions defines the actions that can be performed on a collection of characters
 * These actions are used to manage the characters in the TCharacters map
 */
export type TCharacterActions = {
    /** Retrieves the count of characters in a specific category. */
    getCharactersCount: (
        categoryId: string,
    ) => number | undefined;
    /** Retrieves the IDs of characters in a specific category. */
    getCharactersIds: (
        categoryId: string,
    ) => string[] | undefined;
    /** Retrieves all characters for a specific category. */
    getCharacters: (
        categoryId: string,
    ) => TCharacter[] | undefined;
    /** Retrieves a character category by its character ID. */
    getCharacterCategory: (
        characterId: string,
    ) => string | undefined;
    /** Adds a new character category to the collection. */
    addCharacterCategory: (
        categoryId: string,
        characterId: string,
    ) => void;
    /** Adds multiple characters to the collection under a specific category. */
    addCharactersCategory: (
        categoryId: string,
        characterIds: string[],
    ) => void;
    /** Retrieves a character by its category ID and character ID. */
    getCharacter: (
        categoryId: string,
        characterId: string,
    ) => TCharacter | undefined;
    /** Adds a new character to the collection under a specific category. */
    addCharacter: (
        categoryId: string,
        characterId: string,
        character: TCharacter,
    ) => void;
    /** Adds multiple characters to the collection under a specific category. */
    addCharacters: (
        categoryId: string,
        characterIds: string[],
        characters: TCharacter[],
    ) => void;
    /** Adds a translation for a character in a specific language. */
    addCharacterTranslation: (
        categoryId: string,
        characterId: string,
        language: string,
        translation: TBaseCharacter,
    ) => void;
    /** Adds translations for a character in multiple languages. */
    addCharacterTranslations: (
        categoryId: string,
        characterId: string,
        languages: string[],
        translations: TBaseCharacter[],
    ) => void;
};

/**
 * TCharacterSlice defines the complete state of a collection of characters
 * Combines the characters data (TCharacters) with its actions (TCharacterActions)
 */
export type CharactersSlice = TCharacters &
    TCharacterActions;
