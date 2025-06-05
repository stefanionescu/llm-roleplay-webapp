/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { StaticImageData } from 'next/image';

import { links } from '@/config/links';
import { DiscordIcon } from '@/components/icons/discord';

const RetiredErrorIcon = '/retired-error.webp';

type ErrorStateProps = {
    title?: string;
    hideTitle?: boolean;
    hideMessage?: boolean;
    iconBottomMargin?: number;
    hideDiscordButton?: boolean;
    errorMessage?: React.ReactNode;
    iconPath?: string | StaticImageData;
    iconSize?: {
        width: number;
        height: number;
        mobileWidth: number;
        mobileHeight: number;
    };
};

export function ErrorState({
    iconPath = RetiredErrorIcon,
    errorMessage,
    title,
    hideTitle = false,
    hideMessage = false,
    hideDiscordButton = false,
    iconSize = {
        width: 400,
        height: 400,
        mobileWidth: 250,
        mobileHeight: 250,
    },
    iconBottomMargin = 0,
}: ErrorStateProps) {
    const t = useTranslations();

    // Get the correct src from either string or StaticImageData
    const imageSrc =
        typeof iconPath === 'string'
            ? iconPath
            : iconPath.src;

    const defaultErrorMessage = (
        <>
            {t('error.charactersOnStrikeLineOne')}
            <br />
            {t('error.charactersOnStrikeLineTwo')}
        </>
    );

    const defaultTitle = t('error.ohno');

    return (
        <div
            className={`flex size-full min-h-screen items-center justify-center bg-zinc-800`}
        >
            <div
                className={`flex flex-col items-center justify-center p-4`}
            >
                <Image
                    src={imageSrc}
                    alt={t('error.title')}
                    width={iconSize.width}
                    height={iconSize.height}
                    priority
                    style={
                        {
                            '--mobile-height': `${iconSize.mobileHeight}px`,
                            '--mobile-width': `${iconSize.mobileWidth}px`,
                            '--desktop-height': `${iconSize.height}px`,
                            '--desktop-width': `${iconSize.width}px`,
                            marginBottom: `${iconBottomMargin}px`,
                        } as React.CSSProperties
                    }
                    className={`select-none max-md:h-[var(--mobile-height)] max-md:w-[var(--mobile-width)] md:h-[var(--desktop-height)] md:w-[var(--desktop-width)]`}
                />
                {!hideTitle && (
                    <h1
                        className={`select-none text-center font-bold text-white max-md:text-2xl md:text-4xl`}
                    >
                        {title || defaultTitle}
                    </h1>
                )}
                {!hideMessage && (
                    <p
                        className={`select-none whitespace-pre-line px-8 pt-4 text-center text-white/80 max-md:text-base md:text-lg`}
                    >
                        {errorMessage ||
                            defaultErrorMessage}
                    </p>
                )}
                {!hideDiscordButton && (
                    <a
                        href={links.discordInvite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-8 flex select-none items-center gap-2 rounded-md bg-[#5865F2] px-6 py-3 font-semibold text-white transition-all md:hover:bg-[#4752C4]`}
                    >
                        <DiscordIcon />
                        {t('error.getSupport')}
                    </a>
                )}
            </div>
        </div>
    );
}
