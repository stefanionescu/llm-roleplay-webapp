import { marked } from 'marked';
import Avvvatars from 'avvvatars-react';
import { useShallow } from 'zustand/react/shallow';

import { Flex } from '@/components/ui/flex';
import { Type } from '@/components/ui/type';
import { useStore } from '@/lib/zustand/store';
import { useCharacterId } from '@/hooks/data/use-character-id';
import { useAvatarLetter } from '@/hooks/avatar/use-avatar-letter';

type HumanMessageProps = {
    messageIndex: number;
};

export const HumanMessage = ({
    messageIndex,
}: HumanMessageProps) => {
    const { avatarLetter, isLoading } = useAvatarLetter();

    const characterId = useCharacterId() ?? '';

    const { rawHuman } = useStore(
        useShallow((state) => {
            const message = state.getMessage(
                characterId,
                messageIndex,
            );
            return {
                rawHuman: message?.rawHuman ?? '',
            };
        }),
    );

    // Only render if there's a human message
    if (!rawHuman) return null;

    // Replace double newlines with <br><br> before parsing
    const processedText = rawHuman.replace(
        /\n\n/g,
        '<br><br>',
    );
    const processedHtml = marked(processedText) as string;

    return (
        <div className="flex w-full max-w-full flex-col">
            <div className="flex w-full gap-x-3">
                <div className="size-12 shrink-0 rounded-full">
                    {isLoading ? (
                        <div className="size-full rounded-full bg-zinc-700" />
                    ) : (
                        <Avvvatars
                            displayValue={avatarLetter}
                            value={'Roleplayer'}
                            style={'character'}
                            size={48}
                        />
                    )}
                </div>

                <Flex
                    direction="col"
                    gap="sm"
                    items="start"
                    className="overflow-hide min-w-0 grow"
                >
                    <Type
                        size="base"
                        textColor="secondary"
                        multiline
                        className="w-full text-left"
                        dangerouslySetInnerHTML={{
                            __html: processedHtml,
                        }}
                    />
                </Flex>
            </div>
        </div>
    );
};
