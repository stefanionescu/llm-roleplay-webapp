import Negotiator from 'negotiator';
import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { match as matchLocale } from '@formatjs/intl-localematcher';

import { API_LANGUAGES } from '@/config/language';

// Define supported locales and default locale
const locales = Object.values(API_LANGUAGES);
const defaultLocale = API_LANGUAGES.ENGLISH;

function getLocaleFromHeaders(): string {
    const acceptLanguage = headers().get('accept-language');
    if (!acceptLanguage) return defaultLocale;

    const languages = new Negotiator({
        headers: { 'accept-language': acceptLanguage },
    }).languages();

    try {
        return matchLocale(
            languages,
            locales,
            defaultLocale,
        );
        // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (e) {
        return defaultLocale;
    }
}

export default getRequestConfig(async () => {
    // 1. Check cookie
    let locale = cookies().get('llm-roleplay-language')?.value;

    // 2. Check Accept-Language header if cookie is not set or invalid
    if (!locale || !locales.includes(locale)) {
        locale = getLocaleFromHeaders();
    }

    // 3. Fallback to default if locale is still not valid (shouldn't happen with getLocaleFromHeaders)
    if (!locale || !locales.includes(locale)) {
        locale = defaultLocale;
    }

    return {
        locale,
        messages: (
            (await import(
                `./translations/${locale}.json`
            )) as {
                default: Record<string, string>;
            }
        ).default,
    };
});
