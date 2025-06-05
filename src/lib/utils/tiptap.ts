import { Extension } from '@tiptap/react';
import { Plugin } from 'prosemirror-state';

export const ShiftEnterToLineBreak = Extension.create({
    name: 'shiftEnterToLineBreak',
    addKeyboardShortcuts() {
        return {
            'Shift-Enter': (_) => {
                return _.editor.commands.enter();
            },
        };
    },
});

export const SmartEnterHandler = Extension.create({
    name: 'smartEnterHandler',
    addProseMirrorPlugins() {
        return [
            new Plugin({
                props: {
                    handleKeyDown: (view, event) => {
                        if (
                            event.key === 'Enter' &&
                            !event.shiftKey
                        ) {
                            // Check if we're on a mobile device
                            const isMobile =
                                /iPhone|iPad|iPod|Android/i.test(
                                    navigator.userAgent,
                                ) ||
                                window.innerWidth <= 768;

                            if (isMobile) {
                                // On mobile, prevent event propagation and insert a hard break node
                                event.preventDefault();
                                event.stopPropagation();
                                const { state } = view;
                                const tr = state.tr;
                                tr.replaceSelectionWith(
                                    state.schema.nodes.hardBreak.create(),
                                ).scrollIntoView();
                                view.dispatch(tr);
                                return true;
                            }
                        }
                        return false;
                    },
                },
            }),
        ];
    },
});

export const PasteHandler = Extension.create({
    name: 'pasteHandler',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                props: {
                    handlePaste: (view, event) => {
                        const text =
                            event.clipboardData?.getData(
                                'text/plain',
                            );
                        if (!text) return false;

                        event.preventDefault();
                        const lines = text.split('\n');
                        const tr = view.state.tr;
                        const { from } = tr.selection;

                        lines.forEach((line, i) => {
                            if (i > 0) {
                                tr.insert(
                                    from +
                                        tr.doc.textContent
                                            .length,
                                    view.state.schema.nodes.hardBreak.create(),
                                );
                            }
                            tr.insertText(line || ' ');
                        });

                        view.dispatch(tr);
                        return true;
                    },
                },
            }),
        ];
    },
});
