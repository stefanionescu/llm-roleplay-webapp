import mixpanel from 'mixpanel-browser';

import { supabase } from '@/lib/supabase/client';
import {
    AuthMethod,
    UserProperties,
} from '@/types/mixpanel';

import {
    trackSignInExistingUser,
    trackSignInNewUser,
} from './events';

const MIXPANEL_TOKEN =
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

/**
 * Check if Mixpanel is properly initialized
 */
const isMixpanelReady = (): boolean => {
    return !!MIXPANEL_TOKEN && !!mixpanel;
};

/**
 * Utility function to determine auth method from identifier
 */
const getAuthMethod = (identifier: string): AuthMethod => {
    return identifier.includes('@') ? 'email' : 'phone';
};

/**
 * Utility function to set user properties with type safety
 */
const setUserProperties = async (
    properties: Partial<UserProperties>,
): Promise<void> => {
    if (!isMixpanelReady()) return;

    return new Promise((resolve) => {
        setTimeout(() => {
            try {
                mixpanel.people.set(properties);
                resolve();
            } catch {
                resolve();
            }
        }, 0);
    });
};

/**
 * Get current user data from Supabase
 */
const getCurrentUser = async () => {
    if (!supabase) return null;

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        return user;
    } catch {
        return null;
    }
};

/**
 * Set user profile properties after authentication
 * This creates the People profile in Mixpanel
 */
export const setUserProfile = async (
    authIdentifier: string,
): Promise<void> => {
    if (!isMixpanelReady()) return;

    try {
        const user = await getCurrentUser();
        if (!user || user.is_anonymous === true) {
            return;
        }

        // Set user properties (this creates/updates the user profile)
        const userProperties: UserProperties = {
            $name:
                (user.user_metadata?.name as string) ||
                user.email ||
                user.phone ||
                'Unknown User',
            'User Last Login': new Date().toISOString(),
            'User Auth Method':
                getAuthMethod(authIdentifier),
            'User Status': 'authenticated',
        };

        // Add email if available (use only Mixpanel's standard property)
        if (user.email) {
            userProperties.$email = user.email;
        }

        // Add phone if available (use only Mixpanel's standard property)
        if (user.phone) {
            userProperties.$phone = user.phone;
        }

        // Set user properties in Mixpanel
        await setUserProperties(userProperties);
    } catch {}
};

/**
 * Reset user identification after sign out
 */
export const resetUserIdentification =
    async (): Promise<void> => {
        if (!isMixpanelReady()) return;

        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    // Reset Mixpanel to clean state - this generates a new device ID
                    mixpanel.reset();
                    resolve();
                } catch {
                    resolve();
                }
            }, 0);
        });
    };

/**
 * Initialize user identification based on current auth state
 */
export const initializeUserIdentification =
    async (): Promise<void> => {
        if (!isMixpanelReady()) return;

        try {
            const user = await getCurrentUser();

            if (!user) {
                return;
            }

            if (user.is_anonymous !== true) {
                // User is already authenticated - identify them and set profile
                await new Promise<void>((resolve) => {
                    setTimeout(() => {
                        mixpanel.identify(user.id);
                        resolve();
                    }, 0);
                });

                const authIdentifier =
                    user.email || user.phone || '';
                if (authIdentifier) {
                    await setUserProfile(authIdentifier);
                }
            }
        } catch {}
    };

/**
 * Mark a specific user as discarded when signing into existing account
 */
export const markAnonymousUserAsDiscarded = async (
    anonymousUserId: string,
    authIdentifier: string,
): Promise<void> => {
    if (!isMixpanelReady()) return;

    try {
        // First identify the anonymous user to create their People profile
        await new Promise<void>((resolve) => {
            setTimeout(() => {
                mixpanel.identify(anonymousUserId);
                resolve();
            }, 0);
        });

        // Now set properties on the anonymous user's profile to mark them as discarded
        const discardedUserProperties: UserProperties = {
            $name: 'Anonymous User',
            'User Last Login': new Date().toISOString(),
            'User Auth Method':
                getAuthMethod(authIdentifier),
            'User Status': 'discarded',
            'User Discard Reason':
                'signed_in_with_existing_account',
            'User Discarded At': new Date().toISOString(),
            'User Main Account': authIdentifier,
        };

        await setUserProperties(discardedUserProperties);
    } catch {}
};

/**
 * Called after successful OTP verification to merge anonymous and authenticated states
 */
export const handleUserAuthentication = async (
    authIdentifier: string,
    isUsingSignInWithOtp: boolean,
    anonymousUserId?: string | null,
): Promise<void> => {
    if (!isMixpanelReady()) return;

    try {
        const user = await getCurrentUser();
        if (!user) {
            return;
        }

        if (isUsingSignInWithOtp) {
            // This is signing in with an EXISTING user - we CANNOT merge
            if (anonymousUserId) {
                // Mark the SPECIFIC anonymous user as discarded first
                await markAnonymousUserAsDiscarded(
                    anonymousUserId,
                    authIdentifier,
                );
            }

            // Reset to clear the anonymous session
            await resetUserIdentification();

            // Now identify as the existing user (no merge will happen)
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    mixpanel.identify(user.id);
                    resolve();
                }, 0);
            });

            // Track sign-in event for existing user
            await trackSignInExistingUser(
                authIdentifier,
                anonymousUserId,
            );

            // Set user profile properties for existing user (ensure identify has processed)
            await setUserProfile(authIdentifier);
        } else {
            // This is a NEW user (email_change/phone_change) - we CAN merge
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    mixpanel.identify(user.id);
                    resolve();
                }, 0);
            });

            // Track sign-in event for new user
            await trackSignInNewUser(authIdentifier);

            // Set user profile properties for new user
            await setUserProfile(authIdentifier);
        }
    } catch {}
};
