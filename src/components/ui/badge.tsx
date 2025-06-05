import * as React from 'react';
import {
    cva,
    type VariantProps,
} from 'class-variance-authority';

import { cn } from '@/lib/utils/shad';

const badgeVariants = cva(
    'min-h-2 flex items-center rounded-sm px-2 py-0.5 text-[0.7rem] font-medium text-zinc-500 transition-colors whitespace-nowrap',
    {
        variants: {
            variant: {
                default:
                    'rounded-full bg-zinc-500/20 text-zinc-100',
                secondary:
                    'bg-secondary hover:bg-secondary/80 border-transparent',
                light_purple:
                    'rounded-full bg-violet-400/20 hover:bg-violet-400/30 text-violet-200 border-transparent',
                dark_purple:
                    'rounded-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border-transparent',
                light_gold:
                    'rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border-transparent',
                dark_gold:
                    'rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-transparent',
                light_green:
                    'rounded-full bg-green-400/20 hover:bg-green-400/30 text-green-200 border-transparent',
                dark_green:
                    'rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-300 border-transparent',
                light_red:
                    'rounded-full bg-red-400/20 hover:bg-red-400/30 text-red-200 border-transparent',
                dark_red:
                    'rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border-transparent',
                light_blue:
                    'rounded-full bg-blue-400/20 hover:bg-blue-400/30 text-blue-200 border-transparent',
                dark_blue:
                    'rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-transparent',
                light_orange:
                    'rounded-full bg-orange-400/20 hover:bg-orange-400/30 text-orange-200 border-transparent',
                dark_orange:
                    'rounded-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border-transparent',
                light_pink:
                    'rounded-full bg-pink-400/20 hover:bg-pink-400/30 text-pink-200 border-transparent',
                dark_pink:
                    'rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border-transparent',
                light_brown:
                    'rounded-full bg-stone-400/20 hover:bg-stone-400/30 text-stone-200 border-transparent',
                dark_brown:
                    'rounded-full bg-stone-500/20 hover:bg-stone-500/30 text-stone-300 border-transparent',
                light_bronze:
                    'rounded-full bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-200 border-transparent',
                dark_bronze:
                    'rounded-full bg-yellow-700/20 hover:bg-yellow-700/30 text-yellow-300 border-transparent',
                light_turquoise:
                    'rounded-full bg-teal-400/20 hover:bg-teal-400/30 text-teal-200 border-transparent',
                dark_turquoise:
                    'rounded-full bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border-transparent',
                light_peach:
                    'rounded-full bg-orange-200/30 hover:bg-orange-200/40 text-orange-200 border-transparent',
                dark_peach:
                    'rounded-full bg-orange-300/30 hover:bg-orange-300/40 text-orange-300 border-transparent',
                light_aqua:
                    'rounded-full bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-200 border-transparent',
                dark_aqua:
                    'rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-transparent',
                light_olive:
                    'rounded-full bg-lime-400/20 hover:bg-lime-400/30 text-lime-200 border-transparent',
                dark_olive:
                    'rounded-full bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 border-transparent',
                destructive:
                    'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow',
                outline: 'bg-zinc-800 text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

const categoryToBadgeVariant: Record<string, string> = {
    cosplay: 'dark_purple',
    luxury: 'dark_gold',
    food: 'dark_green',
    university: 'dark_blue',
};

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({
    className,
    variant,
    ...props
}: BadgeProps) {
    return (
        <div
            className={cn(
                badgeVariants({ variant }),
                className,
            )}
            {...props}
        />
    );
}

export { Badge, badgeVariants, categoryToBadgeVariant };
