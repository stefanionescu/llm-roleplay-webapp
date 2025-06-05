'use client';

import { usePathname } from 'next/navigation';
import {
    createContext,
    useContext,
    useState,
    useEffect,
} from 'react';

type MuteContextType = {
    isReload: boolean;
};

const MuteContext = createContext<
    MuteContextType | undefined
>(undefined);

export function MuteProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [lastPath, setLastPath] = useState<string | null>(
        null,
    );
    const [isReload, setIsReload] = useState(true);

    /* eslint-disable unused-imports/no-unused-vars, react-hooks/exhaustive-deps */
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const currentPath = pathname;

                if (!lastPath) {
                    setIsReload(true);
                } else if (lastPath !== currentPath) {
                    setIsReload(false);
                } else {
                    setIsReload(true);
                }

                setLastPath(currentPath);
            }
        } catch (error) {
            setIsReload(true);
        }
    }, [pathname]);
    /* eslint-enable unused-imports/no-unused-vars, react-hooks/exhaustive-deps */

    return (
        <MuteContext.Provider value={{ isReload }}>
            {children}
        </MuteContext.Provider>
    );
}

export function useMute() {
    const context = useContext(MuteContext);

    if (context === undefined) {
        throw new Error(
            'useMute must be used within a MuteProvider',
        );
    }

    return context;
}
