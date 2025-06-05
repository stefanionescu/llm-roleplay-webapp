import { FC, RefObject, useState, useEffect } from 'react';

import { isElementInViewport } from '@/lib/utils/video/viewport';

type TVideoScrollManagerProps = {
    containerRef: RefObject<HTMLDivElement>;
};

/**
 * Component to handle automatic scrolling when videos change in autoplay mode
 */
export const VideoScrollManager: FC<
    TVideoScrollManagerProps
> = ({ containerRef }) => {
    const [currentVideoIndex, setCurrentVideoIndex] =
        useState(-1);

    // Watch for changes to currently playing video
    useEffect(() => {
        const handleVideoChange = () => {
            if (!containerRef.current) return;

            const videos = Array.from(
                containerRef.current.querySelectorAll(
                    'video',
                ),
            );
            let playingVideoIndex = -1;

            // Find any playing video in the container
            videos.forEach((video, index) => {
                if (!video.paused && !video.ended) {
                    // Double-check if this playing video is actually visible
                    if (isElementInViewport(video)) {
                        playingVideoIndex = index;
                    } else {
                        // If playing but not visible enough, pause it
                        video.pause();
                    }
                }
            });

            if (playingVideoIndex !== currentVideoIndex) {
                setCurrentVideoIndex(playingVideoIndex);
            }
        };

        // Set up mutation observer to watch for video changes
        const observer = new MutationObserver(
            handleVideoChange,
        );
        if (containerRef.current) {
            observer.observe(containerRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['src', 'style'],
            });
        }

        // Also watch for play events on all videos
        const handlePlay = (event: Event) => {
            if (!containerRef.current) return;
            const playingVideo =
                event.target as HTMLVideoElement;

            // Make sure the video that's playing is actually visible
            if (!isElementInViewport(playingVideo)) {
                playingVideo.pause();
                return;
            }

            const videos = Array.from(
                containerRef.current.querySelectorAll(
                    'video',
                ),
            );
            const newIndex = videos.indexOf(playingVideo);
            if (newIndex !== currentVideoIndex) {
                setCurrentVideoIndex(newIndex);
            }
        };

        if (containerRef.current) {
            const videos =
                containerRef.current.querySelectorAll(
                    'video',
                );
            videos.forEach((video) => {
                video.addEventListener('play', handlePlay);
            });
        }

        // Initial check
        handleVideoChange();

        return () => {
            observer.disconnect();
            if (containerRef.current) {
                const videos =
                    containerRef.current.querySelectorAll(
                        'video',
                    );
                videos.forEach((video) => {
                    video.removeEventListener(
                        'play',
                        handlePlay,
                    );
                });
            }
        };
    }, [containerRef, currentVideoIndex]);

    // Handle scroll when current video index changes
    useEffect(() => {
        if (!containerRef.current || currentVideoIndex < 0)
            return;

        const container = containerRef.current;
        const videos = Array.from(
            container.querySelectorAll('video'),
        );
        const currentVideo = videos[currentVideoIndex];
        if (!currentVideo) return;

        // Find the video container element
        const videoContainer = currentVideo.closest(
            '.video-wrapper',
        );
        if (!videoContainer) return;

        // Ensure smooth scrolling is enabled
        container.style.scrollBehavior = 'smooth';

        // Calculate the target scroll position
        const containerRect =
            container.getBoundingClientRect();
        const videoRect =
            videoContainer.getBoundingClientRect();

        // Calculate how much we need to scroll to bring the video into view
        const targetScroll =
            container.scrollLeft +
            (videoRect.left - containerRect.left) -
            40; // 40px padding

        // Scroll the container
        container.scrollLeft = targetScroll;
    }, [containerRef, currentVideoIndex]);

    return null;
};
