import { useFormik } from 'formik';
import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import { toFormikValidationSchema } from 'zod-formik-adapter';

// Import our custom hooks
import { useAuthState } from '@/hooks/auth/use-auth-state';
import { useAuthVerification } from '@/hooks/auth/use-auth-verification';
import { useRegistrationStatus } from '@/hooks/auth/use-registration-status';
import { useVerificationHandler } from '@/hooks/auth/use-verification-handler';
import {
    createEmailSchema,
    createPhoneSchema,
} from '@/validators/auth';
import {
    isFormValid as checkFormValidity,
    validateAndSubmitForm,
} from '@/lib/utils/auth/auth-validation';
import {
    formatPhoneWithCountryCode,
    validatePhoneWithCountryCode,
    handleAuthProcess,
} from '@/lib/utils/auth/auth-main';
import {
    proceedWithEmailAuth as proceedWithEmailAuthUtil,
    proceedWithPhoneAuth as proceedWithPhoneAuthUtil,
} from '@/lib/utils/otp/otp-main';

export type AuthMode = 'email' | 'phone';

type UseAuthFormProps = {
    initialAuthMode?: AuthMode;
    onSubmitEmail?: (email: string) => Promise<void>;
    onSubmitPhone?: (
        phone: string,
        countryCode: string,
    ) => Promise<void>;
};

export const useAuthForm = ({
    initialAuthMode = 'email',
    onSubmitEmail,
    onSubmitPhone,
}: UseAuthFormProps) => {
    const t = useTranslations();
    const [authMode, setAuthMode] =
        useState<AuthMode>(initialAuthMode);
    const [countryCode, setCountryCode] = useState('+1');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track error dismissal timeout
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(
        null,
    );

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
        };
    }, []);

    // Get auth state using custom hook
    const {
        authIdentifier,
        setAuthIdentifier,
        authResendCountdown,
        setAuthResendCountdown,
        isUsingSignInWithOtp,
        setIsUsingSignInWithOtp,
        setAuthStep,
        updateAuthState,
        handleWaitlistStatus,
        handleOtpSent,
    } = useAuthState();

    // Create schemas with translated error messages
    const translatedEmailSchema = createEmailSchema({
        invalidEmailFormat: t('error.invalidEmailFormat'),
        emailTooLong: t('error.emailTooLong'),
    });

    const translatedPhoneSchema = createPhoneSchema({
        invalidPhoneNumber: t('error.invalidPhoneNumber'),
    });

    // Email form setup
    const emailFormik = useFormik({
        initialValues: {
            email: '',
        },
        validateOnBlur: false,
        validateOnChange: false,
        validationSchema: toFormikValidationSchema(
            translatedEmailSchema,
        ),
        onSubmit: async (values) => {
            if (!values.email) return;

            try {
                await handleVerificationSuccess(
                    values.email,
                );
                if (onSubmitEmail) {
                    await onSubmitEmail(values.email);
                }
            } catch {
                setIsSubmitting(false);
            }
        },
    });

    // Phone form setup
    const phoneFormik = useFormik({
        initialValues: {
            phone: '',
        },
        validateOnBlur: false,
        validateOnChange: false,
        validationSchema: toFormikValidationSchema(
            translatedPhoneSchema,
        ),
        onSubmit: async (values) => {
            if (!values.phone) return;

            try {
                const fullPhone =
                    formatPhoneWithCountryCode(
                        values.phone,
                        countryCode,
                    );
                await handleVerificationSuccess(fullPhone);
                if (onSubmitPhone) {
                    await onSubmitPhone(
                        values.phone,
                        countryCode,
                    );
                }
            } catch {
                setIsSubmitting(false);
            }
        },
        validate: (values) => {
            const errors: { phone?: string } = {};

            if (values.phone) {
                if (
                    !validatePhoneWithCountryCode(
                        values.phone,
                        countryCode,
                    )
                ) {
                    errors.phone = t(
                        'error.invalidPhoneNumber',
                    );
                }
            }

            return errors;
        },
    });

    // Get verification handler using custom hook
    const { handleVerificationSuccess } =
        useVerificationHandler({
            authMode,
            setIsSubmitting,
            updateAuthState,
            emailFormik,
            phoneFormik,
            errorTimeoutRef,
        });

    // Get registration status handler using custom hook
    useRegistrationStatus({
        authIdentifier,
        isSubmitting,
        authMode,
        emailFormik,
        phoneFormik,
        errorTimeoutRef,
        setIsSubmitting,
        setAuthIdentifier,
        handleWaitlistStatus,
        handleOtpSent,
    });

    // Get verification functions using custom hook
    const { handleVerifyOtp, resendOtp } =
        useAuthVerification({
            authIdentifier,
            isUsingSignInWithOtp,
            setAuthIdentifier,
            setIsUsingSignInWithOtp,
            setAuthStep,
        });

    // Wrapper functions for auth processing
    const proceedWithEmailAuth = async (email: string) => {
        return handleAuthProcess(
            () => proceedWithEmailAuthUtil(email),
            setIsSubmitting,
            setIsUsingSignInWithOtp,
        );
    };

    const proceedWithPhoneAuth = async (phone: string) => {
        return handleAuthProcess(
            () => proceedWithPhoneAuthUtil(phone),
            setIsSubmitting,
            setIsUsingSignInWithOtp,
        );
    };

    // Handle mode switch
    const handleSwitchMode = () => {
        setAuthMode(
            authMode === 'email' ? 'phone' : 'email',
        );
    };

    // Handle form submission
    const handleSubmit = async () => {
        try {
            await validateAndSubmitForm(
                authMode,
                emailFormik,
                phoneFormik,
            );
        } catch {}
    };

    // Check if form is valid
    const isFormValid = () => {
        return checkFormValidity(
            authMode,
            translatedEmailSchema,
            emailFormik.values.email,
            phoneFormik.values.phone,
            countryCode,
        );
    };

    return {
        authMode,
        countryCode,
        isSubmitting,
        emailFormik,
        phoneFormik,
        isUsingSignInWithOtp,
        setCountryCode,
        handleSwitchMode,
        handleSubmit,
        isFormValid,
        resendCountdown: authResendCountdown,
        setResendCountdown: setAuthResendCountdown,
        handleVerificationSuccess,
        proceedWithEmailAuth,
        proceedWithPhoneAuth,
        resendOtp,
        handleVerifyOtp,
    };
};
