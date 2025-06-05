import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { useShallow } from 'zustand/react/shallow';
import { LanguageSkillIcon } from '@hugeicons/core-free-icons';

import { useStore } from '@/lib/zustand/store';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LanguageDropdown } from '@/features/language/ui/components/language-dropdown';

export const MobileSidebarLanguageButton = () => {
    const t = useTranslations();

    const {
        isPreparingToGenerate,
        isDoingRAG,
        isCheckingRAGUsage,
        isGenerating,
    } = useStore(
        useShallow((state) => ({
            isPreparingToGenerate:
                state.isPreparingToGenerate,
            isDoingRAG: state.isDoingRAG,
            isCheckingRAGUsage: state.isCheckingRAGUsage,
            isGenerating: state.isGenerating,
        })),
    );

    const isDoingRAGOrInference =
        isPreparingToGenerate ||
        isDoingRAG ||
        isCheckingRAGUsage ||
        isGenerating;

    return (
        <DropdownMenu
            open={isDoingRAGOrInference ? false : undefined}
        >
            <DropdownMenuTrigger
                disabled={isDoingRAGOrInference}
                asChild
            >
                <button
                    type="button"
                    disabled={isDoingRAGOrInference}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg p-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:bg-primary/10 md:hover:bg-primary/5`}
                    aria-label={t('common.language')}
                >
                    <div className="flex items-center pl-2">
                        <HugeiconsIcon
                            icon={LanguageSkillIcon}
                            className="mr-2 size-5"
                            fontVariant="stroke"
                            aria-hidden="true"
                        />
                        <span className="text-sm">
                            {t('common.language')}
                        </span>
                    </div>
                </button>
            </DropdownMenuTrigger>
            <LanguageDropdown zIndex="z-[100001]" />
        </DropdownMenu>
    );
};
