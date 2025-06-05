'use client';

import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';
import React, { useCallback, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';

import { cn } from '@/lib/utils/shad';
import { Flex } from '@/components/ui/flex';
import { Type } from '@/components/ui/type';
import { feedbackConstants } from '@/config';
import { useStore } from '@/lib/zustand/store';
import { sendFeedbackAction } from '@/actions/send-feedback';
import { FeedbackModalSeo } from '@/features/feedback/ui/components/feedback-modal-seo';
import { FeedbackModalTitle } from '@/features/feedback/ui/components/feedback-modal-title';
import {
    ClientFeedbackSchema,
    createClientFeedbackSchema,
} from '@/validators/feedback';
import { FeedbackModalMainInput } from '@/features/feedback/ui/components/feedback-modal-main-input';
import {
    Dialog,
    DialogContent,
    DialogOverlay,
    DialogPortal,
} from '@/components/ui/dialog';
import { FeedbackModalEmotionSelector } from '@/features/feedback/ui/components/feedback-modal-emotion-selector';

import { FeedbackModalSubmitButton } from '../components/feedback-modal-submit-button';

export const FeedbackModal = () => {
    const t = useTranslations();
    const { isFeedbackOpen, setIsFeedbackOpen } = useStore(
        useShallow((state) => ({
            isFeedbackOpen: state.isFeedbackOpen,
            setIsFeedbackOpen: state.setIsFeedbackOpen,
        })),
    );

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (open !== isFeedbackOpen) {
                setIsFeedbackOpen(open);
            }
        },
        [isFeedbackOpen, setIsFeedbackOpen],
    );

    const feedbackSchema = useMemo(
        () => createClientFeedbackSchema(t),
        [t],
    );

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        watch,
        reset,
    } = useForm<ClientFeedbackSchema>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: {
            email: '',
            feedback: '',
            feedbackType: 'positive',
        },
    });

    const selectedFeedbackType = watch('feedbackType');

    const feedbackOptions = useMemo(
        () => feedbackConstants.feedbackTypes,
        [],
    );

    const onSubmit: SubmitHandler<
        ClientFeedbackSchema
    > = async (data) => {
        const result = await sendFeedbackAction({
            ...data,
            emotionText: data.feedbackType,
        });

        if (result.success) {
            reset();
            setIsFeedbackOpen(false);
            toast.success(t('feedback.successDescription'));
        }
    };

    return (
        <Dialog
            open={isFeedbackOpen}
            onOpenChange={handleOpenChange}
        >
            <DialogPortal>
                <DialogOverlay />

                <DialogContent
                    ariaTitle="Characters"
                    className={cn(
                        'fixed left-[50%] top-[50%] z-50 w-[96vw] max-w-md translate-x-[-50%] translate-y-[-50%]',
                        'rounded-xl border border-white/10 bg-zinc-800 p-0 shadow-lg',
                        'md:w-[400px]',
                        '!m-0',
                    )}
                >
                    <FeedbackModalSeo />
                    <form
                        noValidate
                        onSubmit={handleSubmit(onSubmit)}
                        className="relative w-full space-y-4"
                    >
                        <FeedbackModalTitle />

                        <Flex
                            gap="sm"
                            direction="col"
                            className="w-full px-6 pb-6"
                        >
                            <Type
                                size="sm"
                                textColor="secondary"
                            >
                                {t(
                                    'feedback.feedbackDescription',
                                )}
                            </Type>

                            <FeedbackModalMainInput
                                register={register}
                                errors={errors}
                            />

                            <FeedbackModalEmotionSelector
                                feedbackOptions={
                                    feedbackOptions
                                }
                                selectedFeedbackType={
                                    selectedFeedbackType
                                }
                                onSelectFeedbackType={(
                                    type: ClientFeedbackSchema['feedbackType'],
                                ) =>
                                    setValue(
                                        'feedbackType',
                                        type,
                                        {
                                            shouldValidate:
                                                true,
                                        },
                                    )
                                }
                            />

                            <FeedbackModalSubmitButton
                                isSubmitting={isSubmitting}
                                submitButtonText={t(
                                    'feedback.submitFeedback',
                                )}
                            />
                        </Flex>
                    </form>{' '}
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
};
