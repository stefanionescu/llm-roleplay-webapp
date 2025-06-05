'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { forwardRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { HomeIcon } from '@hugeicons/core-free-icons';

import { uiConstants } from '@/config';
import { Button } from '@/components/ui/button';
import { useCharacterId } from '@/hooks/data/use-character-id';
import { useStopInference } from '@/hooks/inference/use-stop-inference';
import {
    TooltipBase,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export const HomeButton = forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<typeof Button>
>((props, ref) => {
    const t = useTranslations();

    const pathname = usePathname();
    const characterId = useCharacterId() ?? '';

    const [isTooltipOpen, setIsTooltipOpen] =
        useState(false);

    const { stopGeneration } =
        useStopInference(characterId);

    // Prevent tooltip from showing on focus
    const handleFocus = (
        e: React.FocusEvent<HTMLButtonElement>,
    ) => {
        e.preventDefault();
        props.onFocus?.(e);
    };

    if (pathname === '/') {
        return null;
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
                        size="iconSm"
                        variant="ghost"
                        aria-label={t('common.home')}
                        onFocus={handleFocus}
                        onClick={stopGeneration()}
                        asChild
                        {...props}
                    >
                        <Link
                            href="/"
                            passHref
                            prefetch={false}
                        >
                            <HugeiconsIcon
                                icon={HomeIcon}
                                className={`size-menu-icon-desktop stroke-menu-icon`}
                                fontVariant="stroke"
                            />
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={4}>
                    {t('common.home')}
                </TooltipContent>
            </TooltipBase>
        </TooltipProvider>
    );
});

HomeButton.displayName = 'HomeButton';
