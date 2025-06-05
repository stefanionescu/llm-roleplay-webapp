import { VerifyOtpParams } from '@supabase/supabase-js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

import { authConstants } from '@/config';
import { supabase } from '@/lib/supabase/client';

/**
 * Validates OTP to ensure it's 6 digits
 */
export const validateOtp = (otp: string): boolean => {
    return otp.length === 6 && /^\d+$/.test(otp);
};

/**
 * Format countdown time (e.g. "1:20" or "45s")
 */
export const formatCountdown = (
    seconds: number,
): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
        ? `${mins}:${secs.toString().padStart(2, '0')}`
        : `${secs}s`;
};

/**
 * Check if user can request another OTP based on cooldown
 */
export const canRequestOtp = (
    lastRequestTime: number,
    cooldownSeconds = authConstants.otpCooldown,
): {
    canRequest: boolean;
    remainingCooldown: number;
} => {
    const timeSinceLastRequest =
        Date.now() - lastRequestTime;
    const remainingCooldown = Math.max(
        0,
        cooldownSeconds * 1000 - timeSinceLastRequest,
    );

    return {
        canRequest: remainingCooldown <= 0,
        remainingCooldown: Math.ceil(
            remainingCooldown / 1000,
        ),
    };
};

/**
 * Handle proceeding with email auth - attempts to update email or sign in
 */
export const proceedWithEmailAuth = async (
    email: string,
): Promise<{
    error?: Error;
    success: boolean;
    isUsingSignInWithOtp: boolean;
}> => {
    // Ensure Supabase client is available
    if (!supabase)
        throw new Error('Supabase client not initialized');

    try {
        // First try to update the user's email
        // This works for existing anonymous users or users changing email
        const { data: _data, error } =
            await supabase.auth.updateUser({
                email,
            });

        if (error) {
            // Check if the error indicates the email is already registered
            if (
                error.message
                    .toLowerCase()
                    .includes(
                        'a user with this email address has already been registered',
                    )
            ) {
                // Fall back to signInWithOtp with shouldCreateUser: false
                const { data: _otpData, error: otpError } =
                    await supabase.auth.signInWithOtp({
                        email,
                        options: {
                            shouldCreateUser: false,
                        },
                    });

                if (otpError) {
                    // Handle rate limit errors
                    if (
                        otpError.message.includes(
                            'email rate limit exceeded',
                        )
                    ) {
                        throw new Error(
                            'Maximum email requests limit exceeded. Please try again later.',
                        );
                    }
                    // Check for other rate limiting errors
                    else if (
                        otpError.message.includes(
                            'For security purposes',
                        ) ||
                        otpError.message.includes('wait')
                    ) {
                        throw otpError;
                    }
                    throw otpError;
                }

                return {
                    success: true,
                    isUsingSignInWithOtp: true,
                };
            } else {
                // Handle other errors
                if (
                    error.message.includes(
                        'email rate limit exceeded',
                    )
                ) {
                    throw new Error(
                        'Maximum email requests limit exceeded. Please try again later.',
                    );
                }
                // Check for other rate limiting errors
                else if (
                    error.message.includes(
                        'For security purposes',
                    ) ||
                    error.message.includes('wait')
                ) {
                    throw error;
                }
                throw error;
            }
        } else {
            return {
                success: true,
                isUsingSignInWithOtp: false,
            };
        }
    } catch (error) {
        return {
            success: false,
            isUsingSignInWithOtp: false,
            error:
                error instanceof Error
                    ? error
                    : new Error(
                          'Failed to proceed with email auth',
                      ),
        };
    }
};

/**
 * Handle proceeding with phone auth - attempts to update phone or sign in
 */
export const proceedWithPhoneAuth = async (
    phone: string,
): Promise<{
    error?: Error;
    success: boolean;
    isUsingSignInWithOtp: boolean;
}> => {
    // Ensure Supabase client is available
    if (!supabase)
        throw new Error('Supabase client not initialized');

    try {
        // Format the phone number properly using libphonenumber-js
        let formattedPhone = phone;
        try {
            const parsedNumber =
                parsePhoneNumberFromString(phone);
            if (parsedNumber) {
                // E.164 format is the international standard for phone numbers
                formattedPhone =
                    parsedNumber.format('E.164');
            }
        } catch {
            // Silently ignore parsing errors and use original format
        }

        // First try to update the user's phone
        const { data: _data, error } =
            await supabase.auth.updateUser({
                phone: formattedPhone,
            });

        if (error) {
            // Check if the error indicates the phone is already registered
            if (
                error.message
                    .toLowerCase()
                    .includes(
                        'a user with this phone number has already been registered',
                    )
            ) {
                // Fall back to signInWithOtp with shouldCreateUser: false
                const { data: _otpData, error: otpError } =
                    await supabase.auth.signInWithOtp({
                        phone: formattedPhone,
                        options: {
                            shouldCreateUser: false,
                        },
                    });

                if (otpError) {
                    // Handle errors from signInWithOtp
                    if (
                        otpError.message.includes(
                            'rate limit',
                        )
                    ) {
                        throw new Error(
                            'Too many requests. Please try again later.',
                        );
                    }
                    throw otpError;
                }

                return {
                    success: true,
                    isUsingSignInWithOtp: true,
                };
            } else {
                // Handle other errors
                throw error;
            }
        } else {
            return {
                success: true,
                isUsingSignInWithOtp: false,
            };
        }
    } catch (error) {
        return {
            success: false,
            isUsingSignInWithOtp: false,
            error:
                error instanceof Error
                    ? error
                    : new Error(
                          'Failed to proceed with phone auth',
                      ),
        };
    }
};

/**
 * Verify OTP code with Supabase
 */
export const verifyOtpCode = async (
    authIdentifier: string,
    otp: string,
    isUsingSignInWithOtp: boolean,
): Promise<{ error?: Error; success: boolean }> => {
    if (!supabase)
        throw new Error('Supabase client not initialized');
    if (!authIdentifier)
        throw new Error(
            'No identifier available for verification',
        );

    try {
        // Validate OTP format
        if (!validateOtp(otp)) {
            throw new Error(
                'Invalid verification code. Code must be 6 digits.',
            );
        }

        let verifyOptions: VerifyOtpParams;

        if (authIdentifier.includes('@')) {
            // Email verification
            verifyOptions = {
                email: authIdentifier,
                token: otp,
                type: isUsingSignInWithOtp
                    ? 'email' // For existing accounts (sign in)
                    : 'email_change', // For new accounts (registration)
            };
        } else {
            // Phone verification
            verifyOptions = {
                phone: authIdentifier,
                token: otp,
                type: isUsingSignInWithOtp
                    ? 'sms' // For existing accounts (sign in)
                    : 'phone_change', // For new accounts (registration)
            };
        }

        // Call Supabase verification
        const { data: _data, error } =
            await supabase.auth.verifyOtp(verifyOptions);

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error
                    : new Error(
                          'Failed to verify OTP code',
                      ),
        };
    }
};
