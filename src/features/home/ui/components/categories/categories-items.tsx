'use client';

import { useLocale } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';
import {
    RefObject,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import { useStore } from '@/lib/zustand/store';
import {
    calculateCategoryScrollPosition,
    getCategoriesSectionResponsiveValues,
} from '@/lib/utils/animations';

type CategoriesSectionItemsProps = {
    containerRef: RefObject<HTMLDivElement>;
};

export const CategoriesSectionItems = ({
    containerRef,
}: CategoriesSectionItemsProps) => {
    const {
        getCategories,
        getCategoriesIds,
        setActiveCategory,
    } = useStore(
        useShallow((state) => ({
            getCategories: state.getCategories,
            getCategoriesIds: state.getCategoriesIds,
            setActiveCategory: state.setActiveCategory,
        })),
    );

    const categoryItems = getCategories();
    const categoryIds = getCategoriesIds();

    const [selectedIndex, setSelectedIndex] = useState(
        Math.floor(categoryItems.length / 2),
    );
    const locale = useLocale();

    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (categoryIds?.length > 0) {
            const initialIndex = Math.floor(
                categoryIds.length / 2,
            );
            setActiveCategory(categoryIds[initialIndex]);
        }
    }, []);

    const centerSelectedItem = useCallback(
        (index: number, instant = false) => {
            const item = itemRefs.current[index];
            const container = containerRef.current;
            if (!item || !container) return;

            const { itemWidth, gap } =
                getCategoriesSectionResponsiveValues();
            const containerWidth = container.clientWidth;

            const scrollLeft =
                calculateCategoryScrollPosition(
                    index,
                    containerWidth,
                    itemWidth,
                    gap,
                );

            if (instant) {
                container.scrollLeft = scrollLeft;
            } else {
                container.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth',
                });
            }
        },
        [containerRef],
    );

    useLayoutEffect(() => {
        const handleResize = () => {
            centerSelectedItem(selectedIndex, true);
        };

        window.addEventListener('resize', handleResize);

        centerSelectedItem(selectedIndex, true);

        return () => {
            window.removeEventListener(
                'resize',
                handleResize,
            );
        };
    }, [selectedIndex]);

    const handleCategoryClick = useCallback(
        (index: number) => {
            if (index === selectedIndex) return;
            setSelectedIndex(index);
            centerSelectedItem(index);
            setActiveCategory(categoryIds[index]);
        },
        [selectedIndex],
    );
    /* eslint-enable react-hooks/exhaustive-deps */

    if (!categoryItems?.length || !categoryIds?.length)
        return null;

    return (
        <div className="flex min-w-max gap-2">
            {categoryItems.map((category, index) => {
                const categoryName =
                    locale === 'en'
                        ? category.name
                        : category.translations[locale] ||
                          category.name;

                return (
                    <div
                        key={categoryIds[index]}
                        ref={(el) => {
                            itemRefs.current[index] = el;
                        }}
                        onClick={() =>
                            handleCategoryClick(index)
                        }
                        className={`relative flex shrink-0 transform-gpu cursor-pointer flex-row items-center justify-center rounded-xl py-5 max-md:h-[49px] max-md:min-w-[160px] md:h-[68px] md:min-w-[250px] ${index === selectedIndex ? 'bg-white' : 'bg-zinc-500/10 hover:opacity-70'} `}
                        style={index === selectedIndex ? { scrollSnapAlign: 'center' } : {}}
                    >
                        <p
                            className={`text-ellipsis ${index === selectedIndex ? 'text-black' : 'text-white'} max-md:text-sm md:text-lg`}
                        >
                            {categoryName}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};
