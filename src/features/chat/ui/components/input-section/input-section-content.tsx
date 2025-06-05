'use client';

import { useLocale } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';
import { useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils/shad';
import { chatConstants } from '@/config';
import { Flex } from '@/components/ui/flex';
import { Type } from '@/components/ui/type';
import { useStore } from '@/lib/zustand/store';
import { useChatEditor } from '@/hooks/input/use-chat-editor';
import { useInputHandler } from '@/hooks/input/use-input-handler';
import { useCharacterData } from '@/hooks/data/use-character-data';
import { StarterMessages } from '@/features/chat/ui/components/input-section/starter-messages';
import { InputSectionEditor } from '@/features/chat/ui/components/input-section/input-section-editor';
import { InputSectionFooter } from '@/features/chat/ui/components/input-section/input-section-footer';
import { InputSectionSkeleton } from '@/features/chat/ui/components/skeletons/input-section-skeleton';
import { InputSectionActions } from '@/features/chat/ui/components/input-section/input-section-actions';
import { ScrollToBottomButton } from '@/features/chat/ui/components/input-section/scroll-to-bottom-button';

export const InputSectionContent = () => {
    const locale = useLocale();
    const { editor } = useChatEditor();
    const { characterId } = useCharacterData();
    const {
        handleSendMessage,
        handleSelectStarterMessage,
        character,
    } = useInputHandler();

    const [characterCount, setCharacterCount] = useState(0);

    const { messageCount } = useStore(
        useShallow((state) => ({
            messageCount:
                state.getMessageCount(characterId),
        })),
    );

    const chatInputBackgroundContainer = cn(
        'flex w-full flex-col items-center justify-center',
        'min-h-fit',
        'z-10',
        'md:w-full',
        'input-section',
    );

    const innerContainer = cn(
        'flex w-full max-w-[800px] flex-col items-center justify-center px-4',
    );

    useEffect(() => {
        const updateInputSectionHeight = () => {
            const inputSection = document.querySelector(
                '.input-section',
            );
            if (inputSection) {
                const height =
                    inputSection.getBoundingClientRect()
                        .height;
                document.documentElement.style.setProperty(
                    '--input-section-height',
                    `${height}px`,
                );
            }
        };

        updateInputSectionHeight();

        const resizeObserver = new ResizeObserver(
            updateInputSectionHeight,
        );
        const inputSection = document.querySelector(
            '.input-section',
        );
        if (inputSection) {
            resizeObserver.observe(inputSection);
        }

        return () => resizeObserver.disconnect();
    }, []);

    // Track character count
    useEffect(() => {
        if (editor) {
            const updateCharacterCount = () => {
                const characterCountStorage = editor.storage
                    .characterCount as
                    | { characters(): number }
                    | undefined;
                const characterCount =
                    characterCountStorage?.characters() ??
                    0;
                setCharacterCount(characterCount);
            };

            updateCharacterCount();
            editor.on('update', updateCharacterCount);

            return () => {
                editor.off('update', updateCharacterCount);
            };
        }
    }, [editor]);

    const characterData =
        character.translations.get(locale) ?? character;
    const chatStarters = useMemo(
        () => characterData?.chat_starters ?? [],
        [characterData?.chat_starters],
    );

    // Show starters if:
    // 1. We have starters available AND
    // 2. EITHER:
    //    a. We have no messages (empty chat), OR
    //    b. We have exactly 1 message (just the initial system message) AND it's a new session
    //       (don't show starters if we already sent a real message)
    const shouldShowStarters =
        chatStarters.length > 0 && messageCount <= 1;

    const memoizedStarters = useMemo(() => {
        if (!shouldShowStarters) return null;
        return (
            <StarterMessages
                messages={chatStarters}
                onSelectMessage={(content) =>
                    handleSelectStarterMessage(
                        editor,
                        content,
                    )
                }
            />
        );
    }, [
        shouldShowStarters,
        chatStarters,
        handleSelectStarterMessage,
    ]);

    if (!editor) {
        return <InputSectionSkeleton />;
    }

    return (
        <div
            className={chatInputBackgroundContainer}
            translate="no"
        >
            <div
                className={`${innerContainer} notranslate`}
            >
                <ScrollToBottomButton />

                {memoizedStarters}

                <div
                    className="relative mt-2 flex w-full shrink-0 overflow-hidden rounded-xl"
                    style={{
                        paddingBottom:
                            'env(safe-area-inset-bottom, 0px)',
                        marginBottom:
                            'env(safe-area-inset-bottom, 0px)',
                    }}
                >
                    <Flex
                        direction="col"
                        className="w-full rounded-lg border border-zinc-500/15 bg-zinc-700 shadow-sm"
                    >
                        <Flex className="relative flex w-full flex-row items-end gap-2 pl-2">
                            <div className="flex-1 overflow-hidden pb-7">
                                <InputSectionEditor
                                    sendMessage={(input) =>
                                        handleSendMessage(
                                            editor,
                                            input,
                                        )
                                    }
                                    editor={editor}
                                />
                            </div>
                            <div className="w-[100px] flex-none">
                                <InputSectionActions
                                    sendMessage={(input) =>
                                        handleSendMessage(
                                            editor,
                                            input,
                                        )
                                    }
                                    editor={editor}
                                />
                            </div>
                            <div className="pointer-events-none absolute bottom-2 left-2">
                                <Type
                                    size="xs"
                                    textColor={
                                        characterCount >
                                        chatConstants.editorCharacterLimit
                                            ? 'destructive'
                                            : 'tertiary'
                                    }
                                    className="select-none"
                                >
                                    {characterCount}/
                                    {
                                        chatConstants.editorCharacterLimit
                                    }
                                </Type>
                            </div>
                        </Flex>
                    </Flex>
                </div>

                {<InputSectionFooter />}
            </div>
        </div>
    );
};
