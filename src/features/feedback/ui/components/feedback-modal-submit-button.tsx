import { useTranslations } from 'next-intl';

import { Flex } from '@/components/ui/flex';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type FeedbackModalSubmitButtonProps = {
    isSubmitting: boolean;
    submitButtonText: string;
};

export const FeedbackModalSubmitButton = ({
    isSubmitting,
    submitButtonText,
}: FeedbackModalSubmitButtonProps) => {
    const t = useTranslations('feedback');

    return (
        <Flex gap="sm" className="w-full" justify="end">
            <div className="w-[140px]">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                    aria-label={t('submitFeedback')}
                >
                    {isSubmitting ? (
                        <Spinner />
                    ) : (
                        submitButtonText
                    )}
                </Button>
            </div>
        </Flex>
    );
};
