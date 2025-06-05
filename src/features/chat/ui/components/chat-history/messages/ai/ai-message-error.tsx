import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertDiamondIcon } from '@hugeicons/core-free-icons';

import { links } from '@/config/links';
import { Flex } from '@/components/ui/flex';
import { Type } from '@/components/ui/type';
import { Button } from '@/components/ui/button';

type TAIMessageError = {
    rawAI: string;
    stopReason?: string;
};

type ErrorConfig = {
    message: string | React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
};

export const AIErrorMessage = ({
    stopReason,
    rawAI,
}: TAIMessageError) => {
    const t = useTranslations('error');

    // Only show error when necessary
    if (!stopReason) {
        return null;
    }

    // Don't show error for 'finish' or if there's no stopReason
    if (stopReason === 'finish') {
        return null;
    }

    // Don't show error for 'cancel' if we already have content
    if (
        stopReason === 'cancel' &&
        rawAI &&
        rawAI.length > 0
    ) {
        return null;
    }

    // Don't show error if we have content even if stream_empty
    if (stopReason === 'stream_empty' && rawAI.length > 0) {
        return null;
    }

    // Create rich message for default error with Discord link
    const createDefaultMessage = () => {
        const beforeText = t('aiMessageDefaultBefore');
        const linkText = t('aiMessageDefaultLink');
        const afterText = t('aiMessageDefaultAfter');

        return (
            <>
                {beforeText}
                <a
                    href={links.discordInvite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline hover:text-blue-300"
                >
                    {linkText}
                </a>
                {afterText}
            </>
        );
    };

    const errorConfigs: Record<string, ErrorConfig> = {
        // Special error message for cancellation
        cancel: {
            message: t('aiMessageCancelled'),
        },
        // Default error handler for unspecified stop reasons
        default: {
            message: createDefaultMessage(),
        },
    };

    const { message, action } =
        errorConfigs[stopReason] || errorConfigs.default;

    return (
        <Flex
            className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-zinc-500"
            gap="sm"
            items="center"
            justify="between"
        >
            <Flex items="start" gap="sm">
                <HugeiconsIcon
                    icon={AlertDiamondIcon}
                    size={16}
                    strokeWidth={2}
                    className="mt-0.5 shrink-0"
                />

                <Type textColor="secondary" size="sm">
                    {message}
                </Type>
            </Flex>

            {action && (
                <Button
                    variant="secondary"
                    size="iconXS"
                    onClick={action.onClick}
                    rounded="full"
                >
                    {action.label}
                </Button>
            )}
        </Flex>
    );
};
