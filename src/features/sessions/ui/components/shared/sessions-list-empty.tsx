import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';

export const SessionsListEmpty = () => {
    const t = useTranslations('sessions');

    return (
        <div className="flex size-full flex-col items-center justify-center">
            <HugeiconsIcon
                icon={Search01Icon}
                className="mb-4 size-8 text-gray-400"
            />
            <p className="text-md px-8 text-center text-gray-400">
                {t('empty')}
            </p>
        </div>
    );
};
