import { TChatSession } from '@/types/session'; // Add import for TChatSession

type NodeId = string;

class Node<T> {
    constructor(
        public id: NodeId,
        public value: T,
        public prev: Node<T> | null = null,
        public next: Node<T> | null = null,
    ) {}
}

// Helper function to get the sorting key (timestamp)
const getSortDate = (session: TChatSession): number => {
    const createdAt = session.createdAt.getTime();
    // Use 0 if latestMessageAt is null/undefined
    const latestMessageAt =
        session.latestMessageAt?.getTime() ?? 0;
    return Math.max(createdAt, latestMessageAt);
};

export class SortedSessionsList<T extends TChatSession> {
    private head: Node<T> | null = null;
    private tail: Node<T> | null = null;
    private nodes = new Map<NodeId, Node<T>>();
    private _length = 0;

    get length() {
        return this._length;
    }

    has(id: NodeId): boolean {
        return this.nodes.has(id);
    }

    get(id: NodeId): T | undefined {
        return this.nodes.get(id)?.value;
    }

    pushFront(id: NodeId, value: T): void {
        if (this.nodes.has(id)) return; // Ignore duplicates
        const node = new Node(id, value);

        if (!this.head) {
            this.head = this.tail = node;
        } else {
            node.next = this.head;
            this.head.prev = node;
            this.head = node;
        }

        this.nodes.set(id, node);
        this._length++;
    }

    pushEnd(id: NodeId, value: T): void {
        if (this.nodes.has(id)) return; // Ignore duplicates
        const node = new Node(id, value);

        if (!this.tail) {
            this.head = this.tail = node;
        } else {
            node.prev = this.tail;
            this.tail.next = node;
            this.tail = node;
        }

        this.nodes.set(id, node);
        this._length++;
    }

    pushEndMultiple(items: [NodeId, T][]): void {
        for (const [id, value] of items) {
            if (this.nodes.has(id)) continue; // Ignore duplicates
            const node = new Node(id, value);

            if (!this.tail) {
                this.head = this.tail = node;
            } else {
                node.prev = this.tail;
                this.tail.next = node;
                this.tail = node;
            }

            this.nodes.set(id, node);
            this._length++;
        }
    }

    delete(id: NodeId): void {
        const node = this.nodes.get(id);
        if (!node) return;

        if (node.prev) node.prev.next = node.next;
        else this.head = node.next; // Update head if deleting the first node

        if (node.next) node.next.prev = node.prev;
        else this.tail = node.prev; // Update tail if deleting the last node

        this.nodes.delete(id);
        this._length--;
    }

    update(id: NodeId, newValue: T): void {
        const node = this.nodes.get(id);
        if (!node) return;
        node.value = newValue;
    }

    toArray(): T[] {
        const result: T[] = [];
        let current = this.head;
        while (current) {
            result.push(current.value);
            current = current.next;
        }
        return result;
    }

    ids(): string[] {
        const result: string[] = [];
        let current = this.head;
        while (current) {
            result.push(current.id);
            current = current.next;
        }
        return result;
    }

    clear(): void {
        this.head = this.tail = null;
        this.nodes.clear();
        this._length = 0;
    }

    findInsertionPointId(
        idToInsert: NodeId,
        sessionToInsert: T,
    ): NodeId | null {
        // Check for duplicates using the provided id
        if (this.nodes.has(idToInsert)) {
            return null;
        }

        if (!this.head) {
            // List is empty, insertion point conceptually doesn't exist yet, signify add to end/head
            return null;
        }

        const newSessionSortKey =
            getSortDate(sessionToInsert);

        let current: Node<T> | null = this.head;
        while (current) {
            // Use a temporary non-null variable for accessing properties
            const currentNonNull: Node<T> = current;
            const currentSessionSortKey = getSortDate(
                currentNonNull.value,
            );
            if (newSessionSortKey > currentSessionSortKey) {
                return currentNonNull.id; // Insert before this node
            }
            // Explicitly get the next node (which can be null)
            const nextNode: Node<T> | null =
                currentNonNull.next;
            // Assign the potentially null next node back to the loop variable
            current = nextNode;
        }

        // If loop completes, the new session is the oldest, insert at the end
        return null;
    }

    *[Symbol.iterator](): Iterator<T> {
        let current = this.head;
        while (current) {
            yield current.value;
            current = current.next;
        }
    }

    pushFrontMultiple(items: [NodeId, T][]): void {
        // Iterate in reverse to maintain order when pushing to front
        for (let i = items.length - 1; i >= 0; i--) {
            const [id, value] = items[i];
            if (this.nodes.has(id)) continue; // Ignore duplicates
            const node = new Node(id, value);

            if (!this.head) {
                this.head = this.tail = node;
            } else {
                node.next = this.head;
                this.head.prev = node;
                this.head = node;
            }

            this.nodes.set(id, node);
            this._length++;
        }
    }

    getRange(startIndex: number, endIndex: number): T[] {
        const result: T[] = [];
        if (
            startIndex < 0 ||
            endIndex < startIndex ||
            !this.head
        ) {
            return result; // Return empty for invalid range or empty list
        }

        let current: Node<T> | null = this.head;
        let index = 0;
        while (current && index < endIndex) {
            if (index >= startIndex) {
                result.push(current.value);
            }
            current = current.next;
            index++;
        }
        return result;
    }

    pushBefore(
        idToInsert: NodeId,
        value: T,
        beforeId: NodeId,
    ): void {
        if (this.nodes.has(idToInsert)) {
            return;
        }
        const beforeNode = this.nodes.get(beforeId);
        if (!beforeNode) {
            return;
        }

        const newNode = new Node(idToInsert, value);
        this.nodes.set(idToInsert, newNode);
        this._length++;

        // Link the new node
        newNode.prev = beforeNode.prev;
        newNode.next = beforeNode;

        // Update surrounding links
        if (beforeNode.prev) {
            beforeNode.prev.next = newNode;
        } else {
            // beforeNode was the head, newNode is the new head
            this.head = newNode;
        }
        beforeNode.prev = newNode;
    }

    pushAfter(
        idToInsert: NodeId,
        value: T,
        afterId: NodeId,
    ): void {
        if (this.nodes.has(idToInsert)) {
            return;
        }
        const afterNode = this.nodes.get(afterId);
        if (!afterNode) {
            return;
        }

        const newNode = new Node(idToInsert, value);
        this.nodes.set(idToInsert, newNode);
        this._length++;

        // Link the new node
        newNode.prev = afterNode;

        // Update surrounding links
        const nextNode = afterNode.next;
        if (nextNode) {
            nextNode.prev = newNode;
        } else {
            // afterNode was the tail, newNode is the new tail
            this.tail = newNode;
        }
        afterNode.next = newNode;
    }

    getLast(): T | undefined {
        return this.tail?.value;
    }

    getFirst(): T | undefined {
        return this.head?.value;
    }

    removeFirst(): T | undefined {
        if (!this.head) return undefined;

        const firstValue = this.head.value;
        const firstId = this.head.id;

        // Update head to point to the next node
        this.head = this.head.next;
        if (this.head) {
            this.head.prev = null;
        } else {
            // List is now empty
            this.tail = null;
        }

        // Remove from nodes map and decrease length
        this.nodes.delete(firstId);
        this._length--;

        return firstValue;
    }
}
