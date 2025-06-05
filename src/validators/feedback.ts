import { z } from 'zod';

const feedbackTypes = [
    'positive',
    'neutral',
    'negative',
] as const;

export const setServerFeedbackSchema = z
    .object({
        feedback: z
            .string()
            .min(1, 'Feedback cannot be empty.'),
        feedbackType: z.enum(feedbackTypes, {
            errorMap: () => ({
                message: 'Invalid feedback type.',
            }),
        }),
        email: z.string().email('Invalid email address.'),
    })
    .transform((data) => {
        let emotionText: string = data.feedbackType;

        switch (data.feedbackType) {
            case 'positive':
                emotionText = '😊 Happy';
                break;

            case 'neutral':
                emotionText = '😐 Neutral';
                break;

            case 'negative':
                emotionText = '😔 Sad';
                break;
        }

        return {
            ...data,
            emotionText,
        };
    });

export const createClientFeedbackSchema = (
    t: (key: string) => string,
) =>
    z.object({
        email: z
            .string({
                required_error: t('error.emailRequired'),
            })
            .email(t('error.invalidEmail')),
        feedbackType: z.enum(feedbackTypes),
        feedback: z
            .string({
                required_error: t('error.feedbackRequired'),
            })
            .min(1, t('error.feedbackRequired')),
    });

export type ServerFeedbackSchema = z.infer<
    typeof setServerFeedbackSchema
>;
export type ClientFeedbackSchema = z.infer<
    ReturnType<typeof createClientFeedbackSchema>
>;
