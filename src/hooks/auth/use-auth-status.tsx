import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase/client';
import { formatPhoneForDisplay } from '@/lib/utils/phone';
import { isFullyAuthenticated } from '@/lib/utils/auth/auth-main';

// Create a global cache for auth state to avoid flicker between renders/components
type AuthStateCache = {
    account: string;
    isStale: boolean;
    lastChecked: number;
    isAnonymous: boolean;
    userId: string | null;
    isAuthenticated: boolean;
};

// Initialize with null values
let authCache: AuthStateCache | null = null;

export const useAuthStatus = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(
        authCache?.isAuthenticated ?? false,
    );
    const [isAnonymous, setIsAnonymous] = useState(
        authCache?.isAnonymous ?? false,
    );
    const [isLoading, setIsLoading] = useState(!authCache);
    const [userId, setUserId] = useState<string | null>(
        authCache?.userId ?? null,
    );
    const [account, setAccount] = useState<string>(
        authCache?.account ?? 'Anon Roleplayer',
    );

    useEffect(() => {
        const checkAuthStatus = async () => {
            if (!authCache) {
                setIsLoading(true);
            }

            try {
                // Check if user is fully authenticated
                const authenticated =
                    await isFullyAuthenticated();
                setIsAuthenticated(authenticated ?? false);

                // Get user data
                const { data } =
                    (await supabase?.auth.getUser()) || {
                        data: { user: null },
                    };
                const user = data.user;

                // Set user ID if available
                setUserId(user?.id || null);

                // Set anonymous status - user exists but is not fully authenticated
                setIsAnonymous(
                    !!user && !(authenticated ?? false),
                );

                // Set account (email or phone, "Anon Roleplayer" for anonymous users)
                if (user && authenticated) {
                    if (user.phone) {
                        // Format the phone number for display
                        const formattedPhone =
                            formatPhoneForDisplay(
                                user.phone,
                            );
                        setAccount(formattedPhone);
                    } else {
                        setAccount(
                            user.email || 'Anon Roleplayer',
                        );
                    }
                } else {
                    setAccount('Anon Roleplayer');
                }

                // Update the cache
                authCache = {
                    isAuthenticated: authenticated ?? false,
                    isAnonymous:
                        !!user && !(authenticated ?? false),
                    userId: user?.id || null,
                    account:
                        user && authenticated
                            ? user.phone
                                ? formatPhoneForDisplay(
                                      user.phone,
                                  )
                                : user.email ||
                                  'Anon Roleplayer'
                            : 'Anon Roleplayer',
                    lastChecked: Date.now(),
                    isStale: false,
                };
            } catch {
                // Reset states to default values on error
                setIsAuthenticated(false);
                setIsAnonymous(false);
                setUserId(null);
                setAccount('Anon Roleplayer');

                // Clear the cache on error
                authCache = null;
            } finally {
                setIsLoading(false);
            }
        };

        // Use cached values immediately if available and not stale
        if (authCache && !authCache.isStale) {
            setIsAuthenticated(authCache.isAuthenticated);
            setIsAnonymous(authCache.isAnonymous);
            setUserId(authCache.userId);
            setAccount(authCache.account);
            setIsLoading(false);

            // Mark cache as stale to trigger a background refresh
            authCache.isStale = true;

            // Still check in the background to ensure data is fresh
            void checkAuthStatus();
            return;
        }

        // Initial check
        void checkAuthStatus();

        // Subscribe to auth state changes
        if (supabase) {
            const {
                data: { subscription },
            } = supabase.auth.onAuthStateChange(() => {
                // Immediately invalidate cache on auth state change
                if (authCache) {
                    authCache.isStale = true;
                }
                void checkAuthStatus();
            });

            // Cleanup subscription when component unmounts
            return () => {
                subscription.unsubscribe();
            };
        }
    }, []);

    return {
        isAuthenticated, // true if user is fully authenticated (not anonymous)
        isAnonymous, // true if user is signed in but only as an anonymous user
        isLoading, // true while checking authentication status
        userId, // the user's ID (works for both anonymous and authenticated users)
        isSignedIn: !!userId, // true if user is signed in (either anonymous or authenticated)
        account, // user's email or phone ("Anon Roleplayer" for anonymous users)
    };
};

export default useAuthStatus;
