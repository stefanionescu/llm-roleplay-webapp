import { FormikProps } from 'formik';
import { useTranslations } from 'next-intl';

import { Type } from '@/components/ui/type';
import { Flex } from '@/components/ui/flex';
import { Input } from '@/components/ui/input';

type EmailFormValues = {
    email: string;
};

type AuthEmailFormProps = {
    isSubmitting: boolean;
    onEnterPress: () => void;
    formik: FormikProps<EmailFormValues>;
};

export const AuthEmailForm = ({
    formik,
    isSubmitting,
    onEnterPress,
}: AuthEmailFormProps) => {
    const t = useTranslations();

    return (
        <Flex direction="col" className="w-[90%]">
            <Input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={(e) => {
                    // Limit to 75 characters
                    if (e.target.value.length > 75) return;

                    // Just update the field value without immediate validation
                    formik.handleChange(e);

                    // Don't validate as the user types - only on submit
                }}
                onKeyDown={(e) => {
                    if (
                        e.key === 'Enter' &&
                        formik.values.email &&
                        !isSubmitting
                    ) {
                        // Prevent default behavior
                        e.preventDefault();
                        e.stopPropagation();

                        // Remove focus from input and prevent focus transfer to modal
                        if (
                            document.activeElement instanceof
                            HTMLElement
                        ) {
                            document.activeElement.blur();
                        }

                        // Add a small delay to allow blur to take effect
                        setTimeout(() => {
                            // Call the onEnterPress function
                            onEnterPress();
                        }, 10);
                    }
                }}
                onBlur={formik.handleBlur}
                variant="ghost"
                placeholder={t('common.email')}
                size="signin"
                rounded="full"
                className="w-full focus:border-zinc-500/20 focus:outline-none focus:ring-0"
                disabled={isSubmitting}
            />
            {formik.touched.email &&
                formik.errors.email && (
                    <div className="mt-2">
                        <Type
                            size="xs"
                            textColor="tertiary"
                            className="ml-3 text-red-500"
                        >
                            {formik.errors.email}
                        </Type>
                    </div>
                )}
        </Flex>
    );
};
