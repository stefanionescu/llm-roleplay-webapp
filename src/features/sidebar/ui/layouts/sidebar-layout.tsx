import { AuthModal } from '@/features/auth/modals/auth-modal';
import { FeedbackModal } from '@/features/feedback/ui/modals/feedback-modal';
import { MobileSidebarSection } from '@/features/sidebar/ui/sections/mobile-sidebar-section';
import { DesktopSidebarSection } from '@/features/sidebar/ui/sections/desktop-sidebar-section';

type SidebarLayoutProps = {
    children: React.ReactNode;
};

export const SidebarLayout = ({
    children,
}: SidebarLayoutProps) => {
    return (
        <div
            className={`relative flex min-h-screen w-full flex-row overflow-hidden`}
        >
            <div className="max-md:hidden">
                <DesktopSidebarSection />
            </div>

            <div className="md:hidden">
                <MobileSidebarSection />
            </div>

            {/* Main Content Area */}
            <main
                className={`flex-1 overflow-y-auto md:pl-16`}
            >
                {children}
            </main>

            {/* Global Modals */}
            <FeedbackModal />
            <AuthModal />
        </div>
    );
};
