import { useParams } from 'next/navigation';

import { chatIdSchema } from '@/validators/chat';

export function useCharacterId() {
    const params = useParams<{ chatId: string }>();
    const validationResult = chatIdSchema.safeParse(
        params.chatId,
    );

    if (!validationResult.success) {
        return null;
    }

    return validationResult.data;
}
