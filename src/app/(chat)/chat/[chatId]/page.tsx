export const runtime = 'edge';

import { ChatLayout } from '@/features/chat/ui/layouts/chat-layout';

const ChatPage = () => {
    return (
        <div className="no-scrollbar h-screen overflow-hidden">
            <ChatLayout />
        </div>
    );
};

export default ChatPage;
