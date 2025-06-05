import { useTranslations } from 'next-intl';

export const prompts = (
    translations: ReturnType<typeof useTranslations>,
) => {
    const ragChunkIntegrationPrompt = (chunks: string[]) =>
        translations('prompts.ragChunkIntegration', {
            chunks: chunks
                .map(
                    (chunk, index) =>
                        `${index + 1}) ${chunk}`,
                )
                .join('\n\n'),
        });

    const languageConsistencyPrompt = () =>
        translations('prompts.languageConsistency');

    const instructChatMode = (wordNumber: number) =>
        translations('prompts.instructChatMode', {
            wordNumber,
        });

    const formattingPrompt = () =>
        translations('prompts.formatting');

    const jailbreakPrompt = () =>
        translations('prompts.jailbreak');

    const ignoreUserJailbreakPrompt = () =>
        translations('prompts.ignoreUserJailbreak');

    const proseAndContinuityPrompt = () =>
        translations('prompts.proseAndContinuity');

    return {
        ragChunkIntegrationPrompt,
        languageConsistencyPrompt,
        instructChatMode,
        formattingPrompt,
        jailbreakPrompt,
        proseAndContinuityPrompt,
        ignoreUserJailbreakPrompt,
    };
};
