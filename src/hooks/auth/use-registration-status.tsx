import { FormikProps } from 'formik';
import { useTranslations } from 'next-intl';
import { useEffect, useCallback } from 'react';

import { trpc } from '@/trpc/client';
import { setFormErrorByAuthMode } from '@/lib/utils/auth/auth-form';
import { validateRegistrationStatus } from '@/lib/utils/auth/auth-form';

import { AuthMode } from './use-auth-form';

type UseRegistrationStatusProps = {
    authMode: AuthMode;
    isSubmitting: boolean;
    authIdentifier: string | null;
    emailFormik: FormikProps<{ email: string }>;
    handleOtpSent: (authMode: AuthMode) => void;
    setIsSubmitting: (isSubmitting: boolean) => void;
    handleWaitlistStatus: (position: number) => void;
    setAuthIdentifier: (identifier: string | null) => void;
    errorTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
    phoneFormik: FormikProps<{
        phone: string;
        countryCode?: string;
    }>;
};

type RegistrationError = {
    message: string;
};

/**
 * Hook to handle registration status verification and error handling
 */
export const useRegistrationStatus = ({
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
}: UseRegistrationStatusProps) => {
    const t = useTranslations();

    // Create a wrapper function that makes t compatible with what validateRegistrationStatus expects
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

    // Set up the API call correctly using TRPC
    const { data: registrationStatus } =
        trpc.auth.checkRegistrationStatus.useQuery(
            { identifier: authIdentifier || '' },
            {
                enabled: !!authIdentifier, // Only run the query when identifier is set
                retry: false, // Don't retry on error
                staleTime: 0, // Force refetch on every call, never use cache
                refetchOnMount: false, // Never refetch when component mounts
                refetchOnWindowFocus: false, // Never refetch when window regains focus
                refetchOnReconnect: false, // Never refetch when reconnecting
            },
        );

    /**
     * Handle registration status errors
     */
    const handleRegistrationStatusError = useCallback(
        (error: unknown) => {
            const registrationError =
                error as RegistrationError;
            setFormErrorByAuthMode(
                emailFormik,
                phoneFormik,
                authMode,
                registrationError.message ||
                    t('error.failedToSendCode'),
                errorTimeoutRef,
            );

            setIsSubmitting(false);
            setAuthIdentifier(null);
        },
        [
            authMode,
            t,
            emailFormik,
            phoneFormik,
            errorTimeoutRef,
            setIsSubmitting,
            setAuthIdentifier,
        ],
    );

    // React to registration status changes
    useEffect(() => {
        if (
            !registrationStatus ||
            isSubmitting === false ||
            !authIdentifier
        ) {
            return;
        }

        try {
            const {
                registered_normal_signup,
                on_waitlist,
            } = validateRegistrationStatus(
                registrationStatus,
                tAdapter,
            );

            if (
                !registered_normal_signup &&
                on_waitlist &&
                registrationStatus.waitlist_position > 0
            ) {
                handleWaitlistStatus(
                    registrationStatus.waitlist_position,
                );
                return;
            }

            handleOtpSent(authMode);
        } catch (error) {
            handleRegistrationStatusError(error);
        }
    }, [
        registrationStatus,
        isSubmitting,
        authIdentifier,
        tAdapter,
        handleWaitlistStatus,
        handleOtpSent,
        handleRegistrationStatusError,
        authMode,
    ]);

    return {
        registrationStatus,
        handleRegistrationStatusError,
    };
};
