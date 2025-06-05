// Base types for common values
export type AuthMethod = 'email' | 'phone';
export type UserStatus =
    | 'authenticated'
    | 'discarded'
    | 'anonymous';
export type MergeType =
    | 'merge_new_user'
    | 'no_merge_existing_user';
export type DiscardReason =
    'signed_in_with_existing_account';

export type PlayType = 'autoplay' | 'manual';

// Error types for API routes
export type ErrorType =
    | 'validation_error'
    | 'configuration_error'
    | 'api_request_error'
    | 'abort_error'
    | 'unknown_error';

export type ApiRoute =
    | 'inference'
    | 'rag'
    | 'rag_verify_usage';

export type UserProperties = {
    $name: string;
    $email?: string;
    $phone?: string;
    'User Last Login': string;
    'User Status': UserStatus;
    'User Discarded At'?: string;
    'User Main Account'?: string;
    'User Auth Method': AuthMethod;
    'User Discard Reason'?: DiscardReason;
};

export type SignInEventProperties = {
    'Sign In Identifier': string;
    'Sign In Method': AuthMethod;
    'Sign In Merge Type': MergeType;
    'Sign In Discarded User ID'?: string;
};

export type SendMessageEventProperties = {
    'Sent Message Locale': string;
    'Sent Message Length': number;
    'Sent Message Session Id': string;
    'Sent Message Character Id': string;
    'Sent Message Category Name': string;
    'Sent Message Character Name': string;
};

export type CreateSessionEventProperties = {
    'Created Session Id': string;
    'Created Session Locale': string;
    'Created Session Character Id': string;
    'Created Session Character Name': string;
};

export type VideoPlayStartEventProperties = {
    'Video Start Video Id': string;
    'Video Start Session Id': string;
    'Video Start Play Type': PlayType;
    'Video Start Character Id': string;
    'Video Start Category Name': string;
    'Video Start Character Name': string;
};

export type VideoPlayEndEventProperties = {
    'Video End Video Id': string;
    'Video End Session Id': string;
    'Video End Play Type': PlayType;
    'Video End Character Id': string;
    'Video End Is Complete': boolean;
    'Video End Category Name': string;
    'Video End Character Name': string;
    'Video End Played Duration Seconds': number;
};

export type VideoPlayPauseEventProperties = {
    'Video Pause Video Id': string;
    'Video Pause Session Id': string;
    'Video Pause Play Type': PlayType;
    'Video Pause Character Id': string;
    'Video Pause Category Name': string;
    'Video Pause Character Name': string;
    'Video Pause Played Duration Seconds': number;
};

export type VideoReplayEventProperties = {
    'Video Replay Video Id': string;
    'Video Replay Session Id': string;
    'Video Replay Character Id': string;
    'Video Replay Category Name': string;
    'Video Replay Character Name': string;
};

export type ApiErrorEventProperties = {
    'Error Route': ApiRoute;
    'Error Type': ErrorType;
    'Error Message': string;
    'Error Details'?: string;
    'Error Timestamp': string;
    'Error User Agent'?: string;
    'Error Status Code'?: number;
};

export type EventProperties =
    | SignInEventProperties
    | SendMessageEventProperties
    | CreateSessionEventProperties
    | VideoPlayStartEventProperties
    | VideoPlayEndEventProperties
    | VideoPlayPauseEventProperties
    | VideoReplayEventProperties
    | ApiErrorEventProperties;

export const EVENTS = {
    SIGN_IN: 'Sign In',
    SEND_MESSAGE: 'Send Message',
    CREATE_SESSION: 'Create Session',
    VIDEO_PLAY_START: 'Video Play Start',
    VIDEO_PLAY_END: 'Video Play End',
    VIDEO_PLAY_PAUSE: 'Video Play Pause',
    VIDEO_REPLAY: 'Video Replay',
    API_ERROR: 'API Error',
} as const;

export type EventName =
    (typeof EVENTS)[keyof typeof EVENTS];
