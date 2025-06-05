import { useTranslations } from 'next-intl';
import React, { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Flex } from '@/components/ui/flex';
import { Type } from '@/components/ui/type';
import { useStore } from '@/lib/zustand/store';
import { useAuthForm } from '@/hooks/auth/use-auth-form';
import { useAuthInput } from '@/hooks/auth/use-auth-input';
import { useAuthButtonState } from '@/hooks/auth/use-auth-button-state';

import { InputHeader } from './input-header';
import { AuthEmailForm } from './auth/auth-email-form';
import { AuthPhoneForm } from './auth/auth-phone-form';
import { AuthTermsPrivacy } from './auth/auth-terms-privacy';
import { AuthContinueButton } from './auth/auth-continue-button';
import { AuthSwitchModeButton } from './auth/auth-switch-mode-button';

export const AuthModalInputStep = () => {
    const t = useTranslations();

    // Track error dismissal timeouts
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(
        null,
    );

    // Get auth state from the store using shallow equality
    const {
        previousAuthMode,
        setAuthStep,
        canRequestOtp,
        setLastOtpRequestTime,
    } = useStore(
        useShallow((state) => ({
            previousAuthMode: state.previousAuthMode,
            setAuthStep: state.setAuthStep,
            canRequestOtp: state.canRequestOtp,
            setLastOtpRequestTime:
                state.setLastOtpRequestTime,
        })),
    );

    // Initialize auth form with the previous mode
    const {
        authMode,
        countryCode,
        isSubmitting,
        emailFormik,
        phoneFormik,
        setCountryCode,
        handleSwitchMode,
        handleSubmit: rawHandleSubmit,
        isFormValid,
        proceedWithEmailAuth,
        proceedWithPhoneAuth,
    } = useAuthForm({
        initialAuthMode: previousAuthMode,
    });

    // Create a void wrapper for the Promise-returning function
    const handleSubmit = () => {
        void rawHandleSubmit();
    };

    // Use our auth input hook
    const { updateIdentifier } = useAuthInput({
        authMode,
        countryCode,
        emailFormik,
        phoneFormik,
        handleSubmit,
    });

    // Use our auth button state hook
    const { isContinueButtonDisabled } = useAuthButtonState(
        {
            authMode,
            isSubmitting,
            isFormValid,
            emailFormik,
            phoneFormik,
        },
    );

    // Helper function to set error with auto-dismissal
    const setErrorWithDismissal = (
        errorMessage: string,
    ) => {
        // Clear any existing timeout
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = null;
        }

        // Set the error based on auth mode
        if (authMode === 'email') {
            emailFormik.setFieldError(
                'email',
                errorMessage,
            );
        } else {
            phoneFormik.setFieldError(
                'phone',
                errorMessage,
            );
        }

        // Set a new timeout to clear the error
        errorTimeoutRef.current = setTimeout(() => {
            if (authMode === 'email') {
                emailFormik.setFieldError('email', '');
            } else {
                phoneFormik.setFieldError('phone', '');
            }
            errorTimeoutRef.current = null;
        }, 3000);
    };

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
        };
    }, []);

    // Check if we're still in OTP cooldown period and show error if needed
    const checkOtpCooldown = () => {
        const { canRequest, remainingSeconds } =
            canRequestOtp();

        if (!canRequest) {
            // Format error message with remaining time
            const unitKey =
                remainingSeconds === 1
                    ? 'second'
                    : 'seconds';
            const unit = t(`common.timeUnits.${unitKey}`);

            const waitTimeText =
                remainingSeconds.toString();
            const errorMessage = t(
                'error.waitBeforeRequesting',
                {
                    waitTime: waitTimeText,
                    unit: unit,
                },
            );

            // Set error with auto-dismissal
            setErrorWithDismissal(errorMessage);
            return false;
        }

        return true;
    };

    // Process email authentication and handle navigation
    const processEmailAuth = async () => {
        try {
            // Set last OTP request time to current timestamp BEFORE proceeding with auth
            // This guarantees it's set before any async operations
            setLastOtpRequestTime(Date.now());

            await proceedWithEmailAuth(
                emailFormik.values.email,
            );

            // After successful auth, move to OTP step
            setAuthStep('otp');
            return true;
        } catch {
            // If auth fails, reset the lastOtpRequestTime
            setLastOtpRequestTime(0);
            // Errors will be handled by the respective function
            return false;
        }
    };

    // Process phone authentication and handle navigation
    const processPhoneAuth = async () => {
        try {
            await proceedWithPhoneAuth(
                `${countryCode}${phoneFormik.values.phone}`,
            );

            // Set last OTP request time to current timestamp BEFORE moving to OTP step
            // This guarantees it's set before navigation
            setLastOtpRequestTime(Date.now());

            // After successful auth, move to OTP step
            setAuthStep('otp');
            return true;
        } catch {
            // Errors will be handled by the respective function
            return false;
        }
    };

    // Process authentication based on the current auth mode
    const processAuth = async () => {
        return authMode === 'email'
            ? await processEmailAuth()
            : await processPhoneAuth();
    };

    // Handle clicking on continue button
    const handleContinueClick = async () => {
        // First check if we're still in cooldown period
        if (!checkOtpCooldown()) {
            return;
        }

        // Update the identifier in the Zustand store
        updateIdentifier();

        // Process authentication
        await processAuth();
    };

    return (
        <>
            {/* Header with title */}
            <InputHeader />

            <Flex
                gap="sm"
                direction="col"
                className="w-full items-center"
            >
                {/* Mode Switch Button */}
                <AuthSwitchModeButton
                    authMode={authMode}
                    onSwitchMode={handleSwitchMode}
                />

                <Type size="xs" textColor="primary">
                    {t('common.or')}
                </Type>

                {/* Form - either email or phone */}
                {authMode === 'email' ? (
                    <AuthEmailForm
                        formik={emailFormik}
                        isSubmitting={isSubmitting}
                        onEnterPress={handleContinueClick}
                    />
                ) : (
                    <AuthPhoneForm
                        formik={phoneFormik}
                        isSubmitting={isSubmitting}
                        countryCode={countryCode}
                        onCountryCodeChange={setCountryCode}
                        onEnterPress={handleContinueClick}
                    />
                )}

                {/* Continue Button */}
                <AuthContinueButton
                    onClick={handleContinueClick}
                    isSubmitting={isSubmitting}
                    disabled={isContinueButtonDisabled()}
                />

                {/* Terms and Privacy */}
                <AuthTermsPrivacy
                    isSubmitting={isSubmitting}
                />
            </Flex>
        </>
    );
};
