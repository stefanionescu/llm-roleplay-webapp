import { FormikProps } from 'formik';

import { useStore } from '@/lib/zustand/store';
import { AuthMode } from '@/hooks/auth/use-auth-form';

type UseAuthInputProps = {
    authMode: AuthMode;
    countryCode: string;
    handleSubmit: () => void;
    emailFormik: FormikProps<{ email: string }>;
    phoneFormik: FormikProps<{ phone: string }>;
};

export const useAuthInput = ({
    authMode,
    countryCode,
    emailFormik,
    phoneFormik,
    handleSubmit,
}: UseAuthInputProps) => {
    // Get auth identifier setter from Zustand store
    const setAuthIdentifier = useStore(
        (state) => state.setAuthIdentifier,
    );

    // Handle updating the identifier
    const updateIdentifier = () => {
        if (
            authMode === 'email' &&
            emailFormik.values.email
        ) {
            setAuthIdentifier(emailFormik.values.email);
            return emailFormik.values.email;
        } else if (
            authMode === 'phone' &&
            phoneFormik.values.phone
        ) {
            const fullPhone = `${countryCode}${phoneFormik.values.phone}`;
            setAuthIdentifier(fullPhone);
            return fullPhone;
        }
        return null;
    };

    // Handle form submission after all validations
    const submitAuthForm = () => {
        // Update identifier and then submit the form
        updateIdentifier();
        handleSubmit();
    };

    return {
        updateIdentifier,
        submitAuthForm,
    };
};
