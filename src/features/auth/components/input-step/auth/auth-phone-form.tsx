import { FormikProps } from 'formik';
import { useTranslations } from 'next-intl';

import { Type } from '@/components/ui/type';
import { Flex } from '@/components/ui/flex';
import { Input } from '@/components/ui/input';
import CountryCodePicker from '@/features/auth/components/country-code/country-code-picker';

type PhoneFormValues = {
    phone: string;
    countryCode?: string;
};

type AuthPhoneFormProps = {
    countryCode: string;
    isSubmitting: boolean;
    onEnterPress: () => void;
    formik: FormikProps<PhoneFormValues>;
    onCountryCodeChange: (value: string) => void;
};

export const AuthPhoneForm = ({
    formik,
    isSubmitting,
    countryCode,
    onCountryCodeChange,
    onEnterPress,
}: AuthPhoneFormProps) => {
    const t = useTranslations();

    return (
        <Flex direction="col" className="w-[90%]">
            <Flex direction="row" className="w-full">
                <CountryCodePicker
                    value={countryCode}
                    onChange={(value) => {
                        onCountryCodeChange(value);
                        // Only validate on submit, not on country code change
                    }}
                    disabled={isSubmitting}
                    className="shrink-0 [&>button]:border-r-0"
                />
                <Input
                    type="tel"
                    name="phone"
                    value={formik.values.phone}
                    onChange={(e) => {
                        // Only allow numbers and limit to 15 digits
                        if (
                            e.target.value &&
                            !/^\d*$/.test(e.target.value)
                        )
                            return;
                        if (e.target.value.length > 15)
                            return;

                        // Just update the field value without immediate validation
                        formik.handleChange(e);

                        // Don't validate as the user types - only on submit
                    }}
                    onKeyDown={(e) => {
                        if (
                            e.key === 'Enter' &&
                            formik.values.phone &&
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
                    placeholder={t('common.phone')}
                    size="signin"
                    rounded="full"
                    className="w-full rounded-l-none rounded-r-full focus:border-zinc-500/20 focus:outline-none focus:ring-0"
                    disabled={isSubmitting}
                />
            </Flex>
            {formik.touched.phone &&
                formik.errors.phone && (
                    <div className="mt-2">
                        <Type
                            size="xs"
                            textColor="tertiary"
                            className="ml-3 text-red-500"
                        >
                            {formik.errors.phone}
                        </Type>
                    </div>
                )}
        </Flex>
    );
};
