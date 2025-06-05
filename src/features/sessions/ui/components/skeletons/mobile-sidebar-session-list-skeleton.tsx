import { Skeleton } from '@/components/ui/skeleton';

export const MobileSidebarSessionListSkeleton = () => {
    return (
        <div className="mt-2 flex size-full flex-col px-4">
            <div
                className="no-scrollbar flex-1 overflow-y-auto"
                style={{ WebkitOverflowScrolling: 'auto' }}
            >
                {Array.from({ length: 6 }).map(
                    (_, index) => (
                        <div key={index} className="mb-2">
                            <Skeleton className="h-16 w-full rounded-xl bg-gray-700/50" />
                        </div>
                    ),
                )}
            </div>
        </div>
    );
};
