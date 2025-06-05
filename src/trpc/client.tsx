'use client';
// ^-- to make sure we can mount the Provider from a server component
import { useState } from 'react';
import superjson from 'superjson';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';

import type { AppRouter } from './routers/_app';
import { makeQueryClient } from './query-client';

export const trpc = createTRPCReact<AppRouter>();
let clientQueryClientSingleton: QueryClient;

function getQueryClient() {
    if (typeof window === 'undefined') {
        // Server: always make a new query client
        return makeQueryClient();
    }
    // Browser: use singleton pattern to keep the same query client
    return (clientQueryClientSingleton ??=
        makeQueryClient());
}
function getUrl() {
    const base = (() => {
        if (typeof window !== 'undefined') return '';
        if (process.env.PRODUCTION_URL)
            return `https://${process.env.PRODUCTION_URL}`;
        return 'http://localhost:3000';
    })();
    return `${base}/api/trpc`;
}
export function TRPCProvider(
    props: Readonly<{
        children: React.ReactNode;
    }>,
) {
    // NOTE: Avoid useState when initializing the query client if you don't
    //       have a suspense boundary between this and the code that may
    //       suspend because React will throw away the client on the initial
    //       render if it suspends and there is no boundary
    const queryClient = getQueryClient();
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    transformer: superjson,
                    url: getUrl(),
                    headers() {
                        const headers = new Headers();
                        headers.set(
                            'x-trpc-source',
                            'react-query',
                        );
                        return headers;
                    },
                }),
            ],
        }),
    );
    return (
        <trpc.Provider
            client={trpcClient}
            queryClient={queryClient}
        >
            <QueryClientProvider client={queryClient}>
                {props.children}
            </QueryClientProvider>
        </trpc.Provider>
    );
}
