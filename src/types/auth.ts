/**
 * TAuth represents the authentication state of the application
 * Contains information about the auth modal, authentication steps,
 * user identifiers, and waitlist status
 */
export type TAuth = {
    /** Flag indicating if the authentication modal is currently displayed */
    isAuthModalOpen: boolean;
    /** User's current position in the waitlist queue */
    waitlistPosition: number;
    /** Timestamp of when the last OTP was requested */
    lastOtpRequestTime: number;
    /** Countdown timer (in seconds) before user can request another OTP */
    authResendCountdown: number;
    /** User's email or phone number used for authentication, null if not set */
    authIdentifier: string | null;
    /** Flag to track if we're using signInWithOtp (existing user) or email/phone verification (new user) */
    isUsingSignInWithOtp: boolean;
    /** The last authentication method used (email or phone) */
    previousAuthMode: 'email' | 'phone';
    /** Current step in the auth flow: initial input, OTP verification, or waitlist screen */
    authStep: 'input' | 'otp' | 'waitlist';
};

/**
 * Defines the actions that can be performed on the authentication state.
 * These functions are used to update the TAuth state and manage OTP functionality.
 * Includes methods for modal control, authentication flow steps, and waitlist management.
 */
export type AuthActions = {
    /** Updates the timestamp of the most recent OTP request */
    updateLastOtpRequestTime: () => void;
    /** Updates the visibility state of the authentication modal */
    setIsAuthModalOpen: (isAuthModalOpen: boolean) => void;
    /** Updates the user's position in the waitlist */
    setWaitlistPosition: (waitlistPosition: number) => void;
    /** Sets the user's authentication identifier (email or phone) */
    setAuthIdentifier: (
        authIdentifier: string | null,
    ) => void;
    /** Records the timestamp of the most recent OTP request */
    setLastOtpRequestTime: (
        lastOtpRequestTime: number,
    ) => void;
    /** Changes the current authentication step in the flow */
    setAuthStep: (
        authStep: 'input' | 'otp' | 'waitlist',
    ) => void;
    /** Updates the countdown timer for OTP resend functionality */
    setAuthResendCountdown: (
        authResendCountdown: number,
    ) => void;
    /** Updates the flag to track if we're using signInWithOtp (existing user) or email/phone verification (new user) */
    setIsUsingSignInWithOtp: (
        isUsingSignInWithOtp: boolean,
    ) => void;
    /** Updates the last used authentication method */
    setPreviousAuthMode: (
        previousAuthMode: 'email' | 'phone',
    ) => void;
    /** Checks if a new OTP can be requested based on cooldown period */
    canRequestOtp: () => {
        /** Whether an OTP can be requested at this time */
        canRequest: boolean;
        /** Number of seconds remaining before another OTP can be requested */
        remainingSeconds: number;
    };
};

export type WaitlistResponse = {
    on_waitlist: boolean; // Whether user is on the waitlist
    waitlist_position: number; // User's position in the waitlist queue
    registered_signup?: boolean; // Whether user has a normal signup (current field name)
    registered_normal_signup?: boolean; // Whether user has a normal signup (older field name)
    metadata?: {
        message: string;
        request_id: string;
        duration_ms: number;
    };
};

export type AuthProcessResult = {
    error?: Error;
    success: boolean;
    isUsingSignInWithOtp: boolean;
};

export type AuthSlice = TAuth & AuthActions;
