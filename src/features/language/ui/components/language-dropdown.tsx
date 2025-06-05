'use client';

import { toast } from 'react-hot-toast';
import { useLocale, useTranslations } from 'next-intl';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { cn } from '@/lib/utils/shad';
import { setLanguage } from '@/actions/set-language';
import { MemoDropdownContent } from '@/components/custom/memo/memo-dropdown-content';
import {
    countryCodeToApiLanguage,
    Language,
    SUPPORTED_LANGUAGES,
} from '@/config/language';

import { LanguageDropdownItems } from './language-dropdown-items';

export const LanguageDropdown = ({
    zIndex,
}: {
    zIndex?: string;
}) => {
    const currentLocale = useLocale();
    const t = useTranslations('error');

    const [loadingLangCode, setLoadingLangCode] = useState<
        string | null
    >(null);
    const previousLocaleRef = useRef<string | null>(null);

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        const prevLocale = previousLocaleRef.current;
        if (
            prevLocale !== null &&
            prevLocale !== currentLocale &&
            loadingLangCode
        ) {
            const targetApiLanguage =
                countryCodeToApiLanguage[loadingLangCode];
            if (targetApiLanguage === currentLocale) {
                setLoadingLangCode(null);
            }
        }
        previousLocaleRef.current = currentLocale;
    }, [currentLocale, loadingLangCode]);

    const handleLanguageSelect = useCallback(
        async (code: string) => {
            const apiLanguage =
                countryCodeToApiLanguage[code];
            if (
                apiLanguage &&
                apiLanguage !== currentLocale &&
                !loadingLangCode
            ) {
                setLoadingLangCode(code);
                try {
                    await setLanguage(apiLanguage);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
                } catch (error) {
                    toast.error(t('failedSetLanguage'));
                    setLoadingLangCode(null);
                }
            }
        },
        [currentLocale, loadingLangCode],
    );
    /* eslint-enable react-hooks/exhaustive-deps */

    const { currentLanguage, otherLanguages } =
        useMemo(() => {
            const current = SUPPORTED_LANGUAGES.find(
                (lang) =>
                    countryCodeToApiLanguage[lang.code] ===
                    currentLocale,
            );

            const others = SUPPORTED_LANGUAGES.filter(
                (lang) =>
                    countryCodeToApiLanguage[lang.code] !==
                    currentLocale,
            ).sort((a, b) => a.code.localeCompare(b.code));

            const typedCurrentLanguage:
                | Language
                | undefined = current;

            return {
                currentLanguage: typedCurrentLanguage,
                otherLanguages: others,
            };
        }, [currentLocale]);

    if (!currentLanguage) return null;

    return (
        <MemoDropdownContent
            className={cn(
                'mb-2 space-y-2 overflow-hidden border border-white/10 bg-zinc-700 max-md:min-w-[6rem] md:max-w-[10rem]',
                zIndex,
            )}
            align="start"
            side="right"
            sideOffset={8}
        >
            <LanguageDropdownItems
                currentLanguage={currentLanguage}
                otherLanguages={otherLanguages}
                handleLanguageSelect={handleLanguageSelect}
                currentLocale={currentLocale}
                loadingCode={loadingLangCode}
            />
        </MemoDropdownContent>
    );
};
