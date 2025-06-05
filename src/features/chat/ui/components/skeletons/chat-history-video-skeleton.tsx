import { Flex } from '@/components/ui/flex';
import { Skeleton } from '@/components/ui/skeleton';
import { useVideoSize } from '@/hooks/ui/use-video-size';

export const ChatHistoryVideoSkeleton = () => {
    const orientation = useVideoSize();

    return (
        <div className="w-full border-t border-zinc-500/10">
            <div className="flex flex-row">
                <div className="mt-4 size-6">
                    <Skeleton
                        className="size-6 py-2"
                        borderRadius="9999px"
                    />
                </div>
                <div className="ml-2 mt-4 w-[120px]">
                    <Skeleton className="h-4 w-[120px] shrink-0" />
                </div>
            </div>

            <Flex
                gap="sm"
                className="no-scrollbar mt-2 flex w-full flex-row flex-nowrap justify-start"
                items="stretch"
            >
                <div
                    className={`${
                        (orientation.hasNonPhoneSpecialRatio ||
                            orientation.isMediumSquare) &&
                        !orientation.forcesSmallerVideoHeight &&
                        !orientation.forcesBiggerVideoHeight
                            ? 'max-lg:h-[570px] max-lg:w-[321px] max-md:h-[570px] max-md:w-[321px] max-sm:h-[317px] max-sm:w-[179px] sm:h-[431px] sm:w-[242px] md:h-[600px] md:w-[338px] lg:h-[566px] lg:w-[318px]'
                            : 'max-lg:h-[566px] max-lg:w-[318px] max-md:h-[566px] max-md:w-[318px] max-sm:h-[314px] max-sm:w-[176px] lg:h-[566px] lg:w-[318px]'
                    } shrink-0 rounded-md`}
                >
                    <Skeleton className="size-full rounded-md" />
                </div>
            </Flex>
        </div>
    );
};
