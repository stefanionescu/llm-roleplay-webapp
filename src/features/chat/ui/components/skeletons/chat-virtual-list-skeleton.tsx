import { ChatHistorySkeleton } from './chat-history-skeleton';
import { CharacterInfoSkeleton } from './character-info-skeleton';

export const ChatVirtualListSkeleton = () => {
    return (
        <div className="no-scrollbar flex size-full flex-col overflow-y-auto">
            <div className="shrink-0">
                <CharacterInfoSkeleton />
            </div>
            <div className="shrink-0">
                <ChatHistorySkeleton />
            </div>
        </div>
    );
};
