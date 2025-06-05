import withPWA from 'next-pwa';
import createNextIntlPlugin from 'next-intl/plugin';
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
});

const withNextIntl = createNextIntlPlugin(
    './src/lib/i18n/request.ts',
);

// Define security headers
const securityHeaders = [
    {
        key: 'Strict-Transport-Security',
        // Production HSTS: 2 years max-age + preload. ENSURE ALL SUBDOMAINS ARE HTTPS.
        value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
        key: 'X-Frame-Options',
        value: 'DENY',
    },
    {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin',
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()', // Deny common sensitive APIs
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
];

/** @type {import('next').NextConfig} */
const baseConfig = {
    // Add the async headers function
    async headers() {
        return [
            {
                source: '/:path*',
                headers: securityHeaders,
            },
        ];
    },
    images: {
        remotePatterns: [
            { hostname: '' }, // TODO: Add the backend hostname
        ],
    },
    swcMinify: true,
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals = [
                ...config.externals,
                'sharp',
                'pdfjs-dist',
                '@mozilla/readability',
                'jsdom',
                'pdf-parse',
                'posthog-js',
                'react-player',
                'framer-motion',
            ];
        }
        return config;
    },
    env: {
        API_ENDPOINT: process.env.API_ENDPOINT,
        INFERENCE_ENDPOINT:
            process.env.INFERENCE_ENDPOINT,
        API_KEY: process.env.API_KEY,
        INFERENCE_KEY: process.env.INFERENCE_KEY,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
    },
};

const withPWAConfig = withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
        {
            urlPattern:
                /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'google-fonts',
                expiration: {
                    maxEntries: 4,
                    maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
                },
            },
        },
        {
            urlPattern: /^\/_next\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'next-static-assets',
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
            },
        },
        {
            urlPattern:
                /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'image-assets',
                expiration: {
                    maxEntries: 128,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
            },
        },
    ],
});

if (process.env.NODE_ENV === 'development') {
    await setupDevPlatform();
}

// Compose the plugins, wrapping with withBundleAnalyzer
export default bundleAnalyzer(
    withNextIntl(withPWAConfig(baseConfig)),
);
