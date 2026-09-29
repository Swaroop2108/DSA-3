/**
 * Min-Heap Data Structure for identifying earliest available time slots.
 * Heap items are objects with key `{ availableTime: Date/timestamp, resourceId: string, item: object }`
 */
export class MinHeap {
  constructor() {
    this.heap = [];
  }

  getParentIndex(i) { return Math.floor((i - 1) / 2); }
  getLeftChildIndex(i) { return 2 * i + 1; }
  getRightChildIndex(i) { return 2 * i + 2; }

  swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  push(item) {
    // item format: { availableTime: Date | number, ... }
    this.heap.push(item);
    this.heapifyUp();
  }

  heapifyUp() {
    let index = this.heap.length - 1;
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      const currentTime = new Date(this.heap[index].availableTime).getTime();
      const parentTime = new Date(this.heap[parentIndex].availableTime).getTime();

      if (currentTime < parentTime) {
        this.swap(index, parentIndex);
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  poll() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const root = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown();
    return root;
  }

  heapifyDown() {
    let index = 0;
    while (this.getLeftChildIndex(index) < this.heap.length) {
      let smallestIndex = index;
      const leftChild = this.getLeftChildIndex(index);
      const rightChild = this.getRightChildIndex(index);

      const getTime = (idx) => new Date(this.heap[idx].availableTime).getTime();

      if (leftChild < this.heap.length && getTime(leftChild) < getTime(smallestIndex)) {
        smallestIndex = leftChild;
      }

      if (rightChild < this.heap.length && getTime(rightChild) < getTime(smallestIndex)) {
        smallestIndex = rightChild;
      }

      if (smallestIndex !== index) {
        this.swap(index, smallestIndex);
        index = smallestIndex;
      } else {
        break;
      }
    }
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }
}

export default MinHeap;
