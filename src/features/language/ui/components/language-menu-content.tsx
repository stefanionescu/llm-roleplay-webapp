import { useShallow } from 'zustand/react/shallow';

import { useStore } from '@/lib/zustand/store';
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { LanguageButton } from './language-button';
import { LanguageDropdown } from './language-dropdown';

export const LanguageMenuContent = () => {
    const {
        isGenerating,
        isDoingRAG,
        isCheckingRAGUsage,
        isPreparingToGenerate,
    } = useStore(
        useShallow((state) => ({
            isPreparingToGenerate:
                state.isPreparingToGenerate,
            isDoingRAG: state.isDoingRAG,
            isCheckingRAGUsage: state.isCheckingRAGUsage,
            isGenerating: state.isPreparingToGenerate,
        })),
    );

    const isDoingRAGOrInference =
        isPreparingToGenerate ||
        isDoingRAG ||
        isCheckingRAGUsage ||
        isPreparingToGenerate ||
        isGenerating;

    return (
        <>
            <DropdownMenuTrigger
                asChild
                disabled={isDoingRAGOrInference}
            >
                <LanguageButton />
            </DropdownMenuTrigger>
            <LanguageDropdown />
        </>
    );
};
