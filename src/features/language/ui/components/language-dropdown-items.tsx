import { memo } from 'react';

import { Language } from '@/config/language';

import { LanguageDropdownItem } from './language-dropdown-item';

export const LanguageDropdownItems = memo(
    ({
        currentLanguage,
        otherLanguages,
        handleLanguageSelect,
        currentLocale,
        loadingCode,
    }: {
        currentLocale: string;
        currentLanguage: Language;
        otherLanguages: Language[];
        loadingCode: string | null;
        handleLanguageSelect: (
            code: string,
        ) => Promise<void>;
    }) => (
        <>
            <LanguageDropdownItem
                lang={currentLanguage}
                handleLanguageSelect={handleLanguageSelect}
                currentLocale={currentLocale}
                isCurrentLanguage
                loadingCode={loadingCode}
            />
            {otherLanguages.map((lang) => (
                <LanguageDropdownItem
                    key={lang.code}
                    lang={lang}
                    handleLanguageSelect={
                        handleLanguageSelect
                    }
                    currentLocale={currentLocale}
                    loadingCode={loadingCode}
                />
            ))}
        </>
    ),
);

LanguageDropdownItems.displayName = 'LanguageDropdownItems';
