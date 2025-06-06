/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars */

import Link from 'next/link';

import { cn } from '@/lib/utils/shad';

import { Flex } from './flex';
import { Type } from './text';

export type TFormLabel = {
    link?: string;
    label: string;
    linkText?: string;
    className?: string;
    isOptional?: boolean;
    optionalText?: string;
    children?: React.ReactNode;
    extra?: () => React.ReactNode;
};

export const FormLabel = ({
    children,
    label,
    extra,
    isOptional,
    className,
    linkText,
    link,
    optionalText = '(Optional)',
}: TFormLabel) => {
    return (
        <Flex
            direction="col"
            gap="none"
            items="start"
            className={cn('w-full', className)}
        >
            <Flex
                items="center"
                gap="sm"
                className="w-full"
            >
                <Flex items="center" gap="xs">
                    <Type size="sm" weight="medium">
                        {label}
                    </Type>
                    {isOptional && (
                        <Type
                            size="xs"
                            textColor="secondary"
                        >
                            {optionalText}
                        </Type>
                    )}
                </Flex>
                {link && (
                    <Link
                        href={link}
                        target="_blank"
                        className={`py-0.5 text-sm font-medium text-violet-500 underline decoration-zinc-500/20 underline-offset-4 hover:opacity-90`}
                    >
                        {linkText}
                    </Link>
                )}
                {extra?.()}
            </Flex>
            {children && (
                <Type size="xs" textColor="secondary">
                    {children}
                </Type>
            )}
        </Flex>
    );
};
