import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useStore } from '@/lib/zustand/store';

import { AuthMode } from './use-auth-form';

/**
 * Hook to manage authentication state from Zustand store
 */
export const useAuthState = () => {
    // Get auth state from the Zustand store
    const {
        authIdentifier,
        setAuthIdentifier,
        authResendCountdown,
        setAuthResendCountdown,
        updateLastOtpRequestTime,
        setAuthStep,
        setWaitlistPosition,
        setPreviousAuthMode,
        isUsingSignInWithOtp,
        setIsUsingSignInWithOtp,
    } = useStore(
        useShallow((state) => ({
            authIdentifier: state.authIdentifier,
            setAuthIdentifier: state.setAuthIdentifier,
            authResendCountdown: state.authResendCountdown,
            setAuthResendCountdown:
                state.setAuthResendCountdown,
            updateLastOtpRequestTime:
                state.updateLastOtpRequestTime,
            setAuthStep: state.setAuthStep,
            setWaitlistPosition: state.setWaitlistPosition,
            setPreviousAuthMode: state.setPreviousAuthMode,
            isUsingSignInWithOtp:
                state.isUsingSignInWithOtp,
            setIsUsingSignInWithOtp:
                state.setIsUsingSignInWithOtp,
        })),
    );

    /**
     * Update auth state after successful authentication
     */
    const updateAuthState = useCallback(
        (identifier: string, isSignInWithOtp: boolean) => {
            setAuthIdentifier(identifier);
            updateLastOtpRequestTime();
            setIsUsingSignInWithOtp(isSignInWithOtp);
        },
        [
            setAuthIdentifier,
            updateLastOtpRequestTime,
            setIsUsingSignInWithOtp,
        ],
    );

    /**
     * Handle waitlist status by updating state
     */
    const handleWaitlistStatus = useCallback(
        (position: number) => {
            setWaitlistPosition(position);
            setAuthStep('waitlist');
        },
        [setWaitlistPosition, setAuthStep],
    );

    /**
     * Handle OTP sent by updating state
     */
    const handleOtpSent = useCallback(
        (authMode: AuthMode) => {
            setPreviousAuthMode(authMode);
            setAuthStep('otp');
        },
        [setPreviousAuthMode, setAuthStep],
    );

    return {
        authIdentifier,
        setAuthIdentifier,
        authResendCountdown,
        setAuthResendCountdown,
        updateLastOtpRequestTime,
        setAuthStep,
        setWaitlistPosition,
        setPreviousAuthMode,
        isUsingSignInWithOtp,
        setIsUsingSignInWithOtp,
        updateAuthState,
        handleWaitlistStatus,
        handleOtpSent,
    };
};
