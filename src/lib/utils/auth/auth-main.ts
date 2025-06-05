import { isValidPhoneNumber } from 'libphonenumber-js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

import { supabase } from '@/lib/supabase/client';
import { AuthProcessResult } from '@/types/auth';
import { increaseAnonSessionMessagesSchema } from '@/validators/auth';

export const validatePhoneWithCountryCode = (
    phoneNumber: string,
    countryCode: string,
): boolean => {
    if (!phoneNumber) return false;

    try {
        // Get the country code without the + sign for proper formatting
        const countryCodeWithoutPlus = countryCode.replace(
            '+',
            '',
        );

        // Create a complete phone number with the country code
        const fullPhoneNumber = `+${countryCodeWithoutPlus}${phoneNumber}`;

        // Validate the phone number using libphonenumber-js
        return isValidPhoneNumber(fullPhoneNumber);
    } catch {
        return false;
    }
};

export async function isFullyAuthenticated() {
    const response = await supabase?.auth.getUser();
    if (!response) return false;
    const {
        data: { user },
    } = response;
    return user && user.is_anonymous !== true;
}

export function increaseAnonSessions() {
    const key = `anonSessionsCreated`;
    const currentCount = parseInt(
        localStorage.getItem(key) || '0',
        10,
    );

    // Increment and save back to localStorage
    localStorage.setItem(
        key,
        (currentCount + 1).toString(),
    );
}

export function increaseAnonSessionMessages(
    sessionId: string,
) {
    if (!supabase)
        throw new Error('Supabase client not initialized');

    // Validate the sessionId
    const result =
        increaseAnonSessionMessagesSchema.safeParse({
            sessionId,
        });
    if (!result.success) {
        throw new Error('Invalid session ID format');
    }

    // Construct the key for this specific session's message count
    const key = `anonSessionMessages:${sessionId}`;
    const currentCount = parseInt(
        localStorage.getItem(key) || '0',
        10,
    );

    // Increment and save back to localStorage
    localStorage.setItem(
        key,
        (currentCount + 1).toString(),
    );
}

export function getAnonSessionsCreated() {
    const key = `anonSessionsCreated`;
    return parseInt(localStorage.getItem(key) || '0', 10);
}

export function getAnonSessionMessages(
    sessionId: string | null | undefined,
) {
    if (!sessionId) return 0;

    // Validate the sessionId
    const result =
        increaseAnonSessionMessagesSchema.safeParse({
            sessionId,
        });
    if (!result.success) {
        throw new Error('Invalid session ID format');
    }

    // Construct the key for this specific session's message count
    const key = `anonSessionMessages:${sessionId}`;
    return parseInt(localStorage.getItem(key) || '0', 10);
}

export async function anonUserCanChat(
    sessionId: string | null | undefined,
    sessionsLimit: number,
    messagesLimit: number,
): Promise<boolean> {
    // First check if user is fully authenticated (not anonymous)
    if (await isFullyAuthenticated()) {
        return true;
    }

    // Validate the sessionId
    if (sessionId) {
        const result =
            increaseAnonSessionMessagesSchema.safeParse({
                sessionId,
            });
        if (!result.success) {
            throw new Error('Invalid session ID format');
        }
    }

    // Get current session message count
    if (sessionId) {
        const sessionMessages =
            getAnonSessionMessages(sessionId);

        if (sessionMessages + 1 > messagesLimit) {
            return false;
        }
    }

    // Get total sessions count
    const totalSessions = getAnonSessionsCreated();

    if (totalSessions + 1 > sessionsLimit) {
        return false;
    }

    return true;
}

/**
 * Format a phone number with a country code
 */
export const formatPhoneWithCountryCode = (
    phone: string,
    countryCode: string,
): string => {
    if (!phone) return '';

    try {
        // Ensure countryCode starts with +
        const formattedCountryCode = countryCode.startsWith(
            '+',
        )
            ? countryCode
            : `+${countryCode}`;

        // Remove countryCode if it's already in the phone number
        const phoneWithoutCode = phone.startsWith(
            formattedCountryCode,
        )
            ? phone.slice(formattedCountryCode.length)
            : phone;

        // Return the formatted phone
        return `${formattedCountryCode}${phoneWithoutCode}`;
    } catch {
        return phone;
    }
};

/**
 * Extracts error wait time from Supabase error messages
 */
export const extractWaitTimeFromError = (
    errorMessage: string,
): { unit: string; waitTime: string } => {
    // Default values
    let waitTime = '60';
    let unit = 'seconds';

    // Try to extract wait time from the error message
    const waitTimeMatch =
        /(\d+)\s*(?:second|minute|hour)/i.exec(
            errorMessage,
        );
    if (waitTimeMatch) {
        waitTime = waitTimeMatch[1];
    }

    // Determine the time unit
    if (errorMessage.toLowerCase().includes('minute')) {
        unit = 'minutes';
    } else if (
        errorMessage.toLowerCase().includes('hour')
    ) {
        unit = 'hours';
    }

    // Use singular form for 1 second/minute/hour
    if (waitTime === '1') {
        unit = unit.slice(0, -1); // Remove the 's' at the end
    }

    return { waitTime, unit };
};

/**
 * Check if an identifier is an email or phone number
 */
export const isEmailIdentifier = (
    identifier: string,
): boolean => {
    return identifier.includes('@');
};

/**
 * Standardize a phone number to E.164 format
 */
export const standardizePhoneNumber = (
    phone: string,
): string => {
    try {
        const parsedNumber =
            parsePhoneNumberFromString(phone);
        if (parsedNumber) {
            return parsedNumber.format('E.164');
        }
    } catch {}

    // Return original if parsing fails
    return phone;
};

export const handleAuthProcess = async (
    authFn: () => Promise<AuthProcessResult>,
    setIsSubmitting: (value: boolean) => void,
    setIsUsingSignInWithOtp: (value: boolean) => void,
): Promise<boolean> => {
    try {
        setIsSubmitting(true);
        const result = await authFn();

        if (!result.success) {
            throw new Error(
                result.error instanceof Error
                    ? result.error.message
                    : 'Authentication failed',
            );
        }

        setIsUsingSignInWithOtp(
            result.isUsingSignInWithOtp,
        );
        return true;
    } catch (error) {
        setIsSubmitting(false);
        throw error;
    }
};

export const handleVerificationProcess = async (
    identifier: string,
    setIsSubmitting: (value: boolean) => void,
    setAuthIdentifier: (value: string | null) => void,
    updateLastOtpRequestTime: () => void,
    authFn: () => Promise<AuthProcessResult>,
    setIsUsingSignInWithOtp: (value: boolean) => void,
): Promise<boolean> => {
    try {
        setIsSubmitting(true);
        setAuthIdentifier(identifier);
        updateLastOtpRequestTime();

        const result = await authFn();
        if (!result.success) {
            throw new Error(
                result.error instanceof Error
                    ? result.error.message
                    : 'Authentication failed',
            );
        }

        setIsUsingSignInWithOtp(
            result.isUsingSignInWithOtp,
        );
        return true;
    } catch (error) {
        setIsSubmitting(false);
        setAuthIdentifier(null);
        throw error;
    }
};

export const clearAnonSessionData = () => {
    // Clear the total sessions counter
    localStorage.removeItem('anonSessionsCreated');

    // Clear all session message counts
    // Get all keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Remove any keys that match our session messages pattern
        if (key?.startsWith('anonSessionMessages:')) {
            localStorage.removeItem(key);
        }
    }
};
