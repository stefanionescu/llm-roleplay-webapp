export type RagResultItem = {
    id: string;
    content: string;
    post_url: string;
    similarity: number;
    full_content_id: string;
    storage_bucket_id: string;
    matching_hashtags: string[];
    storage_object_name: string;
};

export type RagMetadata = {
    request_id: string;
    duration_ms: number;
    query_length: number;
    language_code: string;
    results_count: number;
    hashtags_count: number;
    secondary_hashtags_count: number;
};

export type RawRagApiResponse = {
    results: {
        id: string;
        score?: number;
        content: string;
        metadata?: Record<string, unknown>;
    }[];
};

export type RagApiResponse = {
    metadata: RagMetadata;
    results: RagResultItem[];
};

export type RagVerificationResponse = {
    content: string;
};
