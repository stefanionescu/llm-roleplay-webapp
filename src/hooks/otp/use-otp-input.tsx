import { useRef } from 'react';
import { FormikProps } from 'formik';

type UseOtpInputProps = {
    isSubmitting: boolean;
    formik: FormikProps<{ otp: string }>;
};

export const useOtpInput = ({
    formik,
    isSubmitting,
}: UseOtpInputProps) => {
    const otpInputRefs = useRef<
        (HTMLInputElement | null)[]
    >([null, null, null, null, null, null]);

    // Handle OTP input change
    const handleOtpInputChange = (
        index: number,
        value: string,
    ) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        // Clear any previous errors when user starts typing again
        if (formik.errors.otp) {
            formik.setErrors({});
        }

        // Update the OTP value
        const newOtp = formik.values.otp.split('');
        newOtp[index] = value;
        const otpString = newOtp.join('');
        void formik.setFieldValue('otp', otpString, false);

        // Auto-focus next input
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }

        // If all digits are filled, validate and auto-submit if valid
        if (otpString.length === 6) {
            // Validate the OTP
            const isValid = /^\d{6}$/.test(otpString);
            if (isValid && !isSubmitting) {
                // Remove any active element focus to prevent modal from being focused
                if (
                    document.activeElement instanceof
                    HTMLElement
                ) {
                    document.activeElement.blur();
                }

                // Auto-submit after a short delay to allow the user to see what they entered
                setTimeout(() => {
                    void formik.handleSubmit();
                }, 300);
            }
        }
    };

    // Handle backspace key in OTP inputs
    const handleOtpKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            if (!formik.values.otp[index] && index > 0) {
                otpInputRefs.current[index - 1]?.focus();
            }
        }

        // Handle Enter key - prevent default behavior and focus on modal
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();

            // Remove focus from input fields to prevent modal from getting focus
            if (
                document.activeElement instanceof
                HTMLElement
            ) {
                document.activeElement.blur();
            }

            // If OTP is complete, submit the form
            if (
                formik.values.otp.length === 6 &&
                !isSubmitting
            ) {
                setTimeout(() => {
                    void formik.handleSubmit();
                }, 10);
            }
        }
    };

    // Handle paste in OTP inputs
    const handleOtpPaste = (
        e: React.ClipboardEvent<HTMLInputElement>,
    ) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        if (!pastedData || !/^\d+$/.test(pastedData))
            return;

        const otpDigits = pastedData.slice(0, 6).split('');
        const newOtp = Array(6).fill('');

        otpDigits.forEach((digit, index) => {
            if (index < 6) {
                newOtp[index] = digit;
            }
        });

        void formik.setFieldValue(
            'otp',
            newOtp.join(''),
            false,
        );

        // Focus the last filled input or the next empty one
        const lastIndex = Math.min(otpDigits.length - 1, 5);
        otpInputRefs.current[lastIndex]?.focus();
    };

    // Clear OTP fields and errors
    const clearOtpFields = () => {
        // Clear formik state for OTP
        void formik.setFieldValue('otp', '', false);
        formik.setErrors({});

        // Clear all input field DOM elements directly
        otpInputRefs.current.forEach((input) => {
            if (input) {
                input.value = '';
            }
        });
    };

    return {
        otpInputRefs,
        handleOtpInputChange,
        handleOtpKeyDown,
        handleOtpPaste,
        clearOtpFields,
    };
};
