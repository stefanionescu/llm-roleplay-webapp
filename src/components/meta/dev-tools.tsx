import Script from 'next/script';

export function DevTools() {
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <Script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
            strategy="lazyOnload"
        />
    );
}
