'use client';

import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { cn } from '@/lib/utils/shad';
import { useStore } from '@/lib/zustand/store';
import { useChatContext } from '@/hooks/data/use-chat-context';
import { RestartChatButton } from '@/features/chat/ui/components/top-nav/restart-chat-button';
import { MobileSidebarToggle } from '@/features/sidebar/ui/components/mobile/mobile-sidebar-toggle';

export const TopNavSection = () => {
    const { isOnChatPage, hasMessages } = useChatContext();

    const { isSidebarCollapsed, setIsSidebarCollapsed } =
        useStore(
            useShallow((state) => ({
                isSidebarCollapsed:
                    state.isSidebarCollapsed,
                setIsSidebarCollapsed:
                    state.setIsSidebarCollapsed,
            })),
        );

    const showRestartButton = isOnChatPage && hasMessages;

    const openSidebar = useCallback(() => {
        setIsSidebarCollapsed(false);
    }, [setIsSidebarCollapsed]);

    useEffect(() => {
        const updateTopNavHeight = () => {
            const topNav = document.querySelector(
                '.top-nav-section',
            );
            if (topNav) {
                const height =
                    topNav.getBoundingClientRect().height;
                document.documentElement.style.setProperty(
                    '--top-nav-height',
                    `${height}px`,
                );
            }
        };

        updateTopNavHeight();

        const resizeObserver = new ResizeObserver(
            updateTopNavHeight,
        );
        const topNav = document.querySelector(
            '.top-nav-section',
        );
        if (topNav) {
            resizeObserver.observe(topNav);
        }

        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div
            className={cn(
                'top-nav-section flex w-full flex-col items-center justify-center',
                'z-25 min-h-fit',
                !showRestartButton && 'md:hidden',
            )}
        >
            <div
                className={cn(
                    'flex w-full max-w-full items-center justify-between',
                    'h-[calc(3rem+1rem)]', // 48px (3rem) height + 16px (1rem) for padding
                    'px-4 py-2', // Equal padding all around
                    'md:pl-[72px]', // Width of desktop sidebar (48px) + padding (24px)
                    'bg-background',
                )}
            >
                <div className="flex items-center md:hidden">
                    <MobileSidebarToggle
                        isCollapsed={isSidebarCollapsed}
                        open={openSidebar}
                    />
                </div>

                {showRestartButton && <RestartChatButton />}
            </div>
        </div>
    );
};
