export type TEmbedContent = {
    videoUrls: string[];
    isMediumSquare: boolean;
    hasSpecialRatio: boolean;
    forcesBiggerVideoHeight: boolean;
    forcesSmallerVideoHeight: boolean;
};

export type TVideoLoadStatus =
    | 'pending'
    | 'loaded'
    | 'failed';

export type TMessageGroupState = {
    isVisible: boolean;
    totalVideos: number;
    isAutoplayVideo: boolean;
    currentPlayingIndex: number;
    waitingForVideoIndex: number;
    currentlyPlaying: HTMLVideoElement | null;
    videoElements: Record<number, HTMLVideoElement>;
    videoLoadStatuses: Record<number, TVideoLoadStatus>;
};

export type TGlobalVideoState = {
    isMuted: boolean;
    startTime: number;
    isVisible: boolean;
    isDragging: boolean;
    totalVideos: number;
    isAutoPlaying: boolean;
    isAutoplayVideo: boolean;
    hasUserInteracted: boolean;
    currentPlayingIndex: number;
    currentAutoPlayIndex: number;
    waitingForVideoIndex: number;
    currentlyPlaying: HTMLVideoElement | null;
    messageGroups: Map<string, TMessageGroupState>;
    videoElements: Record<number, HTMLVideoElement>;
    videoLoadStatuses: Record<number, TVideoLoadStatus>;
};

export type TVideoComponentProps = {
    url: string;
    index: number;
    messageId: string;
    isBaseLoading: boolean;
    onUserInteraction?: () => void;
    setAutoPlayEnabled: (enabled: boolean) => void;
};

export type TVideoTrackingData = {
    sessionId: string;
    characterId: string;
    categoryName: string;
    characterName: string;
} | null;

export type TMemoriesProps = {
    messageId: string;
    memories: string[];
};
