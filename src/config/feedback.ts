import {
    SmileIcon,
    MehIcon,
    Sad01Icon,
} from '@hugeicons/core-free-icons';

import { FeedbackType } from '@/types/feedback';

export const feedbackConstants = {
    feedbackTypes: [
        {
            type: 'positive' as FeedbackType,
            icon: SmileIcon,
            color: 'text-green-500',
        },
        {
            type: 'neutral' as FeedbackType,
            icon: MehIcon,
            color: 'text-orange-500',
        },
        {
            type: 'negative' as FeedbackType,
            icon: Sad01Icon,
            color: 'text-red-500',
        },
    ],
} as const;
