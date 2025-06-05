import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';
import {
    memo,
    useCallback,
    useEffect,
    useState,
} from 'react';

import { Flex } from '@/components/ui/flex';
import { Type } from '@/components/ui/type';
import { useStore } from '@/lib/zustand/store';
import { useCharacterId } from '@/hooks/data/use-character-id';

type StarterMessageTuple = [string, string];
type StarterMessageObject = {
    title: string;
    content: string;
};
type StarterMessage =
    | StarterMessageTuple
    | StarterMessageObject;

type StarterMessagesProps = {
    messages: StarterMessage[];
    onSelectMessage: (content: string) => void;
};

const isStarterMessageObject = (
    message: StarterMessage,
): message is StarterMessageObject => {
    return (
        typeof message === 'object' &&
        message !== null &&
        'title' in message
    );
};

const StarterMessagesComponent = ({
    messages,
    onSelectMessage,
}: StarterMessagesProps) => {
    const t = useTranslations();
    const characterId = useCharacterId();

    if (!characterId) {
        throw new Error('Character ID is required');
    }

    // Track session ID to detect restarts
    const { characterSession } = useStore(
        useShallow((state) => ({
            characterSession:
                state.characterSessions.get(characterId),
        })),
    );

    // Use state to force re-render on restart
    const [sessionKey, setSessionKey] = useState<
        string | undefined
    >(characterSession);

    // Update key when session changes to force re-render
    useEffect(() => {
        if (sessionKey !== characterSession) {
            setSessionKey(characterSession);
        }
    }, [characterSession, sessionKey]);

    // Helper function to get content regardless of type
    const getMessageContent = useCallback(
        (message: StarterMessage): string => {
            return isStarterMessageObject(message)
                ? message.content
                : message[1];
        },
        [],
    );

    // Helper function to get name/title regardless of type
    const getMessageTitle = useCallback(
        (message: StarterMessage): string => {
            return isStarterMessageObject(message)
                ? message.title
                : message[0];
        },
        [],
    );

    const handlePromptClick = useCallback(
        (content: string) => {
            onSelectMessage(content);
        },
        [onSelectMessage],
    );

    // If no messages or empty array, return nothing
    if (!messages || messages.length === 0) {
        return null;
    }

    return (
        <Flex
            direction="col"
            gap="lg"
            justify="center"
            items="center"
            className="mb-2 w-full px-4"
            // Adding a key based on session will force re-render on restart
            key={`starter-messages-${sessionKey}`}
        >
            <Type size="xs" textColor="secondary">
                {t('chat.tryExampleMessages')}
            </Type>

            <div className="mb-1 flex w-full flex-wrap justify-center gap-1 gap-y-2">
                {messages
                    ?.slice(0, 3)
                    ?.map((message, index) => {
                        const content =
                            getMessageContent(message);
                        const title =
                            getMessageTitle(message);
                        return (
                            <button
                                key={`starter-${index}-${sessionKey}`}
                                type="button"
                                onClick={() => {
                                    handlePromptClick(
                                        content,
                                    );
                                }}
                                className="cursor-pointer rounded-full border border-zinc-500/20 bg-zinc-500/5 px-3 py-0.5 text-center !text-sm font-medium opacity-100 shadow-sm hover:bg-zinc-500/10 hover:opacity-80 active:bg-zinc-500/20"
                            >
                                {title}
                            </button>
                        );
                    })}
            </div>
        </Flex>
    );
};

// Only re-render when props change, not on every parent render
export const StarterMessages = memo(
    StarterMessagesComponent,
    (prevProps, nextProps) => {
        // Custom comparison to check if messages array has changed
        if (
            prevProps.messages?.length !==
            nextProps.messages?.length
        ) {
            return false; // Messages changed, so re-render
        }

        // Check if onSelectMessage function reference changed
        if (
            prevProps.onSelectMessage !==
            nextProps.onSelectMessage
        ) {
            return false; // Function changed, so re-render
        }

        // If we reach here, no relevant props changed, so don't re-render
        return true;
    },
);
