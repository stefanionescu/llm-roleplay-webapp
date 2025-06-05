import { Flex } from '@/components/ui/flex';
import { Skeleton } from '@/components/ui/skeleton';

export const CharacterInfoSkeleton = () => {
    return (
        <Flex
            justify="start"
            items="center"
            direction="col"
            gap="md"
            className={'w-full md:pt-8'}
        >
            <div className="h-7 w-20">
                <Skeleton
                    className="h-7 w-20 py-1"
                    borderRadius="9999px"
                />
            </div>

            <div className="relative size-32 self-center overflow-hidden rounded-full md:size-36">
                <Skeleton className="size-full pt-1" />
            </div>

            <Flex
                direction="col"
                gap="xs"
                items="center"
                justify="center"
            >
                <div className="mb-1 w-32 px-4 max-md:h-4 md:h-6">
                    <Skeleton className="size-full rounded-md" />
                </div>

                <div className="mt-1 flex w-[300px] max-w-full flex-col gap-1">
                    <Skeleton className="h-3 w-full rounded-md md:h-3.5" />
                </div>

                <div className="my-2 h-4 w-48 md:h-6">
                    <Skeleton className="size-full rounded-full" />
                </div>
            </Flex>
        </Flex>
    );
};
