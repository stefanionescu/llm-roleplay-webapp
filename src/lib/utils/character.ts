import { uiConstants } from '@/config';
import { TCharacter } from '@/types/character';

const formatHashtags = (character: TCharacter) => {
    const allTags = [
        ...character.main_hashtags,
        ...(character.secondary_hashtags?.flat() || []),
    ];
    return allTags.join(', ');
};

const truncateName = (name: string) => {
    const isMobile =
        window.innerWidth < uiConstants.breakpoints.phone;
    const limit = isMobile
        ? uiConstants.breakpoints.characterNameMaxLength
              .phone
        : uiConstants.breakpoints.characterNameMaxLength
              .tablet;
    return name.length > limit
        ? `${name.slice(0, limit)}...`
        : name;
};

export { formatHashtags, truncateName };
