import { useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { Text } from '@tiptap/extension-text';
import { Document } from '@tiptap/extension-document';
import { Highlight } from '@tiptap/extension-highlight';
import { Paragraph } from '@tiptap/extension-paragraph';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CharacterCount } from '@tiptap/extension-character-count';

import { chatConstants } from '@/config';
import {
    SmartEnterHandler,
    ShiftEnterToLineBreak,
    PasteHandler,
} from '@/lib/utils/tiptap';

export const useChatEditor = () => {
    const t = useTranslations();

    const editor = useEditor({
        extensions: [
            Document,
            Paragraph,
            Text,
            Placeholder.configure({
                placeholder: t('chat.typeMessage'),
            }),
            ShiftEnterToLineBreak,
            Highlight.configure({
                HTMLAttributes: {
                    class: 'prompt-highlight',
                },
            }),
            HardBreak,
            SmartEnterHandler,
            PasteHandler,
            CharacterCount.configure({
                limit: chatConstants.editorCharacterLimit,
            }),
        ],
        editorProps: {
            attributes: {
                'aria-label': t('chat.typeMessage'),
                role: 'textbox',
            },
        },
        immediatelyRender: false,
        content: ``,
        onTransaction(props) {
            const { editor } = props;
            const html = editor.getHTML();
            const newHTML = html.replace(
                /::((?:(?!::).)+)::/g,
                (_, content) => {
                    return ` <mark class="prompt-highlight">${content}</mark> `;
                },
            );

            if (newHTML !== html) {
                editor.commands.setContent(newHTML, true, {
                    preserveWhitespace: true,
                });
            }
        },

        parseOptions: {
            preserveWhitespace: 'full',
        },
    });

    useEffect(() => {
        if (editor) {
            const extension =
                editor.extensionManager.extensions.find(
                    (ext) => ext.name === 'placeholder',
                ) as
                    | ReturnType<
                          typeof Placeholder.configure
                      >
                    | undefined;

            if (extension) {
                extension.options.placeholder = t(
                    'chat.typeMessage',
                );
            }
        }
    }, [editor, t]);

    return {
        editor,
    };
};
