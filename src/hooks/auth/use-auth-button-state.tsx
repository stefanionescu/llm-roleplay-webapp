import { FormikProps } from 'formik';

import { AuthMode } from '@/hooks/auth/use-auth-form';

type UseAuthButtonStateProps = {
    authMode: AuthMode;
    isSubmitting: boolean;
    isFormValid: () => boolean;
    isManualVerificationNeeded?: boolean;
    emailFormik: FormikProps<{ email: string }>;
    phoneFormik: FormikProps<{ phone: string }>;
};

export const useAuthButtonState = ({
    authMode,
    isSubmitting,
    isFormValid,
    emailFormik,
    phoneFormik,
}: UseAuthButtonStateProps) => {
    const isContinueButtonDisabled = () => {
        // Disable if submission is in progress
        if (isSubmitting) return true;

        // Check if the basic input is valid
        const hasValidInput =
            authMode === 'email'
                ? Boolean(emailFormik.values.email) &&
                  isFormValid()
                : Boolean(phoneFormik.values.phone) &&
                  isFormValid();

        // If input is not valid, disable the button
        if (!hasValidInput) return true;

        // Check for form errors
        if (
            (authMode === 'email' &&
                emailFormik.errors.email) ||
            (authMode === 'phone' &&
                phoneFormik.errors.phone)
        ) {
            return true;
        }

        return false;
    };

    return {
        isContinueButtonDisabled,
    };
};
