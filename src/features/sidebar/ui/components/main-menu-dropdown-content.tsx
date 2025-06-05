import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';

import { links } from '@/config/links';
import { useStore } from '@/lib/zustand/store';
import { supabase } from '@/lib/supabase/client';
import { useAuthStatus } from '@/hooks/auth/use-auth-status';
import { resetUserIdentification } from '@/lib/mixpanel/user';
import { MenuDivider } from '@/components/custom/menu-divider';
import { clearUserData } from '@/lib/utils/auth/auth-data-refresh';
import {
    DropdownMenuItem,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

type MainMenuDropdownContentProps = {
    collapse?: () => void;
};

export const MainMenuDropdownContent = ({
    collapse,
}: MainMenuDropdownContentProps) => {
    const t = useTranslations();
    const {
        account,
        isLoading,
        isAnonymous,
        isAuthenticated,
    } = useAuthStatus();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const { setIsFeedbackOpen, setIsAuthModalOpen } =
        useStore(
            useShallow((state) => ({
                setIsFeedbackOpen: state.setIsFeedbackOpen,
                setIsAuthModalOpen:
                    state.setIsAuthModalOpen,
            })),
        );

    // Only show anonymous content if we're explicitly not authenticated and not in a loading state
    // This prevents flickering between states
    const showSignIn =
        !isLoading && (isAnonymous || !isAuthenticated);
    const showSignOut = !isLoading && !showSignIn;

    const handleFeedbackClick = (event: Event) => {
        // Prevent default to stop normal dropdown behavior
        event.preventDefault();

        // Close the dropdown first
        if (collapse) {
            collapse();
        }

        // Set a small timeout to ensure the dropdown is fully closed before opening the modal
        void setTimeout(() => {
            setIsFeedbackOpen(true);
        }, 10);
    };

    const handleSignInClick = (event: Event) => {
        // Prevent default to stop normal dropdown behavior
        event.preventDefault();

        // Close the dropdown first
        if (collapse) {
            collapse();
        }

        // Set a small timeout to ensure the dropdown is fully closed before opening the modal
        void setTimeout(() => {
            setIsAuthModalOpen(true);
        }, 10);
    };

    const handleSignOutClick = async (event: Event) => {
        event.preventDefault();
        setIsSigningOut(true);

        try {
            if (supabase) {
                await supabase.auth.signOut();
                // Reset Mixpanel user identification after sign out
                void resetUserIdentification();
                // Close dropdown first
                if (collapse) {
                    collapse();
                }
                // Defer reload to ensure all state updates and UI changes are complete
                void setTimeout(() => {
                    clearUserData();
                }, 0);
            }
        } catch {
            toast.error(t('error.errorSigningOut'));
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <>
            <DropdownMenuLabel
                className={`xs:max-w-[25ch] origin-left scale-90 truncate text-xs text-zinc-400 sm:max-w-[30ch] md:max-w-[35ch]`}
            >
                {account}
            </DropdownMenuLabel>

            <MenuDivider />

            <DropdownMenuItem
                className={`lg:hover:bg-black/30 lg:hover:text-white`}
                onSelect={handleFeedbackClick}
            >
                {t('feedback.feedback')}
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
                <Link
                    href={links.discordInvite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`lg:hover:bg-black/30 lg:hover:text-white`}
                >
                    {t('common.community')}
                </Link>
            </DropdownMenuItem>

            <MenuDivider />

            <DropdownMenuItem asChild>
                <Link
                    href="/privacy"
                    prefetch={false}
                    className={`lg:hover:bg-black/30 lg:hover:text-white`}
                    onClick={collapse}
                >
                    {t('common.privacyPolicy')}
                </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
                <Link
                    href="/terms"
                    prefetch={false}
                    className={`lg:hover:bg-black/30 lg:hover:text-white`}
                    onClick={collapse}
                >
                    {t('common.terms')}
                </Link>
            </DropdownMenuItem>

            <MenuDivider />

            {showSignIn && (
                <DropdownMenuItem
                    className={`lg:hover:bg-black/30 lg:hover:text-white`}
                    onSelect={handleSignInClick}
                >
                    {t('auth.signIn')}
                </DropdownMenuItem>
            )}

            {showSignOut && (
                <DropdownMenuItem
                    className={`lg:hover:bg-black/30 lg:hover:text-white`}
                    onSelect={handleSignOutClick}
                    disabled={isSigningOut}
                >
                    <div className="flex items-center gap-2">
                        {t('auth.signOut')}
                    </div>
                </DropdownMenuItem>
            )}
        </>
    );
};
