import { useTranslations } from 'next-intl';

import { Flex } from '@/components/ui/flex';
import { Type } from '@/components/ui/type';
import { Spinner } from '@/components/ui/spinner';

type InferenceProgressIndicatorProps = {
    rawAI: string;
    isDoingRAG: boolean;
    isGenerating: boolean;
    isCheckingRAGUsage: boolean;
    isPreparingToGenerate: boolean;
};

export const InferenceProgressIndicator = ({
    rawAI,
    isDoingRAG,
    isPreparingToGenerate,
    isCheckingRAGUsage,
    isGenerating,
}: InferenceProgressIndicatorProps) => {
    const t = useTranslations();

    const message =
        (!rawAI || rawAI.length === 0) &&
        (isDoingRAG || isPreparingToGenerate) &&
        !isGenerating
            ? t('chat.loadingMemories')
            : isPreparingToGenerate &&
                !isDoingRAG &&
                !isGenerating &&
                !isCheckingRAGUsage
              ? t('chat.loadingTyping')
              : rawAI &&
                  rawAI.length > 0 &&
                  !isDoingRAG &&
                  !isPreparingToGenerate &&
                  !isGenerating &&
                  isCheckingRAGUsage
                ? t('chat.loadingWonderWriteMore')
                : '';

    if (!message) return null;

    return (
        <Flex gap="sm" items="center">
            <Spinner className="size-4" />

            <Type size="sm" textColor="secondary">
                {message}
            </Type>
        </Flex>
    );
};
