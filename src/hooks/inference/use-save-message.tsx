import { trpc } from '@/trpc/client';
import { useStore } from '@/lib/zustand/store';
import { TChatMessage, TStopReason } from '@/types/message';

export const useSaveMessage = () => {
    const addMessageMutation =
        trpc.chat.addMessage.useMutation();

    const saveMessage = async (
        characterId: string,
        message: TChatMessage,
        onError: (error: Error) => void,
    ): Promise<void> => {
        try {
            const sessionId = useStore
                .getState()
                .characterSessions.get(characterId);

            if (!sessionId) {
                throw new Error(
                    'No session found for character',
                );
            }

            // Ensure stopReason is set to a valid value before saving
            const messageToSave = {
                ...message,
                stopReason:
                    message.stopReason ||
                    ('finish' as TStopReason),
                relevantContent:
                    message.relevantContent || [],
            };

            // Omit createdAt and position as they're handled by the DB
            const {
                createdAt: _createdAt,
                position: _position,
                ...messageData
            } = messageToSave;

            await addMessageMutation.mutateAsync({
                sessionId,
                message: messageData,
            });
        } catch (error) {
            onError(error as Error);
        }
    };

    return {
        saveMessage,
    };
};
