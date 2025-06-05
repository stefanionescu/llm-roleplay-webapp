import { isElementInViewport } from './viewport';
import {
    globalVideoState,
    getMessageGroupState,
} from './state';

/**
 * Check and start next autoplay video in sequence
 */
export function checkAndStartNextAutoplay(
    minIndex: number,
    messageId: string,
): void {
    const messageState = getMessageGroupState(messageId);

    if (globalVideoState.hasUserInteracted) {
        return;
    }

    if (messageState.waitingForVideoIndex !== -1) {
        return;
    }

    if (messageState.currentlyPlaying) {
        return;
    }

    // Check if the message group is marked as visible (set by container observer)
    // If not visible at container level, don't try to autoplay
    if (!messageState.isVisible) {
        return;
    }

    // For initial autoplay, we trust the container visibility
    // But for subsequent videos, we still check individual video visibility
    let anyVideoVisible: boolean = messageState.isVisible;

    // If we're checking beyond the first video, verify individual visibility
    if (minIndex > 0) {
        anyVideoVisible = false;
        for (let i = 0; i < messageState.totalVideos; i++) {
            const video = messageState.videoElements[i];
            if (video && isElementInViewport(video)) {
                anyVideoVisible = true;
                break;
            }
        }
    }

    // If no video is truly visible, don't try to autoplay anything
    if (!anyVideoVisible) {
        return;
    }

    for (
        let i = minIndex;
        i < messageState.totalVideos;
        i++
    ) {
        const status = messageState.videoLoadStatuses[i];
        const video = messageState.videoElements[i];

        if (!status || status === 'pending') {
            messageState.waitingForVideoIndex = i;
            return;
        }

        if (status === 'failed') {
            continue;
        }

        if (status === 'loaded' && video) {
            // For the first video (minIndex === 0), trust container visibility
            // For subsequent videos, check individual visibility
            const isThisVideoVisible =
                minIndex === 0 && i === 0
                    ? messageState.isVisible
                    : isElementInViewport(video);

            if (!isThisVideoVisible) {
                // Skip to next video if this one isn't visible enough
                continue;
            }

            // Only try to play if this video specifically is visible
            video
                .play()
                .then(() => {
                    messageState.currentlyPlaying = video;
                    messageState.currentPlayingIndex = i;
                    messageState.isAutoplayVideo = true;
                    messageState.waitingForVideoIndex = -1;
                })
                .catch(() => {
                    messageState.waitingForVideoIndex = -1;
                    checkAndStartNextAutoplay(
                        i + 1,
                        messageId,
                    );
                });

            return;
        }
    }

    messageState.waitingForVideoIndex = -1;
}

/**
 * Stop all autoplaying videos
 */
export function stopAutoplayingVideos(): void {
    const videos = document.querySelectorAll('video');
    videos.forEach((video: HTMLVideoElement) => {
        if (!video.paused) {
            video.pause();
        }
    });
    globalVideoState.isAutoplayVideo = false;
    globalVideoState.hasUserInteracted = true;
    globalVideoState.currentlyPlaying = null;
}

/**
 * Pause all videos except the specified one
 */
export function pauseOtherVideos(
    exceptVideo?: HTMLVideoElement,
): void {
    const videos = document.querySelectorAll('video');
    videos.forEach((video: HTMLVideoElement) => {
        if (!video.paused && video !== exceptVideo) {
            video.pause();
        }
    });
}
