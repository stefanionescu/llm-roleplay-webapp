import React, { useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import ReactCountryFlag from 'react-country-flag';
import {
    Loading03Icon,
    Tick02Icon,
} from '@hugeicons/core-free-icons';

import { cn } from '@/lib/utils/shad';
import { Language } from '@/config/language';
import { MemoButton } from '@/components/custom/memo/memo-button';

type LanguageDropdownItemProps = {
    lang: Language;
    currentLocale: string;
    loadingCode: string | null;
    isCurrentLanguage?: boolean;
    handleLanguageSelect: (code: string) => void;
};

export const LanguageDropdownItem = React.memo(
    ({
        lang,
        handleLanguageSelect,
        isCurrentLanguage = false,
        loadingCode,
    }: LanguageDropdownItemProps) => {
        const isLoading = loadingCode === lang.code;

        const onClick = useCallback(() => {
            if (isCurrentLanguage || isLoading) return;
            handleLanguageSelect(lang.code);
        }, [
            handleLanguageSelect,
            lang.code,
            isCurrentLanguage,
            isLoading,
        ]);

        let iconToShow = null;
        if (isLoading) {
            iconToShow = Loading03Icon;
        } else if (isCurrentLanguage) {
            iconToShow = Tick02Icon;
        }

        return (
            <MemoButton
                onClick={onClick}
                disabled={isLoading}
                className={cn(
                    'relative flex w-full cursor-pointer select-none items-center gap-3 rounded-xl px-2 py-2 text-xs font-medium outline-none transition-colors md:text-sm',
                    isLoading
                        ? 'cursor-not-allowed opacity-50'
                        : '',
                )}
            >
                <ReactCountryFlag
                    countryCode={lang.countryCode}
                    className="shrink-0"
                    svg
                />

                <span className="text-sm">{lang.code}</span>

                {iconToShow && (
                    <HugeiconsIcon
                        icon={iconToShow}
                        className={cn(
                            `ml-auto shrink-0 size-menu-icon-desktop`,
                            { 'animate-spin': isLoading },
                        )}
                    />
                )}
            </MemoButton>
        );
    },
);

LanguageDropdownItem.displayName = 'LanguageDropdownItem';
