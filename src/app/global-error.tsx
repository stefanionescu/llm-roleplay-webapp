'use client';

export const runtime = 'edge';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { links } from '@/config/links';
import { DiscordIcon } from '@/components/icons/discord';

const DumpsterFireIcon = '/dumpster-fire.webp';

export default function GlobalError() {
    const t = useTranslations();

    return (
        <html>
            <body>
                <div
                    className={`flex min-h-screen w-full items-center justify-center bg-zinc-800 antialiased`}
                >
                    <div
                        className={`-mt-16 flex flex-col items-center p-4`}
                    >
                        <Image
                            src={DumpsterFireIcon}
                            alt={t('error.title')}
                            className={`mb-5 select-none max-md:size-[300px] md:size-[400px]`}
                        />
                        <h1
                            className={`select-none text-center font-bold text-white max-md:text-2xl md:text-4xl`}
                        >
                            {t('error.ohno')}
                        </h1>
                        <p
                            className={`mt-4 select-none text-center text-white/80 max-md:px-6 max-md:text-base md:text-lg`}
                        >
                            {t(
                                'error.globalUnexpectedErrorLineOne',
                            )}
                            <br />
                            <br />
                            {t(
                                'error.globalUnexpectedErrorLineTwo',
                            )}
                        </p>
                        <a
                            href={links.discordInvite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-6 flex select-none items-center gap-2 rounded-md bg-[#5865F2] px-6 py-3 font-semibold text-white transition-all md:hover:bg-[#4752C4]`}
                        >
                            <DiscordIcon />
                            {t('error.getSupport')}
                        </a>
                    </div>
                </div>
            </body>
        </html>
    );
}
