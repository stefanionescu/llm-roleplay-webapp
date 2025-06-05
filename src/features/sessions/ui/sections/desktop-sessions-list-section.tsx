'use client';

import { ElementRef, useCallback, useRef } from 'react';

import { useSessionsData } from '@/hooks/data/use-sessions-data';
import { SessionsList } from '@/features/sessions/ui/components/shared/sessions-list';
import { SessionsListContent } from '@/features/sessions/ui/components/desktop/sessions-list-content';
import { SessionsSidebarBackdrop } from '@/features/sessions/ui/components/desktop/sessions-sidebar-backdrop';
import { DesktopSidebarSessionListSkeleton } from '@/features/sessions/ui/components/skeletons/desktop-sidebar-session-list-skeleton';

type DesktopSessionsListSectionProps = {
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
};

export const DesktopSessionsListSection = ({
    isOpen = false,
    onOpenChange,
}: DesktopSessionsListSectionProps) => {
    const sidebarRef = useRef<ElementRef<'aside'>>(null);

    const { success, error } = useSessionsData(!isOpen);

    const collapse = useCallback(() => {
        onOpenChange?.(false);
    }, [onOpenChange]);

    return (
        <>
            <SessionsSidebarBackdrop
                isCollapsed={!isOpen}
                collapse={collapse}
            />

            {!success && !error ? (
                <DesktopSidebarSessionListSkeleton
                    sidebarRef={sidebarRef}
                    isCollapsed={!isOpen}
                    collapse={collapse}
                />
            ) : (
                <SessionsListContent
                    sidebarRef={sidebarRef}
                    isCollapsed={!isOpen}
                    collapse={collapse}
                    errorFetchingData={!!error}
                >
                    <SessionsList
                        showTopTag={false}
                        errorFetchingData={!!error}
                        showEmptyState
                    />
                </SessionsListContent>
            )}
        </>
    );
};
