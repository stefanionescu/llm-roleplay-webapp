'use client';

import { useTranslations } from 'next-intl';

import { ErrorState } from '@/components/custom/errors/error-state';

const DumpsterFireIcon = '/dumpster-fire.webp';

export default function Error() {
    const t = useTranslations('error');

    return (
        <ErrorState
            iconPath={DumpsterFireIcon}
            errorMessage={t('globalUnexpectedErrorLineOne')}
            title={t('ohno')}
            iconSize={{
                width: 400,
                height: 400,
                mobileWidth: 300,
                mobileHeight: 300,
            }}
            iconBottomMargin={5}
        />
    );
}
