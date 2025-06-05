'use client';

import { cn } from '@/lib/utils/shad';

type SessionsSidebarBackdropProps = {
    isCollapsed: boolean;
    collapse: () => void;
};

export const SessionsSidebarBackdrop = ({
    isCollapsed,
    collapse,
}: SessionsSidebarBackdropProps) => {
    return (
        <div
            onClick={collapse}
            className={cn(
                'fixed inset-0 z-[900] bg-black/30 transition-opacity duration-300 ease-in-out',
                isCollapsed
                    ? 'pointer-events-none opacity-0'
                    : 'opacity-100',
            )}
        />
    );
};
