import { useState } from 'react';
import { FormikProps } from 'formik';
import { useTranslations } from 'next-intl';

import { validateOtp } from '@/lib/utils/otp/otp-main';
import { resetOtpFormForNewAttempt } from '@/lib/utils/otp/otp-form';

type UseOtpVerificationProps = {
    clearOtpFields: () => void;
    canRequestOtp: () => boolean;
    onResendOtp?: () => Promise<void>;
    otpFormik: FormikProps<{ otp: string }>;
    onVerifyOtp?: (otp: string) => Promise<void>;
};

/**
 * Hook for OTP verification functionality
 * Provides verification and resend capabilities with error handling
 */
export const useOtpVerification = ({
    otpFormik,
    canRequestOtp,
    clearOtpFields,
    onVerifyOtp,
    onResendOtp,
}: UseOtpVerificationProps) => {
    const t = useTranslations();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);

    /**
     * Function to verify OTP
     */
    const verifyOtp = async (otp: string) => {
        try {
            setIsSubmitting(true);
            otpFormik.setErrors({});

            // Validate OTP format before sending to server
            if (!validateOtp(otp)) {
                otpFormik.setFieldError(
                    'otp',
                    t('error.otpMessage'),
                );
                setIsSubmitting(false);
                return;
            }

            // Use external handler or simulate success
            if (onVerifyOtp) {
                await onVerifyOtp(otp);
            } else {
                await new Promise((resolve) =>
                    setTimeout(resolve, 1000),
                );
            }

            setIsSubmitting(false);
        } catch {
            otpFormik.setFieldError(
                'otp',
                t('error.invalidVerificationCode'),
            );
            setIsSubmitting(false);
        }
    };

    /**
     * Handle resend OTP
     */
    const handleResendOtp = async () => {
        try {
            // Check cooldown period for OTP resends
            if (!canRequestOtp()) {
                return;
            }

            setIsResending(true);
            clearOtpFields();

            // Resetting form values and errors
            resetOtpFormForNewAttempt(otpFormik);

            // Use external handler or simulate success
            if (onResendOtp) {
                await onResendOtp();
            } else {
                await new Promise((resolve) =>
                    setTimeout(resolve, 1000),
                );
            }

            setIsResending(false);
        } catch {
            setIsResending(false);
        }
    };

    return {
        isSubmitting,
        isResending,
        verifyOtp,
        handleResendOtp,
    };
};
