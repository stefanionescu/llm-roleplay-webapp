import { useShallow } from 'zustand/react/shallow';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
} from 'react';

import { uiConstants } from '@/config';
import { useStore } from '@/lib/zustand/store';
import { TCharacter } from '@/types/character';
import { CharactersRow } from '@/features/home/ui/components/characters/characters-row';

export const CharacterItems = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const characterScrollRef = useRef<HTMLDivElement>(null);
    const lastMeasuredWidthRef = useRef<number>(
        window.innerWidth,
    ); // Initialize with current width

    const {
        getCharacters,
        getCharactersIds,
        activeCategory,
    } = useStore(
        useShallow((state) => ({
            getCharacters: state.getCharacters,
            getCharactersCount: state.getCharactersCount,
            getCharactersIds: state.getCharactersIds,
            activeCategory: state.activeCategory,
        })),
    );

    // Get characters and their IDs for the active category
    const characters = useMemo(() => {
        if (!activeCategory) return [];
        return getCharacters(activeCategory) || [];
    }, [activeCategory, getCharacters]);

    const characterIds = useMemo(() => {
        if (!activeCategory) return [];
        return getCharactersIds(activeCategory) || [];
    }, [activeCategory, getCharactersIds]);

    // Create grid layout based on screen size
    const createGrid = useCallback(
        (chars: TCharacter[], ids: string[]) => {
            // Desktop: 4 rows x 5 columns
            // Mobile & Tablet: 5 rows x 4 columns
            const isSmallDevice =
                window.innerWidth <=
                uiConstants.breakpoints.tablet;
            const rows = isSmallDevice ? 5 : 4;
            const cols = isSmallDevice ? 4 : 5;

            // Create grid array
            return Array.from(
                { length: rows },
                (_, rowIndex) =>
                    Array.from(
                        { length: cols },
                        (_, colIndex) => {
                            // Use modulo to cycle through characters
                            const index =
                                (rowIndex * cols +
                                    colIndex) %
                                chars.length;
                            return {
                                character: chars[index],
                                id: ids[index],
                            };
                        },
                    ),
            );
        },
        [],
    );

    const grid = useMemo(
        () => createGrid(characters, characterIds),
        [characters, characterIds, createGrid],
    );

    /* eslint-disable react-hooks/exhaustive-deps */
    const handleResize = useCallback(() => {
        const scrollContainer = characterScrollRef.current;
        if (!scrollContainer) return;

        const newWidth = window.innerWidth;
        const isMobileView =
            newWidth < uiConstants.breakpoints.phone;
        const wasMobileView =
            lastMeasuredWidthRef.current <
            uiConstants.breakpoints.phone;

        if (isMobileView !== wasMobileView) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!characterScrollRef.current) return;
                    const updatedScrollContainer =
                        characterScrollRef.current;
                    const scrollWidth =
                        updatedScrollContainer.scrollWidth;
                    const clientWidth =
                        updatedScrollContainer.clientWidth;

                    if (
                        scrollWidth > clientWidth &&
                        !isNaN(scrollWidth) &&
                        !isNaN(clientWidth)
                    ) {
                        const scrollLeft =
                            (scrollWidth - clientWidth) / 2;
                        if (
                            !isNaN(scrollLeft) &&
                            scrollLeft >= 0
                        ) {
                            updatedScrollContainer.scrollTo(
                                {
                                    left: scrollLeft,
                                    behavior: 'smooth',
                                },
                            );
                        }
                    }
                });
            });
        }

        lastMeasuredWidthRef.current = newWidth;
    }, []);

    useLayoutEffect(() => {
        const scrollContainer = characterScrollRef.current;
        if (!scrollContainer || characters.length === 0) {
            return;
        }

        // Use requestAnimationFrame to ensure layout measurements are ready
        requestAnimationFrame(() => {
            // Re-check ref existence inside the animation frame callback
            if (!characterScrollRef.current) return;

            const scrollWidth = scrollContainer.scrollWidth;
            const clientWidth = scrollContainer.clientWidth;

            if (
                scrollWidth > clientWidth &&
                !isNaN(scrollWidth) &&
                !isNaN(clientWidth)
            ) {
                const scrollLeft =
                    (scrollWidth - clientWidth) / 2;
                if (!isNaN(scrollLeft) && scrollLeft >= 0) {
                    // Set scrollLeft directly for immediate centering without animation
                    scrollContainer.scrollLeft = scrollLeft;
                }
            }
        });

        // Update last measured width immediately after layout calculation
        lastMeasuredWidthRef.current = window.innerWidth;
        // Depend on grid and characters to ensure centering happens after data load and layout
    }, [grid]);

    useEffect(() => {
        // Setup ResizeObserver for window/container resize events
        let resizeObserver: ResizeObserver | null = null;
        if (
            typeof ResizeObserver !== 'undefined' &&
            containerRef.current
        ) {
            resizeObserver = new ResizeObserver(
                handleResize,
            );
            resizeObserver.observe(containerRef.current);
        } else {
            window.addEventListener('resize', handleResize);
        }

        return () => {
            if (resizeObserver) {
                resizeObserver.disconnect();
            } else {
                window.removeEventListener(
                    'resize',
                    handleResize,
                );
            }
        };
    }, [handleResize]);
    /* eslint-enable react-hooks/exhaustive-deps */

    return (
        <div className="w-full overflow-hidden">
            <div
                ref={characterScrollRef}
                className={`no-scrollbar w-full overflow-x-auto overflow-y-hidden`}
                style={{
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                <div
                    className={`characters-group mx-auto mb-4 flex w-max flex-col gap-y-10 overflow-y-hidden pl-10 pr-4 pt-5 md:gap-y-4`}
                >
                    {grid.map((row, rowIndex) => (
                        <CharactersRow
                            key={`row-${rowIndex}`}
                            rowIndex={rowIndex}
                            row={row}
                            grid={grid}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
