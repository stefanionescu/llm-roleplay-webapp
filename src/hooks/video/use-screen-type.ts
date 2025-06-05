import { useState, useEffect } from 'react';

import { VIDEO_CONFIG } from '@/config/video';

export type ScreenType = 'small' | 'medium' | 'large';

/**
 * Hook to determine screen type based on viewport width
 * Returns screen type with proper SSR handling
 */
export function useScreenType(): ScreenType {
    // Default to 'large' for SSR, will update client-side
    const [screenType, setScreenType] =
        useState<ScreenType>('large');

    useEffect(() => {
        // Ensure this only runs on the client
        if (typeof window === 'undefined') return;

        const checkScreenSize = () => {
            const width = window.innerWidth;
            if (width < VIDEO_CONFIG.MOBILE_BREAKPOINT) {
                // Tailwind 'md' breakpoint
                setScreenType('small');
            } else if (
                width < VIDEO_CONFIG.TABLET_BREAKPOINT
            ) {
                // Tailwind 'lg' breakpoint
                setScreenType('medium');
            } else {
                setScreenType('large');
            }
        };

        // Initial check
        checkScreenSize();

        // Add event listener
        window.addEventListener('resize', checkScreenSize);

        // Cleanup
        return () =>
            window.removeEventListener(
                'resize',
                checkScreenSize,
            );
    }, []); // Empty dependency array ensures this runs once on mount client-side

    return screenType;
}
