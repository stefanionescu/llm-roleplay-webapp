'use client';

import { useParams } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import {
    useCallback,
    useEffect,
    useState,
    useRef,
} from 'react';

import { useStore } from '@/lib/zustand/store';
import { chatIdSchema } from '@/validators/chat';

// Threshold in pixels to determine how close to bottom is considered "at bottom"
const BOTTOM_THRESHOLD = 50;
// Smaller threshold for immediately hiding the button
const HIDE_BUTTON_THRESHOLD = 5;
// Debounce time for scroll events in milliseconds
const SCROLL_DEBOUNCE_TIME = 50;
// Duration to wait after scrolling completes
const SCROLL_COMPLETE_DELAY = 600;

// Custom event to trigger scroll position checks
export const SCROLL_CHECK_EVENT = 'scrollPositionCheck';

export const useScrollToBottom = () => {
    // Validate chatId param
    const params = useParams<{ chatId: string }>();
    const validationResult = chatIdSchema.safeParse(
        params.chatId,
    );
    if (!validationResult.success) {
        throw new Error('Invalid chat ID');
    }

    const {
        isGenerating,
        isPreparingToGenerate,
        isDoingRAG,
    } = useStore(
        useShallow((state) => ({
            isGenerating: state.isGenerating,
            isPreparingToGenerate:
                state.isPreparingToGenerate,
            isDoingRAG: state.isDoingRAG,
        })),
    );

    // Check if any inference-related activity is happening
    const isInferenceActive =
        isGenerating || isPreparingToGenerate || isDoingRAG;

    // Whether the list is currently at its bottom position
    const [isAtBottom, setIsAtBottom] = useState(true);
    // Whether to show the "scroll to bottom" button
    const [showScrollToBottom, setShowScrollToBottom] =
        useState(false);
    // Track distance from bottom for UI decisions
    const [distanceFromBottom, setDistanceFromBottom] =
        useState(0);

    // Refs
    const initialChecksDoneRef = useRef(false);
    const mutationObserverRef =
        useRef<MutationObserver | null>(null);
    const prevGeneratingRef = useRef(isGenerating);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(
        null,
    );
    const justScrolledRef = useRef(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(
        null,
    );
    const isScrollingRef = useRef(false);

    // Locate the virtual list scroll container by data attribute
    const getScrollContainer = useCallback(() => {
        return document.querySelector('[data-vlist]');
    }, []);

    // Create a throttled/debounced function for handling scroll events
    const createThrottledScrollHandler = useCallback(() => {
        let timeout: NodeJS.Timeout | null = null;

        return () => {
            if (timeout !== null) return;

            timeout = setTimeout(() => {
                checkScrollPosition();
                timeout = null;
            }, SCROLL_DEBOUNCE_TIME);
        };
    }, []);

    // Clear any hide timeout
    const clearHideTimeout = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    }, []);

    // Determine if button should be shown based on scroll distance
    const shouldShowButton = useCallback(
        (distance: number, hasScrollable: boolean) => {
            const isAwayFromBottom =
                distance > BOTTOM_THRESHOLD;

            return (
                hasScrollable &&
                isAwayFromBottom &&
                !(
                    isInferenceActive &&
                    distance <= BOTTOM_THRESHOLD
                )
            );
        },
        [isInferenceActive],
    );

    // Check scroll position and determine if button should be shown
    const checkScrollPosition = useCallback(
        (forceUpdate = false) => {
            const container = getScrollContainer();
            if (!container) return;

            const {
                scrollTop,
                scrollHeight,
                clientHeight,
            } = container;

            // Calculate how close we are to the bottom
            const distance =
                scrollHeight - clientHeight - scrollTop;
            setDistanceFromBottom(distance);

            const hasScrollable =
                scrollHeight > clientHeight;

            // If we're very close to bottom or actively scrolling, force hide
            if (
                distance <= HIDE_BUTTON_THRESHOLD ||
                isScrollingRef.current
            ) {
                clearHideTimeout();
                setShowScrollToBottom(false);
                setIsAtBottom(true);
                return;
            }

            // Check if we're away from the bottom
            const isAwayFromBottom =
                distance > BOTTOM_THRESHOLD;
            setIsAtBottom(!isAwayFromBottom);

            // Determine if button should be shown
            const shouldShow = shouldShowButton(
                distance,
                hasScrollable,
            );

            // Update immediately if showing or force updating
            if (shouldShow || forceUpdate) {
                setShowScrollToBottom(shouldShow);
            }
            // Add a small delay when hiding to prevent flickering
            else if (
                !shouldShow &&
                showScrollToBottom &&
                !hideTimeoutRef.current
            ) {
                hideTimeoutRef.current = setTimeout(() => {
                    setShowScrollToBottom(false);
                    hideTimeoutRef.current = null;
                }, 100);
            }

            initialChecksDoneRef.current = true;
        },
        [
            getScrollContainer,
            shouldShowButton,
            showScrollToBottom,
            clearHideTimeout,
        ],
    );

    // Notify other components that scroll position has changed
    const notifyScrollPositionChanged = useCallback(() => {
        document.dispatchEvent(
            new CustomEvent(SCROLL_CHECK_EVENT),
        );
    }, []);

    // Scroll smoothly back to bottom
    const scrollToBottom = useCallback(() => {
        const container = getScrollContainer();
        if (!container) return;

        // Mark that we just scrolled and are scrolling
        justScrolledRef.current = true;
        isScrollingRef.current = true;

        // Clear any hide timeout
        clearHideTimeout();

        // Hide button immediately for better UX
        setShowScrollToBottom(false);

        // Scroll to the actual bottom
        container.scrollTo({
            top:
                container.scrollHeight -
                container.clientHeight,
            behavior: 'smooth',
        });

        // Force check after scrolling completes
        setTimeout(() => {
            checkScrollPosition(true);
            justScrolledRef.current = false;
            isScrollingRef.current = false;

            // Notify other components
            notifyScrollPositionChanged();

            // Extra check after any animations complete
            setTimeout(() => {
                checkScrollPosition(true);
            }, 200);
        }, SCROLL_COMPLETE_DELAY);
    }, [
        getScrollContainer,
        checkScrollPosition,
        clearHideTimeout,
        notifyScrollPositionChanged,
    ]);

    // Setup mutation observer to watch for DOM changes
    useEffect(() => {
        mutationObserverRef.current = new MutationObserver(
            (mutations) => {
                let contentChanged = false;
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        contentChanged = true;
                        break;
                    }
                }

                if (contentChanged) {
                    checkScrollPosition(true);
                }
            },
        );

        // Start observing the document body for changes
        mutationObserverRef.current.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => {
            if (mutationObserverRef.current) {
                mutationObserverRef.current.disconnect();
            }
        };
    }, [checkScrollPosition]);

    // Setup scroll event listeners
    useEffect(() => {
        const container = getScrollContainer();
        if (!container) return;

        const handleScroll = createThrottledScrollHandler();

        container.addEventListener('scroll', handleScroll, {
            passive: true,
        });

        // Initial check
        checkScrollPosition(true);

        return () => {
            container.removeEventListener(
                'scroll',
                handleScroll,
            );
        };
    }, [
        getScrollContainer,
        checkScrollPosition,
        createThrottledScrollHandler,
    ]);

    // Setup window and document event listeners
    useEffect(() => {
        const checkHandler = () =>
            checkScrollPosition(true);

        // Window events
        window.addEventListener('load', checkHandler);
        window.addEventListener('resize', checkHandler);

        // Document events
        document.addEventListener('click', () => {
            setTimeout(checkHandler, 100);
        });
        document.addEventListener(
            SCROLL_CHECK_EVENT,
            checkHandler,
        );
        document.addEventListener(
            'generationEnd',
            checkHandler,
        );

        return () => {
            window.removeEventListener(
                'load',
                checkHandler,
            );
            window.removeEventListener(
                'resize',
                checkHandler,
            );
            document.removeEventListener(
                SCROLL_CHECK_EVENT,
                checkHandler,
            );
            document.removeEventListener(
                'generationEnd',
                checkHandler,
            );
        };
    }, [checkScrollPosition]);

    // Effect to recheck when inference state changes
    useEffect(() => {
        checkScrollPosition(true);
    }, [isInferenceActive, checkScrollPosition]);

    // Effect to handle generation state changes
    useEffect(() => {
        // If generation just ended, do quick checks to update UI
        if (prevGeneratingRef.current && !isGenerating) {
            // Immediate check
            checkScrollPosition(true);

            // Schedule a few more checks to catch any UI adjustments
            const timers = [
                setTimeout(
                    () => checkScrollPosition(true),
                    200,
                ),
                setTimeout(
                    () => checkScrollPosition(true),
                    500,
                ),
                setTimeout(
                    () => checkScrollPosition(true),
                    1000,
                ),
            ];

            return () => {
                timers.forEach(clearTimeout);
            };
        }

        prevGeneratingRef.current = isGenerating;
    }, [isGenerating, checkScrollPosition]);

    // Effect to cleanup timeouts
    useEffect(() => {
        return () => {
            if (checkIntervalRef.current !== null) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
            }

            if (hideTimeoutRef.current !== null) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
        };
    }, []);

    return {
        showScrollToBottom,
        scrollToBottom,
        isAtBottom,
        distanceFromBottom,
        isInferenceActive,
        checkScrollPosition,
    };
};
