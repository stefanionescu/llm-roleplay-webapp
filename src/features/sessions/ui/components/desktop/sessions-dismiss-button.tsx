import { forwardRef } from 'react';
import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

import { Button } from '@/components/ui/button';

type SessionsDismissButtonProps = {
    handleOpenChange: (open: boolean) => void;
};

export const SessionsDismissButton = forwardRef<
    HTMLButtonElement,
    SessionsDismissButtonProps
>(({ handleOpenChange, ...props }, ref) => {
    const t = useTranslations();

    return (
        <Button
            ref={ref}
            variant="ghost"
            size="iconSm"
            onClick={() => handleOpenChange(false)}
            aria-label={t('common.close')}
            {...props}
        >
            <HugeiconsIcon
                icon={Cancel01Icon}
                className="size-menu-icon-desktop"
                fontVariant="stroke"
                aria-hidden="true"
            />
        </Button>
    );
});

SessionsDismissButton.displayName = 'SessionsDismissButton';
