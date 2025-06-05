'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useState } from 'react';
import { useLocale } from 'next-intl';

import { cn } from '@/lib/utils/shad';
import { uiConstants } from '@/config';
import { type TimeTranslations } from '@/lib/utils/time';
import { useWindowWidth } from '@/hooks/ui/use-window-width';
import { useCharacterId } from '@/hooks/data/use-character-id';
import { useStopInference } from '@/hooks/inference/use-stop-inference';
import { DeleteSessionPopup } from '@/features/sessions/ui/components/shared/delete-session-popup';
import { SessionCharacterInfo } from '@/features/sessions/ui/components/shared/session-character-info';

type SessionItemProps = {
    lastUpdatedAt: Date;
    characterId: string;
    isCurrentSession: boolean;
    characterImageUrl?: string;
    timeTranslations: TimeTranslations;
    characterNames: Map<string, string>;
};

export const SessionItem = memo(
    ({
        isCurrentSession,
        lastUpdatedAt,
        characterId,
        characterNames,
        characterImageUrl,
        timeTranslations,
    }: SessionItemProps) => {
        const locale = useLocale();
        const width = useWindowWidth();
        const currentCharacterId = useCharacterId() ?? '';
        const [openDeleteConfirm, setOpenDeleteConfirm] =
            useState(false);

        let displayedName =
            characterNames?.get(locale) || 'Unknown';

        if (width > 0) {
            if (
                width < uiConstants.breakpoints.phone &&
                displayedName.length >
                    uiConstants.breakpoints
                        .characterNameMaxLength.phone
            ) {
                displayedName = `${displayedName.substring(0, uiConstants.breakpoints.characterNameMaxLength.phone)}...`;
            } else if (
                width >= uiConstants.breakpoints.phone &&
                width < uiConstants.breakpoints.tablet &&
                displayedName.length >
                    uiConstants.breakpoints
                        .characterNameMaxLength.tablet
            ) {
                displayedName = `${displayedName.substring(0, uiConstants.breakpoints.characterNameMaxLength.tablet)}...`;
            }
        }

        const { stopGeneration } = useStopInference(
            characterId,
            currentCharacterId,
        );

        return (
            <Link
                href={`/chat/${characterId}`}
                passHref
                legacyBehavior
                prefetch={false}
            >
                <div
                    key={characterId}
                    className={cn(
                        'group flex w-full cursor-pointer flex-row items-start gap-2 rounded-xl p-2',
                        isCurrentSession
                            ? 'bg-black/30'
                            : 'lg:hover:bg-zinc-700',
                    )}
                    onClick={stopGeneration()}
                >
                    <SessionCharacterInfo
                        characterImageUrl={
                            characterImageUrl ?? ''
                        }
                        characterName={displayedName}
                        lastUpdatedAt={lastUpdatedAt}
                        timeTranslations={timeTranslations}
                    />

                    <DeleteSessionPopup
                        openDeleteConfirm={
                            openDeleteConfirm
                        }
                        setOpenDeleteConfirm={
                            setOpenDeleteConfirm
                        }
                        characterId={characterId}
                        characterNames={characterNames}
                        isCurrentSession={isCurrentSession}
                    />
                </div>
            </Link>
        );
    },
);

SessionItem.displayName = 'SessionItem';
