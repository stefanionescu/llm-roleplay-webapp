import { FC, useEffect } from 'react';

import { VIDEO_CONFIG } from '@/config/video';
import { Skeleton } from '@/components/ui/skeleton';
import { TVideoComponentProps } from '@/types/video';
import { pauseOtherVideos } from '@/lib/utils/video/autoplay';
import { useVideoState } from '@/hooks/video/use-video-state';
import { getMessageGroupState } from '@/lib/utils/video/state';
import { AuthVideo } from '@/components/custom/media/auth-video';
import { useVideoTrackingData } from '@/hooks/video/use-video-tracking';
import { useVideoEventHandlers } from '@/hooks/video/use-video-event-handlers';
import {
    createDragHandlers,
    createVisibilityObserver,
    handleVideoLoadSuccess,
} from '@/lib/utils/video/handlers';

import { VideoControls } from './video-controls';
import { VideoProgressBar } from './video-progress-bar';

export const VideoComponent: FC<TVideoComponentProps> = ({
    url,
    isBaseLoading,
    onUserInteraction,
    setAutoPlayEnabled,
    index,
    messageId,
}) => {
    const trackingData = useVideoTrackingData();
    const videoState = useVideoState();
    const messageState = getMessageGroupState(messageId);

    const {
        isLoaded,
        setIsLoaded,
        isMounted,
        setIsMounted,
        isError,
        setIsError,
        videoUrl,
        setVideoUrl,
        isPlaying,
        setIsPlaying,
        hasEnded,
        setHasEnded,
        currentTime,
        setCurrentTime,
        duration,
        setDuration,
        isDragging,
        setIsDragging,
        videoRef,
        progressBarRef,
        shouldPlayAfterDrag,
        isInViewport,
        playStartTime,
        setPlayStartTime,
        currentPlayType,
        setCurrentPlayType,
        hasTrackedStartRef,
        shouldTrackIncompleteEndRef,
        updateTimeState,
    } = videoState;

    const eventHandlers = useVideoEventHandlers({
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
    });

    useEffect(() => {
        if (!url) return;
        setVideoUrl(url);
    }, [url, setVideoUrl]);

    // Handle play/pause during dragging
    useEffect(() => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        if (isDragging) {
            shouldPlayAfterDrag.current =
                isPlaying || (!video.paused && !hasEnded);
            if (
                shouldPlayAfterDrag.current &&
                hasTrackedStartRef.current
            ) {
                eventHandlers.trackPause();
            }
            pauseOtherVideos();
            messageState.currentlyPlaying = null;
        } else if (
            shouldPlayAfterDrag.current &&
            !hasEnded
        ) {
            void video.play();
            messageState.currentlyPlaying = video;
            setIsPlaying(true);
            shouldPlayAfterDrag.current = false;

            const isNearEnd =
                video.currentTime >=
                video.duration -
                    VIDEO_CONFIG.NEAR_END_BUFFER;
            if (!isNearEnd) {
                eventHandlers.trackPlayStart('manual');
            } else {
                shouldTrackIncompleteEndRef.current = true;
            }
        }
    }, [
        isDragging,
        hasEnded,
        isPlaying,
        setIsPlaying,
        eventHandlers,
    ]);

    // Set up intersection observer
    useEffect(() => {
        if (!videoRef.current) return;

        const observer = createVisibilityObserver(
            videoRef.current,
            messageId,
            (visible) => {
                isInViewport.current = visible;
            },
        );

        return () => observer.disconnect();
    }, [messageId, videoRef, isInViewport]);

    const { handleMouseDown } = createDragHandlers(
        videoRef,
        progressBarRef,
        setIsDragging,
        updateTimeState,
        onUserInteraction,
    );

    const commonClasses = 'w-full h-full rounded-md';

    if (isError) {
        return (
            <div
                className={`${commonClasses} flex items-center justify-center bg-zinc-900`}
            >
                <span className="text-red-500">
                    Failed to load video
                </span>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full">
            {(!isMounted || isBaseLoading) && (
                <Skeleton
                    className={`${commonClasses} absolute inset-0 z-10`}
                />
            )}
            {videoUrl && (
                <>
                    <AuthVideo
                        ref={videoRef}
                        path={url}
                        className={`${commonClasses} z-1 relative cursor-pointer ${isDragging ? 'brightness-50' : ''}`}
                        style={{
                            opacity: isMounted ? 1 : 0,
                            transition:
                                'opacity 200ms ease-in-out',
                            willChange:
                                'transform, opacity',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility:
                                'hidden',
                        }}
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={() => {
                            if (videoRef.current) {
                                handleVideoLoadSuccess(
                                    videoRef.current,
                                    index,
                                    messageId,
                                    setIsLoaded,
                                    setDuration,
                                    setIsMounted,
                                );
                            }
                        }}
                        onTimeUpdate={
                            eventHandlers.handleTimeUpdate
                        }
                        onPlay={eventHandlers.handlePlay}
                        onPause={eventHandlers.handlePause}
                        onEnded={eventHandlers.handleEnded}
                        onMouseDown={handleMouseDown}
                        onClick={eventHandlers.handleClick}
                        onError={() => {
                            setIsError(true);
                            eventHandlers.handleError();
                        }}
                    />
                    {isLoaded && (
                        <>
                            <VideoProgressBar
                                progressBarRef={
                                    progressBarRef
                                }
                                videoRef={videoRef}
                                currentTime={currentTime}
                                duration={duration}
                                isDragging={isDragging}
                                hasEnded={hasEnded}
                                setCurrentTime={
                                    setCurrentTime
                                }
                                setHasEnded={setHasEnded}
                                setIsPlaying={setIsPlaying}
                                setAutoPlayEnabled={
                                    setAutoPlayEnabled
                                }
                                onUserInteraction={
                                    onUserInteraction
                                }
                                messageId={messageId}
                                hasTrackedStartRef={
                                    hasTrackedStartRef
                                }
                                shouldTrackIncompleteEndRef={
                                    shouldTrackIncompleteEndRef
                                }
                                handleMouseDown={
                                    handleMouseDown
                                }
                                trackPlayStart={
                                    eventHandlers.trackPlayStart
                                }
                                trackPause={
                                    eventHandlers.trackPause
                                }
                            />
                            <VideoControls
                                isPlaying={isPlaying}
                                hasEnded={hasEnded}
                                isDragging={isDragging}
                                handlePlayPause={
                                    eventHandlers.handlePlayPause
                                }
                                handleRestart={
                                    eventHandlers.handleRestart
                                }
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
};
