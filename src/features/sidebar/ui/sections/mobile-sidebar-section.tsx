'use client';

import { usePathname } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import {
    ElementRef,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import { cn } from '@/lib/utils/shad';
import { links } from '@/config/links';
import { uiConstants } from '@/config';
import { useStore } from '@/lib/zustand/store';
import { SUPPORTED_LANGUAGES } from '@/config/language';
import { useCharacterId } from '@/hooks/data/use-character-id';
import { DimmingOverlay } from '@/components/custom/dimming-overlay';
import { useStopInference } from '@/hooks/inference/use-stop-inference';
import { MobileAccountSection } from '@/features/sidebar/ui/sections/mobile-account-section';
import { MobileSidebarToggle } from '@/features/sidebar/ui/components/mobile/mobile-sidebar-toggle';
import { MobileSidebarTopNav } from '@/features/sidebar/ui/components/mobile/mobile-sidebar-top-nav';
import { MobileSessionsListSection } from '@/features/sessions/ui/sections/mobile-sessions-list-section';
import { MobileSidebarHomeButton } from '@/features/sidebar/ui/components/mobile/mobile-sidebar-home-button';
import { MobileSidebarLanguageButton } from '@/features/sidebar/ui/components/mobile/mobile-sidebar-language-button';

export const MobileSidebarSection = () => {
    const pathname = usePathname();
    const characterId = useCharacterId() ?? '';

    const sidebarRef = useRef<ElementRef<'aside'>>(null);

    const { isSidebarCollapsed, setIsSidebarCollapsed } =
        useStore(
            useShallow((state) => ({
                isSidebarCollapsed:
                    state.isSidebarCollapsed,
                setIsSidebarCollapsed:
                    state.setIsSidebarCollapsed,
            })),
        );

    // Use local state for flags preloaded to prevent infinite updates
    const [flagsPreloaded, setFlagsPreloaded] =
        useState(false);

    const { stopGeneration } =
        useStopInference(characterId);

    const collapse = useCallback(() => {
        if (sidebarRef.current) {
            stopGeneration();

            // Start transform animation first
            setIsSidebarCollapsed(true);
            // Remove inline width style after the transition completes
            setTimeout(() => {
                sidebarRef.current?.style.removeProperty(
                    'width',
                );
            }, uiConstants.sidebar.transitionDuration);
        }
    }, [setIsSidebarCollapsed]);

    const open = useCallback(() => {
        if (sidebarRef.current) {
            // Calculate and set width immediately
            const width =
                window.innerWidth <=
                uiConstants.breakpoints.phone
                    ? `${window.innerWidth - uiConstants.sidebar.tabletSidebarLeftoverSpace}px`
                    : uiConstants.sidebar.tabletWidth;
            sidebarRef.current.style.width = width;

            // Use rAF to ensure width is set before triggering the transform animation
            requestAnimationFrame(() => {
                setIsSidebarCollapsed(false);
            });

            // Preload flags only once
            if (!flagsPreloaded) {
                SUPPORTED_LANGUAGES.forEach((lang) => {
                    const flagUrl = `${links.flags}${lang.countryCode}.svg`;
                    const img = new Image();
                    img.src = flagUrl;
                });
                setFlagsPreloaded(true);
            }
        }
    }, [flagsPreloaded, setIsSidebarCollapsed]);

    useEffect(() => {
        function handleResize() {
            if (
                window.innerWidth >=
                uiConstants.breakpoints.phone
            ) {
                collapse();
                return;
            }

            if (!isSidebarCollapsed && sidebarRef.current) {
                const width =
                    window.innerWidth <=
                    uiConstants.breakpoints.phone
                        ? `${window.innerWidth - uiConstants.sidebar.tabletSidebarLeftoverSpace}px`
                        : uiConstants.sidebar.tabletWidth;
                sidebarRef.current.style.width = width;
            }
        }

        window.addEventListener('resize', handleResize);
        handleResize();
        return () =>
            window.removeEventListener(
                'resize',
                handleResize,
            );
    }, [isSidebarCollapsed, collapse]);

    return (
        <>
            {!pathname.startsWith('/chat/') && (
                <div className="fixed left-4 top-4 z-50 md:hidden">
                    <MobileSidebarToggle
                        isCollapsed={isSidebarCollapsed}
                        open={open}
                    />
                </div>
            )}

            <div className="bg-black/30">
                <aside
                    ref={sidebarRef}
                    className={cn(
                        'group/sidebar z-[99999] flex h-full flex-col overflow-y-auto bg-secondary',
                        'fixed inset-y-0 left-0',
                        'transform transition-transform duration-300 ease-in-out',
                        isSidebarCollapsed &&
                            '-translate-x-full',
                    )}
                >
                    <div
                        className={`no-scrollbar flex w-full flex-col overflow-y-auto`}
                    >
                        <MobileSidebarTopNav
                            collapse={collapse}
                        />

                        <MobileSidebarHomeButton
                            collapse={collapse}
                        />

                        <MobileSidebarLanguageButton />

                        <MobileSessionsListSection />
                    </div>

                    <MobileAccountSection
                        collapse={collapse}
                    />
                </aside>

                <DimmingOverlay
                    isCollapsed={isSidebarCollapsed}
                    hide={collapse}
                />
            </div>
        </>
    );
};
