export const runtime = 'edge';

import { useTranslations } from 'next-intl';

import { ErrorState } from '@/components/custom/errors/error-state';

const NotFoundIcon = '/404-error.webp';

export default function NotFound() {
    const t = useTranslations();

    return (
        <ErrorState
            iconPath={NotFoundIcon}
            errorMessage={t('error.notFound')}
            title={t('error.oops')}
            hideDiscordButton
            iconBottomMargin={5}
            iconSize={{
                width: 400,
                height: 400,
                mobileWidth: 300,
                mobileHeight: 300,
            }}
        />
    );
}
