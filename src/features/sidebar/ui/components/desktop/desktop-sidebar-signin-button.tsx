'use client';

import { useTranslations } from 'next-intl';
import { forwardRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Login03Icon } from '@hugeicons/core-free-icons';

import { uiConstants } from '@/config';
import { Button } from '@/components/ui/button';
import {
    TooltipBase,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export const SignInButton = forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<typeof Button>
>((props, ref) => {
    const t = useTranslations();
    const [isTooltipOpen, setIsTooltipOpen] =
        useState(false);

    const handleFocus = (
        e: React.FocusEvent<HTMLButtonElement>,
    ) => {
        e.preventDefault();
        props.onFocus?.(e);
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
                        aria-label={t('auth.signIn')}
                        onFocus={handleFocus}
                        {...props}
                    >
                        <HugeiconsIcon
                            icon={Login03Icon}
                            className="size-menu-icon-desktop"
                            fontVariant="solid"
                        />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={4}>
                    {t('auth.signIn')}
                </TooltipContent>
            </TooltipBase>
        </TooltipProvider>
    );
});

SignInButton.displayName = 'SignInButton';
