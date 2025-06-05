import { useTranslations } from 'next-intl';

import { Flex } from '@/components/ui/flex';
import { Type } from '@/components/ui/type';

export const InputSectionFooter = () => {
    const t = useTranslations();

    return (
        <Flex
            className="mb-1 w-full px-4 py-2"
            justify="center"
            gap="xs"
        >
            <Type
                size="xxs"
                textColor="secondary"
                className="inline-block text-center"
            >
                {t('chat.characterWarning')}
            </Type>
        </Flex>
    );
};
