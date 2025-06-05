import { RefObject } from 'react';

import { VIDEO_CONFIG } from '@/config/video';

import { updateVideoTime } from './tracking';
import { isElementInViewport } from './viewport';
import {
    globalVideoState,
    getMessageGroupState,
} from './state';
import {
    checkAndStartNextAutoplay,
    pauseOtherVideos,
} from './autoplay';

/**
 * Create drag handlers for video scrubbing
 */
export function createDragHandlers(
    videoRef: RefObject<HTMLVideoElement>,
    progressBarRef: RefObject<HTMLDivElement>,
    setIsDragging: (dragging: boolean) => void,
    updateTimeState: (
        time: number,
        ended: boolean,
        playing: boolean,
    ) => void,
    onUserInteraction?: () => void,
) {
    const handleMouseDown = (
        e: React.MouseEvent,
        isProgressBar = false,
    ) => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const targetRect = isProgressBar
            ? progressBarRef.current?.getBoundingClientRect()
            : video.getBoundingClientRect();

        if (!targetRect) return;

        const startX = e.clientX;
        let hasMoved = false;

        const handleTimeChange = (clientX: number) => {
            const pos = Math.max(
                0,
                Math.min(
                    1,
                    (clientX - targetRect.left) /
                        targetRect.width,
                ),
            );
            const newTime = pos * video.duration;
            updateVideoTime(
                video,
                newTime,
                (time) =>
                    updateTimeState(
                        time,
                        time >=
                            video.duration -
                                VIDEO_CONFIG.VIDEO_END_BUFFER,
                        false,
                    ),
                (ended) =>
                    updateTimeState(
                        video.currentTime,
                        ended,
                        !ended,
                    ),
                (playing) =>
                    updateTimeState(
                        video.currentTime,
                        false,
                        playing,
                    ),
            );
        };

        const handleDrag = (e: MouseEvent) => {
            const deltaX = Math.abs(e.clientX - startX);

            if (
                !hasMoved &&
                deltaX > VIDEO_CONFIG.DRAG_THRESHOLD
            ) {
                hasMoved = true;
                pauseOtherVideos();
                setIsDragging(true);
                globalVideoState.isDragging = true;
                handleTimeChange(e.clientX);
            }

            if (hasMoved) {
                e.preventDefault();
                handleTimeChange(e.clientX);
            }
        };

        const endDrag = () => {
            if (hasMoved) {
                setIsDragging(false);
                globalVideoState.isDragging = false;
                onUserInteraction?.();
                globalVideoState.hasUserInteracted = true;
            }
            window.removeEventListener(
                'mousemove',
                handleDrag,
            );
            window.removeEventListener('mouseup', endDrag);
        };

        window.addEventListener('mousemove', handleDrag);
        window.addEventListener('mouseup', endDrag);
    };

    return { handleMouseDown };
}

/**
 * Create intersection observer for video visibility
 */
export function createVisibilityObserver(
    videoElement: HTMLVideoElement,
    messageId: string,
    onVisibilityChange: (visible: boolean) => void,
) {
    const messageState = getMessageGroupState(messageId);

    const observer = new IntersectionObserver(
        () => {
            const isActuallyVisible =
                isElementInViewport(videoElement);

            messageState.isVisible = isActuallyVisible;
            onVisibilityChange(isActuallyVisible);

            if (
                isActuallyVisible &&
                !messageState.currentlyPlaying &&
                !globalVideoState.hasUserInteracted
            ) {
                if (isElementInViewport(videoElement)) {
                    checkAndStartNextAutoplay(0, messageId);
                }
            } else if (
                !isActuallyVisible &&
                videoElement ===
                    messageState.currentlyPlaying
            ) {
                videoElement.pause();
                messageState.currentlyPlaying = null;
            }
        },
        { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1.0] },
    );

    observer.observe(videoElement);
    return observer;
}

/**
 * Handle video loading success
 */
export function handleVideoLoadSuccess(
    video: HTMLVideoElement,
    index: number,
    messageId: string,
    setLoaded: (loaded: boolean) => void,
    setDuration: (duration: number) => void,
    setMounted: (mounted: boolean) => void,
) {
    const messageState = getMessageGroupState(messageId);

    setLoaded(true);
    setDuration(video.duration);
    video.muted = globalVideoState.isMuted;

    // Mark video as loaded
    messageState.videoLoadStatuses[index] = 'loaded';
    messageState.videoElements[index] = video;

    // Handle waiting video
    if (messageState.waitingForVideoIndex === index) {
        messageState.waitingForVideoIndex = -1;

        if (
            isElementInViewport(video) &&
            messageState.isVisible
        ) {
            checkAndStartNextAutoplay(0, messageId);
        }
    }

    // Force load first frame for Safari
    video.currentTime = 0.01;
    video.addEventListener(
        'seeked',
        () => {
            video.currentTime = 0;
            const isCurrentlyInViewport =
                isElementInViewport(video);
            messageState.isVisible = isCurrentlyInViewport;

            if (isCurrentlyInViewport) {
                checkAndStartNextAutoplay(0, messageId);
            }
        },
        { once: true },
    );

    requestAnimationFrame(() => setMounted(true));
}
