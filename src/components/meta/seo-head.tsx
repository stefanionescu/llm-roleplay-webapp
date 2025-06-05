// TODO: Add the correct metadata

import type { Metadata } from 'next';

// Consolidated metadata
// This defines metadata that applies to the entire application
// Next.js uses this to generate proper HTML metadata tags for SEO
export const metadata: Metadata = {
    // Set the base URL for relative URLs in metadata
    // This ensures all URLs are properly resolved
    metadataBase: new URL(''),
    // Set the document title that appears in browser tabs
    title: '',
    // Set the meta description for search engines
    // This appears in search results and is important for SEO
    description:
        'Chat with fun characters about your favorite topics.',
    // Set keywords for search engines
    // These help with SEO but have diminished importance in modern search algorithms
    keywords:
        'AI chat, AI roleplay, LLM, characters, gpt, university, student, chatgpt, roleplay',
    // Set the author information
    // This indicates who created the content
    authors: [{ name: '' }],
    // Set the creator metadata
    // Similar to author but can be used for different attribution purposes
    creator: '',
    // Set the publisher information
    // Indicates the organization that published the content
    publisher: '',
    // Configure robot directives for search engines
    // This controls how search engines should crawl and index the site
    robots: {
        // Allow search engines to index the page
        index: true,
        // Allow search engines to follow links on the page
        follow: true,
        // Specific directives for Google's crawler
        // These provide more fine-grained control over Google specifically
        googleBot: {
            index: true,
            follow: true,
            // Allow full video previews
            'max-video-preview': -1,
            // Allow large image previews in search results
            'max-image-preview': 'large',
            // Allow full snippet length in search results
            'max-snippet': -1,
        },
    },
    // Set alternate versions of the page
    // This defines the canonical URL to prevent duplicate content issues
    alternates: {
        canonical: '',
    },
    // Open Graph metadata for social sharing (Facebook, LinkedIn, etc.)
    openGraph: {
        title: '',
        description:
            'Chat with fun characters about your favorite topics.',
        url: '',
        siteName: '',
        images: [
            {
                url: '/opengraph-image.png', // Must be an absolute URL or relative path from /public
                width: 1200, // Recommended size
                height: 630, // Recommended size
                alt: '',
            },
        ],
        type: 'website',
    },
    // Twitter Card metadata for Twitter sharing
    twitter: {
        card: 'summary_large_image', // Type of card ('summary', 'summary_large_image', 'app', 'player')
        title: '',
        description:
            'Chat with fun characters about your favorite topics.',
        images: ['/twitter-image.png'], // Must be an absolute URL or relative path from /public
    },
    // Link to the Web App Manifest
    manifest: '/manifest.json',
    // Apple touch icon for iOS home screen
    icons: {
        apple: '/apple-touch-icon.png',
    },
    // Apple Web App configuration
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: '',
    },
};
