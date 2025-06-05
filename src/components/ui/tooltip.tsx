/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars */

'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils/shad';

const TooltipProvider = TooltipPrimitive.Provider;

const TooltipBase = TooltipPrimitive.Root;

// Modified TooltipTrigger that prevents tooltips from showing on click
const TooltipTrigger = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<
        typeof TooltipPrimitive.Trigger
    >
>(({ children, ...props }, ref) => {
    // Find closest TooltipBase to access its onOpenChange
    const handleMouseDown = (
        e: React.MouseEvent<HTMLElement>,
    ) => {
        // Find the closest tooltip root element
        const tooltipRoot =
            e.currentTarget.closest('[data-state]');
        if (tooltipRoot) {
            // If tooltip is open, close it
            if (
                tooltipRoot.getAttribute('data-state') ===
                'open'
            ) {
                // Use the Radix Primitive directly
                tooltipRoot.setAttribute(
                    'data-state',
                    'closed',
                );
            }
        }

        // Continue with the original mousedown handler if any
        // Use type assertion with more specific type
        if (props.onMouseDown) {
            // Create a properly typed handler
            const mouseDownHandler =
                props.onMouseDown as unknown as React.MouseEventHandler<HTMLElement>;
            mouseDownHandler(e);
        }
    };

    return (
        <TooltipPrimitive.Trigger
            ref={ref}
            // Using type assertion with specific type instead of 'any'
            onMouseDown={
                handleMouseDown as React.MouseEventHandler<HTMLButtonElement>
            }
            {...props}
        >
            {children}
        </TooltipPrimitive.Trigger>
    );
});
TooltipTrigger.displayName =
    TooltipPrimitive.Trigger.displayName;

const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<
        typeof TooltipPrimitive.Content
    >
>(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
            'duration-50 z-50 max-w-[250px] overflow-hidden whitespace-normal break-words rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 md:text-base',
            className,
        )}
        {...props}
    />
));
TooltipContent.displayName =
    TooltipPrimitive.Content.displayName;

export type TTooltip = {
    open?: boolean;
    sideOffset?: number;
    alignOffset?: number;
    content: React.ReactNode;
    children: React.ReactNode;
    align?: 'start' | 'center' | 'end';
    onOpenChange?: (open: boolean) => void;
    side?: 'left' | 'right' | 'top' | 'bottom';
};

const Tooltip = ({
    children,
    content,
    side,
    sideOffset,
    align = 'start',
    alignOffset,
    open,
    onOpenChange,
}: TTooltip) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isTouchDevice, setIsTouchDevice] =
        React.useState(false);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsTouchDevice(
                'ontouchstart' in window ||
                    navigator.maxTouchPoints > 0,
            );
        }
    }, []);

    const controlled = open !== undefined;

    const isTooltipOpen = controlled ? open : isOpen;

    const handleOpenChange = (newOpenState: boolean) => {
        if (!controlled) {
            setIsOpen(newOpenState);
        }
        onOpenChange?.(newOpenState);
    };

    return (
        <TooltipBase
            open={isTooltipOpen}
            onOpenChange={handleOpenChange}
            delayDuration={isTouchDevice ? 100 : 0}
        >
            <TooltipTrigger asChild>
                <span
                    onClick={
                        isTouchDevice && !controlled
                            ? (e) => {
                                  e.stopPropagation();
                                  handleOpenChange(
                                      !isTooltipOpen,
                                  );
                              }
                            : undefined
                    }
                    onMouseEnter={
                        !isTouchDevice && !controlled
                            ? () => handleOpenChange(true)
                            : undefined
                    }
                    onMouseLeave={
                        !isTouchDevice && !controlled
                            ? () => handleOpenChange(false)
                            : undefined
                    }
                    onFocus={
                        !controlled
                            ? () => handleOpenChange(true)
                            : undefined
                    }
                    onBlur={
                        !controlled
                            ? () => handleOpenChange(false)
                            : undefined
                    }
                >
                    {children}
                </span>
            </TooltipTrigger>
            <TooltipContent
                side={side}
                sideOffset={sideOffset}
                align={align}
                alignOffset={alignOffset}
            >
                {content}
            </TooltipContent>
        </TooltipBase>
    );
};

export {
    Tooltip,
    TooltipBase,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
};
