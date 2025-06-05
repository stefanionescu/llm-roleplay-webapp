'use client';

import { BsDiscord } from 'react-icons/bs';
import { useTranslations } from 'next-intl';

import { links } from '@/config/links';
import { Type } from '@/components/ui/type';
import { Flex } from '@/components/ui/flex';
import { useStore } from '@/lib/zustand/store';

export const AuthModalWaitlistStep = () => {
    const t = useTranslations();
    const waitlistPosition = useStore(
        (state) => state.waitlistPosition,
    );

    return (
        <Flex
            gap="md"
            direction="col"
            className="w-full items-center text-center"
        >
            <Type weight="bold" size="lg">
                {t('auth.waitlist.title')}
            </Type>
            <Type size="base" className="mt-2">
                {t('auth.waitlist.position')}{' '}
                <span className="font-bold">
                    {waitlistPosition}
                </span>
            </Type>
            <Type
                size="sm"
                textColor="tertiary"
                className="mt-4"
            >
                {t('auth.waitlist.joinDiscordMessage')}
            </Type>
            <a
                href={links.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-[90%] select-none items-center justify-center gap-2 rounded-md bg-[#5865F2] px-6 py-3 font-semibold text-white transition-all hover:bg-[#4752C4]"
            >
                <BsDiscord size={18} />
                {t('auth.waitlist.joinDiscordButton')}
            </a>
        </Flex>
    );
};
