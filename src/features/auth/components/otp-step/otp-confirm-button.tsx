import React from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils/shad';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type OtpConfirmButtonProps = {
    hasError?: boolean;
    onClick: () => void;
    isSubmitting: boolean;
    isOtpComplete: boolean;
};

export const OtpConfirmButton: React.FC<
    OtpConfirmButtonProps
> = ({
    isSubmitting,
    isOtpComplete,
    onClick,
    hasError = false,
}) => {
    const t = useTranslations();
    const isDisabled =
        isSubmitting || !isOtpComplete || hasError;

    return (
        <Button
            type="button"
            rounded="full"
            variant={isDisabled ? 'secondary' : 'default'}
            className={cn(
                'mt-4 w-full transition-colors',
                isDisabled
                    ? 'cursor-not-allowed bg-zinc-200/20 text-zinc-400 dark:bg-zinc-700/30'
                    : 'bg-white text-black hover:bg-white/90',
            )}
            onClick={onClick}
            disabled={isDisabled}
        >
            {isSubmitting ? (
                <Spinner
                    className={cn(
                        'h-4 w-4',
                        isDisabled
                            ? 'stroke-zinc-400'
                            : 'stroke-black',
                    )}
                />
            ) : (
                t('common.confirm')
            )}
        </Button>
    );
};
