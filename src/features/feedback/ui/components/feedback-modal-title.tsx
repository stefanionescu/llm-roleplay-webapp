import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { Flag01Icon } from '@hugeicons/core-free-icons';

import { Flex } from '@/components/ui/flex';
import { Type } from '@/components/ui/type';

export const FeedbackModalTitle = () => {
    const t = useTranslations('feedback');

    return (
        <Flex
            className="w-full p-4"
            gap="sm"
            items="center"
        >
            <HugeiconsIcon
                icon={Flag01Icon}
                className={`size-menu-icon-desktop stroke-menu-icon`}
                fontVariant="stroke"
                strokeWidth={2}
            />
            <Type size="base" weight="medium">
                {t('shareFeedback')}
            </Type>
        </Flex>
    );
};
