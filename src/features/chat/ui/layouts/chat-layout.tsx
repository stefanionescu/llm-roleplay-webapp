import { InputSection } from '@/features/chat/ui/sections/input-section';
import { TopNavSection } from '@/features/chat/ui/sections/top-nav-section';
import { ChatHistorySection } from '@/features/chat/ui/sections/chat-history-section';

export const ChatLayout = () => {
    return (
        <div
            className="notranslate flex h-full flex-col"
            translate="no"
        >
            {/* Top navigation */}
            <TopNavSection />

            {/* Main scrollable area - no padding on desktop, positioned under the absolute nav */}
            <div className="relative flex-1 overflow-hidden">
                <div className="no-scrollbar absolute inset-0 flex flex-col overflow-hidden">
                    <ChatHistorySection />
                </div>
            </div>

            {/* Input section */}
            <div className="shrink-0">
                <InputSection />
            </div>
        </div>
    );
};
