import { z } from 'zod';

import { authConstants } from '@/config';

export const increaseAnonSessionMessagesSchema = z.object({
    sessionId: z.string().uuid(),
});

// Registration status check schema
export const checkRegistrationStatusSchema = z.object({
    identifier: z.string(),
});

// Type for translation error messages
export type ValidationErrorMessages = {
    emailTooLong: string;
    invalidEmailFormat: string;
    invalidPhoneNumber: string;
};

// Schema factory functions that accept error messages as parameters
export const createEmailSchema = (
    errorMessages: Pick<
        ValidationErrorMessages,
        'invalidEmailFormat' | 'emailTooLong'
    >,
) =>
    z.object({
        email: z
            .string()
            .email(errorMessages.invalidEmailFormat)
            .max(
                authConstants.maxEmailLength,
                errorMessages.emailTooLong,
            ),
    });

// Type definition for the context we'll pass to the phoneSchema
export type PhoneValidationContext = {
    countryCode?: string;
};

export const createPhoneSchema = (
    errorMessages: Pick<
        ValidationErrorMessages,
        'invalidPhoneNumber'
    >,
) =>
    z.object({
        phone: z.string().refine((_value) => {
            // Basic validation in the schema
            // The complex validation with country code will be handled in the component
            return true;
        }, errorMessages.invalidPhoneNumber),
    });

// Backward compatibility for existing code
export const emailSchema = createEmailSchema({
    invalidEmailFormat: 'error.invalidEmailFormat',
    emailTooLong: 'error.emailTooLong',
});

export const phoneSchema = createPhoneSchema({
    invalidPhoneNumber: 'error.invalidPhoneNumber',
});

// OTP validation schema
export const createOtpSchema = (errorMessage: string) =>
    z.object({
        otp: z.string().length(6, errorMessage),
    });

// Default OTP schema for backward compatibility
export const otpSchema = createOtpSchema(
    'error.invalidVerificationCode',
);
