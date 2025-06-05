'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    HomeIcon,
    LinkCircleIcon,
} from '@hugeicons/core-free-icons';

type MobileSidebarHomeButtonProps = {
    collapse: () => void;
};

export const MobileSidebarHomeButton = ({
    collapse,
}: MobileSidebarHomeButtonProps) => {
    const pathname = usePathname();
    const t = useTranslations();

    return (
        pathname !== '/' && (
            <Link
                href="/"
                prefetch={false}
                className="px-2"
                onClick={collapse}
            >
                <div
                    className={`group flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-lg py-2 md:hover:bg-primary/5`}
                >
                    <div className="flex items-center pl-2">
                        <HugeiconsIcon
                            icon={HomeIcon}
                            className="mr-2 size-5"
                            fontVariant="stroke"
                        />
                        <span className="text-sm">
                            {t('common.home')}
                        </span>
                    </div>
                    <HugeiconsIcon
                        icon={LinkCircleIcon}
                        className={`mr-2 size-6 pr-2 opacity-0 transition-opacity md:group-hover:opacity-100`}
                        fontVariant="stroke"
                    />
                </div>
            </Link>
        )
    );
};
