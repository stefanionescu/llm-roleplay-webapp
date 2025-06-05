import React from 'react';
import { FormikProps } from 'formik';

import { Flex } from '@/components/ui/flex';
import { Type } from '@/components/ui/type';
import { Input } from '@/components/ui/input';

type OtpInputFieldsProps = {
    isSubmitting: boolean;
    formik: FormikProps<{ otp: string }>;
    onInputChange: (index: number, value: string) => void;
    onPaste: (
        e: React.ClipboardEvent<HTMLInputElement>,
    ) => void;
    otpInputRefs: React.MutableRefObject<
        (HTMLInputElement | null)[]
    >;
    onKeyDown: (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => void;
};

export const OtpInputFields: React.FC<
    OtpInputFieldsProps
> = ({
    formik,
    isSubmitting,
    otpInputRefs,
    onInputChange,
    onKeyDown,
    onPaste,
}) => {
    return (
        <>
            <Flex
                direction="row"
                gap="sm"
                className="my-4 justify-center"
            >
                {Array(6)
                    .fill(0)
                    .map((_, index) => (
                        <Input
                            key={index}
                            type="text"
                            maxLength={1}
                            className="size-12 text-center"
                            value={
                                formik.values.otp[index] ||
                                ''
                            }
                            onChange={(e) =>
                                onInputChange(
                                    index,
                                    e.target.value,
                                )
                            }
                            onKeyDown={(e) =>
                                onKeyDown(index, e)
                            }
                            onPaste={
                                index === 0
                                    ? onPaste
                                    : undefined
                            }
                            ref={(el) => {
                                otpInputRefs.current[
                                    index
                                ] = el;
                            }}
                            variant="ghost"
                            disabled={isSubmitting}
                            inputMode="numeric"
                            pattern="[0-9]*"
                        />
                    ))}
            </Flex>

            {formik.submitCount > 0 &&
                formik.errors.otp && (
                    <div className="mt-2">
                        <Type
                            size="xs"
                            textColor="tertiary"
                            className="text-center text-red-500"
                        >
                            {formik.errors.otp}
                        </Type>
                    </div>
                )}
        </>
    );
};
