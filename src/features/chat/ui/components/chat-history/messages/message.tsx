import { memo } from 'react';

import { cn } from '@/lib/utils/shad';
import { Flex } from '@/components/ui/flex';
import { AIMessage } from '@/features/chat/ui/components/chat-history/messages/ai/ai-message';
import { HumanMessage } from '@/features/chat/ui/components/chat-history/messages/human-message';

type TMessage = {
    messageId: string;
    messageIndex: number;
};

const MessageComponent = ({
    messageId,
    messageIndex,
}: TMessage) => {
    return (
        <div
            id={`message-${messageId}`}
            className="flex w-full justify-center px-8 will-change-transform"
        >
            <div className="w-full max-w-[1000px] md:w-[700px] lg:w-[1000px]">
                <Flex
                    className={cn(
                        'flex w-full flex-col items-start gap-4 py-2',
                        'content-visibility-auto',
                    )}
                >
                    <HumanMessage
                        messageIndex={messageIndex}
                    />
                    <AIMessage
                        messageId={messageId}
                        messageIndex={messageIndex}
                    />
                </Flex>
            </div>
        </div>
    );
};

export const Message = memo(MessageComponent);
