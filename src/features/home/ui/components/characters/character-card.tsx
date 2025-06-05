import Link from 'next/link';
import React, { memo } from 'react';
import { useLocale } from 'next-intl';

import { TCharacter } from '@/types/character';

import { CharacterCardData } from './character-card-data';
import { CharacterCardImage } from './character-card-image';

type CharacterCardProps = {
    characterId: string;
    character: TCharacter;
};

export const CharacterCard = memo(
    function CharacterCard({
        characterId,
        character,
    }: CharacterCardProps) {
        const locale = useLocale();

        // Get translated content if available, otherwise use default
        const translatedContent =
            character.translations?.get(locale);

        const characterName =
            translatedContent?.name || character.name;
        const characterBio =
            translatedContent?.bio || character.bio;
        const characterHashtags =
            translatedContent?.display_hashtags ||
            character.display_hashtags;

        return (
            <Link
                href={`/chat/${characterId}`}
                prefetch={false}
                className="block"
            >
                <div
                    className={`mx-2.5 flex h-auto transform-gpu cursor-pointer items-center rounded-xl border shadow transition-transform duration-300 ease-in-out max-md:w-[280px] md:w-[340px] lg:hover:z-[999] lg:hover:translate-x-[5px] lg:hover:scale-[1.02] lg:hover:border-primary`}
                    style={{
                        background: 'transparent',
                        willChange: 'transform',
                    }}
                >
                    <div
                        aria-label={`Character: ${characterName}`}
                        className={`group flex w-full will-change-transform max-md:max-w-[280px] md:max-w-[22rem]`}
                        style={
                            {
                                // Removed: contain: 'paint layout style',
                            }
                        }
                    >
                        <div
                            className={`group/card relative flex w-full transform-gpu cursor-pointer items-center rounded-xl bg-zinc-500/10 p-4 pr-2.5 max-md:h-[115px] md:h-[120px] lg:hover:cursor-pointer`}
                        >
                            <CharacterCardImage
                                characterName={
                                    characterName
                                }
                                characterIconUrl={
                                    character.icon_url
                                }
                            />

                            <CharacterCardData
                                characterName={
                                    characterName
                                }
                                characterBio={characterBio}
                                characterHashtags={
                                    characterHashtags
                                }
                            />
                        </div>
                    </div>
                </div>
            </Link>
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison function for memo
        return (
            prevProps.character.name ===
                nextProps.character.name &&
            prevProps.character.icon_url ===
                nextProps.character.icon_url &&
            prevProps.character.bio ===
                nextProps.character.bio &&
            prevProps.character.display_hashtags ===
                nextProps.character.display_hashtags
        );
    },
);
