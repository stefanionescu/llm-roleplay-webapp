import { useQueryClient } from '@tanstack/react-query';
import {
    useEffect,
    useState,
    VideoHTMLAttributes,
    forwardRef,
    useMemo,
} from 'react';

import { trpc } from '@/trpc/client';
import { cn } from '@/lib/utils/shad';
import { Skeleton } from '@/components/ui/skeleton';

type AuthVideoProps = Omit<
    VideoHTMLAttributes<HTMLVideoElement>,
    'src'
> & {
    path: string;
    className?: string;
    onPlay?: (
        event: React.SyntheticEvent<
            HTMLVideoElement,
            Event
        >,
    ) => void;
    onError?: (
        event: React.SyntheticEvent<
            HTMLVideoElement,
            Event
        >,
    ) => void;
    onPause?: (
        event: React.SyntheticEvent<
            HTMLVideoElement,
            Event
        >,
    ) => void;
    onEnded?: (
        event: React.SyntheticEvent<
            HTMLVideoElement,
            Event
        >,
    ) => void;
    onTimeUpdate?: (
        event: React.SyntheticEvent<
            HTMLVideoElement,
            Event
        >,
    ) => void;
    onLoadedMetadata?: (
        event: React.SyntheticEvent<
            HTMLVideoElement,
            Event
        >,
    ) => void;
};

export const AuthVideo = forwardRef<
    HTMLVideoElement,
    AuthVideoProps
>(
    (
        {
            path,
            className,
            onLoadedMetadata,
            onError,
            onPlay,
            onPause,
            onEnded,
            onTimeUpdate,
            ...props
        },
        ref,
    ) => {
        const queryClient = useQueryClient();
        const [
            isInitialCheckLoading,
            setIsInitialCheckLoading,
        ] = useState(true);
        const [videoSrc, setVideoSrc] = useState<
            string | null
        >(null);

        const queryKey = useMemo(
            () => [
                ['media', 'getMedia'],
                { input: path, type: 'query' },
            ],
            [path],
        );

        // Check cache for video source first
        useEffect(() => {
            const cachedData = queryClient.getQueryData<{
                data: string;
            } | null>(queryKey);

            if (cachedData?.data) {
                setVideoSrc(cachedData.data);
            }
            setIsInitialCheckLoading(false);
        }, [path, queryClient, queryKey]);

        // Use TRPC query to fetch video source if not in cache
        const { data: videoData } =
            trpc.media.getMedia.useQuery(path, {
                enabled:
                    !isInitialCheckLoading && !videoSrc, // Only enable if cache check is done and src is not found
                retry: false,
            });

        // Update videoSrc when query data arrives
        useEffect(() => {
            if (videoData?.data) {
                setVideoSrc(videoData.data);
            }
        }, [videoData]);

        const showSkeleton = !videoSrc;

        return (
            <div
                className={cn(
                    'relative size-full rounded-md',
                    className,
                )}
            >
                {showSkeleton && (
                    <Skeleton className="size-full rounded-md" />
                )}

                {videoSrc && (
                    <video
                        ref={ref}
                        src={videoSrc}
                        className={cn(
                            'size-full transform-gpu rounded-md object-cover transition-opacity duration-300',
                        )}
                        onLoadedMetadata={onLoadedMetadata}
                        onError={onError}
                        onPlay={onPlay}
                        onPause={onPause}
                        onEnded={onEnded}
                        onTimeUpdate={onTimeUpdate}
                        {...props} // Spread remaining video attributes (autoplay, controls, loop, etc.)
                    />
                )}
            </div>
        );
    },
);

AuthVideo.displayName = 'AuthVideo';
