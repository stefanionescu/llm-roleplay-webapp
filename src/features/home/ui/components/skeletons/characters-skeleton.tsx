'use client';

import { Skeleton } from '@/components/ui/skeleton';

export const CharactersSkeleton = () => {
    const baseRows = 4;
    const mobileOnlyRowIndex = 4; // 5th row (0-indexed)

    return (
        <div className={`mb-4 flex flex-col gap-y-4 pt-5`}>
            {Array(baseRows + 1) // Render 5 potential rows
                .fill(0)
                .map((_, i) => (
                    <div
                        key={i}
                        className={`mx-0 h-[115px] w-full px-0 opacity-0 transition-all duration-300 ease-in-out md:h-[120px] ${
                            // Hide the 5th row on medium screens and up
                            i === mobileOnlyRowIndex
                                ? 'md:hidden'
                                : ''
                        }`}
                        style={{
                            animation: `slide-in ${300}ms ease-out forwards ${i * 50}ms`,
                            willChange:
                                'transform, opacity',
                        }}
                    >
                        <Skeleton
                            className="size-full"
                            borderRadius={0}
                        />
                    </div>
                ))}
        </div>
    );
};
