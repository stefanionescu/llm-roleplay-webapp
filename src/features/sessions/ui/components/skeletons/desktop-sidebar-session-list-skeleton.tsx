import { ElementRef } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { SessionsListContent } from '@/features/sessions/ui/components/desktop/sessions-list-content';

type DesktopSidebarSessionListSkeletonProps = {
    isCollapsed: boolean;
    collapse: () => void;
    sidebarRef: React.RefObject<ElementRef<'aside'>>;
};

export const DesktopSidebarSessionListSkeleton = ({
    isCollapsed,
    collapse,
    sidebarRef,
}: DesktopSidebarSessionListSkeletonProps) => {
    return (
        <SessionsListContent
            isCollapsed={isCollapsed}
            collapse={collapse}
            sidebarRef={sidebarRef}
            errorFetchingData
        >
            <div className="flex size-full flex-col">
                <div
                    className="no-scrollbar flex-1 overflow-y-auto"
                    style={{
                        WebkitOverflowScrolling: 'auto',
                    }}
                >
                    {Array.from({ length: 6 }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="mb-2"
                            >
                                <Skeleton className="h-16 w-full rounded-xl bg-gray-700/50" />
                            </div>
                        ),
                    )}
                </div>
            </div>
        </SessionsListContent>
    );
};
