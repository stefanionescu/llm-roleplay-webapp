import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

import { RawRagApiResponse } from '@/types/rag';
import { trackRagError } from '@/lib/mixpanel/errors';
import { hybridRAGWithHashtagsURLParamsSchema } from '@/features/chat/server/validators';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    try {
        // Get URL parameters
        const url = new URL(request.url);
        const searchParams = Object.fromEntries(
            url.searchParams.entries(),
        );

        // Validate and transform URL parameters
        const validatedParams =
            hybridRAGWithHashtagsURLParamsSchema.parse(
                searchParams,
            );

        // Get API configuration
        const mainApiEndpoint = process.env.API_ENDPOINT;
        const apiKey = process.env.API_KEY;

        if (!mainApiEndpoint || !apiKey) {
            await trackRagError(
                'configuration_error',
                'Missing required API configuration',
                500,
                undefined,
                request.headers.get('user-agent') ||
                    undefined,
            );
            return NextResponse.json(
                {
                    error: 'Missing required API configuration',
                },
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

        // Construct base URL
        const baseUrl = mainApiEndpoint.startsWith('http')
            ? mainApiEndpoint
            : `https://${mainApiEndpoint}`;

        // Construct query parameters
        const queryParams = new URLSearchParams({
            user_id: validatedParams.user_id,
            text: validatedParams.text,
            language_code: validatedParams.language_code,
            hashtags: validatedParams.hashtags.join(','),
            secondary_hashtags:
                validatedParams.secondary_hashtags
                    ?.map((arr) => arr.join(','))
                    .join('|') || '',
            similarity_threshold:
                validatedParams.similarity_threshold.toString(),
            max_results:
                validatedParams.max_results.toString(),
        });

        // Handle abort signals directly from client
        const controller = new AbortController();

        // Forward the client's abort signal to our controller
        request.signal.addEventListener('abort', () => {
            controller.abort('Request canceled by client');
        });

        // Make request to the main API using the request's signal
        const response = await fetch(
            `${baseUrl}/rag/hybrid-rag-with-hashtags?${queryParams.toString()}`,
            {
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        if (!response.ok) {
            await trackRagError(
                'api_request_error',
                `API request failed with status ${response.status}`,
                response.status,
                undefined,
                request.headers.get('user-agent') ||
                    undefined,
            );
            return NextResponse.json(
                {
                    error: `API request failed with status ${response.status}`,
                },
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

        const data =
            (await response.json()) as RawRagApiResponse;
        return NextResponse.json(data, {
            headers: {
                'Cache-Control':
                    'no-cache, no-store, must-revalidate, max-age=0',
                Pragma: 'no-cache',
                Expires: '0',
            },
        });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            await trackRagError(
                'validation_error',
                'Invalid input parameters',
                400,
                JSON.stringify(error.errors),
                request.headers.get('user-agent') ||
                    undefined,
            );
            return NextResponse.json(
                {
                    error: 'Invalid input parameters',
                    details: error.errors,
                },
                {
                    status: 400,
                    headers: {
                        'Cache-Control':
                            'no-cache, no-store, must-revalidate, max-age=0',
                        Pragma: 'no-cache',
                        Expires: '0',
                    },
                },
            );
        }

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                await trackRagError(
                    'abort_error',
                    'Request aborted',
                    undefined,
                    undefined,
                    request.headers.get('user-agent') ||
                        undefined,
                );
                return NextResponse.json(
                    { results: [] },
                    {
                        headers: {
                            'Cache-Control':
                                'no-cache, no-store, must-revalidate, max-age=0',
                            Pragma: 'no-cache',
                            Expires: '0',
                        },
                    },
                );
            }

            if (
                error.message ===
                'Missing required API configuration'
            ) {
                await trackRagError(
                    'configuration_error',
                    error.message,
                    500,
                    undefined,
                    request.headers.get('user-agent') ||
                        undefined,
                );
                return NextResponse.json(
                    { error: error.message },
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

        const errorMessage =
            error instanceof Error
                ? error.message
                : 'Failed to fetch RAG results';
        await trackRagError(
            'unknown_error',
            errorMessage,
            500,
            undefined,
            request.headers.get('user-agent') || undefined,
        );
        return NextResponse.json(
            { error: 'Failed to fetch RAG results' },
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
