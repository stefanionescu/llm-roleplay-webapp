import { cn } from '@/lib/utils/shad';

type DimmingOverlayProps = {
    hide: () => void;
    isCollapsed: boolean;
};

export const DimmingOverlay = ({
    isCollapsed,
    hide,
}: DimmingOverlayProps) => {
    return (
        <div
            onClick={hide}
            className={cn(
                'fixed inset-0 z-[99998] bg-black/30 md:hidden',
                'transition-opacity duration-300 ease-in-out',
                isCollapsed
                    ? 'pointer-events-none hidden opacity-0'
                    : 'opacity-100',
            )}
        />
    );
};
