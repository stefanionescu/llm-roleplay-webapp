import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';

import { cn } from '@/lib/utils/shad';
import { Button } from '@/components/ui/button';
import { useScrollToBottom } from '@/hooks/ui/use-scroll-to-bottom';

export const ScrollToBottomButton = () => {
    const { showScrollToBottom, scrollToBottom } =
        useScrollToBottom();

    const t = useTranslations('chat');

    // Local state to track visibility for animation purposes
    const [isVisible, setIsVisible] = useState(
        showScrollToBottom,
    );

    // Update local visibility state when the hook's state changes
    useEffect(() => {
        if (showScrollToBottom) {
            setIsVisible(true);
        } else {
            // Small delay for exit animations
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showScrollToBottom]);

    return (
        <div className="relative mb-1 mt-2 flex h-[32px] items-center justify-center py-2">
            <div
                className={cn(
                    'absolute bottom-0 transition-all duration-300',
                    isVisible
                        ? 'opacity-100'
                        : 'pointer-events-none opacity-0',
                )}
            >
                <Button
                    onClick={scrollToBottom}
                    variant="outline"
                    size="iconXS"
                    rounded="full"
                    aria-label={t('scrollToBottom')}
                    className={cn(
                        'duration-300 animate-in fade-in slide-in-from-bottom',
                        'hover:bg-accent/80',
                        'shadow-sm',
                    )}
                >
                    <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={16}
                    />
                </Button>
            </div>
        </div>
    );
};
