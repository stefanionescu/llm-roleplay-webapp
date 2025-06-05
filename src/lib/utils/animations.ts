export const REVEAL_ANIMATION_VARIANTS = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: 'easeIn',
            delay: 0.1,
        },
    },
};
export const REVEAL_FAST_ANIMATION_VARIANTS = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: 'easeInOut',
            delay: 0.1,
        },
    },
};

const slideUpVariant = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
    },
};

const popInVariant = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: {
            duration: 0.2,
            ease: 'easeInOut',
            delay: 0.1,
        },
    },
};

const zoomVariant = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
        scale: 1,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: 'easeInOut',
            delay: 1,
        },
    },
};

const getCategoriesSectionResponsiveValues = () => {
    const isMdScreen = window.matchMedia(
        '(min-width: 768px)',
    ).matches;
    // No need to check for lg separately as md styles apply upwards

    return {
        itemWidth: isMdScreen ? 250 : 160, // 160px for <768px, 250px for >=768px
        gap: 8, // gap-2 class corresponds to 8px
    };
};

const calculateCategoryScrollPosition = (
    index: number,
    containerWidth: number,
    itemWidth: number,
    gap: number,
) => {
    // Calculate the start position of the item
    const itemStart = (itemWidth + gap) * index;

    // Calculate how much space we need on each side of the item to center it
    const spaceOnEachSide =
        (containerWidth - itemWidth) / 2;

    // The scroll position is the item's start minus the space needed on the left
    // Add 16px (px-4) to account for the container's left padding
    return Math.max(0, itemStart - spaceOnEachSide + 16);
};

export {
    calculateCategoryScrollPosition,
    getCategoriesSectionResponsiveValues,
    popInVariant,
    slideUpVariant,
    zoomVariant,
};
