import './globals.css';
import '@/components/meta/flag-prefetcher';

import type { Viewport } from 'next';
import { Baloo_2 } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';

import { TRPCProvider } from '@/trpc/client';
import { MuteProvider } from '@/lib/context/mute';
import { PWAHead } from '@/components/meta/pwa-head';
import { metadata } from '@/components/meta/seo-head';
import { DevTools } from '@/components/meta/dev-tools';
import { HotToaster } from '@/components/ui/hot-toaster';
import { MixpanelProvider } from '@/lib/context/mixpanel';
import { MixpanelHead } from '@/components/meta/mixpanel-head';
import { TranslateProtection } from '@/components/meta/translate-protection';
import { SidebarLayout } from '@/features/sidebar/ui/layouts/sidebar-layout';

// Define viewport configuration separately
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

// Metadata
export { metadata };

// Main font
const baloo2 = Baloo_2({
    subsets: ['latin'],
    variable: '--font-baloo2',
    weight: ['400', '500', '600', '700', '800'],
});

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();

    return (
        <html
            lang={locale}
            className={`${baloo2.variable}`}
        >
            <head>
                {/* Make sure you comment the devtools when doing Lighthouse tests */}
                <DevTools />
                <PWAHead />
                <MixpanelHead />
                <TranslateProtection />
            </head>
            <body className="antialiased" translate="no">
                <NextIntlClientProvider>
                    <TRPCProvider>
                        <MixpanelProvider>
                            <SidebarLayout>
                                <MuteProvider>
                                    {children}
                                </MuteProvider>
                            </SidebarLayout>
                            <HotToaster />
                        </MixpanelProvider>
                    </TRPCProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
