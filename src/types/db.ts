import { API_LANGUAGES } from '@/config/language';

// Define the typed Supabase DB
export type Database = {
    content_data: {
        Tables: {
            content_settings: {
                Row: {
                    id: number;
                    penalty_value: number;
                    min_similarity: number;
                    max_anonymous_sessions: number;
                    penalty_expiry_seconds: number;
                    top_rag_result_multiplier: number;
                    max_anonymous_session_messages: number;
                };
            };
        };
        Functions: {
            get_current_content_settings: {
                Args: Record<string, never>;
                Returns: {
                    id: number;
                    penalty_value: number;
                    min_similarity: number;
                    max_anonymous_sessions: number;
                    penalty_expiry_seconds: number;
                    top_rag_result_multiplier: number;
                    max_anonymous_session_messages: number;
                };
            };
        };
    };
    public: {
        Tables: {
            character_categories: {
                Row: {
                    id: string;
                    name: string;
                };
            };
            character_category_translations: {
                Row: {
                    id: string;
                    name: string;
                    category_id: string;
                    language_code: string;
                };
            };
            character_translations: {
                Row: {
                    id: string;
                    bio: string;
                    name: string;
                    character_id: string;
                    language_code: string;
                    system_prompt: string;
                    initial_message: string;
                    display_hashtags: string[];
                    system_prompt_token_count: number;
                    initial_message_content?: string[];
                    initial_message_token_count: number;
                    chat_starters: (
                        | [string, string]
                        | { title: string; content: string }
                    )[];
                };
            };
            characters: {
                Row: {
                    id: string;
                    bio: string;
                    name: string;
                    paused: boolean;
                    icon_url: string;
                    system_prompt: string;
                    main_hashtags: string[];
                    initial_message: string;
                    display_hashtags: string[];
                    secondary_hashtags: string[][];
                    system_prompt_token_count: number;
                    initial_message_content?: string[];
                    initial_message_token_count: number;
                    chat_starters: (
                        | [string, string]
                        | { title: string; content: string }
                    )[];
                };
            };
        };
    };
    chat_data: {
        Functions: {
            get_latest_session_for_character: {
                Args: {
                    p_character_id: string; // UUID
                };
                Returns: {
                    session_id: string; // UUID
                    created_at: string; // TIMESTAMPTZ
                }[];
            };
            fetch_context_messages: {
                Args: {
                    p_session_id: string; // UUID
                    p_max_tokens?: number; // INT
                };
                Returns: {
                    role: string;
                    content: string;
                    token_count: number;
                }[];
            };
            get_paginated_sessions: {
                Args: {
                    p_limit: number; // INT
                    p_cursor_id?: string | null; // UUID
                    p_cursor_activity_rank?: string | null; // TIMESTAMPTZ
                };
                Returns: {
                    session_id: string; // UUID
                    created_at: string; // TIMESTAMPTZ
                    character_id: string; // UUID
                    activity_rank: string; // TIMESTAMPTZ
                    character_icon_url: string; // TEXT
                    latest_message_at: string | null; // TIMESTAMPTZ
                    character_names: Record<string, string>; // JSONB
                }[];
            };
            get_paginated_messages: {
                Args: {
                    p_limit: number; // INT
                    p_session_id: string; // UUID
                    p_last_position?: number | null; // INT
                };
                Returns: {
                    message_id: string | null; // UUID
                    message_raw_ai: string | null; // TEXT
                    message_position: number | null; // INT
                    message_raw_human: string | null; // TEXT
                    message_created_at: string | null; // TIMESTAMPTZ
                    message_stop_reason: string | null; // TEXT
                    message_error_message: string | null; // TEXT
                    message_ai_token_count: number | null; // INT
                    message_llm_model_used: string | null; // TEXT
                    message_human_token_count:
                        | number
                        | null; // INT
                    message_relevant_content:
                        | string[]
                        | null; // text[]
                }[];
            };
        };
        Tables: {
            active_chat_sessions: {
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    created_at?: string | null;
                    character_id?: string | null;
                    latest_message_at?: string | null;
                    set_for_migration?: boolean | null;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    created_at?: string | null;
                    character_id?: string | null;
                    latest_message_at?: string | null;
                    set_for_migration?: boolean | null;
                };
                Row: {
                    id: string;
                    user_id: string | null;
                    created_at: string | null;
                    character_id: string | null;
                    activity_rank: string | null;
                    latest_message_at: string | null;
                    set_for_migration: boolean | null;
                };
            };
            active_chat_messages: {
                Row: {
                    id: string;
                    raw_ai: string;
                    ai_token_count: number;
                    llm_model_used: string;
                    position: number | null;
                    raw_human: string | null;
                    human_token_count: number;
                    session_id: string | null;
                    created_at: string | null;
                    stop_reason: string | null;
                    error_message: string | null;
                    relevant_content: string[] | null;
                };
                Insert: {
                    id?: string;
                    raw_ai: string;
                    ai_token_count: number;
                    llm_model_used: string;
                    position?: number | null;
                    raw_human?: string | null;
                    human_token_count?: number;
                    session_id?: string | null;
                    created_at?: string | null;
                    stop_reason?: string | null;
                    error_message?: string | null;
                    relevant_content?: string[] | null;
                };
                Update: {
                    id?: string;
                    raw_ai?: string;
                    ai_token_count?: number;
                    llm_model_used?: string;
                    position?: number | null;
                    raw_human?: string | null;
                    human_token_count?: number;
                    session_id?: string | null;
                    created_at?: string | null;
                    stop_reason?: string | null;
                    error_message?: string | null;
                    relevant_content?: string[] | null;
                };
            };
        };
    };
};

// Define database row types
export type CharacterRow =
    Database['public']['Tables']['characters']['Row'];
export type CharacterTranslationRow =
    Database['public']['Tables']['character_translations']['Row'];
export type CategoryRow =
    Database['public']['Tables']['character_categories']['Row'];
export type CategoryTranslationRow =
    Database['public']['Tables']['character_category_translations']['Row'];
export type PaginatedMessageItem =
    Database['chat_data']['Functions']['get_paginated_messages']['Returns'][number];
export type FetchContextMessagesResponseItem =
    Database['chat_data']['Functions']['fetch_context_messages']['Returns'][number];
export type FetchContextMessagesResponse =
    FetchContextMessagesResponseItem[];
export type PaginatedSessionItem =
    Database['chat_data']['Functions']['get_paginated_sessions']['Returns'][number];
export type PaginatedSessionsResponse =
    PaginatedSessionItem[];

export type LatestSessionForCharacterResponse =
    Database['chat_data']['Tables']['active_chat_sessions']['Row'][];

// Type representing the data structure of a chat session row from the DB, excluding the ID.
export type ChatSessionData = Omit<
    Database['chat_data']['Tables']['active_chat_sessions']['Row'],
    'id'
>;

// Define the response types for our specific queries
export type CategoryWithTranslationsResponse =
    CategoryRow & {
        translations: CategoryTranslationRow[];
    };

export type CategoryWithCountResponse = CategoryRow & {
    character_count: [{ count: number }];
};

export type CharacterWithTranslationsResponse =
    CharacterRow & {
        translations: CharacterTranslationRow[];
    };

export type CharacterWithCategoryAndTranslationsResponse =
    CharacterRow & {
        translations: CharacterTranslationRow[];
        category: CategoryRow & {
            translations: CategoryTranslationRow[];
        };
    };

export type MediaResponse = {
    data: string | null;
    error: string | null;
    contentType: string | null;
};

export type CategoriesResponse = {
    categoryIds: string[];
    zustandCategories: {
        name: string;
        characters: string[];
        translations: Partial<
            Record<
                (typeof API_LANGUAGES)[keyof typeof API_LANGUAGES],
                string
            >
        >;
    }[];
};

export type CharactersResponse = {
    characterIds: string[];
    characters: CharacterWithTranslationsResponse[];
};

// Add new type aliases after all the existing exports
export type GetCurrentContentSettingsResponse =
    Database['content_data']['Functions']['get_current_content_settings']['Returns'];

// Type for successful createSession data
export type CreateSessionSuccessData = {
    id: string;
    created_at: string;
};

// Type for the full createSession response including potential error
export type CreateSessionResponse = {
    data: CreateSessionSuccessData | null;
    error:
        | import('@supabase/supabase-js').PostgrestError
        | null;
};

// Type for the sessions query response
export type GetSessionsResponse = {
    hasMore: boolean;
    sessionIds: string[];
    sessions: import('@/types/session').TChatSession[];
    cursor: {
        id: string | null;
        activityRank: string | null;
    } | null;
};
