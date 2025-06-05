import { useState, useRef } from 'react';

import { PlayType } from '@/types/mixpanel';

/**
 * Hook to manage all video component state
 */
export function useVideoState() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isError, setIsError] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(
        null,
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasEnded, setHasEnded] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const shouldPlayAfterDrag = useRef(false);
    const isInViewport = useRef(false);

    // Video tracking state
    const [playStartTime, setPlayStartTime] = useState(0);
    const [currentPlayType, setCurrentPlayType] =
        useState<PlayType>('autoplay');
    const hasTrackedStartRef = useRef(false);
    const shouldTrackIncompleteEndRef = useRef(false);

    const updateTimeState = (
        time: number,
        ended: boolean,
        playing: boolean,
    ) => {
        setCurrentTime(time);
        setHasEnded(ended);
        setIsPlaying(playing);
    };

    return {
        // State
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

        // Refs
        videoRef,
        progressBarRef,
        shouldPlayAfterDrag,
        isInViewport,

        // Tracking state
        playStartTime,
        setPlayStartTime,
        currentPlayType,
        setCurrentPlayType,
        hasTrackedStartRef,
        shouldTrackIncompleteEndRef,

        // Helper
        updateTimeState,
    };
}
