import { FormikProps } from 'formik';

import { AuthMode } from '@/hooks/auth/use-auth-form';
import { setErrorWithDismissal } from '@/lib/utils/form';
import { extractWaitTimeFromError } from '@/lib/utils/auth/auth-main';
import {
    proceedWithEmailAuth as proceedWithEmailAuthUtil,
    proceedWithPhoneAuth as proceedWithPhoneAuthUtil,
} from '@/lib/utils/otp/otp-main';

type EmailFormValues = {
    email: string;
    [key: string]: unknown;
};

type PhoneFormValues = {
    phone: string;
    [key: string]: unknown;
};

/**
 * Set form error for the appropriate field (email or phone)
 */
export const setFormErrorByAuthMode = (
    emailFormik: FormikProps<EmailFormValues>,
    phoneFormik: FormikProps<PhoneFormValues>,
    authMode: AuthMode,
    errorMessage: string,
    errorTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
) => {
    setErrorWithDismissal(
        emailFormik,
        phoneFormik,
        authMode === 'email' ? 'email' : 'phone',
        errorMessage,
        errorTimeoutRef,
    );
};

/**
 * Handle rate limiting errors with translated messages
 */
export const handleRateLimitingError = (
    errorMessage: string,
    t: (
        key: string,
        params?: Record<string, unknown>,
    ) => string,
    emailFormik: FormikProps<EmailFormValues>,
    phoneFormik: FormikProps<PhoneFormValues>,
    authMode: AuthMode,
    errorTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
) => {
    const { waitTime, unit } =
        extractWaitTimeFromError(errorMessage);
    const translatedUnit = t(`common.timeUnits.${unit}`);
    const errorMsg = t('error.waitBeforeRequesting', {
        waitTime,
        unit: translatedUnit,
    });

    setFormErrorByAuthMode(
        emailFormik,
        phoneFormik,
        authMode,
        errorMsg,
        errorTimeoutRef,
    );
};

/**
 * Process authentication errors and display appropriate messages
 */
export const processAuthError = (
    error: unknown,
    authMode: AuthMode,
    t: (
        key: string,
        params?: Record<string, unknown>,
    ) => string,
    emailFormik: FormikProps<EmailFormValues>,
    phoneFormik: FormikProps<PhoneFormValues>,
    errorTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
) => {
    if (
        error instanceof Error &&
        (error.message.includes('wait') ||
            error.message.includes('For security purposes'))
    ) {
        handleRateLimitingError(
            error.message,
            t,
            emailFormik,
            phoneFormik,
            authMode,
            errorTimeoutRef,
        );
    } else {
        const errorMsg =
            error instanceof Error
                ? error.message
                : 'Verification failed';

        setFormErrorByAuthMode(
            emailFormik,
            phoneFormik,
            authMode,
            errorMsg,
            errorTimeoutRef,
        );
    }
    throw error;
};

/**
 * Resend OTP for a given identifier
 */
export const resendOtpForIdentifier = async (
    identifier: string,
    setIsUsingSignInWithOtp: (value: boolean) => void,
) => {
    let result;

    if (identifier.includes('@')) {
        result = await proceedWithEmailAuthUtil(identifier);
    } else {
        result = await proceedWithPhoneAuthUtil(identifier);
    }

    if (!result.success) {
        throw new Error(
            result.error instanceof Error
                ? result.error.message
                : 'Authentication failed',
        );
    }

    setIsUsingSignInWithOtp(result.isUsingSignInWithOtp);

    return true;
};

/**
 * Reset auth state after successful verification
 */
export const resetAuthStateAfterVerification = (
    setIsSubmitting: (value: boolean) => void,
    setAuthIdentifier: (value: null) => void,
    setIsUsingSignInWithOtp: (value: boolean) => void,
    setAuthStep: (
        value: 'input' | 'otp' | 'waitlist',
    ) => void,
) => {
    setIsSubmitting(false);
    setAuthIdentifier(null);
    setIsUsingSignInWithOtp(false);
    setAuthStep('input');
};

interface RegistrationStatus {
    on_waitlist?: boolean;
    registered_signup?: boolean;
    registered_normal_signup?: boolean;
}

/**
 * Validate registration status and handle errors
 */
export const validateRegistrationStatus = (
    status: RegistrationStatus,
    t: (
        key: string,
        params?: Record<string, unknown>,
    ) => string,
) => {
    const registered_normal_signup =
        status.registered_signup ||
        status.registered_normal_signup;
    const on_waitlist = status.on_waitlist || false;

    if (
        (registered_normal_signup && on_waitlist) ||
        (!registered_normal_signup && !on_waitlist)
    ) {
        throw new Error(t('error.failedToSendCode'));
    }

    return { registered_normal_signup, on_waitlist };
};
