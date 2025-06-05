import { useState, useCallback } from 'react';

import { supabase } from '@/lib/supabase/client';
import { verifyOtpCode } from '@/lib/utils/otp/otp-main';
import { handleUserAuthentication } from '@/lib/mixpanel/user';
import { clearUserData } from '@/lib/utils/auth/auth-data-refresh';
import {
    resetAuthStateAfterVerification,
    resendOtpForIdentifier,
} from '@/lib/utils/auth/auth-form';

type UseAuthVerificationProps = {
    authIdentifier: string | null;
    isUsingSignInWithOtp: boolean;
    setAuthIdentifier: (value: null) => void;
    setIsUsingSignInWithOtp: (value: boolean) => void;
    setAuthStep: (
        value: 'input' | 'otp' | 'waitlist',
    ) => void;
};

/**
 * Hook to handle OTP verification and resending
 */
export const useAuthVerification = ({
    authIdentifier,
    isUsingSignInWithOtp,
    setAuthIdentifier,
    setIsUsingSignInWithOtp,
    setAuthStep,
}: UseAuthVerificationProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Verify OTP code
     */
    const handleVerifyOtp = useCallback(
        async (otp: string) => {
            if (!authIdentifier) {
                throw new Error(
                    'No identifier available for verification',
                );
            }

            try {
                setIsSubmitting(true);

                // CAPTURE ANONYMOUS USER ID BEFORE OTP VERIFICATION
                // This is critical because after OTP verification, Supabase switches to the existing user
                let anonymousUserId: string | null = null;
                if (isUsingSignInWithOtp && supabase) {
                    try {
                        const {
                            data: { user },
                        } = await supabase.auth.getUser();
                        anonymousUserId = user?.id || null;
                    } catch {
                        // If we can't get the user, continue without capturing ID
                    }
                }

                const result = await verifyOtpCode(
                    authIdentifier,
                    otp,
                    isUsingSignInWithOtp,
                );

                if (!result.success) {
                    throw new Error(
                        result.error instanceof Error
                            ? result.error.message
                            : 'OTP verification failed',
                    );
                }

                // Handle user authentication in Mixpanel after successful OTP verification
                // Pass the captured anonymous user ID so we can mark the correct user as discarded
                await handleUserAuthentication(
                    authIdentifier,
                    isUsingSignInWithOtp,
                    anonymousUserId,
                );

                // Reset the UI state first before clearing user data
                resetAuthStateAfterVerification(
                    setIsSubmitting,
                    setAuthIdentifier,
                    setIsUsingSignInWithOtp,
                    setAuthStep,
                );

                // If this is a sign-in (not email/phone change), clear user data
                // Defer this to the next tick to allow UI to update first
                if (isUsingSignInWithOtp) {
                    setTimeout(() => {
                        clearUserData();
                    }, 0);
                }

                return true;
            } catch (error) {
                setIsSubmitting(false);
                throw error;
            }
        },
        [authIdentifier, isUsingSignInWithOtp],
    );

    /**
     * Resend OTP code
     */
    const resendOtp = useCallback(async () => {
        if (!authIdentifier) {
            throw new Error(
                'No identifier to resend code to',
            );
        }

        try {
            return await resendOtpForIdentifier(
                authIdentifier,
                setIsUsingSignInWithOtp,
            );
        } catch (error) {
            throw error;
        }
    }, [authIdentifier, setIsUsingSignInWithOtp]);

    return {
        isSubmitting,
        setIsSubmitting,
        handleVerifyOtp,
        resendOtp,
    };
};
