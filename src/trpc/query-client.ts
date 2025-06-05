import superjson from 'superjson';
import {
    defaultShouldDehydrateQuery,
    QueryClient,
} from '@tanstack/react-query';

export function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: Infinity,
                retry: 2,
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
                refetchOnMount: false,
            },
            dehydrate: {
                serializeData: superjson.serialize,
                shouldDehydrateQuery: (query) =>
                    defaultShouldDehydrateQuery(query) ||
                    query.state.status === 'pending',
            },
            hydrate: {
                deserializeData: superjson.deserialize,
            },
        },
    });
}
