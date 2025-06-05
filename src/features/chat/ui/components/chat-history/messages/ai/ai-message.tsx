import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Flex } from '@/components/ui/flex';
import { useStore } from '@/lib/zustand/store';
import { useCharacterId } from '@/hooks/data/use-character-id';
import { AuthImage } from '@/components/custom/media/auth-image';
import { Memories } from '@/features/chat/ui/components/chat-history/memories/memories';
import { AIMessageContent } from '@/features/chat/ui/components/chat-history/messages/ai/ai-message-content';

type TAIMessageProps = {
    messageId: string;
    messageIndex: number;
};

export const AIMessage = ({
    messageId,
    messageIndex,
}: TAIMessageProps) => {
    const characterId = useCharacterId();

    if (!characterId) {
        throw new Error('Character ID is required');
    }

    // Split selectors into smaller chunks to prevent unnecessary rerenders
    const message = useStore(
        useShallow((state) =>
            state.getMessage(characterId, messageIndex),
        ),
    );

    const character = useStore(
        useShallow((state) => {
            const categoryId =
                state.getCharacterCategory(characterId);
            return categoryId
                ? state.getCharacter(
                      categoryId,
                      characterId,
                  )
                : null;
        }),
    );

    const messageCount = useStore((state) =>
        state.getMessageCount(characterId),
    );

    const toggledMessage = useStore(
        (state) => state.toggledMessage,
    );

    // Derive all computed values with useMemo to prevent recalculation on every render
    const messageData = useMemo(() => {
        if (!message || !character) {
            return {
                rawAI: null,
                characterName: '',
                stopReason: '',
                isLast: false,
                imageUrl: '',
                memories: [],
                showInspiration: false,
            };
        }

        return {
            rawAI: message.rawAI,
            characterName: character.name,
            stopReason: message.stopReason ?? '',
            isLast: messageCount - 1 === messageIndex,
            imageUrl: character.icon_url,
            memories: message.relevantContent ?? [],
            showInspiration:
                messageCount - 1 === messageIndex ||
                toggledMessage === messageId,
        };
    }, [
        message,
        character,
        messageCount,
        messageIndex,
        toggledMessage,
        messageId,
    ]);

    return (
        <div className="flex w-full flex-col pb-4">
            <div className="flex w-full gap-x-3">
                <div className="size-12 shrink-0 overflow-hidden rounded-full">
                    <AuthImage
                        src={messageData.imageUrl}
                        alt={messageData.characterName}
                        width={48}
                        height={48}
                        className="size-full object-cover"
                    />
                </div>

                <Flex
                    direction="col"
                    gap="sm"
                    items="start"
                    className="overflow-hide min-w-0 grow"
                >
                    <AIMessageContent
                        rawAI={messageData.rawAI}
                        characterName={
                            messageData.characterName
                        }
                        stopReason={messageData.stopReason}
                        isLast={messageData.isLast}
                        showInspiration={
                            messageData.showInspiration
                        }
                        memories={messageData.memories}
                        messageId={messageId}
                    />
                </Flex>
            </div>

            {messageData.memories.length > 0 &&
                (messageData.isLast ||
                    toggledMessage === messageId) && (
                    <div className="w-full max-w-[calc(100%-16px)] overflow-hidden md:max-w-[calc(100%-40px)] md:pl-[60px]">
                        <Memories
                            messageId={messageId}
                            memories={messageData.memories}
                        />
                    </div>
                )}
        </div>
    );
};
