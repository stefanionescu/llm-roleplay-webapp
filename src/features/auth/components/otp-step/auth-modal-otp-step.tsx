'use client';

import { Flex } from '@/components/ui/flex';
import { useOtpForm } from '@/hooks/otp/use-otp-form';
import { useOtpInput } from '@/hooks/otp/use-otp-input';

// Import our UI components
import { OtpHeader } from './otp-header';
import { OtpInputFields } from './otp-input-fields';
import { OtpResendOption } from './otp-resend-option';
import { OtpConfirmButton } from './otp-confirm-button';

export const AuthModalOTPStep = () => {
    const {
        otpFormik,
        isSubmittingOtp,
        isResendingOtp,
        lastOtpRequestTime,
        detectedAuthMode,
        authIdentifier,
        handleResendOtp,
        handleBackToInput,
    } = useOtpForm();

    // Use our OTP input hook
    const {
        otpInputRefs,
        handleOtpInputChange,
        handleOtpKeyDown,
        handleOtpPaste,
    } = useOtpInput({
        formik: otpFormik,
        isSubmitting: isSubmittingOtp,
    });

    return (
        <Flex
            direction="col"
            className="w-full items-center"
        >
            {/* Header section with back button and title */}
            <OtpHeader
                authMode={detectedAuthMode}
                authIdentifier={authIdentifier}
                isSubmitting={isSubmittingOtp}
                onBackClick={handleBackToInput}
            />

            {/* OTP input fields */}
            <OtpInputFields
                formik={otpFormik}
                isSubmitting={isSubmittingOtp}
                otpInputRefs={otpInputRefs}
                onInputChange={handleOtpInputChange}
                onKeyDown={handleOtpKeyDown}
                onPaste={handleOtpPaste}
            />

            {/* Confirm button */}
            <OtpConfirmButton
                isSubmitting={isSubmittingOtp}
                isOtpComplete={
                    otpFormik.values.otp.length === 6
                }
                onClick={() => otpFormik.handleSubmit()}
                hasError={!!otpFormik.errors.otp}
            />

            {/* Resend option */}
            <OtpResendOption
                isResending={isResendingOtp}
                onResend={handleResendOtp}
                lastOtpRequestTime={lastOtpRequestTime}
            />
        </Flex>
    );
};
