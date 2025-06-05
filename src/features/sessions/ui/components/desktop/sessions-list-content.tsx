import { ElementRef } from 'react';
import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';

import { cn } from '@/lib/utils/shad';
import { useStore } from '@/lib/zustand/store';
import { getTimeGroup } from '@/lib/utils/time';

import { SessionsDismissButton } from './sessions-dismiss-button';
import { SessionsHistoryTimespan } from '../shared/sessions-history-timespan';

type SessionsListContentProps = {
    isCollapsed: boolean;
    collapse: () => void;
    children: React.ReactNode;
    errorFetchingData?: boolean;
    sidebarRef: React.RefObject<ElementRef<'aside'>>;
};

export const SessionsListContent = ({
    children,
    isCollapsed,
    collapse,
    sidebarRef,
    errorFetchingData = false,
}: SessionsListContentProps) => {
    const t = useTranslations('common.timeGroups');
    const { getFirstSessionActivityRank, sessionsCount } =
        useStore(
            useShallow((state) => ({
                getFirstSessionActivityRank:
                    state.getFirstSessionActivityRank,
                sessionsCount: state.sessionsCount,
            })),
        );

    return (
        <aside
            ref={sidebarRef}
            className={cn(
                'fixed left-2 top-2 z-[901] flex h-[98dvh] w-[350px] flex-col rounded-3xl outline-none md:bottom-2',
                'transform transition-transform duration-300 ease-in-out',
                isCollapsed
                    ? '-translate-x-[calc(100%+1rem)]'
                    : 'translate-x-0',
            )}
        >
            <div
                className={`relative flex h-full flex-1 flex-row rounded-2xl border-white/5 bg-zinc-800 p-2`}
            >
                <div
                    className={`no-scrollbar flex w-full flex-col overflow-y-auto`}
                >
                    {/* Container for Timespan and Dismiss button */}
                    <div
                        className={`flex flex-row items-center justify-between`}
                    >
                        <div className="flex-1">
                            {!errorFetchingData &&
                                sessionsCount > 0 && (
                                    <SessionsHistoryTimespan
                                        timespan={t(
                                            getTimeGroup(
                                                getFirstSessionActivityRank(),
                                                sessionsCount,
                                            ),
                                        )}
                                    />
                                )}
                        </div>
                        <SessionsDismissButton
                            handleOpenChange={collapse}
                        />
                    </div>

                    {/* Content area */}
                    {children}
                </div>
            </div>
        </aside>
    );
};
