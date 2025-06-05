import { ragConstants } from '@/config';
import { TCharacter } from '@/types/character';
import { RagApiResponse, RagResultItem } from '@/types/rag';

/**
 * Determines if RAG should be performed based on input length
 */
export const shouldPerformRag = (
    input: string,
): boolean => {
    return (
        input.trim().length >
        ragConstants.minInputLengthForRAG
    );
};

/**
 * Builds parameters for the RAG API call
 */
export const buildRagQueryParams = (
    input: string,
    language: string,
    character: TCharacter,
    userId: string,
    similarityThreshold: number,
): URLSearchParams => {
    return new URLSearchParams({
        text: input,
        language_code: language.toLowerCase(),
        hashtags: character.main_hashtags.join(','),
        secondary_hashtags:
            character.secondary_hashtags
                ?.map((arr) => arr.join(','))
                .join('|') || '',
        similarity_threshold:
            similarityThreshold.toString(),
        max_results: ragConstants.maxResults.toString(),
        user_id: userId,
    });
};

// Helper to deduplicate results by url (internal, not exported)
function dedupeByUrl(
    contents: string[],
    urls: string[],
    fullContentIds: string[],
) {
    const seen = new Set<string>();
    const dedupedContents: string[] = [];
    const dedupedUrls: string[] = [];
    const dedupedFullContentIds: string[] = [];
    for (let i = 0; i < urls.length; ++i) {
        const url = urls[i];
        if (!seen.has(url)) {
            seen.add(url);
            dedupedContents.push(contents[i]);
            dedupedUrls.push(url);
            dedupedFullContentIds.push(fullContentIds[i]);
        }
    }
    return {
        contents: dedupedContents,
        urls: dedupedUrls,
        fullContentIds: dedupedFullContentIds,
    };
}

/**
 * Fetches relevant content from the RAG API
 */
export const getRelevantContent = async (
    input: string,
    language: string,
    character: TCharacter,
    userId: string,
    signal: AbortSignal,
    previousAiText?: string | null,
): Promise<{
    urls: string[];
    contents: string[];
    fullContentIds: string[];
}> => {
    // Don't perform RAG if input is too short
    if (!shouldPerformRag(input)) {
        return {
            contents: [],
            urls: [],
            fullContentIds: [],
        };
    }

    // Helper to do a single RAG request
    const doRag = async (
        text: string,
        similarityThreshold: number,
    ) => {
        const queryParams = buildRagQueryParams(
            text,
            language,
            character,
            userId,
            similarityThreshold,
        );
        const response = await fetch(
            `/api/rag?${queryParams.toString()}`,
            {
                signal,
                cache: 'no-store',
            },
        );
        if (!response.ok) {
            throw new Error(
                `API request failed with status ${response.status}`,
            );
        }
        const ragResults =
            (await response.json()) as RagApiResponse;
        if (
            ragResults.results &&
            ragResults.results.length > 0
        ) {
            const contents = ragResults.results
                .filter(
                    (result: RagResultItem) =>
                        result.content,
                )
                .map(
                    (result: RagResultItem) =>
                        result.content,
                );
            const urls = ragResults.results
                .filter(
                    (result: RagResultItem) =>
                        result.storage_bucket_id &&
                        result.storage_object_name,
                )
                .map(
                    (result: RagResultItem) =>
                        `${result.storage_bucket_id}/${result.storage_object_name}`,
                );
            const fullContentIds = ragResults.results
                .filter(
                    (result: RagResultItem) =>
                        result.full_content_id,
                )
                .map(
                    (result: RagResultItem) =>
                        result.full_content_id,
                );
            return { contents, urls, fullContentIds };
        }
        return {
            contents: [],
            urls: [],
            fullContentIds: [],
        };
    };

    // If previousAiText is provided and non-empty, do both requests in parallel
    if (
        previousAiText &&
        shouldPerformRag(previousAiText)
    ) {
        let userRag, aiRag;
        try {
            [userRag, aiRag] = await Promise.all([
                doRag(
                    input,
                    ragConstants.mainSimilarityThreshold,
                ),
                doRag(
                    previousAiText,
                    ragConstants.secondarySimilarityThreshold,
                ),
            ]);
        } catch (err) {
            // If one fails, use the other if available
            if (
                err instanceof Error &&
                err.name === 'AbortError'
            )
                throw err;
            // Try to recover with whichever succeeded
            try {
                userRag = await doRag(
                    input,
                    ragConstants.mainSimilarityThreshold,
                );
            } catch {}
            try {
                aiRag = await doRag(
                    previousAiText,
                    ragConstants.secondarySimilarityThreshold,
                );
            } catch {}
        }

        // If userRag has results, use only those
        if (userRag && userRag.contents.length > 0) {
            return dedupeByUrl(
                userRag.contents,
                userRag.urls,
                userRag.fullContentIds,
            );
        }
        // If aiRag has results, use those
        if (aiRag && aiRag.contents.length > 0) {
            return dedupeByUrl(
                aiRag.contents,
                aiRag.urls,
                aiRag.fullContentIds,
            );
        }
        // If both failed or empty, return empty
        return {
            contents: [],
            urls: [],
            fullContentIds: [],
        };
    } else {
        // Only do user input RAG
        try {
            const result = await doRag(
                input,
                ragConstants.mainSimilarityThreshold,
            );
            return dedupeByUrl(
                result.contents,
                result.urls,
                result.fullContentIds,
            );
        } catch (err) {
            if (
                err instanceof Error &&
                err.name === 'AbortError'
            )
                throw err;
            return {
                contents: [],
                urls: [],
                fullContentIds: [],
            };
        }
    }
};

/**
 * Builds parameters for the RAG verification API call
 */
export const buildRagVerificationParams = (
    messageContent: string,
    relevantContent: string[],
): URLSearchParams => {
    return new URLSearchParams({
        text_to_verify: messageContent,
        texts_to_verify_against:
            JSON.stringify(relevantContent),
        max_tokens:
            ragConstants.verificationMaxTokens.toString(),
    });
};

/**
 * Makes the API call to verify RAG usage
 */
export const fetchRagVerification = async (
    params: URLSearchParams,
): Promise<{ content: string }> => {
    const response = await fetch(
        `/api/rag/verify-usage?${params.toString()}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        },
    );

    if (!response.ok) {
        throw new Error(
            `Verification API request failed with status ${response.status}`,
        );
    }

    return response.json() as Promise<{ content: string }>;
};

/**
 * Verifies which RAG content was actually used in the generated response
 */
export const verifyRagUsage = async (
    messageContent: string,
    relevantContent: string[],
    contentUrls: string[],
    fullContentIds: string[],
): Promise<{
    relevantUrls: string[];
    relevantContentIds: string[];
}> => {
    // Skip verification if there's no content to verify
    if (relevantContent.length === 0 || !messageContent) {
        return { relevantUrls: [], relevantContentIds: [] };
    }

    try {
        // Build request parameters
        const params = buildRagVerificationParams(
            messageContent,
            relevantContent,
        );

        // Make the API request
        const verificationData =
            await fetchRagVerification(params);

        // Get the references boolean array once
        let references: boolean[] = [];
        try {
            const contentObj = JSON.parse(
                verificationData.content,
            ) as { references?: boolean[] };

            if (
                contentObj?.references &&
                Array.isArray(contentObj.references)
            ) {
                references = contentObj.references;
            }
        } catch {}

        // Apply the references to both URLs and content IDs
        const relevantUrls = references
            .map((isRelevant, index) =>
                isRelevant && index < contentUrls.length
                    ? contentUrls[index]
                    : null,
            )
            .filter((url): url is string => url !== null);

        const relevantContentIds = references
            .map((isRelevant, index) =>
                isRelevant && index < fullContentIds.length
                    ? fullContentIds[index]
                    : null,
            )
            .filter((id): id is string => id !== null);

        return { relevantUrls, relevantContentIds };
    } catch {
        return { relevantUrls: [], relevantContentIds: [] };
    }
};

/**
 * Applies penalties to content that was used in the response
 * Wrapped in try/catch to prevent any errors from affecting the main flow
 */
export const applyContentPenalties = async (
    fullContentIds: string[],
): Promise<void> => {
    if (!fullContentIds || fullContentIds.length === 0) {
        return;
    }

    try {
        // Call the API directly using the endpoint format that's expected by the server
        await fetch('/api/trpc/chat.applyPenalties', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                json: {
                    chunkIds: fullContentIds,
                },
            }),
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
    } catch (_error) {
        // Intentionally left empty as errors should not affect the main flow
    }
};
