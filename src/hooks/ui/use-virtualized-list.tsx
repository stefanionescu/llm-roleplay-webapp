'use client';

import { VListHandle } from 'virtua';
import {
    useRef,
    useLayoutEffect,
    useEffect,
    useCallback,
} from 'react';

import type {
    UseVirtualizedListProps,
    UseVirtualizedListReturn,
} from '@/types/virtual-list';

export const useVirtualizedList = ({
    currentMessageCount,
    onScroll,
    loadMore,
    initialStickToBottom = true,
}: UseVirtualizedListProps): UseVirtualizedListReturn => {
    const virtualizerRef = useRef<VListHandle>(null);
    const isPrepend = useRef(false);
    const isInitialMount = useRef(true);
    const shouldStickToBottom = useRef(
        initialStickToBottom,
    );
    // Track previous message count to detect resets
    const prevMessageCountRef = useRef(currentMessageCount);
    // Track last scroll operation time to debounce multiple scroll calls
    const lastScrollTime = useRef(0);

    // Expose scroll state for scroll-to-bottom hook
    const scrollState = {
        current: {
            offset: 0,
            scrollSize: 0,
            viewportSize: 0,
        },
    };

    // Handle initial mount effect
    useLayoutEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        }
    }, []);

    // Detect chat restart by checking for a large decrease in message count
    useEffect(() => {
        const prevCount = prevMessageCountRef.current;

        // If message count goes from multiple to one, it's likely a chat restart
        if (prevCount > 1 && currentMessageCount <= 1) {
            shouldStickToBottom.current = false;
        }

        // Update the previous count reference
        prevMessageCountRef.current = currentMessageCount;
    }, [currentMessageCount]);

    // Initial scroll to bottom
    useEffect(() => {
        if (!virtualizerRef.current) return;
        if (!shouldStickToBottom.current) return;
        // Only scroll if we're not prepending messages
        if (isPrepend.current) return;

        void virtualizerRef.current.scrollToIndex(
            currentMessageCount - 1,
            {
                align: 'end',
            },
        );
    }, [currentMessageCount]);

    // Handle scroll events
    const handleScroll = useCallback(
        (offset: number) => {
            if (!virtualizerRef.current) return;
            const scrollSize =
                virtualizerRef.current.scrollSize;
            const viewportSize =
                virtualizerRef.current.viewportSize;

            // Update scroll state
            scrollState.current = {
                offset,
                scrollSize,
                viewportSize,
            };

            // Update stick-to-bottom state
            shouldStickToBottom.current =
                offset - scrollSize + viewportSize >= -1.5;

            // Call onScroll callback if provided
            onScroll?.(offset, scrollSize, viewportSize);

            // Handle loading more messages - for reversed list, we need to check top edge
            // which means being close to scrollSize - viewportSize
            const threshold = 100;
            const nearTopEdge =
                offset >
                scrollSize - viewportSize - threshold;

            if (nearTopEdge && loadMore) {
                isPrepend.current = true;
                void loadMore();
            }
        },
        [onScroll, loadMore],
    );

    // Force scroll to bottom (can be called externally)
    const scrollToBottom = useCallback(() => {
        if (
            !virtualizerRef.current ||
            currentMessageCount <= 0
        )
            return;

        const now = Date.now();
        // Debounce scroll operations (prevent multiple rapid scrolls)
        if (now - lastScrollTime.current < 100) return;

        lastScrollTime.current = now;
        virtualizerRef.current.scrollToIndex(
            currentMessageCount - 1,
            {
                align: 'end',
            },
        );

        // Ensure stick to bottom is set to true
        shouldStickToBottom.current = true;
    }, [currentMessageCount]);

    return {
        virtualizerRef,
        scrollState,
        shouldStickToBottom,
        isPrepend,
        handleScroll,
        scrollToBottom,
    } as UseVirtualizedListReturn;
};
