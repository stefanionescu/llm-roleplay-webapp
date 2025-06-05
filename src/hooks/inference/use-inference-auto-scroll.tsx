'use client';

import { useShallow } from 'zustand/react/shallow';
import { useCallback, useEffect, useRef } from 'react';

import type { VListContainerElement } from '@/types/virtual-list';

import { useStore } from '@/lib/zustand/store';

export const useAutoScrollDuringInference = () => {
    const { isGenerating } = useStore(
        useShallow((state) => ({
            isGenerating: state.isGenerating,
        })),
    );

    const animationFrameRef = useRef<number | null>(null);
    const wasGeneratingRef = useRef(isGenerating);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToBottom = useCallback(() => {
        const vlistEl =
            document.querySelector('[data-vlist]');
        if (!vlistEl) return;

        const maybeContainer = vlistEl.closest(
            '[data-vlist-container]',
        );
        if (!maybeContainer) return;

        // Check the data attribute first, which is kept up to date via the onScroll handler
        const shouldStick = maybeContainer.getAttribute(
            'data-should-stick-to-bottom',
        );
        if (shouldStick === 'false') return;

        // Type assertion after runtime check
        const vlistContainer =
            maybeContainer as VListContainerElement;

        const virtualizerRef =
            vlistContainer._virtualizerRef;
        if (!virtualizerRef?.current) return;

        // Get the current count from the data attribute
        const count = vlistEl.getAttribute(
            'data-item-count',
        );
        if (!count) return;
        const itemCount = parseInt(count, 10);
        if (isNaN(itemCount)) return;

        // Scroll to the last item
        virtualizerRef.current.scrollToIndex(
            itemCount - 1,
            {
                align: 'end',
            },
        );

        // Schedule next scroll if still generating
        if (isGenerating) {
            animationFrameRef.current =
                requestAnimationFrame(scrollToBottom);
        }
    }, [isGenerating]);

    // Function to trigger scroll events after generation ends
    const triggerScrollEvents = useCallback(() => {
        const vlistEl =
            document.querySelector('[data-vlist]');
        if (!vlistEl) return;

        // Dispatch a scroll event to ensure scroll position detection is triggered
        vlistEl.dispatchEvent(new Event('scroll'));

        // Schedule scroll event to ensure detection works
        setTimeout(() => {
            const el =
                document.querySelector('[data-vlist]');
            if (el) {
                el.dispatchEvent(new Event('scroll'));
            }
        }, 100);

        // Also dispatch a custom event that might be listened for elsewhere
        const generationEndEvent = new CustomEvent(
            'generationEnd',
        );
        document.dispatchEvent(generationEndEvent);
        vlistEl.dispatchEvent(generationEndEvent);
    }, []);

    useEffect(() => {
        if (isGenerating) {
            // Start the scroll loop
            scrollToBottom();
            wasGeneratingRef.current = true;

            // Clear any pending timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        } else {
            // Clean up when generation stops
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(
                    animationFrameRef.current,
                );
                animationFrameRef.current = null;
            }

            // If we just finished generating, trigger scroll events
            if (wasGeneratingRef.current) {
                wasGeneratingRef.current = false;

                // Immediately trigger the first event
                triggerScrollEvents();

                // Clear any previous timeout
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                // Set a timeout to trigger again in case first one doesn't catch
                timeoutRef.current = setTimeout(() => {
                    triggerScrollEvents();
                    timeoutRef.current = null;
                }, 500);
            }
        }

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(
                    animationFrameRef.current,
                );
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [isGenerating, scrollToBottom, triggerScrollEvents]);
};
