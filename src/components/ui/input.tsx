/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars */

import * as React from 'react';
import {
    cva,
    VariantProps,
} from 'class-variance-authority';

import { cn } from '@/lib/utils/shad';

const inputVariants = cva(
    'h-9 w-full flex rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm transition-colors outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-white/5',
                ghost: 'bg-transparent',
            },
            size: {
                signin: 'h-12 px-4 text-sm max-sm:text-sm sm:text-sm md:text-md',
                default: 'h-10 px-4 text-sm',
                sm: 'h-9 px-3 text-xs md:text-sm',
            },
            rounded: {
                lg: 'rounded-lg',
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

export interface InputProps
    extends Omit<
            React.InputHTMLAttributes<HTMLInputElement>,
            'size'
        >,
        VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<
    HTMLInputElement,
    InputProps
>(
    (
        {
            className,
            type,
            variant,
            size,
            rounded,
            ...props
        },
        ref,
    ) => {
        return (
            <input
                type={type}
                className={cn(
                    inputVariants({
                        variant,
                        size,
                        rounded,
                        className,
                    }),
                )}
                ref={ref}
                autoComplete="off"
                {...props}
            />
        );
    },
);
Input.displayName = 'Input';

export { Input };
