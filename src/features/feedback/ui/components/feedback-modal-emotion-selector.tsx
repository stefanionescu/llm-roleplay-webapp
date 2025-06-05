import React from 'react';
import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import type { IconSvgElement } from '@hugeicons/react';

import { cn } from '@/lib/utils/shad';
import { Flex } from '@/components/ui/flex';
import { Button } from '@/components/ui/button';
import { ClientFeedbackSchema } from '@/validators/feedback';

type FeedbackOption = {
    color: string;
    icon: IconSvgElement;
    type: ClientFeedbackSchema['feedbackType'];
};

type FeedbackModalEmotionSelectorProps = {
    feedbackOptions: readonly FeedbackOption[];
    selectedFeedbackType: ClientFeedbackSchema['feedbackType'];
    onSelectFeedbackType: (
        type: ClientFeedbackSchema['feedbackType'],
    ) => void;
};

export const FeedbackModalEmotionSelector = ({
    feedbackOptions,
    selectedFeedbackType,
    onSelectFeedbackType,
}: FeedbackModalEmotionSelectorProps) => {
    const t = useTranslations('feedback.emotionSelector');

    return (
        <Flex
            gap="sm"
            className="w-full py-2"
            justify="center"
        >
            {feedbackOptions.map(
                ({ type, icon: Icon, color }) => (
                    <Button
                        key={type}
                        type="button"
                        variant={
                            selectedFeedbackType === type
                                ? 'secondary'
                                : 'ghost'
                        }
                        size="icon"
                        className={cn(
                            selectedFeedbackType === type &&
                                'opacity-100',
                            selectedFeedbackType === type &&
                                color,
                        )}
                        rounded="full"
                        onClick={() =>
                            onSelectFeedbackType(type)
                        }
                        aria-label={t(type)}
                    >
                        <HugeiconsIcon
                            icon={Icon}
                            size={24}
                            strokeWidth={2}
                            className={
                                selectedFeedbackType ===
                                type
                                    ? color
                                    : ''
                            }
                        />
                    </Button>
                ),
            )}
        </Flex>
    );
};
