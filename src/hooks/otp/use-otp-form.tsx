import { useFormik } from 'formik';
import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/shallow';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    useState,
    useEffect,
    useRef,
    useMemo,
} from 'react';

import { Store } from '@/types/zustand';
import { otpSchema } from '@/validators/auth';
import { useStore } from '@/lib/zustand/store';
import { useAuthForm } from '@/hooks/auth/use-auth-form';
import {
    handleOtpError,
    handleCooldownError,
    handleResendOtpError,
} from '@/lib/utils/otp/otp-errors';
import {
    calculateRemainingCooldown,
    shouldShowOtpCountdown,
    detectAuthMode,
    resetOtpFormForNewAttempt,
} from '@/lib/utils/otp/otp-form';

interface UseOtpFormProps {
    onSuccess?: () => void;
}

export const useOtpForm = ({
    onSuccess,
}: UseOtpFormProps = {}) => {
    const t = useTranslations();

    // Track error dismissal timeouts
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(
        null,
    );

    // Get auth state from the Zustand store using shallow equality
    const {
        setAuthStep,
        setIsAuthModalOpen,
        authIdentifier,
        lastOtpRequestTime,
        updateLastOtpRequestTime,
        setPreviousAuthMode,
    } = useStore(
        useShallow((state: Store) => ({
            setAuthStep: state.setAuthStep,
            setIsAuthModalOpen: state.setIsAuthModalOpen,
            authIdentifier: state.authIdentifier,
            lastOtpRequestTime: state.lastOtpRequestTime,
            updateLastOtpRequestTime:
                state.updateLastOtpRequestTime,
            setPreviousAuthMode: state.setPreviousAuthMode,
        })),
    );

    const [isSubmittingOtp, setIsSubmittingOtp] =
        useState(false);
    const [isResendingOtp, setIsResendingOtp] =
        useState(false);

    // Force immediate and frequent updates to ensure we show countdown properly
    useEffect(() => {
        // Update frequently (every 100ms) for smoother transitions
        const interval = setInterval(() => {
            // Force re-render to update remaining countdown
            setIsResendingOtp((prev) => prev);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Calculate cooldown directly in a memo
    const remainingCooldown = useMemo(
        () =>
            calculateRemainingCooldown(lastOtpRequestTime),
        [lastOtpRequestTime],
    );

    // Ensure we show countdown immediately if lastOtpRequestTime is set
    const shouldShowCountdown = useMemo(
        () => shouldShowOtpCountdown(lastOtpRequestTime),
        [lastOtpRequestTime],
    );

    // Detect auth mode from identifier
    const [detectedAuthMode, setDetectedAuthMode] =
        useState(detectAuthMode(authIdentifier));

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
        };
    }, []);

    // Update detected auth mode when identifier changes
    useEffect(() => {
        if (authIdentifier) {
            setDetectedAuthMode(
                detectAuthMode(authIdentifier),
            );
        }
    }, [authIdentifier]);

    // Get auth form state from the hook
    const { handleVerifyOtp, resendOtp } = useAuthForm({
        initialAuthMode: detectedAuthMode,
    });

    // OTP verification form
    const otpFormik = useFormik({
        initialValues: {
            otp: '',
        },
        validateOnBlur: false,
        validateOnChange: false,
        validationSchema:
            toFormikValidationSchema(otpSchema),
        onSubmit: async (values) => {
            if (!values.otp || values.otp.length !== 6)
                return;

            try {
                setIsSubmittingOtp(true);

                // Use the handleVerifyOtp function from useAuthForm
                const success = await handleVerifyOtp(
                    values.otp,
                );

                if (success) {
                    // Close the auth modal
                    setIsAuthModalOpen(false);
                    onSuccess?.();
                }
            } catch (error) {
                handleOtpError(
                    error,
                    t,
                    otpFormik,
                    errorTimeoutRef,
                );
            } finally {
                setIsSubmittingOtp(false);
            }
        },
    });

    // Handle resending the OTP
    const handleResendOtp = async () => {
        // Get real-time cooldown calculation
        const realRemainingCooldown =
            calculateRemainingCooldown(lastOtpRequestTime);

        // Check if we're in the cooldown period
        if (realRemainingCooldown > 0) {
            handleCooldownError(
                realRemainingCooldown,
                t,
                otpFormik,
                errorTimeoutRef,
            );
            return;
        }

        if (isResendingOtp) return;

        try {
            setIsResendingOtp(true);
            resetOtpFormForNewAttempt(otpFormik);

            // Use the resendOtp function from useAuthForm
            await resendOtp();

            // Update the last OTP request time
            updateLastOtpRequestTime();
        } catch (error) {
            handleResendOtpError(
                error,
                t,
                otpFormik,
                errorTimeoutRef,
            );
        } finally {
            setIsResendingOtp(false);
        }
    };

    const handleBackToInput = () => {
        // Set previous auth mode based on the detected mode
        // This preserves the input type (email/phone) when going back
        setPreviousAuthMode(detectedAuthMode);

        // Go back to input step
        setAuthStep('input');
    };

    return {
        otpFormik,
        isSubmittingOtp,
        isResendingOtp,
        shouldShowCountdown,
        remainingCooldown,
        lastOtpRequestTime,
        detectedAuthMode,
        authIdentifier,
        handleResendOtp,
        handleBackToInput,
    };
};
