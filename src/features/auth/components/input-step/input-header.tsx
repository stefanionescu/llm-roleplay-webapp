import React from 'react';
import { useTranslations } from 'next-intl';

import { Type } from '@/components/ui/type';
import { Flex } from '@/components/ui/flex';

type InputHeaderProps = {
    title?: string;
};

export const InputHeader: React.FC<InputHeaderProps> = ({
    title,
}) => {
    const t = useTranslations();

    return (
        <Flex
            gap="xs"
            direction="col"
            className="max-md:mt-2"
        >
            <Type weight="bold" size="lg">
                {title || t('auth.createAccount')}
            </Type>
        </Flex>
    );
};
