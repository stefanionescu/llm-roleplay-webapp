import { Flex } from '@/components/ui/flex';
import { Skeleton } from '@/components/ui/skeleton';

export const ChatHistoryTextSkeleton = () => {
    return (
        <>
            <div className="mb-4 flex w-full gap-x-3">
                <div className="size-12 shrink-0 overflow-hidden">
                    <Skeleton
                        className="size-full py-2"
                        borderRadius="9999px"
                    />
                </div>

                <Flex
                    direction="col"
                    gap="md"
                    items="start"
                    className="overflow-hide min-w-0 grow"
                >
                    <div className="h-4 w-32">
                        <Skeleton className="size-full rounded-md" />
                    </div>

                    <div className="flex w-full flex-col gap-1">
                        <div style={{ width: '100%' }}>
                            <Skeleton className="h-4 w-full rounded-md" />
                        </div>
                        <div style={{ width: '90%' }}>
                            <Skeleton className="h-4 w-full rounded-md" />
                        </div>
                        <div style={{ width: '95%' }}>
                            <Skeleton className="h-4 w-full rounded-md" />
                        </div>
                        <div style={{ width: '85%' }}>
                            <Skeleton className="h-4 w-full rounded-md" />
                        </div>
                        <div style={{ width: '75%' }}>
                            <Skeleton className="h-4 w-full rounded-md" />
                        </div>
                    </div>

                    <div className="w-[80px]">
                        <Skeleton className="h-[32px] w-full" />
                    </div>
                </Flex>
            </div>
        </>
    );
};
