'use server';

import { z } from 'zod';
import { Resend } from 'resend';

import { emailConstants } from '@/config';
import {
    ServerFeedbackSchema,
    setServerFeedbackSchema,
} from '@/validators/feedback';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendFeedbackAction(
    args: ServerFeedbackSchema,
): Promise<{
    success: boolean;
    error?: string | z.ZodIssue[];
}> {
    const validationResult =
        setServerFeedbackSchema.safeParse(args);

    if (!validationResult.success) {
        return {
            success: false,
            error: validationResult.error.errors,
        };
    }

    // Use the validated and transformed data
    const { feedback, email, emotionText } =
        validationResult.data;

    try {
        const emailSubject = `${emailConstants.feedbackEmailSubject} - ${emotionText}`;
        const emailContent = `From: ${email}\n\n${feedback}`;

        await resend.emails.send({
            from: `${emailConstants.feedbackEmailName} <${emailConstants.feedbackEmail}>`,
            to: emailConstants.feedbackEmail,
            subject: emailSubject,
            text: emailContent,
            replyTo: email,
        });

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Failed to send feedback. Please try again later.',
        };
    }
}
