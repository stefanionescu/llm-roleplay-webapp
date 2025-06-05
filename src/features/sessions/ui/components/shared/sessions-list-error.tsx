import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { RssErrorIcon } from '@hugeicons/core-free-icons';

export const SessionsListError = () => {
    const t = useTranslations('error');

    return (
        <div className="flex size-full flex-col items-center justify-center">
            <HugeiconsIcon
                icon={RssErrorIcon}
                className="mb-4 size-8 text-gray-400"
            />
            <p className="text-md px-8 text-center text-gray-400">
                {t('sessionsListError')}
            </p>
        </div>
    );
};
