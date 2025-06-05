import { TRPCError } from '@trpc/server';

import { WaitlistResponse } from '@/types/auth';
import { checkRegistrationStatusSchema } from '@/validators/auth';
import {
    baseProcedure,
    createTRPCRouter,
} from '@/trpc/init';

export const authRouter = createTRPCRouter({
    checkRegistrationStatus: baseProcedure
        .input(checkRegistrationStatusSchema)
        .query(async ({ input }) => {
            const { identifier } = input;

            try {
                if (!identifier) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Identifier is required',
                    });
                }

                const response = await fetch(
                    `https://${process.env.API_ENDPOINT}/user-management/register-user`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${process.env.API_KEY}`,
                            'Content-Type':
                                'application/json',
                        },
                        body: JSON.stringify({
                            username: identifier,
                        }),
                    },
                );

                if (!response.ok) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: `External API request failed with status ${response.status}`,
                    });
                }

                const data =
                    (await response.json()) as WaitlistResponse;
                return data;
            } catch (error) {
                if (error instanceof TRPCError) {
                    throw error;
                }

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Failed to check registration status',
                    cause: error,
                });
            }
        }),
});
