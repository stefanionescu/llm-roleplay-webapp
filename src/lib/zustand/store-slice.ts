import { StateCreator } from 'zustand';

import { Store } from '@/types/zustand';

/**
 * Generic type for creating Zustand slices within this application.
 * Ensures consistent typing for `set`, `get`, and middleware compatibility.
 * @template T The specific slice type (e.g., AppSlice, ChatSessionsSlice).
 */
export type StoreSlice<T> = StateCreator<
    Store,
    [['zustand/immer', never]], // Specify immer middleware usage
    [], // No additional middleware groups
    T // The specific slice being created
>;
