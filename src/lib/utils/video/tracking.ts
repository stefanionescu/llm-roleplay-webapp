/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Update video time and handle end state
 */
export function updateVideoTime(
    video: HTMLVideoElement,
    newTime: number,
    setCurrentTime: (time: number) => void,
    setHasEnded: (ended: boolean) => void,
    setIsPlaying: (playing: boolean) => void,
): void {
    video.currentTime = newTime;
    setCurrentTime(newTime);

    if (newTime >= video.duration - 0.1) {
        setHasEnded(true);
        setIsPlaying(false);
        video.pause();
    } else {
        setHasEnded(false);
    }
}
