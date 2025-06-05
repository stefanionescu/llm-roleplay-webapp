'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { trpc } from '@/trpc/client';
import { cn } from '@/lib/utils/shad';
import { Skeleton } from '@/components/ui/skeleton';

type AuthImageProps = {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    style?: React.CSSProperties;
};

export function AuthImage({
    src,
    alt,
    width,
    height,
    className,
    style,
}: AuthImageProps) {
    const queryClient = useQueryClient();
    const [
        isInitialCheckLoading,
        setIsInitialCheckLoading,
    ] = useState(true);
    const [shouldSkipBlur, setShouldSkipBlur] =
        useState(false);
    const [isBlurLoaded, setIsBlurLoaded] = useState(false);
    const [isHighQualityLoaded, setIsHighQualityLoaded] =
        useState(false);
    const blurDivRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Construct blurred image path
    const blurredSrc = src.replace(
        /\.(\w+)$/,
        '-blurred.$1',
    );

    // Added: Check cache for high-quality image first
    useEffect(() => {
        const queryKey = [
            ['media', 'getMedia'],
            { input: src, type: 'query' },
        ];
        const cachedData = queryClient.getQueryData<{
            data: string;
        } | null>(queryKey);

        if (cachedData?.data) {
            setShouldSkipBlur(true);
            setIsHighQualityLoaded(true);
        }
        setIsInitialCheckLoading(false);
    }, [src, queryClient]);

    // Use TRPC queries
    const { data: blurredData } =
        trpc.media.getMedia.useQuery(blurredSrc, {
            retry: false,
            enabled:
                !isInitialCheckLoading && !shouldSkipBlur,
        });

    const { data: highQualityData } =
        trpc.media.getMedia.useQuery(src, {
            enabled:
                !isInitialCheckLoading &&
                (shouldSkipBlur ||
                    (!!blurredData?.data && isBlurLoaded)),
            retry: false,
        });

    // Handle blur image load
    useEffect(() => {
        if (!blurredData?.data || !blurDivRef.current)
            return;

        // Create a new image to preload the blur
        const img = document.createElement('img');
        img.src = blurredData.data;
        img.onload = () => {
            setIsBlurLoaded(true);
        };
    }, [blurredData?.data]);

    // Handle high quality image load
    useEffect(() => {
        if (!imageRef.current || !highQualityData?.data)
            return;

        if (imageRef.current.complete) {
            setIsHighQualityLoaded(true);
        }
    }, [highQualityData]);

    const handleHighQualityLoad = () => {
        setIsHighQualityLoaded(true);
    };

    return (
        <div
            className={cn(
                'relative size-full overflow-hidden',
                className,
            )}
            style={style}
        >
            {/* Skeleton loader - show during initial check OR while loading blur if not skipping */}
            {(isInitialCheckLoading ||
                (!shouldSkipBlur &&
                    !blurredData?.data)) && (
                <Skeleton className="absolute inset-0 size-full py-2" />
            )}

            {/* Low quality image container - only show if not skipping blur */}
            {blurredData?.data && !shouldSkipBlur && (
                <div
                    ref={blurDivRef}
                    className={cn(
                        'absolute inset-0 scale-105 transform-gpu bg-cover bg-center bg-no-repeat blur-[2px] transition-opacity duration-700',
                        isHighQualityLoaded
                            ? 'opacity-0'
                            : 'opacity-100',
                    )}
                    style={{
                        backgroundImage: `url(${blurredData.data})`,
                    }}
                />
            )}

            {/* High quality image */}
            {(highQualityData?.data ||
                (shouldSkipBlur &&
                    queryClient.getQueryData<{
                        data: string;
                    } | null>([
                        ['media', 'getMedia'],
                        { input: src, type: 'query' },
                    ])?.data)) && (
                <Image
                    ref={imageRef}
                    src={
                        shouldSkipBlur
                            ? (queryClient.getQueryData<{
                                  data: string;
                              } | null>([
                                  ['media', 'getMedia'],
                                  {
                                      input: src,
                                      type: 'query',
                                  },
                              ])?.data ?? '')
                            : (highQualityData?.data ?? '')
                    }
                    alt={alt}
                    width={width}
                    height={height}
                    onLoad={handleHighQualityLoad}
                    className={cn(
                        'relative size-full object-cover',
                        shouldSkipBlur
                            ? ''
                            : 'transition-opacity duration-700',
                        isHighQualityLoaded ||
                            shouldSkipBlur
                            ? 'opacity-100'
                            : 'opacity-0',
                    )}
                />
            )}
        </div>
    );
}
