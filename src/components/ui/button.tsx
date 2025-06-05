/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import {
    cva,
    type VariantProps,
} from 'class-variance-authority';

import { cn } from '@/lib/utils/shad';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none',
    {
        variants: {
            variant: {
                default:
                    'bg-zinc-800 text-white hover:bg-zinc-900 outline outline-white/10',
                destructive:
                    'bg-red-400/50 text-destructive-foreground md:hover:bg-red-500/50',
                outline:
                    'bg-zinc-800 border border-zinc-500/30 text-zinc-100 md:hover:text-white',
                secondary:
                    'bg-white/5 text-zinc-100 md:hover:bg-black/15',
                ghost: 'text-zinc-200 md:hover:bg-white/10 md:hover:text-white',
                link: 'h-auto text-zinc-400 underline-offset-4 decoration-white/20 md:hover:underline',
                text: 'p-0 text-xs',
            },
            size: {
                default:
                    'h-10 px-4 py-3 text-xs md:text-sm',
                sm: 'h-8 px-3 text-xs md:text-sm',
                lg: 'h-12 px-8 text-xs md:text-sm',
                icon: 'h-9 min-w-9 text-xs md:text-sm',
                iconSm: 'h-8 min-w-8 text-xs md:text-sm',
                iconXS: 'h-6 min-w-6 text-xs md:text-sm',
                link: 'p-0',
                linkSm: 'p-0 text-xs',
            },
            rounded: {
                default: 'rounded-md',
                lg: 'rounded-xl',
                full: 'rounded-full',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            rounded: 'lg',
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<
    HTMLButtonElement,
    ButtonProps
>(
    (
        {
            className,
            variant,
            size,
            rounded,
            asChild = false,
            ...props
        },
        ref,
    ) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(
                    buttonVariants({
                        variant,
                        size,
                        rounded,
                        className,
                    }),
                )}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
