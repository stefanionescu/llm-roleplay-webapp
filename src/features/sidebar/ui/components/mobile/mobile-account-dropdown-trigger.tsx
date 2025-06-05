'use client';

import Avvvatars from 'avvvatars-react';
import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { UnfoldMoreIcon } from '@hugeicons/core-free-icons';

import { useAuthStatus } from '@/hooks/auth/use-auth-status';
import { useAvatarLetter } from '@/hooks/avatar/use-avatar-letter';
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const MobileAccountDropdownTrigger = () => {
    const t = useTranslations();
    const { avatarLetter } = useAvatarLetter();
    const { account } = useAuthStatus();

    return (
        <DropdownMenuTrigger asChild className="w-full">
            <div
                role="button"
                aria-label={t('common.accountMenu')}
                className={`flex w-full items-center justify-between rounded-lg p-3 text-sm md:hover:bg-primary/5`}
            >
                <div
                    className={`flex min-w-0 items-center gap-x-2`}
                >
                    <div className="size-8 shrink-0 overflow-hidden rounded-full">
                        <Avvvatars
                            displayValue={avatarLetter}
                            value={'Roleplayer'}
                            style={'character'}
                            size={32}
                        />
                    </div>
                    <span
                        className={`xs:max-w-[25ch] truncate text-start font-medium sm:max-w-[30ch] md:max-w-[35ch]`}
                    >
                        {account}
                    </span>
                </div>
                <HugeiconsIcon
                    icon={UnfoldMoreIcon}
                    size={16}
                    fontVariant="stroke"
                    className="text-muted-foreground"
                    strokeWidth={2}
                    aria-hidden="true"
                />
            </div>
        </DropdownMenuTrigger>
    );
};
