'use client';

import { useState } from 'react';

import { SessionsButton } from '@/features/sidebar/ui/components/desktop/desktop-sidebar-sessions-button';
import { DesktopSessionsListSection } from '@/features/sessions/ui/sections/desktop-sessions-list-section';

export const ChatHistoryToggle = () => {
    const [isHistoryOpen, setIsHistoryOpen] =
        useState(false);

    return (
        <div className={`flex flex-col items-center gap-2`}>
            <SessionsButton
                onClick={() =>
                    setIsHistoryOpen((prev) => !prev)
                }
            />
            <DesktopSessionsListSection
                isOpen={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
            />
        </div>
    );
};
