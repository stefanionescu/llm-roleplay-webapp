import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

import { authConstants } from '@/config';
import { Type } from '@/components/ui/type';
import { Flex } from '@/components/ui/flex';
import { Spinner } from '@/components/ui/spinner';
import { formatCountdown } from '@/lib/utils/otp/otp-main';

type OtpResendOptionProps = {
    isResending: boolean;
    onResend: () => void;
    lastOtpRequestTime: number;
};

export const OtpResendOption: React.FC<
    OtpResendOptionProps
> = ({ isResending, onResend, lastOtpRequestTime }) => {
    const t = useTranslations();

    // Force component to update every 100ms to ensure countdown is visible
    const [, forceUpdate] = useState({});
    useEffect(() => {
        const interval = setInterval(
            () => forceUpdate({}),
            100,
        );
        return () => clearInterval(interval);
    }, []);

    // Calculate remaining seconds directly for more accurate display
    const currentTime = Date.now();
    const cooldownEndTime =
        lastOtpRequestTime +
        authConstants.otpCooldown * 1000;
    const displaySeconds = Math.max(
        0,
        Math.ceil((cooldownEndTime - currentTime) / 1000),
    );

    // Show resend button only if countdown is done and not resending
    const showResendButton =
        displaySeconds === 0 && !isResending;

    return (
        <Flex
            direction="row"
            gap="sm"
            className="mt-4 items-center justify-center text-center"
        >
            <Type size="xs" textColor="tertiary">
                {t('auth.didntReceiveCode')}
            </Type>

            {!showResendButton ? (
                <Flex
                    direction="row"
                    gap="xs"
                    className="items-center"
                >
                    {isResending ? (
                        <Spinner className="size-4 stroke-primary" />
                    ) : (
                        <>
                            <Type
                                size="xs"
                                textColor="tertiary"
                                className="opacity-70"
                            >
                                {t('auth.resendIn')}
                            </Type>
                            <Type
                                size="xs"
                                textColor="tertiary"
                                className="font-medium tabular-nums"
                            >
                                {formatCountdown(
                                    displaySeconds,
                                )}
                            </Type>
                        </>
                    )}
                </Flex>
            ) : (
                <Type
                    size="xs"
                    textColor="primary"
                    className="cursor-pointer font-medium hover:underline"
                    onClick={onResend}
                >
                    {t('auth.resend')}
                </Type>
            )}
        </Flex>
    );
};
