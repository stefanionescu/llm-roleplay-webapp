import { useEffect, useState } from 'react';

export function useWindowWidth() {
    const [windowWidth, setWindowWidth] = useState<number>(
        typeof window !== 'undefined'
            ? window.innerWidth
            : 0,
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        // Call handler right away so state gets updated with initial window size
        handleResize();

        // Remove event listener on cleanup
        return () =>
            window.removeEventListener(
                'resize',
                handleResize,
            );
    }, []); // Empty array ensures that effect is only run on mount and unmount

    return windowWidth;
}
