import React from 'react';
import { useTranslations } from 'next-intl';
import { IoChevronBack } from 'react-icons/io5';

import { Type } from '@/components/ui/type';
import { Flex } from '@/components/ui/flex';
import { AuthMode } from '@/hooks/auth/use-auth-form';
import { formatPhoneForDisplay } from '@/lib/utils/phone';

type OtpHeaderProps = {
    authMode: AuthMode;
    isSubmitting: boolean;
    onBackClick: () => void;
    authIdentifier: string | null;
};

export const OtpHeader: React.FC<OtpHeaderProps> = ({
    authMode,
    authIdentifier,
    isSubmitting,
    onBackClick,
}) => {
    const t = useTranslations();

    // Format the phone number if this is a phone authentication
    const displayIdentifier =
        authMode === 'phone' && authIdentifier
            ? formatPhoneForDisplay(authIdentifier)
            : authIdentifier;

    return (
        <>
            <button
                type="button"
                onClick={onBackClick}
                className="absolute left-3 top-3 flex size-6 items-center justify-center rounded-full opacity-70 ring-offset-background transition-opacity hover:bg-zinc-500/20 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label={t('common.back')}
                disabled={isSubmitting}
            >
                <IoChevronBack
                    size={16}
                    strokeWidth={2.5}
                />
            </button>

            <Flex
                gap="xs"
                direction="col"
                className="items-center text-center"
            >
                <Type weight="bold" size="lg">
                    {authMode === 'email'
                        ? t('auth.verifyEmail')
                        : t('auth.verifyPhone')}
                </Type>
                <Type
                    size="sm"
                    textColor="tertiary"
                    className="text-center"
                >
                    {t('auth.enterCode')}{' '}
                    <span className="font-medium">
                        {displayIdentifier}
                    </span>
                </Type>
            </Flex>
        </>
    );
};
