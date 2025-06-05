export const VIDEO_CONFIG = {
    VISIBILITY_THRESHOLD: 0.6,
    MUTE_STATE_CHANGE_EVENT: 'MUTE_STATE_CHANGE',
    INPUT_SECTION_HEIGHT: {
        SMALL_DEVICE: 200,
        LARGE_DEVICE: 100,
    },
    TOP_BAR_HEIGHT: {
        SMALL_DEVICE: 60,
        LARGE_DEVICE: 0,
    },
    MOBILE_BREAKPOINT: 768,
    TABLET_BREAKPOINT: 1024,
    AUTOPLAY_DELAYS: {
        MOBILE: 300,
        DESKTOP: 300,
    },
    VIDEO_END_BUFFER: 0.1,
    NEAR_END_BUFFER: 0.5,
    DRAG_THRESHOLD: 5,
    PROGRESS_BAR_HEIGHT: 24,
    PROGRESS_BAR_PADDING: 8,
} as const;

export const VIDEO_CONTAINER_CLASSES = {
    SPECIAL_RATIO:
        'max-sm:h-[317px] max-sm:w-[179px] sm:h-[431px] sm:w-[242px] max-md:h-[570px] max-md:w-[321px] md:h-[600px] md:w-[338px] max-lg:h-[570px] max-lg:w-[321px] lg:h-[566px] lg:w-[318px]',
    NORMAL_RATIO:
        'max-md:h-[566px] max-md:w-[318px] max-sm:h-[314px] max-sm:w-[176px] max-lg:h-[566px] max-lg:w-[318px] lg:h-[566px] lg:w-[318px]',
} as const;
