import { ChatHistoryTextSkeleton } from './chat-history-text-skeleton';
import { ChatHistoryVideoSkeleton } from './chat-history-video-skeleton';

export const ChatHistorySkeleton = () => {
    return (
        <div className="mb-8 mt-12 flex w-full justify-center px-8 max-[400px]:mb-16">
            <div className="flex w-full max-w-[1000px] flex-col items-start md:w-[700px] lg:w-[1000px]">
                <ChatHistoryTextSkeleton />
                <div className="flex w-full flex-col">
                    <div className="hidden w-full gap-x-3 md:flex">
                        <div className="size-12 shrink-0" />
                        <div className="grow">
                            <ChatHistoryVideoSkeleton />
                        </div>
                    </div>
                    <div className="flex w-full md:hidden">
                        <ChatHistoryVideoSkeleton />
                    </div>
                </div>
            </div>
        </div>
    );
};
