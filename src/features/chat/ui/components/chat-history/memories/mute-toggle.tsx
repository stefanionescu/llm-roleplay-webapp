import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    FC,
    useState,
    useEffect,
    useCallback,
} from 'react';
import {
    VolumeMute02Icon,
    VolumeLowIcon,
} from '@hugeicons/core-free-icons';

import { useMute } from '@/lib/context/mute';
import { VIDEO_CONFIG } from '@/config/video';
import {
    globalVideoState,
    getStoredMutePreference,
    storeMutePreference,
    updateGlobalMuteState,
} from '@/lib/utils/video/state';

type TMuteToggleProps = {
    className?: string;
};

type TMuteStateChangeEvent = CustomEvent<{
    isMuted: boolean;
}>;

export const MuteToggle: FC<TMuteToggleProps> = ({
    className,
}) => {
    const { isReload } = useMute();
    const t = useTranslations('chat');
    // Start with a consistent state for SSR
    const [isMuted, setIsMuted] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);

    // Initialize client-side state after hydration
    useEffect(() => {
        const newMutedState =
            getStoredMutePreference(isReload);
        globalVideoState.isMuted = newMutedState;
        setIsMuted(newMutedState);
        setIsHydrated(true);
    }, [isReload]);

    const toggleMute = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            const newMutedState = !isMuted;
            setIsMuted(newMutedState);

            updateGlobalMuteState(newMutedState);

            // Dispatch event to sync all MuteToggle components
            if (typeof window !== 'undefined') {
                window.dispatchEvent(
                    new CustomEvent(
                        VIDEO_CONFIG.MUTE_STATE_CHANGE_EVENT,
                        {
                            detail: {
                                isMuted: newMutedState,
                            },
                        },
                    ),
                );

                storeMutePreference(newMutedState);
            }
        },
        [isMuted],
    );

    // Listen for mute state changes from other components
    useEffect(() => {
        if (!isHydrated) return;

        const handleMuteChange = (
            e: TMuteStateChangeEvent,
        ) => {
            setIsMuted(e.detail.isMuted);
        };

        window.addEventListener(
            VIDEO_CONFIG.MUTE_STATE_CHANGE_EVENT,
            handleMuteChange as EventListener,
        );

        return () =>
            window.removeEventListener(
                VIDEO_CONFIG.MUTE_STATE_CHANGE_EVENT,
                handleMuteChange as EventListener,
            );
    }, [isHydrated]);

    // Only render the button after hydration to avoid hydration mismatch
    if (!isHydrated) {
        return null;
    }

    return (
        <button
            onClick={toggleMute}
            className={`absolute left-3 top-3 z-10 opacity-90 transition-opacity hover:opacity-100 ${className || ''}`}
            aria-label={
                isMuted ? t('muteVideo') : t('unmuteVideo')
            }
        >
            {isMuted ? (
                <HugeiconsIcon
                    icon={VolumeMute02Icon}
                    size={28}
                    strokeWidth={3}
                    className="text-white"
                />
            ) : (
                <HugeiconsIcon
                    icon={VolumeLowIcon}
                    size={28}
                    strokeWidth={3}
                    className="text-white"
                />
            )}
        </button>
    );
};
