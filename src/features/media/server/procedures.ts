import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { MediaResponse } from '@/types/db';
import { baseProcedure } from '@/trpc/init';
import { createTRPCRouter } from '@/trpc/init';

export const mediaRouter = createTRPCRouter({
    getMedia: baseProcedure
        .input(z.string())
        .query(
            async ({
                ctx,
                input: path,
            }): Promise<MediaResponse> => {
                try {
                    if (!path) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'Missing path',
                        });
                    }

                    const [bucket, ...pathParts] =
                        path.split('/');
                    if (!bucket || pathParts.length === 0) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'Invalid path format',
                        });
                    }

                    const { supabase } = ctx;
                    const { data, error } =
                        await supabase.storage
                            .from(bucket)
                            .download(pathParts.join('/'));

                    if (error || !data) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message:
                                error?.message ||
                                'Failed to fetch media',
                        });
                    }

                    const arrayBuffer =
                        await data.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const base64 =
                        buffer.toString('base64');

                    return {
                        data: `data:${data.type};base64,${base64}`,
                        contentType: data.type,
                        error: null,
                    };
                } catch (error) {
                    if (error instanceof TRPCError) {
                        throw error;
                    }
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message:
                            error instanceof Error
                                ? error.message
                                : 'Internal Server Error',
                        cause: error,
                    });
                }
            },
        ),
});
