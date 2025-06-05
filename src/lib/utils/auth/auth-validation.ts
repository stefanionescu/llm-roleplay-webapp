import { ZodType } from 'zod';

import { AuthMode } from '@/hooks/auth/use-auth-form';
import { validatePhoneWithCountryCode } from '@/lib/utils/auth/auth-main';

/**
 * Check if form is valid without triggering validation errors
 */
export const isFormValid = (
    authMode: AuthMode,
    emailSchema: ZodType<{ email: string }>,
    emailValue: string,
    phoneValue: string,
    countryCode: string,
): boolean => {
    if (authMode === 'email') {
        return emailSchema.safeParse({
            email: emailValue,
        }).success;
    } else {
        return validatePhoneWithCountryCode(
            phoneValue,
            countryCode,
        );
    }
};

/**
 * Validate form and submit if valid
 */
export const validateAndSubmitForm = async (
    mode: AuthMode,
    emailFormik: {
        handleSubmit: () => void;
        validateForm: () => Promise<
            Record<string, unknown>
        >;
    },
    phoneFormik: {
        handleSubmit: () => void;
        validateForm: () => Promise<
            Record<string, unknown>
        >;
    },
): Promise<boolean> => {
    if (mode === 'email') {
        const errors = await emailFormik.validateForm();
        if (Object.keys(errors).length === 0) {
            void emailFormik.handleSubmit();
            return true;
        }
    } else {
        const errors = await phoneFormik.validateForm();
        if (Object.keys(errors).length === 0) {
            void phoneFormik.handleSubmit();
            return true;
        }
    }
    return false;
};
