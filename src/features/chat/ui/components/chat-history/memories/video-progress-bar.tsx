import { FC, RefObject } from 'react';

import { PlayType } from '@/types/mixpanel';
import { VIDEO_CONFIG } from '@/config/video';
import { pauseOtherVideos } from '@/lib/utils/video/autoplay';
import {
    updateVideoTime,
    formatTime,
} from '@/lib/utils/video/tracking';
import {
    globalVideoState,
    getMessageGroupState,
} from '@/lib/utils/video/state';

type TVideoProgressBarProps = {
    duration: number;
    hasEnded: boolean;
    messageId: string;
    currentTime: number;
    isDragging: boolean;
    trackPause: () => void;
    onUserInteraction?: () => void;
    videoRef: RefObject<HTMLVideoElement>;
    setHasEnded: (ended: boolean) => void;
    setCurrentTime: (time: number) => void;
    setIsPlaying: (playing: boolean) => void;
    trackPlayStart: (type: PlayType) => void;
    progressBarRef: RefObject<HTMLDivElement>;
    setAutoPlayEnabled: (enabled: boolean) => void;
    hasTrackedStartRef: React.MutableRefObject<boolean>;
    shouldTrackIncompleteEndRef: React.MutableRefObject<boolean>;
    handleMouseDown: (
        e: React.MouseEvent,
        isProgressBar?: boolean,
    ) => void;
};

export const VideoProgressBar: FC<
    TVideoProgressBarProps
> = ({
    progressBarRef,
    videoRef,
    currentTime,
    duration,
    isDragging,
    hasEnded,
    setCurrentTime,
    setHasEnded,
    setIsPlaying,
    setAutoPlayEnabled,
    onUserInteraction,
    messageId,
    hasTrackedStartRef,
    shouldTrackIncompleteEndRef,
    handleMouseDown,
    trackPlayStart,
    trackPause,
}) => {
    const messageState = getMessageGroupState(messageId);

    const handleProgressBarClick = (
        e: React.MouseEvent<HTMLDivElement>,
    ) => {
        if (isDragging || globalVideoState.isDragging)
            return;
        if (!videoRef.current || !progressBarRef.current)
            return;

        if (
            !videoRef.current.paused &&
            hasTrackedStartRef.current
        ) {
            trackPause();
        }

        pauseOtherVideos();
        messageState.currentlyPlaying = null;
        onUserInteraction?.();
        globalVideoState.hasUserInteracted = true;
        messageState.isAutoplayVideo = false;
        setAutoPlayEnabled(false);

        const rect =
            progressBarRef.current.getBoundingClientRect();
        const pos = Math.max(
            0,
            Math.min(
                1,
                (e.clientX - rect.left) / rect.width,
            ),
        );
        const newTime = pos * videoRef.current.duration;
        updateVideoTime(
            videoRef.current,
            newTime,
            setCurrentTime,
            setHasEnded,
            setIsPlaying,
        );

        const isNearEnd =
            newTime >=
            videoRef.current.duration -
                VIDEO_CONFIG.NEAR_END_BUFFER;
        if (!isNearEnd) {
            void videoRef.current.play();
            messageState.currentlyPlaying =
                videoRef.current;
            setIsPlaying(true);
            trackPlayStart('manual');
        } else {
            shouldTrackIncompleteEndRef.current = true;
        }
    };

    return (
        <>
            <div
                ref={progressBarRef}
                className="group absolute bottom-0 left-0 right-0 z-10 cursor-pointer"
                style={{
                    height: '24px',
                    paddingBottom: '8px',
                }}
                onClick={handleProgressBarClick}
                onMouseDown={(e) =>
                    handleMouseDown(e, true)
                }
            >
                <div className="absolute bottom-0 left-0 right-0 h-3 bg-gray-800/50">
                    <div
                        className="h-full rounded-b-md bg-white"
                        style={{
                            width: `${Math.min((currentTime / duration) * 100, 99.99)}%`,
                        }}
                    />
                    <div
                        className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full bg-white active:cursor-grabbing ${
                            isDragging
                                ? 'opacity-100'
                                : globalVideoState.isDragging
                                  ? 'opacity-0'
                                  : !hasEnded &&
                                      currentTime > 0
                                    ? 'opacity-0 group-hover:opacity-100'
                                    : 'opacity-0'
                        } transition-opacity`}
                        style={{
                            left: `${(currentTime / duration) * 100}%`,
                        }}
                        onMouseDown={(e) =>
                            handleMouseDown(e, true)
                        }
                    />
                </div>
            </div>
            {isDragging && (
                <>
                    <div className="pointer-events-none absolute inset-0 bg-black/30" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-mono text-2xl font-bold tracking-wider text-white">
                        {formatTime(currentTime)} /{' '}
                        {formatTime(duration)}
                    </div>
                </>
            )}
        </>
    );
};
