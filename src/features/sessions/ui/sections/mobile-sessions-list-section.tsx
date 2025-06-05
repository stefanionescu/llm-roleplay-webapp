import { useSessionsData } from '@/hooks/data/use-sessions-data';

import { SessionsList } from '../components/shared/sessions-list';
import { MobileSidebarSessionListSkeleton } from '../components/skeletons/mobile-sidebar-session-list-skeleton';

type MobileSessionsListSectionProps = {
    isOpen?: boolean;
};

export const MobileSessionsListSection = ({
    isOpen = false,
}: MobileSessionsListSectionProps) => {
    const { success, error } = useSessionsData(!isOpen);

    return (
        <>
            {!success && !error ? (
                <MobileSidebarSessionListSkeleton />
            ) : (
                <div className="no-scrollbar mt-2 flex h-dvh w-full flex-col px-2">
                    <SessionsList
                        showTopTag
                        errorFetchingData={!!error}
                        showEmptyState={false}
                    />
                </div>
            )}
        </>
    );
};
