import { FormikHelpers } from 'formik';

type FormField = 'email' | 'phone';

export type FormValues = Record<string, unknown>;

export type EmailFormValues = {
    email: string;
} & FormValues;

export type PhoneFormValues = {
    phone: string;
} & FormValues;

export const clearFormError = <T extends FormValues>(
    formik: FormikHelpers<T>,
    field: keyof T & string,
) => {
    formik.setFieldError(field, '');
};

export const setFormError = <T extends FormValues>(
    formik: FormikHelpers<T>,
    field: keyof T & string,
    errorMessage: string,
) => {
    formik.setFieldError(field, errorMessage);
};

export const setErrorWithDismissal = (
    emailFormik: FormikHelpers<EmailFormValues>,
    phoneFormik: FormikHelpers<PhoneFormValues>,
    field: FormField,
    errorMessage: string,
    timeoutRef: { current: NodeJS.Timeout | null },
) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }

    // Set the error based on field
    if (field === 'email') {
        setFormError(emailFormik, 'email', errorMessage);
    } else {
        setFormError(phoneFormik, 'phone', errorMessage);
    }

    // Set a new timeout to clear the error
    timeoutRef.current = setTimeout(() => {
        if (field === 'email') {
            clearFormError(emailFormik, 'email');
        } else {
            clearFormError(phoneFormik, 'phone');
        }
        timeoutRef.current = null;
    }, 3000);
};
