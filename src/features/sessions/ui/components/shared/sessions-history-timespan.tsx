import { HugeiconsIcon } from '@hugeicons/react';
import { RotateClockwiseIcon } from '@hugeicons/core-free-icons';

import { Flex } from '@/components/ui/flex';

type SessionsHistoryTimespanProps = {
    timespan: string;
};

export const SessionsHistoryTimespan = ({
    timespan,
}: SessionsHistoryTimespanProps) => {
    return (
        <div className="p-2">
            <Flex
                className="text-sm text-zinc-500"
                items="center"
                gap="sm"
            >
                <HugeiconsIcon
                    icon={RotateClockwiseIcon}
                    className="size-menu-icon-desktop"
                    fontVariant="stroke"
                />{' '}
                {timespan}
            </Flex>
        </div>
    );
};
