'use client';

import { VList } from 'virtua';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { trpc } from '@/trpc/client';
import { dbConstants } from '@/config';
import { useStore } from '@/lib/zustand/store';
import { TChatSession } from '@/types/session';
import { getTimeGroup } from '@/lib/utils/time';
import { Spinner } from '@/components/ui/spinner';
import { processSessionsData } from '@/lib/utils/session';
import { useCharacterId } from '@/hooks/data/use-character-id';
import { useTimeTranslations } from '@/hooks/use-time-translations';
import { SessionItem } from '@/features/sessions/ui/components/shared/session-item';
import { SessionsListError } from '@/features/sessions/ui/components/shared/sessions-list-error';
import { SessionsListEmpty } from '@/features/sessions/ui/components/shared/sessions-list-empty';
import { SessionsHistoryTimespan } from '@/features/sessions/ui/components/shared/sessions-history-timespan';

type SessionsListProps = {
    showTopTag: boolean;
    showEmptyState: boolean;
    errorFetchingData: boolean;
};

export const SessionsList = ({
    errorFetchingData,
    showTopTag,
    showEmptyState = true,
}: SessionsListProps) => {
    const t = useTranslations();
    const timeTranslations = useTimeTranslations();

    const [isFetching, setIsFetching] = useState(false);
    const [errorFetching, setErrorFetching] =
        useState(false);

    const utils = trpc.useUtils();
    const characterId = useCharacterId();

    const {
        getSessionByIndex,
        addSessions,
        hasMoreSessions,
        characterSessions,
        setHasMoreSessions,
        setCharacterSessionLink,
        sessionsCount,
        oldestSessionRank,
    } = useStore(
        useShallow((state) => ({
            getSessionByIndex: state.getSessionByIndex,
            characterSessions: state.characterSessions,
            hasMoreSessions: state.hasMoreSessions,
            setHasMoreSessions: state.setHasMoreSessions,
            addSessions: state.addSessions,
            setCharacterSessionLink:
                state.setCharacterSessionLink,
            sessionsCount: state.sessionsCount,
            oldestSessionRank:
                state.getLastSessionActivityRank(),
        })),
    );

    // Function to load more (older) sessions
    const loadMore = useCallback(async () => {
        if (
            !hasMoreSessions ||
            isFetching ||
            errorFetching
        ) {
            return;
        }

        setIsFetching(true);

        try {
            const data =
                await utils.sessions.getSessions.fetch({
                    limit: dbConstants.sessionLimit,
                    cursor: {
                        activityRank: oldestSessionRank
                            ? new Date(
                                  oldestSessionRank,
                              ).toISOString()
                            : null,
                    },
                });

            if (data && data.sessions.length > 0) {
                processSessionsData({
                    data,
                    characterSessions,
                    setCharacterSessionLink,
                    addSessions,
                    setHasMoreSessions,
                });
            }
        } catch {
            setErrorFetching(true);
            toast.error(t('error.notLoadSessions'));
        } finally {
            setIsFetching(false);
        }
    }, [hasMoreSessions]);

    const renderLoadingSpinner = useCallback(
        () => (
            <div className="flex justify-center py-4">
                <Spinner />
            </div>
        ),
        [],
    );

    const renderTimeGroupSpan = useCallback(
        (latestDate: Date) => (
            <SessionsHistoryTimespan
                timespan={t(
                    `common.timeGroups.${getTimeGroup(latestDate, sessionsCount)}`,
                )}
            />
        ),
        [t, sessionsCount],
    );

    const renderSessionItem = useCallback(
        (
            session: TChatSession,
            sessionLatestDate: Date,
        ) => (
            <SessionItem
                isCurrentSession={
                    session.character === characterId
                }
                lastUpdatedAt={sessionLatestDate}
                characterId={session.character}
                characterNames={session.characterNames}
                characterImageUrl={session.characterIcon}
                timeTranslations={timeTranslations}
            />
        ),
        [characterId],
    );

    const shouldShowTimeGroup = useCallback(
        (
            currentSession: TChatSession,
            previousSession: TChatSession | null,
            index: number,
        ) => {
            if (showTopTag && index === 0) return true;

            if (!previousSession) return false;

            const currentLatestDate = new Date(
                Math.max(
                    currentSession.latestMessageAt?.getTime() ||
                        0,
                    currentSession.createdAt.getTime(),
                ),
            );

            const previousLatestDate = new Date(
                Math.max(
                    previousSession.latestMessageAt?.getTime() ||
                        0,
                    previousSession.createdAt.getTime(),
                ),
            );

            return (
                getTimeGroup(
                    currentLatestDate,
                    sessionsCount,
                ) !==
                getTimeGroup(
                    previousLatestDate,
                    sessionsCount,
                )
            );
        },
        [showTopTag, sessionsCount],
    );

    const renderSession = useCallback(
        (index: number) => {
            const session = getSessionByIndex(index);

            if (!session) {
                return index === sessionsCount - 1 &&
                    isFetching &&
                    hasMoreSessions ? (
                    renderLoadingSpinner()
                ) : (
                    <></>
                );
            }

            const previousSession =
                index > 0
                    ? getSessionByIndex(index - 1)
                    : null;
            const sessionLatestDate = new Date(
                Math.max(
                    session.latestMessageAt?.getTime() || 0,
                    session.createdAt.getTime(),
                ),
            );

            const timeGroupSwitched = shouldShowTimeGroup(
                session,
                previousSession || null,
                index,
            );

            const element = (
                <div
                    className={`${
                        index === sessionsCount - 1
                            ? 'mb-4'
                            : 'mb-2'
                    } ${
                        index === 0 && !showTopTag
                            ? 'mt-2'
                            : ''
                    }`}
                >
                    {timeGroupSwitched && (
                        <div className="mb-2">
                            {renderTimeGroupSpan(
                                sessionLatestDate,
                            )}
                        </div>
                    )}
                    {renderSessionItem(
                        session,
                        sessionLatestDate,
                    )}
                </div>
            );

            if (
                index === sessionsCount - 1 &&
                isFetching &&
                hasMoreSessions
            ) {
                return (
                    <>
                        {element}
                        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-2">
                            <Spinner />
                        </div>
                    </>
                );
            }

            return element;
        },
        [characterId, isFetching],
    );

    if (errorFetchingData) {
        return <SessionsListError />;
    }

    if (sessionsCount === 0 && showEmptyState) {
        return <SessionsListEmpty />;
    }

    return (
        <div className="flex size-full flex-col">
            <div
                className="no-scrollbar relative flex-1 overflow-y-auto"
                style={{ WebkitOverflowScrolling: 'auto' }}
            >
                <VList
                    count={sessionsCount}
                    overscan={dbConstants.sessionLimit}
                    className="no-scrollbar"
                    style={{ overscrollBehavior: 'none' }}
                    onScrollEnd={loadMore}
                >
                    {renderSession}
                </VList>
            </div>
        </div>
    );
};
