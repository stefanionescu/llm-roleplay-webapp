import { useCallback } from 'react';

import { PlayType } from '@/types/mixpanel';
import { VIDEO_CONFIG } from '@/config/video';
import { TVideoTrackingData } from '@/types/video';
import {
    globalVideoState,
    getMessageGroupState,
} from '@/lib/utils/video/state';
import {
    checkAndStartNextAutoplay,
    pauseOtherVideos,
} from '@/lib/utils/video/autoplay';
import {
    trackVideoPlayStart,
    trackVideoPlayEnd,
    trackVideoPlayPause,
    trackVideoReplay,
} from '@/lib/mixpanel/events';

type TVideoEventHandlersProps = {
    url: string;
    index: number;
    messageId: string;
    hasEnded: boolean;
    isPlaying: boolean;
    isDragging: boolean;
    playStartTime: number;
    currentPlayType: PlayType;
    onUserInteraction?: () => void;
    trackingData: TVideoTrackingData;
    setHasEnded: (ended: boolean) => void;
    setCurrentTime: (time: number) => void;
    setIsPlaying: (playing: boolean) => void;
    setPlayStartTime: (time: number) => void;
    videoRef: React.RefObject<HTMLVideoElement>;
    setCurrentPlayType: (type: PlayType) => void;
    hasTrackedStartRef: React.MutableRefObject<boolean>;
    shouldTrackIncompleteEndRef: React.MutableRefObject<boolean>;
};

export function useVideoEventHandlers({
    url,
    index,
    messageId,
    trackingData,
    onUserInteraction,
    videoRef,
    isPlaying,
    setIsPlaying,
    hasEnded,
    setHasEnded,
    setCurrentTime,
    isDragging,
    playStartTime,
    setPlayStartTime,
    currentPlayType,
    setCurrentPlayType,
    hasTrackedStartRef,
    shouldTrackIncompleteEndRef,
}: TVideoEventHandlersProps) {
    const messageState = getMessageGroupState(messageId);

    // Video tracking functions
    const trackPlayStart = useCallback(
        (playType: PlayType) => {
            if (
                !trackingData ||
                !videoRef.current ||
                hasTrackedStartRef.current
            )
                return;

            const startTime = Date.now();
            setPlayStartTime(startTime);
            setCurrentPlayType(playType);
            hasTrackedStartRef.current = true;
            shouldTrackIncompleteEndRef.current = false;

            void trackVideoPlayStart(
                trackingData.sessionId,
                trackingData.characterId,
                trackingData.characterName,
                trackingData.categoryName,
                url,
                playType,
            );
        },
        [
            trackingData,
            url,
            setPlayStartTime,
            setCurrentPlayType,
            hasTrackedStartRef,
            shouldTrackIncompleteEndRef,
            videoRef,
        ],
    );

    const trackPlayEnd = useCallback(
        (isComplete: boolean) => {
            if (
                shouldTrackIncompleteEndRef.current &&
                trackingData &&
                videoRef.current
            ) {
                void trackVideoPlayEnd(
                    trackingData.sessionId,
                    trackingData.characterId,
                    trackingData.characterName,
                    trackingData.categoryName,
                    url,
                    currentPlayType,
                    0,
                    false,
                );
                shouldTrackIncompleteEndRef.current = false;
                return;
            }

            if (
                !trackingData ||
                !videoRef.current ||
                !hasTrackedStartRef.current
            )
                return;

            const endTime = Date.now();
            const playedDurationSeconds = Math.max(
                0,
                (endTime - playStartTime) / 1000,
            );

            void trackVideoPlayEnd(
                trackingData.sessionId,
                trackingData.characterId,
                trackingData.characterName,
                trackingData.categoryName,
                url,
                currentPlayType,
                playedDurationSeconds,
                isComplete,
            );

            hasTrackedStartRef.current = false;
        },
        [
            trackingData,
            url,
            currentPlayType,
            playStartTime,
            videoRef,
            hasTrackedStartRef,
            shouldTrackIncompleteEndRef,
        ],
    );

    const trackPause = useCallback(() => {
        if (
            !trackingData ||
            !videoRef.current ||
            !hasTrackedStartRef.current
        )
            return;

        const pauseTime = Date.now();
        const playedDurationSeconds = Math.max(
            0,
            (pauseTime - playStartTime) / 1000,
        );

        void trackVideoPlayPause(
            trackingData.sessionId,
            trackingData.characterId,
            trackingData.characterName,
            trackingData.categoryName,
            url,
            currentPlayType,
            playedDurationSeconds,
        );

        hasTrackedStartRef.current = false;
    }, [
        trackingData,
        url,
        currentPlayType,
        playStartTime,
        videoRef,
        hasTrackedStartRef,
    ]);

    const trackReplay = useCallback(() => {
        if (!trackingData) return;
        void trackVideoReplay(
            trackingData.sessionId,
            trackingData.characterId,
            trackingData.characterName,
            trackingData.categoryName,
            url,
        );
    }, [trackingData, url]);

    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current && !isDragging) {
            const newTime = videoRef.current.currentTime;
            setCurrentTime(newTime);
            if (
                newTime >=
                videoRef.current.duration -
                    VIDEO_CONFIG.VIDEO_END_BUFFER
            ) {
                setHasEnded(true);
                setIsPlaying(false);
            }
        }
    }, [
        isDragging,
        setCurrentTime,
        setHasEnded,
        setIsPlaying,
        videoRef,
    ]);

    const handlePlayPause = useCallback(() => {
        if (!videoRef.current) return;

        onUserInteraction?.();
        globalVideoState.hasUserInteracted = true;

        if (
            isPlaying ||
            (videoRef.current ===
                messageState.currentlyPlaying &&
                !videoRef.current.paused)
        ) {
            trackPause();
            videoRef.current.pause();
            messageState.currentlyPlaying = null;
            setIsPlaying(false);
        } else {
            pauseOtherVideos(videoRef.current);
            trackPlayStart('manual');
            void videoRef.current.play();
            messageState.currentlyPlaying =
                videoRef.current;
            setIsPlaying(true);
        }
    }, [
        isPlaying,
        onUserInteraction,
        setIsPlaying,
        trackPause,
        trackPlayStart,
        videoRef,
        messageState,
    ]);

    const handleRestart = useCallback(() => {
        if (!videoRef.current) return;

        onUserInteraction?.();
        trackReplay();

        if (
            messageState.currentlyPlaying &&
            messageState.currentlyPlaying !==
                videoRef.current
        ) {
            messageState.currentlyPlaying.pause();
        }

        videoRef.current.currentTime = 0;
        trackPlayStart('manual');
        void videoRef.current.play();
        messageState.currentlyPlaying = videoRef.current;
    }, [
        onUserInteraction,
        trackReplay,
        trackPlayStart,
        videoRef,
        messageState,
    ]);

    const handlePlay = useCallback(() => {
        const playType: PlayType =
            globalVideoState.hasUserInteracted
                ? 'manual'
                : 'autoplay';
        trackPlayStart(playType);
        setIsPlaying(true);
        setHasEnded(false);

        if (
            messageState.currentlyPlaying &&
            messageState.currentlyPlaying !==
                videoRef.current
        ) {
            messageState.currentlyPlaying.pause();
        }

        if (
            !globalVideoState.hasUserInteracted &&
            videoRef.current
        ) {
            messageState.currentlyPlaying =
                videoRef.current;
            messageState.isAutoplayVideo = true;
        }
    }, [
        setIsPlaying,
        setHasEnded,
        trackPlayStart,
        videoRef,
        messageState,
    ]);

    const handlePause = useCallback(() => {
        const isAtEnd =
            videoRef.current &&
            videoRef.current.currentTime >=
                videoRef.current.duration -
                    VIDEO_CONFIG.VIDEO_END_BUFFER;

        if (!isDragging && !isAtEnd) {
            trackPause();
            setIsPlaying(false);
        } else if (!isDragging) {
            setIsPlaying(false);
        }
    }, [isDragging, setIsPlaying, trackPause, videoRef]);

    const handleEnded = useCallback(() => {
        trackPlayEnd(true);
        setHasEnded(true);
        setIsPlaying(false);

        if (
            !globalVideoState.hasUserInteracted &&
            messageState.isAutoplayVideo
        ) {
            messageState.currentlyPlaying = null;
            messageState.isAutoplayVideo = false;

            if (index + 1 < messageState.totalVideos) {
                checkAndStartNextAutoplay(
                    index + 1,
                    messageId,
                );
            }
        }
    }, [
        index,
        messageId,
        setHasEnded,
        setIsPlaying,
        trackPlayEnd,
        messageState,
    ]);

    const handleClick = useCallback(
        (_e: React.MouseEvent<HTMLVideoElement>) => {
            if (!isDragging && videoRef.current) {
                if (
                    videoRef.current ===
                    messageState.currentlyPlaying
                ) {
                    if (!hasEnded) trackPause();
                    videoRef.current.pause();
                    messageState.currentlyPlaying = null;
                    setIsPlaying(false);
                    onUserInteraction?.();
                    globalVideoState.hasUserInteracted =
                        true;
                    return;
                }

                if (hasEnded) {
                    return;
                } else {
                    handlePlayPause();
                }
            }
        },
        [
            isDragging,
            hasEnded,
            handlePlayPause,
            onUserInteraction,
            setIsPlaying,
            trackPause,
            videoRef,
            messageState,
        ],
    );

    const handleError = useCallback(() => {
        messageState.videoLoadStatuses[index] = 'failed';
        if (index === messageState.waitingForVideoIndex) {
            checkAndStartNextAutoplay(index + 1, messageId);
        }
    }, [index, messageId, messageState]);

    return {
        // Event handlers
        handleTimeUpdate,
        handlePlayPause,
        handleRestart,
        handlePlay,
        handlePause,
        handleEnded,
        handleClick,
        handleError,
        // Tracking functions
        trackPlayStart,
        trackPause,
        trackPlayEnd,
        trackReplay,
    };
}
