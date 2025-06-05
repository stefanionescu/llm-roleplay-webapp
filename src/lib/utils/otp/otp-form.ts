import { FormikProps } from 'formik';

import { authConstants } from '@/config';

/**
 * Calculate the remaining cooldown time for OTP requests
 */
export const calculateRemainingCooldown = (
    lastOtpRequestTime: number,
): number => {
    const currentTime = Date.now();
    const cooldownEndTime =
        lastOtpRequestTime +
        authConstants.otpCooldown * 1000;
    return Math.max(
        0,
        Math.ceil((cooldownEndTime - currentTime) / 1000),
    );
};

/**
 * Check if countdown should be shown based on last request time
 */
export const shouldShowOtpCountdown = (
    lastOtpRequestTime: number,
): boolean => {
    const currentTime = Date.now();
    const cooldownEndTime =
        lastOtpRequestTime +
        authConstants.otpCooldown * 1000;
    return currentTime < cooldownEndTime;
};

/**
 * Determine auth mode based on identifier format
 */
export const detectAuthMode = (
    identifier: string | null,
): 'email' | 'phone' => {
    if (!identifier) return 'email';
    return identifier.startsWith('+') ? 'phone' : 'email';
};

/**
 * Set form error with auto-dismissal
 */
export const setOtpErrorWithDismissal = (
    formik: FormikProps<{ otp: string }>,
    errorMessage: string,
    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
    dismissDelay = 3000,
): void => {
    // Clear any existing timeout
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }

    // Set the error
    formik.setFieldError('otp', errorMessage);

    // Set a new timeout to clear the error
    timeoutRef.current = setTimeout(() => {
        formik.setFieldError('otp', '');
        timeoutRef.current = null;
    }, dismissDelay);
};

/**
 * Format cooldown error message with translation
 */
export const formatCooldownErrorMessage = (
    remainingCooldown: number,
    t: (
        key: string,
        params?: Record<string, string | number | Date>,
    ) => string,
): string => {
    const unitKey =
        remainingCooldown === 1 ? 'second' : 'seconds';
    const unit = t(`common.timeUnits.${unitKey}`);
    const waitTimeText = remainingCooldown.toString();

    return t('error.waitBeforeRequesting', {
        waitTime: waitTimeText,
        unit: unit,
    });
};

/**
 * Reset OTP form state for a new verification attempt
 */
export const resetOtpFormForNewAttempt = (
    formik: FormikProps<{ otp: string }>,
): void => {
    // Clear any existing OTP values
    void formik.setValues({ otp: '' });
    // Clear existing errors
    formik.setErrors({});
};
