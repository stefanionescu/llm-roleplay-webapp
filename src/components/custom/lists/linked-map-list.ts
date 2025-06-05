type NodeId = string;

class Node<T> {
    constructor(
        public id: NodeId,
        public value: T,
        public prev: Node<T> | null = null,
        public next: Node<T> | null = null,
    ) {}
}

export class LinkedMapList<T> {
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
        else this.head = node.next;

        if (node.next) node.next.prev = node.prev;
        else this.tail = node.prev;

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
