'use client';

import { useTranslations } from 'next-intl';
import { forwardRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { useShallow } from 'zustand/react/shallow';
import { LanguageSkillIcon } from '@hugeicons/core-free-icons';

import { uiConstants } from '@/config';
import { useStore } from '@/lib/zustand/store';
import { Button } from '@/components/ui/button';
import {
    TooltipBase,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export const LanguageButton = forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<typeof Button>
>((props, ref) => {
    const t = useTranslations();
    const [isTooltipOpen, setIsTooltipOpen] =
        useState(false);

    const {
        isPreparingToGenerate,
        isDoingRAG,
        isCheckingRAGUsage,
        isGenerating,
    } = useStore(
        useShallow((state) => ({
            isPreparingToGenerate:
                state.isPreparingToGenerate,
            isDoingRAG: state.isDoingRAG,
            isCheckingRAGUsage: state.isCheckingRAGUsage,
            isGenerating: state.isGenerating,
        })),
    );

    const isDoingRAGOrInference =
        isGenerating ||
        isDoingRAG ||
        isCheckingRAGUsage ||
        isPreparingToGenerate;

    // Prevent tooltip from showing on focus
    const handleFocus = (
        e: React.FocusEvent<HTMLButtonElement>,
    ) => {
        e.preventDefault(); // Prevent default focus behavior that might trigger tooltip
        props.onFocus?.(e); // Forward original event if needed
    };

    return (
        <TooltipProvider>
            <TooltipBase
                delayDuration={
                    uiConstants.tooltipDelayDuration
                }
                disableHoverableContent={
                    isDoingRAGOrInference
                }
                open={
                    isDoingRAGOrInference
                        ? false
                        : isTooltipOpen
                }
                onOpenChange={setIsTooltipOpen}
            >
                <TooltipTrigger asChild>
                    <Button
                        ref={ref}
                        size="iconSm"
                        variant="ghost"
                        aria-label={t('common.language')}
                        onFocus={handleFocus}
                        disabled={isDoingRAGOrInference}
                        className={`${isDoingRAGOrInference ? 'cursor-not-allowed opacity-50 hover:bg-transparent' : ''}`}
                        {...props}
                    >
                        <HugeiconsIcon
                            icon={LanguageSkillIcon}
                            className={`size-menu-icon-desktop stroke-menu-icon ${isDoingRAGOrInference ? 'opacity-50' : ''}`}
                            fontVariant="stroke"
                        />
                    </Button>
                </TooltipTrigger>

                <TooltipContent side="left" sideOffset={4}>
                    {t('common.language')}
                </TooltipContent>
            </TooltipBase>
        </TooltipProvider>
    );
});

LanguageButton.displayName = 'LanguageButton';
