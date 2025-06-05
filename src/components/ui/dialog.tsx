/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars */

'use client';

import * as React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

import { cn } from '@/lib/utils/shad';

const Dialog = ({
    children,
    ...props
}: DialogPrimitive.DialogProps) => {
    return (
        <DialogPrimitive.Root {...props}>
            {children}
        </DialogPrimitive.Root>
    );
};

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<
        typeof DialogPrimitive.Overlay
    >
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            'fixed inset-0 z-50 bg-black/30',
            'transition-opacity duration-300 ease-in-out',
            'data-[state=closed]:opacity-0 data-[state=open]:opacity-100',
            className,
        )}
        {...props}
    />
));
DialogOverlay.displayName =
    DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<
        typeof DialogPrimitive.Content
    > & {
        ariaTitle: string;
    }
>(({ className, children, ariaTitle, ...props }, ref) => (
    <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
            ref={ref}
            aria-describedby={`${ariaTitle}`}
            className={cn(
                'duration-750 fixed left-[50%] top-[50%] z-50 grid w-[96dvw] translate-x-[-50%] translate-y-[-10%] gap-4 rounded-xl bg-zinc-800 p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[50%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[50%] md:top-[40%] md:w-full md:max-w-[600px] md:translate-y-[-30%]',
                className,
            )}
            {...props}
        >
            <VisuallyHidden.Root>
                <DialogTitle>{ariaTitle}</DialogTitle>
                <DialogDescription id={`${ariaTitle}`}>
                    {ariaTitle} Dialog
                </DialogDescription>
            </VisuallyHidden.Root>
            {children}
            <DialogPrimitive.Close
                className={`absolute right-3 top-3 flex size-6 items-center justify-center rounded-full opacity-70 ring-offset-background transition-opacity hover:bg-zinc-500/20 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 data-[state=open]:bg-accent data-[state=open]:text-muted-foreground`}
            >
                <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={16}
                    strokeWidth={2.5}
                />
                <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPortal>
));
DialogContent.displayName =
    DialogPrimitive.Content.displayName;

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            'flex flex-col space-y-1.5 text-center sm:text-left',
            className,
        )}
        {...props}
    />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
            className,
        )}
        {...props}
    />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<
        typeof DialogPrimitive.Title
    >
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn(
            'text-lg font-semibold leading-none tracking-tight',
            className,
        )}
        {...props}
    />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<
        typeof DialogPrimitive.Description
    >
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn(
            'text-sm text-muted-foreground md:text-base',
            className,
        )}
        {...props}
    />
));
DialogDescription.displayName =
    DialogPrimitive.Description.displayName;

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
