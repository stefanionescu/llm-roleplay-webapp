import { useState } from 'react';

import {
    DropdownMenu,
    DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { MainMenuDropdownContent } from '@/features/sidebar/ui/components/main-menu-dropdown-content';
import { MobileAccountDropdownTrigger } from '@/features/sidebar/ui/components/mobile/mobile-account-dropdown-trigger';

type MobileAccountSectionProps = {
    collapse: () => void;
};

export const MobileAccountSection = ({
    collapse,
}: MobileAccountSectionProps) => {
    const [menuOpen, setMenuOpen] = useState(false);

    // Enhanced collapse function to ensure menu state is properly closed
    const handleCollapse = () => {
        // Close the dropdown
        setMenuOpen(false);
        // Close the sidebar
        collapse();
    };

    return (
        <div
            className={`sticky bottom-0 z-10 mt-auto bg-secondary px-2 pt-1`}
        >
            <div
                className={`flex items-center justify-between`}
            >
                <DropdownMenu
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
                >
                    <MobileAccountDropdownTrigger />

                    <DropdownMenuContent
                        className={`z-[100001] w-[--radix-dropdown-menu-trigger-width] text-sm md:text-base`}
                        align="start"
                        side="top"
                        sideOffset={8}
                        avoidCollisions={false}
                    >
                        <MainMenuDropdownContent
                            collapse={handleCollapse}
                        />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="border-t border-border" />
        </div>
    );
};
