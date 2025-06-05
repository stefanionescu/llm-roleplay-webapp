import { createTRPCRouter } from '@/trpc/init';
import { chatRouter } from '@/features/chat/server/procedures';
import { homeRouter } from '@/features/home/server/procedures';
import { authRouter } from '@/features/auth/server/procedures';
import { mediaRouter } from '@/features/media/server/procedures';
import { sessionsRouter } from '@/features/sessions/server/procedures';

export const appRouter = createTRPCRouter({
    home: homeRouter,
    media: mediaRouter,
    chat: chatRouter,
    auth: authRouter,
    sessions: sessionsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
