import { useParams } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';

import { Store } from '@/types/zustand';
import { useStore } from '@/lib/zustand/store';
import { chatIdSchema } from '@/validators/chat';
import { TVideoTrackingData } from '@/types/video';

/**
 * Hook to get video tracking data for analytics
 * Returns session and character information for video event tracking
 */
export function useVideoTrackingData(): TVideoTrackingData {
    const params = useParams<{ chatId: string }>();
    const validationResult = chatIdSchema.safeParse(
        params.chatId,
    );

    const result = useStore(
        useShallow((state: Store) => {
            if (!validationResult.success) {
                return null;
            }

            const characterId = validationResult.data;
            const categoryId =
                state.getCharacterCategory(characterId);
            const character = categoryId
                ? state.getCharacter(
                      categoryId,
                      characterId,
                  )
                : null;
            const category = categoryId
                ? state.getCategory(categoryId)
                : null;
            const sessionId =
                state.characterSessions.get(characterId);

            return {
                sessionId: sessionId || '',
                characterId,
                characterName: character?.name || '',
                categoryName: category?.name || '',
            };
        }),
    );

    return result;
}
