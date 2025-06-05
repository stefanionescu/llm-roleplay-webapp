import { FormikProps } from 'formik';

import { setOtpErrorWithDismissal } from '@/lib/utils/otp/otp-form';

/**
 * Handle specific OTP error cases with appropriate error messages
 */
export const handleOtpError = (
    error: unknown,
    t: (
        key: string,
        params?: Record<string, string | number | Date>,
    ) => string,
    formik: FormikProps<{ otp: string }>,
    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
): void => {
    // Check for specific error messages
    if (
        error instanceof Error &&
        error.message ===
            'Maximum email requests limit exceeded. Please try again later.'
    ) {
        setOtpErrorWithDismissal(
            formik,
            t('error.codeRequestLimitExceeded'),
            timeoutRef,
        );
    } else if (
        error instanceof Error &&
        error.message === 'Token has expired or is invalid'
    ) {
        setOtpErrorWithDismissal(
            formik,
            t('error.invalidOtp'),
            timeoutRef,
        );
    } else {
        // Set general error message
        setOtpErrorWithDismissal(
            formik,
            error instanceof Error
                ? error.message
                : t('error.invalidVerificationCode'),
            timeoutRef,
        );
    }
};

/**
 * Handle cooldown error when attempting to resend OTP
 */
export const handleCooldownError = (
    remainingCooldown: number,
    t: (
        key: string,
        params?: Record<string, string | number | Date>,
    ) => string,
    formik: FormikProps<{ otp: string }>,
    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
): void => {
    const unitKey =
        remainingCooldown === 1 ? 'second' : 'seconds';
    const unit = t(`common.timeUnits.${unitKey}`);
    const errorMessage = t('error.waitBeforeRequesting', {
        waitTime: remainingCooldown.toString(),
        unit: unit,
    });

    setOtpErrorWithDismissal(
        formik,
        errorMessage,
        timeoutRef,
    );
};

/**
 * Handle errors during OTP resend attempts
 */
export const handleResendOtpError = (
    error: unknown,
    t: (
        key: string,
        params?: Record<string, string | number | Date>,
    ) => string,
    formik: FormikProps<{ otp: string }>,
    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
): void => {
    const errorMessage =
        error instanceof Error
            ? error.message
            : t('error.failedToSendCode');

    // Check if the error is about maximum email requests limit exceeded
    if (
        error instanceof Error &&
        error.message ===
            'Maximum email requests limit exceeded. Please try again later.'
    ) {
        setOtpErrorWithDismissal(
            formik,
            t('error.codeRequestLimitExceeded'),
            timeoutRef,
        );
    } else {
        // Set other error messages
        setOtpErrorWithDismissal(
            formik,
            errorMessage,
            timeoutRef,
        );
    }
};
