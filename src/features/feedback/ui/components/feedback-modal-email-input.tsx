import { useTranslations } from 'next-intl';
import {
    FieldErrors,
    UseFormRegister,
} from 'react-hook-form';

import { Type } from '@/components/ui/type';
import { Input } from '@/components/ui/input';
import { FormLabel } from '@/components/ui/form-label';
import { ClientFeedbackSchema } from '@/validators/feedback';

type FeedbackModalEmailInputProps = {
    errors: FieldErrors<ClientFeedbackSchema>;
    register: UseFormRegister<ClientFeedbackSchema>;
};

export const FeedbackModalEmailInput = ({
    register,
    errors,
}: FeedbackModalEmailInputProps) => {
    const t = useTranslations('common');

    return (
        <>
            <FormLabel label={t('email')} />

            <Input
                type="email"
                autoFocus={false}
                tabIndex={-1}
                placeholder={t('email')}
                className="w-full"
                {...register('email')}
            />

            {errors.email && (
                <Type size="sm" textColor="destructive">
                    {' '}
                    {errors.email.message}
                </Type>
            )}
        </>
    );
};
