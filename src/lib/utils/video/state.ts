import {
    TGlobalVideoState,
    TMessageGroupState,
} from '@/types/video';

export const globalVideoState: TGlobalVideoState = {
    currentlyPlaying: null,
    hasUserInteracted: false,
    isAutoplayVideo: false,
    isDragging: false,
    isAutoPlaying: false,
    currentAutoPlayIndex: 0,
    currentPlayingIndex: -1,
    isMuted: true,
    videoLoadStatuses: {},
    startTime: 0,
    videoElements: {},
    totalVideos: 0,
    isVisible: false,
    waitingForVideoIndex: -1,
    messageGroups: new Map<string, TMessageGroupState>(),
};

/**
 * Get or create message group state for a specific message ID
 */
export function getMessageGroupState(
    messageId: string,
): TMessageGroupState {
    if (!globalVideoState.messageGroups.has(messageId)) {
        globalVideoState.messageGroups.set(messageId, {
            currentlyPlaying: null,
            isAutoplayVideo: false,
            currentPlayingIndex: -1,
            videoLoadStatuses: {},
            videoElements: {},
            totalVideos: 0,
            isVisible: false,
            waitingForVideoIndex: -1,
        });
    }
    return globalVideoState.messageGroups.get(messageId)!;
}

/**
 * Reset global video state for new sessions
 */
export function resetGlobalVideoState(): void {
    globalVideoState.hasUserInteracted = false;
    globalVideoState.isAutoplayVideo = false;
    globalVideoState.currentlyPlaying = null;
    globalVideoState.isAutoPlaying = false;
}

/**
 * Update video mute state globally
 */
export function updateGlobalMuteState(
    isMuted: boolean,
): void {
    globalVideoState.isMuted = isMuted;

    if (typeof window !== 'undefined') {
        const videos = document.querySelectorAll('video');
        videos.forEach((video) => {
            video.muted = isMuted;
        });
    }
}

/**
 * Get stored mute preference from localStorage
 */
export function getStoredMutePreference(
    isReload: boolean,
): boolean {
    if (isReload) {
        return true; // Force muted on reload
    }

    try {
        const storedMutePreference = localStorage.getItem(
            'videos_muted_preference',
        );
        return storedMutePreference === null
            ? false
            : storedMutePreference === 'true';
    } catch {
        return true; // Default to muted if localStorage fails
    }
}

/**
 * Store mute preference to localStorage
 */
export function storeMutePreference(
    isMuted: boolean,
): void {
    try {
        localStorage.setItem(
            'videos_muted_preference',
            isMuted.toString(),
        );
    } catch {
        // Ignore localStorage errors
    }
}
