import {
    NextResponse,
    type NextRequest,
} from 'next/server';

import { ragConstants } from '@/config';
import { trackRagVerifyUsageError } from '@/lib/mixpanel/errors';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

interface ApiResponse {
    choices?: {
        message?: {
            content?: string;
        };
    }[];
}

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const text_to_verify = searchParams.get(
            'text_to_verify',
        );
        const texts_to_verify_against = JSON.parse(
            searchParams.get('texts_to_verify_against') ||
                '[]',
        ) as string[];
        const max_tokens = parseInt(
            searchParams.get('max_tokens') ||
                ragConstants.verificationMaxTokens.toString(),
            10,
        );

        if (!process.env.API_KEY) {
            await trackRagVerifyUsageError(
                'configuration_error',
                'Server configuration error',
                500,
                'Missing API_KEY environment variable',
                req.headers.get('user-agent') || undefined,
            );
            return NextResponse.json(
                { error: 'Server configuration error' },
                {
                    status: 500,
                    headers: {
                        'Cache-Control':
                            'no-cache, no-store, must-revalidate, max-age=0',
                        Pragma: 'no-cache',
                        Expires: '0',
                    },
                },
            );
        }

        const response = await fetch(
            `https://${process.env.INFERENCE_ENDPOINT}/verify-content-usage`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.INFERENCE_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: {
                        text_to_verify,
                        texts_to_verify_against,
                    },
                    maxTokens: max_tokens,
                    stream: false,
                }),
            },
        );

        if (!response.ok) {
            const errorData = await response.text();
            await trackRagVerifyUsageError(
                'api_request_error',
                `API error: ${errorData}`,
                response.status,
                errorData,
                req.headers.get('user-agent') || undefined,
            );
            return NextResponse.json(
                { error: `API error: ${errorData}` },
                {
                    status: response.status,
                    headers: {
                        'Cache-Control':
                            'no-cache, no-store, must-revalidate, max-age=0',
                        Pragma: 'no-cache',
                        Expires: '0',
                    },
                },
            );
        }

        const data = (await response.json()) as ApiResponse;
        // Extract only the content from choices[0].message.content if it exists
        const content =
            data?.choices?.[0]?.message?.content || '';

        return NextResponse.json(
            { content },
            {
                headers: {
                    'Cache-Control':
                        'no-cache, no-store, must-revalidate, max-age=0',
                    Pragma: 'no-cache',
                    Expires: '0',
                },
            },
        );
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'Failed to process request';
        await trackRagVerifyUsageError(
            'unknown_error',
            errorMessage,
            500,
            undefined,
            req.headers.get('user-agent') || undefined,
        );
        return NextResponse.json(
            { error: 'Failed to process request' },
            {
                status: 500,
                headers: {
                    'Cache-Control':
                        'no-cache, no-store, must-revalidate, max-age=0',
                    Pragma: 'no-cache',
                    Expires: '0',
                },
            },
        );
    }
}
