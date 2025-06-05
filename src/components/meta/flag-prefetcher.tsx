'use client';

import { links } from '@/config/links';
import { SUPPORTED_LANGUAGES } from '@/config/language';

// Prefetch all flag SVGs with simple fetch calls
SUPPORTED_LANGUAGES.forEach((lang) => {
    const flagUrl = `${links.flags}${lang.countryCode}.svg`;
    void fetch(flagUrl);
});
