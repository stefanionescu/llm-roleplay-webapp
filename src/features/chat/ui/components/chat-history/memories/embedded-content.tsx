import { FC, useRef, useState, useEffect } from 'react';

import { Flex } from '@/components/ui/flex';
import { TEmbedContent } from '@/types/video';
import { checkAndStartNextAutoplay } from '@/lib/utils/video/autoplay';
import {
    VIDEO_CONFIG,
    VIDEO_CONTAINER_CLASSES,
} from '@/config/video';
import {
    globalVideoState,
    getMessageGroupState,
    resetGlobalVideoState,
} from '@/lib/utils/video/state';

import { MuteToggle } from './mute-toggle';
import { VideoComponent } from './video-component';
import { VideoScrollManager } from './video-scroll-manager';

type TEmbeddedContentProps = TEmbedContent & {
    messageId: string;
};

export const EmbeddedContent: FC<TEmbeddedContentProps> = ({
    videoUrls,
    hasSpecialRatio,
    isMediumSquare,
    forcesSmallerVideoHeight,
    forcesBiggerVideoHeight,
    messageId,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [autoPlayEnabled, setAutoPlayEnabled] =
        useState(true);
    const [_isVisible, setIsVisible] = useState(false);
    const autoplayTriggeredRef = useRef(false);

    // Reset global state when component mounts
    useEffect(() => {
        resetGlobalVideoState();
        setAutoPlayEnabled(true);
        setIsVisible(false);
        autoplayTriggeredRef.current = false;

        return () => {
            if (globalVideoState.currentlyPlaying) {
                globalVideoState.currentlyPlaying.pause();
            }
            globalVideoState.currentlyPlaying = null;
            globalVideoState.currentAutoPlayIndex = 0;
            globalVideoState.isAutoPlaying = false;
        };
    }, []);

    // Handle video visibility and trigger autoplay through proper system
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                const isNowVisible =
                    entry.intersectionRatio >=
                    VIDEO_CONFIG.VISIBILITY_THRESHOLD;
                setIsVisible(isNowVisible);

                const messageState =
                    getMessageGroupState(messageId);
                messageState.isVisible = isNowVisible;

                if (
                    isNowVisible &&
                    !globalVideoState.hasUserInteracted &&
                    autoPlayEnabled
                ) {
                    // Only trigger autoplay once when becoming visible
                    if (!autoplayTriggeredRef.current) {
                        autoplayTriggeredRef.current = true;

                        // Use mobile-specific delays like the original code
                        const isMobile =
                            typeof window !== 'undefined' &&
                            window.innerWidth <
                                VIDEO_CONFIG.MOBILE_BREAKPOINT;
                        const delay = isMobile
                            ? VIDEO_CONFIG.AUTOPLAY_DELAYS
                                  .MOBILE
                            : VIDEO_CONFIG.AUTOPLAY_DELAYS
                                  .DESKTOP;

                        setTimeout(() => {
                            // Double-check that we're still visible and haven't interacted
                            if (
                                messageState.isVisible &&
                                !globalVideoState.hasUserInteracted &&
                                autoPlayEnabled
                            ) {
                                checkAndStartNextAutoplay(
                                    0,
                                    messageId,
                                );
                            }
                        }, delay);
                    }
                } else if (!isNowVisible) {
                    // Reset autoplay trigger when not visible
                    autoplayTriggeredRef.current = false;

                    // Pause any currently playing video when not visible
                    if (messageState.currentlyPlaying) {
                        messageState.currentlyPlaying.pause();
                        messageState.currentlyPlaying =
                            null;
                    }
                }
            },
            {
                threshold:
                    VIDEO_CONFIG.VISIBILITY_THRESHOLD,
            },
        );

        // Observe the container
        observer.observe(
            containerRef.current.parentElement ||
                containerRef.current,
        );

        return () => {
            observer.disconnect();
        };
    }, [autoPlayEnabled, messageId]);

    // Set totalVideos in message state
    useEffect(() => {
        const messageState =
            getMessageGroupState(messageId);
        messageState.totalVideos = videoUrls.length;
    }, [videoUrls.length, messageId]);

    if (
        !Array.isArray(videoUrls) ||
        videoUrls.length === 0
    ) {
        return null;
    }

    return (
        <Flex direction="col" gap="md" className="w-full">
            <VideoScrollManager
                containerRef={containerRef}
            />
            <Flex
                ref={containerRef}
                gap="sm"
                className="no-scrollbar mt-2 flex w-full flex-row flex-nowrap justify-start overflow-x-auto overflow-y-hidden scroll-smooth"
                items="stretch"
            >
                {videoUrls.map((url, index) => {
                    const shouldUseSpecialRatio =
                        (hasSpecialRatio ||
                            isMediumSquare) &&
                        !forcesSmallerVideoHeight &&
                        !forcesBiggerVideoHeight;

                    const containerClasses = `${
                        shouldUseSpecialRatio
                            ? VIDEO_CONTAINER_CLASSES.SPECIAL_RATIO
                            : VIDEO_CONTAINER_CLASSES.NORMAL_RATIO
                    } flex-shrink-0 rounded-md video-wrapper`;

                    return (
                        <div
                            key={url}
                            className={containerClasses}
                        >
                            <div className="relative h-full w-full">
                                <VideoComponent
                                    url={url}
                                    isBaseLoading={false}
                                    onUserInteraction={() => {
                                        globalVideoState.hasUserInteracted =
                                            true;
                                        setAutoPlayEnabled(
                                            false,
                                        );
                                        autoplayTriggeredRef.current =
                                            false;
                                    }}
                                    setAutoPlayEnabled={
                                        setAutoPlayEnabled
                                    }
                                    index={index}
                                    messageId={messageId}
                                />
                                <MuteToggle />
                            </div>
                        </div>
                    );
                })}
            </Flex>
        </Flex>
    );
};
