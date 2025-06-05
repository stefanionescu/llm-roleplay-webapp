import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase/client';

type AvatarLetterCache = {
    letter: string;
    isStale: boolean;
    lastChecked: number;
};

// Initialize with null value
let avatarLetterCache: AvatarLetterCache | null = null;

export const useAvatarLetter = () => {
    const [avatarLetter, setAvatarLetter] = useState(
        avatarLetterCache?.letter ?? 'Y',
    );
    const [isLoading, setIsLoading] = useState(
        !avatarLetterCache,
    );

    useEffect(() => {
        // Initial check
        const getAvatarLetterFromUser = async () => {
            if (!avatarLetterCache) {
                setIsLoading(true);
            }

            try {
                const {
                    data: { user },
                } = (await supabase?.auth.getUser()) || {
                    data: { user: null },
                };

                let letter = 'Y';

                if (!user || user.is_anonymous === true) {
                    // Not fully signed in or anonymous user
                    letter = 'Y';
                } else if (user.email) {
                    // Use first letter of email, uppercase
                    letter = user.email
                        .charAt(0)
                        .toUpperCase();
                } else if (user.phone) {
                    // If user uses phone, set to Y
                    letter = 'Y';
                }

                setAvatarLetter(letter);

                // Update cache
                avatarLetterCache = {
                    letter,
                    isStale: false,
                    lastChecked: Date.now(),
                };
            } catch {
                setAvatarLetter('Y');

                // Clear cache on error
                avatarLetterCache = null;
            } finally {
                setIsLoading(false);
            }
        };

        // Use cached values immediately if available and not stale
        if (
            avatarLetterCache &&
            !avatarLetterCache.isStale
        ) {
            setAvatarLetter(avatarLetterCache.letter);
            setIsLoading(false);

            // Mark cache as stale to trigger a background refresh
            avatarLetterCache.isStale = true;

            // Still check in the background to ensure data is fresh
            void getAvatarLetterFromUser();
            return;
        }

        // Run initial check
        void getAvatarLetterFromUser();

        // Subscribe to auth state changes
        if (supabase) {
            const {
                data: { subscription },
            } = supabase.auth.onAuthStateChange(() => {
                // Invalidate cache on auth state change
                if (avatarLetterCache) {
                    avatarLetterCache.isStale = true;
                }
                void getAvatarLetterFromUser();
            });

            // Cleanup subscription when component unmounts
            return () => {
                subscription.unsubscribe();
            };
        }
    }, []);

    return { avatarLetter, isLoading };
};
