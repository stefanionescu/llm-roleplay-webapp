'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStatus } from '@/hooks/auth/use-auth-status';
import { MainMenuDropdown } from '@/features/sidebar/ui/components/main-menu-dropdown';
import {
    DropdownMenu,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SignInButton } from '@/features/sidebar/ui/components/desktop/desktop-sidebar-signin-button';
import { AccountMenuAvatar } from '@/features/sidebar/ui/components/desktop/desktop-sidebar-account-menu-avatar';

type AccountMenuProps = {
    collapse?: () => void;
};

export const AccountMenu = ({
    collapse,
}: AccountMenuProps) => {
    const [accountOpen, setAccountOpen] = useState(false);
    const {
        isLoading: isAuthLoading,
        isAnonymous,
        isAuthenticated,
    } = useAuthStatus();

    const showSignIn =
        !isAuthLoading && (isAnonymous || !isAuthenticated);

    // Enhanced collapse function that also opens feedback if needed
    const handleCollapse = () => {
        // Close the dropdown
        setAccountOpen(false);
        // Call the original collapse function if provided
        if (collapse) {
            collapse();
        }
    };

    // If loading, show a custom skeleton animation that matches button dimensions
    if (isAuthLoading) {
        return (
            <Button
                variant="ghost"
                size="iconSm"
                className="pointer-events-none cursor-wait"
                disabled
            >
                <div className="size-[22px] p-0">
                    <Skeleton
                        className="size-full"
                        borderRadius="9999px"
                    />
                </div>
            </Button>
        );
    }

    return (
        <DropdownMenu
            open={accountOpen}
            onOpenChange={setAccountOpen}
        >
            <DropdownMenuTrigger asChild>
                {showSignIn ? (
                    <SignInButton />
                ) : (
                    <AccountMenuAvatar />
                )}
            </DropdownMenuTrigger>

            <MainMenuDropdown collapse={handleCollapse} />
        </DropdownMenu>
    );
};
