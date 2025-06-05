import { AppSlice } from '@/types/app';
import { AuthSlice } from '@/types/auth';
import { CategoriesSlice } from '@/types/category';
import { CharactersSlice } from '@/types/character';
import { ChatSessionsSlice } from '@/types/session';
import { ChatHistoriesSlice } from '@/types/chat-history';

/**
 * Represents the complete state slice for the application.
 */
export type Store = AppSlice &
    ChatSessionsSlice &
    CategoriesSlice &
    CharactersSlice &
    ChatHistoriesSlice &
    AuthSlice;
