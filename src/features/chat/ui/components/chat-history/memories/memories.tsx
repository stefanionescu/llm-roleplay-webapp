import { useParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslations, useLocale } from 'next-intl';
import { FC, useRef, useState, useEffect } from 'react';
import { Idea01Icon } from '@hugeicons/core-free-icons';

import { Store } from '@/types/zustand';
import { Flex } from '@/components/ui/flex';
import { Type } from '@/components/ui/type';
import { useStore } from '@/lib/zustand/store';
import { TMemoriesProps } from '@/types/video';
import { chatIdSchema } from '@/validators/chat';
import { useVideoSize } from '@/hooks/ui/use-video-size';
import { globalVideoState } from '@/lib/utils/video/state';
import { useScreenType } from '@/hooks/video/use-screen-type';
import {
    Tooltip,
    TooltipProvider,
} from '@/components/ui/tooltip';

import { EmbeddedContent } from './embedded-content';

export const Memories: FC<TMemoriesProps> = ({
    messageId,
    memories,
}) => {
    const t = useTranslations();
    const locale = useLocale();
    const {
        hasNonPhoneSpecialRatio,
        isPhoneLandscape,
        isMediumSquare,
        forcesSmallerVideoHeight,
        forcesBiggerVideoHeight,
    } = useVideoSize();

    const screenType = useScreenType();
    const isLargeScreen = screenType === 'large';
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const firstRenderRef = useRef(true);

    useEffect(() => {
        if (
            firstRenderRef.current &&
            memories &&
            memories.length > 0
        ) {
            globalVideoState.hasUserInteracted = false;
            firstRenderRef.current = false;
        }

        return () => {
            firstRenderRef.current = true;
        };
    }, [messageId, memories]);

    const hasSpecialRatio =
        hasNonPhoneSpecialRatio || isPhoneLandscape;

    const params = useParams<{ chatId: string }>();
    const validationResult = chatIdSchema.safeParse(
        params.chatId,
    );

    if (!validationResult.success) {
        throw new Error('Invalid character ID prop');
    }

    const characterId = validationResult.data;

    if (!characterId) {
        throw new Error('Invalid character ID prop');
    }

    const { getCharacter, getCharacterCategory } = useStore(
        useShallow((state: Store) => ({
            getCharacter: state.getCharacter,
            getCharacterCategory:
                state.getCharacterCategory,
        })),
    );

    const characterCategory =
        getCharacterCategory(characterId);
    if (!characterCategory) {
        throw new Error('Invalid character category');
    }

    const character = getCharacter(
        characterCategory,
        characterId,
    );

    // Determine the correct translation key based on the number of memories
    const tooltipTranslationKey =
        memories.length === 1
            ? 'chat.memoryVideo'
            : 'chat.memoryVideos';

    // Get the translated tooltip content with the character's name interpolated
    const characterTranslation =
        character?.translations?.get(locale);
    const characterNameForLocale =
        characterTranslation?.name || character?.name || '';

    const tooltipContent = t(tooltipTranslationKey, {
        characterName: characterNameForLocale,
    });

    // Wrap the content in a div for styling
    const styledTooltipContent = (
        <div className="max-w-xs whitespace-normal text-left">
            {tooltipContent}
        </div>
    );

    return (
        <div className="w-full border-t border-zinc-500/10">
            <Flex
                direction="col"
                gap="sm"
                className="w-full overflow-hidden"
            >
                <Flex
                    gap="sm"
                    items="center"
                    className="mt-4 flex flex-row justify-start"
                >
                    <TooltipProvider>
                        <Tooltip
                            side="bottom"
                            content={styledTooltipContent}
                            // Conditionally control open state for non-large screens
                            open={
                                !isLargeScreen
                                    ? tooltipOpen
                                    : undefined
                            }
                            onOpenChange={
                                !isLargeScreen
                                    ? setTooltipOpen
                                    : undefined
                            }
                        >
                            <div
                                ref={tooltipRef}
                                className="flex touch-manipulation items-center gap-2 active:opacity-80 md:hover:opacity-80"
                                // Only trigger onClick for non-large screens
                                onClick={
                                    !isLargeScreen
                                        ? () =>
                                              setTooltipOpen(
                                                  (prev) =>
                                                      !prev,
                                              )
                                        : undefined
                                }
                            >
                                <Flex
                                    items="center"
                                    justify="center"
                                    className="h-6 w-6 rounded-md border border-zinc-500/15 bg-zinc-700 shadow-sm"
                                >
                                    <HugeiconsIcon
                                        icon={Idea01Icon}
                                        size={18}
                                        strokeWidth={2}
                                        className="flex-shrink-0"
                                    />
                                </Flex>
                                <Type
                                    size="sm"
                                    weight="medium"
                                    className="ml-1"
                                >
                                    {t('chat.memories')}
                                </Type>
                            </div>
                        </Tooltip>
                    </TooltipProvider>
                </Flex>

                <EmbeddedContent
                    videoUrls={memories || []}
                    hasSpecialRatio={hasSpecialRatio}
                    isMediumSquare={isMediumSquare}
                    forcesSmallerVideoHeight={
                        forcesSmallerVideoHeight
                    }
                    forcesBiggerVideoHeight={
                        forcesBiggerVideoHeight
                    }
                    messageId={messageId}
                />
            </Flex>
        </div>
    );
};
