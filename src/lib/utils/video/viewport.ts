import { VIDEO_CONFIG } from '@/config/video';

/**
 * Checks if an element is visible in the viewport with strict visibility requirements
 * Considers mobile device constraints and input section coverage
 */
export function isElementInViewport(
    el: HTMLElement,
): boolean {
    const rect = el.getBoundingClientRect();
    const windowHeight =
        window.innerHeight ||
        document.documentElement.clientHeight;
    const windowWidth =
        window.innerWidth ||
        document.documentElement.clientWidth;
    const threshold = VIDEO_CONFIG.VISIBILITY_THRESHOLD;

    // Is this a small device?
    const isSmallDevice =
        windowWidth < VIDEO_CONFIG.MOBILE_BREAKPOINT;

    // Consider the input section at the bottom which may cover the video
    // Much larger values for small devices to account for the virtual keyboard
    const inputSectionHeight = isSmallDevice
        ? VIDEO_CONFIG.INPUT_SECTION_HEIGHT.SMALL_DEVICE
        : VIDEO_CONFIG.INPUT_SECTION_HEIGHT.LARGE_DEVICE;

    // Calculate visible height considering both top and bottom obstructions
    // For small devices, be even more aggressive with the bottom margin
    const visibleBottom = Math.min(
        rect.bottom,
        windowHeight - inputSectionHeight,
    );

    // For small devices, also consider top navigation and status bars
    const topBarHeight = isSmallDevice
        ? VIDEO_CONFIG.TOP_BAR_HEIGHT.SMALL_DEVICE
        : VIDEO_CONFIG.TOP_BAR_HEIGHT.LARGE_DEVICE;
    const visibleTop = Math.max(rect.top, topBarHeight);

    // If bottom is less than top, element is not visible at all
    if (visibleBottom <= visibleTop) return false;

    const visibleHeight = visibleBottom - visibleTop;
    const elementHeight = rect.bottom - rect.top;

    // For small screens, use a higher effective threshold
    const effectiveThreshold = isSmallDevice
        ? Math.max(threshold, 0.7)
        : threshold;

    const visibleRatio =
        Math.max(0, visibleHeight) / elementHeight;

    return visibleRatio >= effectiveThreshold;
}
