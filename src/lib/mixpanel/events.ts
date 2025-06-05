import mixpanel from 'mixpanel-browser';

import {
    EventProperties,
    EventName,
    EVENTS,
    SignInEventProperties,
    SendMessageEventProperties,
    CreateSessionEventProperties,
    VideoPlayStartEventProperties,
    VideoPlayEndEventProperties,
    VideoPlayPauseEventProperties,
    VideoReplayEventProperties,
    AuthMethod,
    PlayType,
} from '@/types/mixpanel';

const MIXPANEL_TOKEN =
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

/**
 * Check if Mixpanel is properly initialized
 */
const isMixpanelReady = (): boolean => {
    return !!MIXPANEL_TOKEN && !!mixpanel;
};

/**
 * Utility function to track events with type safety
 */
const trackEvent = async <T extends EventProperties>(
    eventName: EventName,
    properties: T,
): Promise<void> => {
    if (!isMixpanelReady()) return;

    return new Promise((resolve) => {
        setTimeout(() => {
            try {
                mixpanel.track(eventName, properties);
                resolve();
            } catch {
                resolve();
            }
        }, 0);
    });
};

/**
 * Utility function to determine auth method from identifier
 */
const getAuthMethod = (identifier: string): AuthMethod => {
    return identifier.includes('@') ? 'email' : 'phone';
};

/**
 * Track sign-in event for existing user (no merge scenario)
 */
export const trackSignInExistingUser = async (
    authIdentifier: string,
    anonymousUserId?: string | null,
): Promise<void> => {
    const signInProperties: SignInEventProperties = {
        'Sign In Method': getAuthMethod(authIdentifier),
        'Sign In Identifier': authIdentifier,
        'Sign In Merge Type': 'no_merge_existing_user',
    };

    // Add discarded user ID if we had an anonymous user
    if (anonymousUserId) {
        signInProperties['Sign In Discarded User ID'] =
            anonymousUserId;
    }

    await trackEvent(EVENTS.SIGN_IN, signInProperties);
};

/**
 * Track sign-in event for new user (merge scenario)
 */
export const trackSignInNewUser = async (
    authIdentifier: string,
): Promise<void> => {
    await trackEvent(EVENTS.SIGN_IN, {
        'Sign In Method': getAuthMethod(authIdentifier),
        'Sign In Identifier': authIdentifier,
        'Sign In Merge Type': 'merge_new_user',
    });
};

/**
 * Track send message event
 */
export const trackSendMessage = async (
    characterName: string,
    characterId: string,
    sessionId: string,
    messageLength: number,
    categoryName: string,
    locale: string,
): Promise<void> => {
    const sendMessageProperties: SendMessageEventProperties =
        {
            'Sent Message Character Name': characterName,
            'Sent Message Character Id': characterId,
            'Sent Message Session Id': sessionId,
            'Sent Message Length': messageLength,
            'Sent Message Category Name': categoryName,
            'Sent Message Locale': locale,
        };

    await trackEvent(
        EVENTS.SEND_MESSAGE,
        sendMessageProperties,
    );
};

/**
 * Track create session event
 */
export const trackCreateSession = async (
    sessionId: string,
    characterId: string,
    characterName: string,
    locale: string,
): Promise<void> => {
    const createSessionProperties: CreateSessionEventProperties =
        {
            'Created Session Id': sessionId,
            'Created Session Character Id': characterId,
            'Created Session Character Name': characterName,
            'Created Session Locale': locale,
        };

    await trackEvent(
        EVENTS.CREATE_SESSION,
        createSessionProperties,
    );
};

/**
 * Track video play start event
 */
export const trackVideoPlayStart = async (
    sessionId: string,
    characterId: string,
    characterName: string,
    categoryName: string,
    videoId: string,
    playType: PlayType,
): Promise<void> => {
    const videoPlayStartProperties: VideoPlayStartEventProperties =
        {
            'Video Start Session Id': sessionId,
            'Video Start Character Id': characterId,
            'Video Start Character Name': characterName,
            'Video Start Category Name': categoryName,
            'Video Start Video Id': videoId,
            'Video Start Play Type': playType,
        };

    await trackEvent(
        EVENTS.VIDEO_PLAY_START,
        videoPlayStartProperties,
    );
};

/**
 * Track video play end event
 */
export const trackVideoPlayEnd = async (
    sessionId: string,
    characterId: string,
    characterName: string,
    categoryName: string,
    videoId: string,
    playType: PlayType,
    playedDurationSeconds: number,
    isComplete: boolean,
): Promise<void> => {
    const videoPlayEndProperties: VideoPlayEndEventProperties =
        {
            'Video End Session Id': sessionId,
            'Video End Character Id': characterId,
            'Video End Character Name': characterName,
            'Video End Category Name': categoryName,
            'Video End Video Id': videoId,
            'Video End Play Type': playType,
            'Video End Played Duration Seconds':
                playedDurationSeconds,
            'Video End Is Complete': isComplete,
        };

    await trackEvent(
        EVENTS.VIDEO_PLAY_END,
        videoPlayEndProperties,
    );
};

/**
 * Track video play pause event
 */
export const trackVideoPlayPause = async (
    sessionId: string,
    characterId: string,
    characterName: string,
    categoryName: string,
    videoId: string,
    playType: PlayType,
    playedDurationSeconds: number,
): Promise<void> => {
    const videoPlayPauseProperties: VideoPlayPauseEventProperties =
        {
            'Video Pause Session Id': sessionId,
            'Video Pause Character Id': characterId,
            'Video Pause Character Name': characterName,
            'Video Pause Category Name': categoryName,
            'Video Pause Video Id': videoId,
            'Video Pause Play Type': playType,
            'Video Pause Played Duration Seconds':
                playedDurationSeconds,
        };

    await trackEvent(
        EVENTS.VIDEO_PLAY_PAUSE,
        videoPlayPauseProperties,
    );
};

/**
 * Track video replay event
 */
export const trackVideoReplay = async (
    sessionId: string,
    characterId: string,
    characterName: string,
    categoryName: string,
    videoId: string,
): Promise<void> => {
    const videoReplayProperties: VideoReplayEventProperties =
        {
            'Video Replay Session Id': sessionId,
            'Video Replay Character Id': characterId,
            'Video Replay Character Name': characterName,
            'Video Replay Category Name': categoryName,
            'Video Replay Video Id': videoId,
        };

    await trackEvent(
        EVENTS.VIDEO_REPLAY,
        videoReplayProperties,
    );
};
