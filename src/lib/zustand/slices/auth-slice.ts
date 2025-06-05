import { authConstants } from '@/config';
import { AuthSlice, TAuth } from '@/types/auth';
import { StoreSlice } from '@/lib/zustand/store-slice';

const initialState: TAuth = {
    isAuthModalOpen: false,
    authStep: 'input',
    waitlistPosition: 0,
    authIdentifier: null,
    previousAuthMode: 'email',
    authResendCountdown: 0,
    lastOtpRequestTime: 0,
    isUsingSignInWithOtp: false,
};

export const createAuthSlice: StoreSlice<AuthSlice> = (
    set,
    get,
) => ({
    ...initialState,
    setIsAuthModalOpen: (isAuthModalOpen: boolean) =>
        set({ isAuthModalOpen }),
    setAuthStep: (authStep: 'input' | 'otp' | 'waitlist') =>
        set({ authStep }),
    setWaitlistPosition: (waitlistPosition: number) =>
        set({ waitlistPosition }),
    setAuthIdentifier: (authIdentifier: string | null) =>
        set({ authIdentifier }),
    setPreviousAuthMode: (
        previousAuthMode: 'email' | 'phone',
    ) => set({ previousAuthMode }),
    setAuthResendCountdown: (authResendCountdown: number) =>
        set({ authResendCountdown }),
    setLastOtpRequestTime: (lastOtpRequestTime: number) =>
        set({ lastOtpRequestTime }),
    setIsUsingSignInWithOtp: (
        isUsingSignInWithOtp: boolean,
    ) => set({ isUsingSignInWithOtp }),
    updateLastOtpRequestTime: () =>
        set({ lastOtpRequestTime: Date.now() }),
    canRequestOtp: () => {
        const lastOtpRequestTime = get().lastOtpRequestTime;
        const currentTime = Date.now();
        const elapsedTime =
            currentTime - lastOtpRequestTime;
        const cooldownMs = authConstants.otpCooldown * 1000;

        if (
            elapsedTime >= cooldownMs ||
            lastOtpRequestTime === 0
        ) {
            return {
                canRequest: true,
                remainingSeconds: 0,
            };
        } else {
            const remainingMs = cooldownMs - elapsedTime;
            const remainingSeconds = Math.ceil(
                remainingMs / 1000,
            );
            return { canRequest: false, remainingSeconds };
        }
    },
});
