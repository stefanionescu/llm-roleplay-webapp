import { FC } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    PlayIcon,
    ReplayIcon,
} from '@hugeicons/core-free-icons';

import { Button } from '@/components/ui/button';

type TVideoControlsProps = {
    hasEnded: boolean;
    isPlaying: boolean;
    isDragging: boolean;
    handleRestart: () => void;
    handlePlayPause: () => void;
};

export const VideoControls: FC<TVideoControlsProps> = ({
    isPlaying,
    hasEnded,
    isDragging,
    handlePlayPause,
    handleRestart,
}) => {
    if (isDragging) return null;

    return (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {!isPlaying && !hasEnded && (
                <div className="pointer-events-auto">
                    <Button
                        variant="text"
                        size="icon"
                        rounded="full"
                        className="h-20 w-20 min-w-[80px] bg-zinc-900/80 opacity-90"
                        onClick={handlePlayPause}
                        aria-label={
                            isPlaying
                                ? 'Pause video'
                                : 'Play video'
                        }
                    >
                        <HugeiconsIcon
                            icon={PlayIcon}
                            size={40}
                            className="text-white"
                        />
                    </Button>
                </div>
            )}
            {hasEnded && (
                <div className="pointer-events-auto">
                    <Button
                        variant="text"
                        size="icon"
                        rounded="full"
                        className="h-20 w-20 min-w-[80px] bg-zinc-900/80 opacity-90"
                        onClick={handleRestart}
                        aria-label="Replay video"
                    >
                        <HugeiconsIcon
                            icon={ReplayIcon}
                            size={40}
                            className="text-white"
                        />
                    </Button>
                </div>
            )}
        </div>
    );
};
