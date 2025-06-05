import { Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { useShallow } from 'zustand/react/shallow';
import {
    StopCircleIcon,
    ArrowUp01Icon,
} from '@hugeicons/core-free-icons';

import { chatConstants } from '@/config';
import { Flex } from '@/components/ui/flex';
import { useStore } from '@/lib/zustand/store';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useCharacterId } from '@/hooks/data/use-character-id';
import { stopGenerationProcess } from '@/lib/utils/inference/inference';

type InputSectionActionsProps = {
    editor: Editor;
    sendMessage: (message: string) => void;
};

export const InputSectionActions = ({
    sendMessage,
    editor,
}: InputSectionActionsProps) => {
    const t = useTranslations();
    const characterId = useCharacterId() ?? '';

    const {
        isPreparingToGenerate,
        isDoingRAG,
        isCheckingRAGUsage,
        isGenerating,
        cancelAbortController,
        cleanAppState,
        getMessageCount,
        getMessage,
        getMessageId,
        updateMessage,
        addContext,
        getLatestContextRole,
        getContextCount,
        deleteLatestContext,
    } = useStore(
        useShallow((state) => ({
            isPreparingToGenerate:
                state.isPreparingToGenerate,
            isDoingRAG: state.isDoingRAG,
            isCheckingRAGUsage: state.isCheckingRAGUsage,
            isGenerating: state.isGenerating,
            cancelAbortController:
                state.cancelAbortController,
            cleanAppState: state.cleanAppState,
            getMessageCount: state.getMessageCount,
            getMessage: state.getMessage,
            getMessageId: state.getMessageId,
            updateMessage: state.updateMessage,
            addContext: state.addContext,
            getLatestContextRole:
                state.getLatestContextRole,
            getContextCount: state.getContextCount,
            deleteLatestContext: state.deleteLatestContext,
        })),
    );

    const [hasText, setHasText] = useState(false);
    const [isWithinLimit, setIsWithinLimit] =
        useState(true);

    const isDoingRAGOrInference =
        isDoingRAG || isCheckingRAGUsage || isGenerating;

    useEffect(() => {
        if (editor) {
            const checkForText = () => {
                try {
                    const text = editor.getText().trim();
                    const characterCountStorage = editor
                        .storage.characterCount as
                        | { characters(): number }
                        | undefined;
                    const characterCount =
                        characterCountStorage?.characters() ??
                        0;
                    setHasText(!!text);
                    setIsWithinLimit(
                        characterCount <=
                            chatConstants.editorCharacterLimit,
                    );
                    // eslint-disable-next-line unused-imports/no-unused-vars
                } catch (e) {}
            };

            checkForText();
            editor.on('update', checkForText);

            return () => {
                editor.off('update', checkForText);
            };
        }
    }, [editor]);

    const handleSendMessage = () => {
        if (editor) {
            const text = editor.getText().trim();
            const characterCountStorage = editor.storage
                .characterCount as
                | { characters(): number }
                | undefined;
            const characterCount =
                characterCountStorage?.characters() ?? 0;
            if (
                text &&
                characterCount <=
                    chatConstants.editorCharacterLimit
            ) {
                sendMessage(text);
            }
        }
    };

    return (
        <Flex
            className="notranslate flex h-[52px] items-center justify-end px-2"
            items="center"
            justify="end"
            translate="no"
        >
            {isPreparingToGenerate ? (
                <Button
                    size="sm"
                    variant="secondary"
                    className="relative gap-1 bg-white px-3 py-1.5 hover:bg-white hover:opacity-100"
                >
                    <div className="invisible flex items-center gap-2">
                        <HugeiconsIcon
                            size={16}
                            strokeWidth={2}
                            icon={ArrowUp01Icon}
                        />
                        <span>{t('chat.sendMessage')}</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Spinner />
                    </div>
                </Button>
            ) : isDoingRAGOrInference ? (
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                        stopGenerationProcess(
                            characterId,
                            getMessageCount,
                            getMessage,
                            getMessageId,
                            updateMessage,
                            addContext,
                            cancelAbortController,
                            cleanAppState,
                            getLatestContextRole,
                            getContextCount,
                            deleteLatestContext,
                        )
                    }
                    disabled={false}
                    className="gap-1 px-3 py-1.5"
                >
                    <HugeiconsIcon
                        size={16}
                        strokeWidth={2}
                        icon={StopCircleIcon}
                    />{' '}
                    {t('chat.stop')}
                </Button>
            ) : (
                <Button
                    size="sm"
                    variant={
                        hasText && isWithinLimit
                            ? 'default'
                            : 'secondary'
                    }
                    disabled={
                        !hasText ||
                        !isWithinLimit ||
                        isDoingRAGOrInference
                    }
                    onClick={handleSendMessage}
                    className="relative gap-1 px-3 py-1.5"
                >
                    <div className="flex items-center gap-2">
                        <HugeiconsIcon
                            size={16}
                            strokeWidth={2}
                            icon={ArrowUp01Icon}
                        />
                        <span>{t('chat.sendMessage')}</span>
                    </div>
                </Button>
            )}
        </Flex>
    );
};
