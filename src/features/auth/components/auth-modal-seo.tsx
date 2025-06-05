import { useTranslations } from 'next-intl';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

import { DialogTitle } from '@/components/ui/dialog';

export const AuthModalSeo = () => {
    const t = useTranslations('auth');

    return (
        <>
            <VisuallyHidden.Root>
                <DialogTitle>
                    {t('createAccount')}
                </DialogTitle>{' '}
            </VisuallyHidden.Root>

            <DialogPrimitive.Description className="sr-only">
                {t('createAccount')}
            </DialogPrimitive.Description>
        </>
    );
};
