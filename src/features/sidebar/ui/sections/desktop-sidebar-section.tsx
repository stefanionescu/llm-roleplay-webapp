import { Flex } from '@/components/ui/flex';
import { LanguageMenu } from '@/features/language/ui/components/language-menu';
import { HomeButton } from '@/features/sidebar/ui/components/desktop/desktop-sidebar-home-button';
import { AccountMenu } from '@/features/sidebar/ui/components/desktop/desktop-sidebar-account-menu';
import { ChatHistoryToggle } from '@/features/sidebar/ui/components/desktop/desktop-sidebar-chat-history-toggle';

export const DesktopSidebarSection = () => {
    return (
        <div
            className={`fixed inset-y-0 z-50 flex h-screen flex-col items-center justify-center gap-3 border-r border-white/5 p-3 pb-6`}
        >
            <HomeButton />

            <ChatHistoryToggle />

            <Flex className="flex-1" />

            <LanguageMenu />
            <AccountMenu />
        </div>
    );
};
