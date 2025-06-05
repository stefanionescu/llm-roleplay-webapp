'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { Menu01Icon } from '@hugeicons/core-free-icons';

import { Button } from '@/components/ui/button';

interface MobileSidebarToggleProps {
    open: () => void;
    isCollapsed: boolean;
}

export const MobileSidebarToggle = ({
    isCollapsed,
    open,
}: MobileSidebarToggleProps) => {
    if (!isCollapsed) return null;

    return (
        <Button
            variant="ghost"
            size="iconSm"
            onClick={open}
            aria-label="Toggle sidebar"
        >
            <HugeiconsIcon
                icon={Menu01Icon}
                className="size-menu-icon-desktop stroke-menu-icon"
                fontVariant="stroke"
            />
        </Button>
    );
};
