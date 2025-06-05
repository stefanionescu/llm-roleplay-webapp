import { cn } from '@/lib/utils/shad';
import { Flex } from '@/components/ui/flex';
import { Skeleton } from '@/components/ui/skeleton';

export const InputSectionSkeleton = () => {
    const chatInputBackgroundContainer = cn(
        'flex w-full flex-col items-center justify-center',
        'min-h-fit',
        'z-10',
        'bg-background',
        'md:w-full',
        'input-section',
    );

    const innerContainer = cn(
        'flex w-full max-w-[800px] flex-col items-center justify-center px-4',
    );

    const editorContainerClass = cn(
        'no-scrollbar wysiwyg max-h-[104px] min-h-[92px] w-full overflow-y-auto outline-none focus:outline-none',
        '[&>*]:leading-5 [&>*]:outline-none',
        '[&_.ProseMirror]:flex [&_.ProseMirror]:h-[48px] [&_.ProseMirror]:items-start',
        '[&_.ProseMirror]:py-[14px] [&_.ProseMirror]:pr-2',
        '[&_.ProseMirror_p:first-child:last-child]:my-auto',
        '[&_.ProseMirror_p]:overflow-wrap-break-word [&_.ProseMirror_p]:whitespace-pre-wrap',
        '[&_.ProseMirror_p]:hyphens-auto [&_.ProseMirror_p]:break-words',
        '[&_.ProseMirror]:transition-all [&_.ProseMirror]:duration-200',
    );

    return (
        <div className={chatInputBackgroundContainer}>
            <div className={innerContainer}>
                <div className="mb-1 mt-2 flex h-[32px] items-center justify-center py-2">
                    <Skeleton className="flex h-6 min-w-6 items-center justify-center rounded-full" />
                </div>

                <div className="flex w-full flex-col justify-center">
                    <div className="mx-auto h-4 w-full max-w-[500px]">
                        <Skeleton className="size-full rounded-md" />
                    </div>
                </div>

                <div className="mb-2 mt-4 flex w-full flex-wrap justify-center gap-1 gap-y-2">
                    <Skeleton className="flex h-7 min-w-[96px] items-center justify-center rounded-full" />
                    <Skeleton className="flex h-7 min-w-[128px] items-center justify-center rounded-full" />
                    <Skeleton className="flex h-7 min-w-[112px] items-center justify-center rounded-full" />
                </div>

                <div
                    className="relative mt-2 flex w-full shrink-0 overflow-hidden rounded-xl"
                    style={{
                        paddingBottom:
                            'env(safe-area-inset-bottom, 0px)',
                        marginBottom:
                            'env(safe-area-inset-bottom, 0px)',
                    }}
                >
                    <Flex
                        direction="col"
                        className="w-full rounded-lg"
                    >
                        <Flex className="relative flex w-full flex-row items-end gap-2">
                            <div className="flex-1 overflow-hidden">
                                <Skeleton
                                    className={
                                        editorContainerClass
                                    }
                                />
                            </div>
                        </Flex>
                    </Flex>
                </div>

                <Flex
                    className="mb-1 w-full px-4 py-2"
                    justify="center"
                    gap="xs"
                >
                    <div className="h-3 w-[200px]">
                        <Skeleton className="size-full rounded-md" />
                    </div>
                </Flex>
            </div>
        </div>
    );
};
