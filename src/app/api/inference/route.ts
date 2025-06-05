import { ZodError } from 'zod';
import {
    NextResponse,
    type NextRequest,
} from 'next/server';

import { trackInferenceError } from '@/lib/mixpanel/errors';
import { inferenceRequestParamsSchema } from '@/features/chat/server/validators';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Type for the raw request body before validation
type InferenceRequestParams = {
    messages: string;
    maxTokens?: string;
    systemPrompt: string;
};

export async function POST(req: NextRequest) {
    try {
        const params =
            (await req.json()) as InferenceRequestParams;

        const validationResult =
            inferenceRequestParamsSchema.safeParse(params);

        if (!validationResult.success) {
            await trackInferenceError(
                'validation_error',
                'Invalid request parameters',
                400,
                JSON.stringify(
                    validationResult.error.flatten()
                        .fieldErrors,
                ),
                req.headers.get('user-agent') || undefined,
            );
            return NextResponse.json(
                {
                    error: 'Invalid request parameters',
                    details:
                        validationResult.error.flatten()
                            .fieldErrors,
                },
                { status: 400 },
            );
        }

        const { systemPrompt, messages, maxTokens } =
            validationResult.data;

        const inferenceEndpoint = `https://${process.env.INFERENCE_ENDPOINT}/roleplay`;

        const requestBody = {
            systemPrompt: systemPrompt,
            messages: messages.map((msg) => ({
                role: msg.role,
                content: [
                    { type: 'text', text: msg.content },
                ],
            })),
            maxTokens: maxTokens,
            stream: true,
        };

        // Handle abort signals directly from client
        const controller = new AbortController();

        // Forward the client's abort signal to our controller
        req.signal.addEventListener('abort', () => {
            controller.abort('Request canceled by client');
        });

        const response = await fetch(inferenceEndpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.INFERENCE_KEY}`,
                'Content-Type': 'application/json',
                Accept: 'text/event-stream',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
        });

        if (!response.ok) {
            await trackInferenceError(
                'api_request_error',
                `HTTP error! status: ${response.status}`,
                response.status,
                undefined,
                req.headers.get('user-agent') || undefined,
            );
            throw new Error(
                `HTTP error! status: ${response.status}`,
            );
        }

        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
            status: response.status,
            statusText: response.statusText,
        });
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            error.name === 'AbortError'
        ) {
            await trackInferenceError(
                'abort_error',
                'Request aborted',
                499,
                undefined,
                req.headers.get('user-agent') || undefined,
            );
            return new Response('Request aborted', {
                status: 499, // Using 499 Client Closed Request
            });
        }
        if (error instanceof ZodError) {
            await trackInferenceError(
                'validation_error',
                'Invalid request parameters',
                400,
                JSON.stringify(error.flatten().fieldErrors),
                req.headers.get('user-agent') || undefined,
            );
            return NextResponse.json(
                {
                    error: 'Invalid request parameters',
                    details: error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const errorMessage =
            error instanceof Error
                ? error.message
                : 'Unknown error occurred';
        await trackInferenceError(
            'unknown_error',
            errorMessage,
            500,
            undefined,
            req.headers.get('user-agent') || undefined,
        );
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 },
        );
    }
}
