import { memo } from 'react';

import { DropdownMenuContent } from '@/components/ui/dropdown-menu';

type MemoDropdownContentProps = {
    className?: string;
    sideOffset?: number;
    children: React.ReactNode;
    align?: 'start' | 'center' | 'end';
    side?: 'top' | 'right' | 'bottom' | 'left';
};

export const MemoDropdownContent = memo(
    ({
        children,
        className,
        align,
        side,
        sideOffset,
    }: MemoDropdownContentProps) => (
        <DropdownMenuContent
            className={className}
            align={align}
            side={side}
            sideOffset={sideOffset}
        >
            {children}
        </DropdownMenuContent>
    ),
);

MemoDropdownContent.displayName = 'MemoDropdownContent';
