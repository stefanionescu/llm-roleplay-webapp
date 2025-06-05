export const uiConstants = {
    breakpoints: {
        phone: 768,
        tablet: 1024,
        threeFourTolerance: 0.05,
        isThreeByFourAspect: 0.75,
        isFourByThreeAspect: 1.3333,
        isNearSquareAspect: 1,
        mediumSquareMinWidth: 600,
        characterNameMaxLength: {
            phone: 18,
            tablet: 18,
        },
        scrollToBottomThreshold: 100,
    },
    sessionLoadingDelay: 1000,
    tooltipDelayDuration: 200,
    sidebar: {
        tabletWidth: '250px',
        tabletSidebarLeftoverSpace: 120,
        transitionDuration: 300,
    },
} as const;
