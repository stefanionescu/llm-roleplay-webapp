import { create } from 'zustand';
import { enableMapSet } from 'immer';
import { immer } from 'zustand/middleware/immer';
import {
    devtools,
    subscribeWithSelector,
} from 'zustand/middleware';

import { Store } from '@/types/zustand';

import { createAppSlice } from './slices/app-slice';
import { createAuthSlice } from './slices/auth-slice';
import { createCategoriesSlice } from './slices/categories-slice';
import { createCharactersSlice } from './slices/characters-slice';
import { createChatSessionsSlice } from './slices/chat-sessions-slice';
import { createChatHistoriesSlice } from './slices/chat-histories-slice';

// Enable the MapSet plugin for Immer
enableMapSet();

export const useStore = create<Store>()(
    devtools(
        subscribeWithSelector(
            immer((...a) => ({
                ...createAppSlice(...a),
                ...createAuthSlice(...a),
                ...createChatSessionsSlice(...a),
                ...createCategoriesSlice(...a),
                ...createCharactersSlice(...a),
                ...createChatHistoriesSlice(...a),
            })),
        ),
    ),
);
