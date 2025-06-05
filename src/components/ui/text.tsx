/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars */

import React from 'react';
import {
    cva,
    VariantProps,
} from 'class-variance-authority';

import { cn } from '@/lib/utils/shad';

const typeVariants = cva('text', {
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
            secondary: 'text-zinc-300',
            tertiary: 'text-zinc-400',
            white: 'text-white',
        },
        weight: {
            regular: 'font-normal',
            medium: 'font-medium',
            bold: 'font-bold',
        },
    },
    defaultVariants: {
        size: 'sm',
        textColor: 'primary',
        weight: 'regular',
    },
});

export interface TypeProps
    extends React.HTMLAttributes<HTMLParagraphElement>,
        VariantProps<typeof typeVariants> {
    asChild?: boolean;
}

export const Type = React.forwardRef<
    HTMLParagraphElement,
    TypeProps
>(
    (
        {
            className,
            size,
            textColor,
            weight,
            asChild = false,
            ...props
        },
        ref,
    ) => {
        return (
            <p
                className={cn(
                    typeVariants({
                        size,
                        textColor,
                        className,
                        weight,
                    }),
                )}
                ref={ref}
            >
                {props.children}
            </p>
        );
    },
);

Type.displayName = 'Type';
