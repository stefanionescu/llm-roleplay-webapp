import { useCallback } from 'react';
import { FormikProps } from 'formik';
import { useTranslations } from 'next-intl';

import { AuthMode } from '@/hooks/auth/use-auth-form';
import { processAuthError } from '@/lib/utils/auth/auth-form';
import { isEmailIdentifier } from '@/lib/utils/auth/auth-main';
import {
    proceedWithEmailAuth as proceedWithEmailAuthUtil,
    proceedWithPhoneAuth as proceedWithPhoneAuthUtil,
} from '@/lib/utils/otp/otp-main';

type UseVerificationHandlerProps = {
    authMode: AuthMode;
    setIsSubmitting: (value: boolean) => void;
    emailFormik: FormikProps<{ email: string }>;
    errorTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
    phoneFormik: FormikProps<{
        phone: string;
        countryCode?: string;
    }>;
    updateAuthState: (
        identifier: string,
        isSignInWithOtp: boolean,
    ) => void;
};

/**
 * Hook to handle auth verification success
 */
export const useVerificationHandler = ({
    authMode,
    setIsSubmitting,
    updateAuthState,
    emailFormik,
    phoneFormik,
    errorTimeoutRef,
}: UseVerificationHandlerProps) => {
    const t = useTranslations();

    // Create a wrapper function that makes t compatible with what processAuthError expects
    const tAdapter = useCallback(
        (key: string, params?: Record<string, unknown>) => {
            return t(
                key,
                params as Record<
                    string,
                    string | number | Date
                >,
            );
        },
        [t],
    );

    /**
     * Handle successful verification
     */
    const handleVerificationSuccess = useCallback(
        async (id: string) => {
            try {
                // Determine if we're dealing with an email or phone
                const isEmail = isEmailIdentifier(id);

                // Call the appropriate auth function
                const authFn = isEmail
                    ? proceedWithEmailAuthUtil
                    : proceedWithPhoneAuthUtil;

                setIsSubmitting(true);

                const result = await authFn(id);
                if (!result.success) {
                    throw new Error(
                        result.error instanceof Error
                            ? result.error.message
                            : 'Authentication failed',
                    );
                }

                updateAuthState(
                    id,
                    result.isUsingSignInWithOtp,
                );
                return true;
            } catch (error) {
                processAuthError(
                    error,
                    authMode,
                    tAdapter,
                    emailFormik,
                    phoneFormik,
                    errorTimeoutRef,
                );
                return false;
            }
        },
        [
            setIsSubmitting,
            updateAuthState,
            authMode,
            tAdapter,
            emailFormik,
            phoneFormik,
            errorTimeoutRef,
        ],
    );

    return {
        handleVerificationSuccess,
    };
};
