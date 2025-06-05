'use client';

import { useRef } from 'react';

import { CategoriesContent } from '@/features/home/ui/components/categories/categories-content';

export const CategoriesSection = () => {
    const containerRef = useRef<HTMLDivElement | null>(
        null,
    );

    return (
        <div
            className={`my-[5vh] flex w-full justify-center overflow-hidden max-md:h-[49px] md:h-[68px]`}
        >
            <div
                ref={containerRef}
                className={`no-scrollbar overflow-x-auto scroll-smooth`}
            >
                <div className={`flex w-max gap-2 px-4`}>
                    <CategoriesContent
                        containerRef={containerRef}
                    />
                </div>
            </div>
        </div>
    );
};
