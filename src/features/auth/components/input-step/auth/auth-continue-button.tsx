import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';

import { cn } from '@/lib/utils/shad';
import { useStore } from '@/lib/zustand/store';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type AuthContinueButtonProps = {
    disabled?: boolean;
    isSubmitting: boolean;
    onClick: () => void | Promise<void>;
};

export const AuthContinueButton = ({
    isSubmitting: externalIsSubmitting,
    onClick,
    disabled,
}: AuthContinueButtonProps) => {
    const t = useTranslations();
    // Local loading state to show spinner immediately on click
    const [localIsSubmitting, setLocalIsSubmitting] =
        useState(false);

    // Get OTP cooldown check function from store
    const canRequestOtp = useStore(
        (state) => state.canRequestOtp,
    );

    // Wrap onClick to first check OTP cooldown, then set loading state only if cooldown check passes
    const handleClick = useCallback(async () => {
        if (
            externalIsSubmitting ||
            localIsSubmitting ||
            disabled
        ) {
            return;
        }

        // First check if we're still in cooldown period without showing spinner
        const { canRequest } = canRequestOtp();
        if (!canRequest) {
            // Let the parent component handle the error display
            const result = onClick();

            // Handle non-promise returns from onClick
            if (!(result instanceof Promise)) {
                return;
            }

            await result;
            return;
        }

        // Only if cooldown check passes, set loading state and proceed
        setLocalIsSubmitting(true);
        try {
            const result = onClick();

            // Handle both promise and non-promise returns from onClick
            if (result instanceof Promise) {
                await result;
            }
        } catch {
        } finally {
            // If the external handler doesn't set isSubmitting,
            // we need to reset our local state after a delay
            setTimeout(() => {
                if (!externalIsSubmitting) {
                    setLocalIsSubmitting(false);
                }
            }, 500);
        }
    }, [
        onClick,
        externalIsSubmitting,
        localIsSubmitting,
        disabled,
        canRequestOtp,
    ]);

    // Button is disabled when submitting or explicitly disabled
    const isDisabled =
        disabled ||
        externalIsSubmitting ||
        localIsSubmitting;

    const showSpinner =
        externalIsSubmitting || localIsSubmitting;

    return (
        <Button
            type="button"
            rounded="full"
            variant={isDisabled ? 'secondary' : 'default'}
            className={cn(
                'mt-4 w-[90%] transition-colors',
                isDisabled
                    ? 'cursor-not-allowed bg-zinc-200/20 text-zinc-400 dark:bg-zinc-700/30'
                    : 'bg-white text-black hover:bg-white/90',
            )}
            onClick={handleClick}
            disabled={isDisabled}
        >
            {showSpinner ? (
                <Spinner
                    className={cn(
                        'h-4 w-4',
                        isDisabled
                            ? 'stroke-zinc-400'
                            : 'stroke-black',
                    )}
                />
            ) : (
                t('common.continue')
            )}
        </Button>
    );
};
