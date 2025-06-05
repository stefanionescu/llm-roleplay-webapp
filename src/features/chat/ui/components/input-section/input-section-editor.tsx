'use client';

import { memo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Editor, EditorContent } from '@tiptap/react';

import { cn } from '@/lib/utils/shad';
import { Flex } from '@/components/ui/flex';
import { useStore } from '@/lib/zustand/store';
import { chatConstants, uiConstants } from '@/config';

type InputSectionEditorProps = {
    disabled?: boolean;
    editor: Editor | null;
    sendMessage: (input: string) => void;
};

export const InputSectionEditor = memo(
    ({
        sendMessage,
        editor,
        disabled,
    }: InputSectionEditorProps) => {
        const {
            isGenerating,
            isDoingRAG,
            isPreparingToGenerate,
        } = useStore(
            useShallow((state) => ({
                isGenerating: state.isGenerating,
                isDoingRAG: state.isDoingRAG,
                isPreparingToGenerate:
                    state.isPreparingToGenerate,
            })),
        );

        const isDisabled =
            disabled ||
            isGenerating ||
            isDoingRAG ||
            isPreparingToGenerate;

        /* eslint-disable react-hooks/exhaustive-deps, unused-imports/no-unused-vars */
        useEffect(() => {
            if (editor) {
                editor.setEditable(!isDisabled);
            }
        }, [editor, isDisabled]);
        /* eslint-enable react-hooks/exhaustive-deps, unused-imports/no-unused-vars */

        const editorContainerClass = cn(
            'no-scrollbar wysiwyg max-h-[120px] min-h-[92px] w-full overflow-y-auto outline-none focus:outline-none',
            '[&>*]:leading-5 [&>*]:outline-none',
            '[&_.ProseMirror]:flex [&_.ProseMirror]:h-[48px] [&_.ProseMirror]:items-start',
            '[&_.ProseMirror]:py-[14px] [&_.ProseMirror]:pr-2',
            '[&_.ProseMirror_p:first-child:last-child]:my-auto',
            '[&_.ProseMirror_p]:overflow-wrap-break-word [&_.ProseMirror_p]:whitespace-pre-wrap',
            '[&_.ProseMirror_p]:hyphens-auto [&_.ProseMirror_p]:break-words',
            '[&_.ProseMirror]:transition-all [&_.ProseMirror]:duration-200',
            isDisabled
                ? 'cursor-not-allowed opacity-70'
                : 'cursor-text',
        );

        const handleKeyDown = (
            e: React.KeyboardEvent<HTMLDivElement>,
        ) => {
            if (isDisabled) return;

            if (e.key === 'Enter') {
                const isMobile =
                    /iPhone|iPad|iPod|Android/i.test(
                        navigator.userAgent,
                    ) ||
                    window.innerWidth <=
                        uiConstants.breakpoints.phone;

                if (isMobile) {
                    return;
                }

                if (e.shiftKey) {
                    return;
                }

                const messageText = editor
                    ?.getText()
                    .trim();
                const characterCountStorage = editor
                    ?.storage.characterCount as
                    | { characters(): number }
                    | undefined;
                const characterCount =
                    characterCountStorage?.characters() ??
                    0;

                if (
                    messageText &&
                    characterCount <=
                        chatConstants.editorCharacterLimit
                ) {
                    e.preventDefault();
                    e.stopPropagation();
                    sendMessage(messageText);
                }
            }
        };

        return (
            <Flex className="flex-1 items-start">
                <EditorContent
                    editor={editor}
                    disabled={isDisabled}
                    onKeyDown={handleKeyDown}
                    className={editorContainerClass}
                />
            </Flex>
        );
    },
);

InputSectionEditor.displayName = 'InputSectionEditor';
