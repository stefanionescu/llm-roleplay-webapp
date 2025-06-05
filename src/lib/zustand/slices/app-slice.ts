import { AppSlice, TApp } from '@/types/app';
import { StoreSlice } from '@/lib/zustand/store-slice';

const initialState: TApp = {
    activeCategory: undefined,
    toggledMessage: undefined,
    isPreparingToGenerate: false,
    isGenerating: false,
    isDoingRAG: false,
    isCheckingRAGUsage: false,
    isSidebarCollapsed: true,
    isSidebarFlagsPreloaded: false,
    isFeedbackOpen: false,
    abortController: undefined,
    maxMessagesPerSession: 0,
    maxSessions: 0,
    newSessions: new Map(),
};

export const createAppSlice: StoreSlice<AppSlice> = (
    set,
    get,
) => ({
    ...initialState,
    setActiveCategory: (
        activeCategory: string | undefined,
    ) => set({ activeCategory }),
    setIsPreparingToGenerate: (
        isPreparingToGenerate: boolean,
    ) => set({ isPreparingToGenerate }),
    setIsGenerating: (isGenerating: boolean) =>
        set({ isGenerating }),
    setIsDoingRAG: (isDoingRAG: boolean) =>
        set({ isDoingRAG }),
    setIsCheckingRAGUsage: (isCheckingRAGUsage: boolean) =>
        set({ isCheckingRAGUsage }),
    setIsSidebarCollapsed: (isSidebarCollapsed: boolean) =>
        set({ isSidebarCollapsed }),
    setIsFeedbackOpen: (isFeedbackOpen: boolean) =>
        set({ isFeedbackOpen }),
    setAbortController: (
        abortController: AbortController | undefined,
    ) => set({ abortController }),
    setToggledMessage: (
        toggledMessage: string | undefined,
    ) => set({ toggledMessage }),
    cancelAbortController: () => {
        get().abortController?.abort('cancel');
    },
    cleanAppState: () => {
        set({
            isPreparingToGenerate: false,
            isGenerating: false,
            isDoingRAG: false,
            isCheckingRAGUsage: false,
            abortController: undefined,
            toggledMessage: undefined,
        });
    },
    setMaxMessagesPerSession: (
        maxMessagesPerSession: number,
    ) => set({ maxMessagesPerSession }),
    setMaxSessions: (maxSessions: number) =>
        set({ maxSessions }),
    setIsNewSession: (
        characterId: string,
        isNew: boolean,
    ) =>
        set((state) => {
            state.newSessions.set(characterId, isNew);
        }),
    isNewSession: (characterId: string) => {
        const isNew = get().newSessions.get(characterId);
        return isNew === true;
    },
});
