export const ragConstants = {
    mainSimilarityThreshold: 0.75,
    secondarySimilarityThreshold: 0.6,
    maxResults: 2,
    minInputLengthForRAG: 10,
    verificationMaxTokens: 40,
    contentUrls: {
        initialContentSubpath: '/no_watermark/',
        desiredContentSubpath: '/watermark/',
    },
} as const;
