'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { EXPECTED_CATEGORY_NUMBER } from '@/config/categories';

export const CategoriesSkeleton = () => {
    const centerIndex = Math.floor(
        EXPECTED_CATEGORY_NUMBER / 2,
    );

    return (
        <div className="flex min-w-max gap-2">
            {Array(EXPECTED_CATEGORY_NUMBER)
                .fill(0)
                .map((_, index) => {
                    const baseClasses =
                        'relative flex flex-shrink-0 transform-gpu cursor-pointer flex-row items-center justify-center py-5 overflow-hidden max-md:h-[49px] max-md:min-w-[160px] md:h-[68px] md:min-w-[250px]';
                 
                    return (
                        <Skeleton
                            key={index}
                            className={baseClasses}
                            style={index === centerIndex ? { scrollSnapAlign: 'center' } : {}}
                        />
                    );
                })}
        </div>
    );
};
