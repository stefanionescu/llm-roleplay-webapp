import { RefObject } from 'react';
import { VListHandle } from 'virtua';

export type UseVirtualizedListProps = {
    currentMessageCount: number;
    loadMore?: () => Promise<void>;
    initialStickToBottom?: boolean;
    onScroll?: (
        offset: number,
        scrollSize: number,
        viewportSize: number,
    ) => void;
};

export type UseVirtualizedListReturn = {
    scrollToBottom: () => void;
    handleScroll: (offset: number) => void;
    virtualizerRef: React.RefObject<VListHandle>;
    isPrepend: {
        current: boolean;
    };
    shouldStickToBottom: {
        current: boolean;
    };
    scrollState: {
        current: VirtualListScrollState;
    };
};

export type VirtualListScrollState = {
    offset: number;
    scrollSize: number;
    viewportSize: number;
};

export type VirtualListInstance = {
    count: number;
    scrollToIndex: (
        index: number,
        options: {
            behavior: ScrollBehavior;
            align: 'start' | 'center' | 'end';
        },
    ) => void;
};

export type VListContainerElement = HTMLDivElement & {
    _virtualizerRef: RefObject<VListHandle>;
    _shouldStickToBottom: RefObject<boolean>;
    _scrollState: { current: VirtualListScrollState };
};

export type Virtualizer = {
    scrollToIndex: (
        index: number,
        options: { align: 'start' | 'center' | 'end' },
    ) => void;
};

export type VirtualListContainer = HTMLElement & {
    _virtualizerRef: RefObject<Virtualizer>;
    _shouldStickToBottom: RefObject<boolean>;
};

export type VirtualListElement = HTMLElement & {
    getAttribute(name: 'data-item-count'): string | null;
};

// Define the shape of the container element with its custom properties
declare global {
    interface Element {
        _vlist?: VirtualListInstance;
        _scrollState?: {
            current: VirtualListScrollState;
        };
    }
}
