'use client';

import Avvvatars from 'avvvatars-react';
import { useTranslations } from 'next-intl';
import { forwardRef, useState } from 'react';

import { uiConstants } from '@/config';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvatarLetter } from '@/hooks/avatar/use-avatar-letter';
import {
    TooltipBase,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export const AccountMenuAvatar = forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<typeof Button>
>((props, ref) => {
    const { avatarLetter, isLoading } = useAvatarLetter();
    const t = useTranslations();
    const [isTooltipOpen, setIsTooltipOpen] =
        useState(false);

    const handleFocus = (
        e: React.FocusEvent<HTMLButtonElement>,
    ) => {
        e.preventDefault();
        props.onFocus?.(e);
    };

    // If the avatar letter is still loading, render a skeleton
    if (isLoading) {
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
                        aria-label={t('common.accountMenu')}
                        className="p-0"
                        onFocus={handleFocus}
                        {...props}
                    >
                        <div className="flex items-center justify-center overflow-hidden rounded-full size-menu-icon-desktop">
                            <Avvvatars
                                displayValue={avatarLetter}
                                value={'Roleplayer'}
                                style={'character'}
                            />
                        </div>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={4}>
                    {t('common.accountMenu')}
                </TooltipContent>
            </TooltipBase>
        </TooltipProvider>
    );
});

AccountMenuAvatar.displayName = 'AccountMenuAvatar';
