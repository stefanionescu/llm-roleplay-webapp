import { useTranslations } from 'next-intl';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

import { DialogTitle } from '@/components/ui/dialog';

export const FeedbackModalSeo = () => {
    const t = useTranslations('feedback');

    return (
        <>
            <VisuallyHidden.Root>
                <DialogTitle>{t('title')}</DialogTitle>{' '}
            </VisuallyHidden.Root>

            <DialogPrimitive.Description className="sr-only">
                {t('feedbackDescription')}
            </DialogPrimitive.Description>
        </>
    );
};
