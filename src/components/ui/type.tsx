/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars */

import React from 'react';
import {
    cva,
    VariantProps,
} from 'class-variance-authority';

import { cn } from '@/lib/utils/shad';

const typeVariants = cva('!my-0 text-center text', {
    variants: {
        size: {
            xxs: 'text-xs',
            xs: 'text-xs',
            sm: 'text-xs md:text-sm',
            base: 'text-sm md:text-base',
            lg: 'text-base md:text-lg',
            xl: 'text-lg md:text-xl',
        },
        textColor: {
            primary: 'text-zinc-50',
            secondary: 'text-zinc-200',
            tertiary: 'text-zinc-400',
            white: 'text-white',
            destructive: 'text-destructive',
        },
        weight: {
            regular: 'font-normal',
            medium: 'font-medium',
            bold: 'font-semibold',
        },
        multiline: {
            true: 'whitespace-pre-wrap break-words',
            false: 'whitespace-normal',
        },
    },
    defaultVariants: {
        size: 'sm',
        textColor: 'primary',
        weight: 'regular',
        multiline: false,
    },
});

export interface TypeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof typeVariants> {
    asChild?: boolean;
    multiline?: boolean;
}

export const Type = React.forwardRef<
    HTMLDivElement,
    TypeProps
>(
    (
        {
            className,
            size,
            textColor,
            weight,
            asChild = false,
            multiline = false,
            ...props
        },
        ref,
    ) => {
        return (
            <div
                className={cn(
                    typeVariants({
                        size,
                        textColor,
                        weight,
                        multiline,
                        className,
                    }),
                )}
                ref={ref}
                {...props}
            >
                {props.children}
            </div>
        );
    },
);

Type.displayName = 'Type';
