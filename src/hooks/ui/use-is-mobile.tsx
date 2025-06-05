import { useEffect, useState } from 'react';

export const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Initial check
        checkMobile();

        // Add resize listener
        window.addEventListener('resize', checkMobile);

        // Cleanup
        return () =>
            window.removeEventListener(
                'resize',
                checkMobile,
            );
    }, [breakpoint]);

    return isMobile;
};
