import { useTranslations } from 'next-intl';
import { forwardRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SidebarLeftIcon } from '@hugeicons/core-free-icons';

import { uiConstants } from '@/config';
import { Button } from '@/components/ui/button';
import {
    TooltipBase,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

type SessionsButtonProps = Omit<
    React.ComponentPropsWithoutRef<typeof Button>,
    'name'
> & {};

export const SessionsButton = forwardRef<
    HTMLButtonElement,
    SessionsButtonProps
>(({ ...props }, ref) => {
    const t = useTranslations();
    const [isTooltipOpen, setIsTooltipOpen] =
        useState(false);

    // Prevent tooltip from showing on focus so it doesn't clash with the click event
    const handleFocus = (
        e: React.FocusEvent<HTMLButtonElement>,
    ) => {
        e.preventDefault(); // Prevent default focus behavior that might trigger tooltip
    };

    return (
        <TooltipProvider>
            <TooltipBase
                delayDuration={
                    uiConstants.tooltipDelayDuration
                }
                open={isTooltipOpen}
                onOpenChange={setIsTooltipOpen}
            >
                <TooltipTrigger asChild>
                    <Button
                        ref={ref}
                        variant="ghost"
                        size="iconSm"
                        aria-label={t('common.chats')}
                        onFocus={handleFocus}
                        {...props}
                    >
                        <HugeiconsIcon
                            icon={SidebarLeftIcon}
                            className={`size-menu-icon-desktop stroke-menu-icon`}
                            fontVariant="stroke"
                        />
                    </Button>
                </TooltipTrigger>

                <TooltipContent side="left" sideOffset={4}>
                    {t('common.chats')}
                </TooltipContent>
            </TooltipBase>
        </TooltipProvider>
    );
});

SessionsButton.displayName = 'SessionsButton';
