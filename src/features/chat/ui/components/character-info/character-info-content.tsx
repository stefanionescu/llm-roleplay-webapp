import React, { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLocale, useTranslations } from 'next-intl';
import { VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/shad';
import { Flex } from '@/components/ui/flex';
import { useStore } from '@/lib/zustand/store';
import { categoryToIcon, iconMap } from '@/lib/utils/icons';
import { useChatContext } from '@/hooks/data/use-chat-context';
import {
    categoryToBadgeVariant,
    badgeVariants,
} from '@/components/ui/badge';
import { CharacterInfoMain } from '@/features/chat/ui/components/character-info/character-info-main';
import { CharacterInfoDetails } from '@/features/chat/ui/components/character-info/character-info-details';

type CharacterInfoContentProps = {
    categoryId: string;
    characterId: string;
};

const CharacterInfoContentComponent = ({
    characterId,
    categoryId,
}: CharacterInfoContentProps) => {
    const t = useTranslations();
    const locale = useLocale();
    const { isOnChatPage, hasMessages } = useChatContext();
    const showRestartButton = isOnChatPage && hasMessages;

    const {
        getCharacter,
        getCategory,
        getFirstMessage,
        getMessageCount,
    } = useStore(
        useShallow((state) => ({
            getCharacter: state.getCharacter,
            getCategory: state.getCategory,
            getFirstMessage: state.getFirstMessage,
            getMessageCount: state.getMessageCount,
        })),
    );

    const character = getCharacter(categoryId, characterId);
    const category = getCategory(categoryId);

    if (!character || !category) {
        throw new Error(
            'Character or category not found when setting character info content',
        );
    }

    const translatedContent =
        character.translations?.get(locale) ?? character;

    // Get translated category name or fallback to default
    const categoryName =
        category.translations?.[locale] ?? category.name;

    const categoryIcon =
        iconMap[
            categoryToIcon[
                category.name.toLowerCase() as keyof typeof categoryToIcon
            ]
        ];

    const characterName = translatedContent.name;
    const characterBio = translatedContent.bio;
    const characterHashtags =
        translatedContent.display_hashtags;
    const messageCount = getMessageCount(characterId);
    const firstMessage = getFirstMessage(characterId);

    // Check if we should hide the content
    const shouldHideContent =
        messageCount > 0 &&
        firstMessage?.position !== undefined &&
        firstMessage.position > 1;

    if (shouldHideContent) {
        return null;
    }

    return (
        <Flex
            justify="start"
            items="center"
            direction="col"
            gap="md"
            className={cn(
                'min-h-full w-full',
                !showRestartButton && 'md:pt-8',
            )}
        >
            <CharacterInfoMain
                badgeVariant={
                    categoryToBadgeVariant[
                        category.name.toLowerCase()
                    ] as VariantProps<
                        typeof badgeVariants
                    >['variant']
                }
                categoryName={categoryName}
                iconUrl={character.icon_url}
                icon={categoryIcon}
                characterName={characterName}
            />

            <Flex
                direction="col"
                gap="xs"
                items="center"
                justify="center"
            >
                <CharacterInfoDetails
                    characterName={characterName}
                    characterBio={characterBio}
                    characterHashtags={characterHashtags}
                    commonTraits={t('common.traits')}
                    badgeVariant={
                        categoryToBadgeVariant[
                            category.name.toLowerCase()
                        ] as VariantProps<
                            typeof badgeVariants
                        >['variant']
                    }
                />
            </Flex>
        </Flex>
    );
};

// Export a memoized version of the component to prevent unnecessary re-renders
export const CharacterInfoContent = memo(
    CharacterInfoContentComponent,
);
