export type Language = {
    code: string;
    countryCode: string;
};

export const SUPPORTED_LANGUAGES: Language[] = [
    { code: 'EN', countryCode: 'US' },
    { code: 'DE', countryCode: 'DE' },
    { code: 'ES', countryCode: 'ES' },
    { code: 'FR', countryCode: 'FR' },
    { code: 'HI', countryCode: 'IN' },
    { code: 'IT', countryCode: 'IT' },
    { code: 'PT', countryCode: 'PT' },
    { code: 'TH', countryCode: 'TH' },
];

export const API_LANGUAGES = {
    ENGLISH: 'en',
    FRENCH: 'fr',
    SPANISH: 'es',
    PORTUGUESE: 'pt',
    ITALIAN: 'it',
    GERMAN: 'de',
    HINDI: 'hi',
    THAI: 'th',
};

export const countryCodeToApiLanguage: Record<
    string,
    string
> = {
    EN: API_LANGUAGES.ENGLISH,
    ES: API_LANGUAGES.SPANISH,
    DE: API_LANGUAGES.GERMAN,
    FR: API_LANGUAGES.FRENCH,
    HI: API_LANGUAGES.HINDI,
    IT: API_LANGUAGES.ITALIAN,
    PT: API_LANGUAGES.PORTUGUESE,
    TH: API_LANGUAGES.THAI,
};
