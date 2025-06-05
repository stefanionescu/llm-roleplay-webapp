import { useTranslations } from 'next-intl';
import { FieldErrors } from 'react-hook-form';
import { UseFormRegister } from 'react-hook-form';

import { Type } from '@/components/ui/type';
import { Textarea } from '@/components/ui/textarea';
import { FormLabel } from '@/components/ui/form-label';
import { ClientFeedbackSchema } from '@/validators/feedback';

import { FeedbackModalEmailInput } from './feedback-modal-email-input';

type FeedbackModalMainInputProps = {
    errors: FieldErrors<ClientFeedbackSchema>;
    register: UseFormRegister<ClientFeedbackSchema>;
};

export const FeedbackModalMainInput = ({
    register,
    errors,
}: FeedbackModalMainInputProps) => {
    const t = useTranslations('feedback');

    return (
        <>
            <FeedbackModalEmailInput
                register={register}
                errors={errors}
            />

            <FormLabel label={t('feedback')} />

            <Textarea
                id="feedback"
                autoFocus={false}
                tabIndex={-1}
                placeholder={t('shareYourThoughts')}
                className="w-full resize-none"
                {...register('feedback')}
            />

            {errors.feedback && (
                <Type size="sm" textColor="destructive">
                    {' '}
                    {errors.feedback.message}
                </Type>
            )}
        </>
    );
};
