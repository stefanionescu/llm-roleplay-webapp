'use client';

import { useTranslations } from 'next-intl';

import { ErrorState } from '@/components/custom/errors/error-state';

const RetiredCharacterIcon = '/retired-error.webp';

export default function Error() {
    const t = useTranslations();
    const errorMessage =
        t('error.singleCharacterOnStrikeLineOne') +
        '\n\n' +
        t('error.singleCharacterOnStrikeLineTwo');

    return (
        <ErrorState
            iconPath={RetiredCharacterIcon}
            errorMessage={errorMessage}
            title={t('error.ohno')}
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
