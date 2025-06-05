import { getLocale } from 'next-intl/server';

/**
 * Meta component to protect against Google Translate and other translation services
 * from interfering with React's DOM management, which can cause removeChild errors
 * Also protects brand names from being translated while allowing descriptions to be translated
 */
export const TranslateProtection = async () => {
    const locale = await getLocale();

    return (
        <>
            {/* Protect against translation service DOM interference */}
            <meta name="google" content="notranslate" />
            <meta
                httpEquiv="Content-Language"
                content={locale}
            />

            {/* Protect brand name from translation */}
            <meta
                name="google"
                content="nositelinkssearchbox"
            />

            {/* Additional translation hints */}
            <meta name="translator" content="notranslate" />

            {/* Specific elements to never translate (brand names) */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    /* Protect brand names and titles from translation */
                    title,
                    [property="og:site_name"],
                    [property="og:title"],
                    [property="twitter:title"],
                    .brand-name,
                    .site-title {
                        translate: no !important;
                    }
                `,
                }}
            />
        </>
    );
};
