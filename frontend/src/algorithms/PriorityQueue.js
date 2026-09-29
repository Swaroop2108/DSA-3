/**
 * Max-Priority Queue implementation for Patient Scheduling
 * Urgency rank: EMERGENCY (1) > HIGH (2) > MEDIUM (3) > NORMAL (4)
 * Smaller numerical priority integer means HIGHER urgency.
 * In case of priority ties, older admission time gets served first (FIFO).
 */
export class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  // Helper getters
  getParentIndex(i) { return Math.floor((i - 1) / 2); }
  getLeftChildIndex(i) { return 2 * i + 1; }
  getRightChildIndex(i) { return 2 * i + 2; }

  // Compare two elements. Returns true if element A has HIGHER priority than element B.
  isHigherPriority(a, b) {
    if (a.priority !== b.priority) {
      return a.priority < b.priority; // e.g. 1 (EMERGENCY) < 4 (NORMAL) -> true
    }
    // Priority tie: compare admissionDate (earlier date wins)
    const timeA = new Date(a.admissionDate || a.createdAt || Date.now()).getTime();
    const timeB = new Date(b.admissionDate || b.createdAt || Date.now()).getTime();
    return timeA < timeB;
  }

  swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  push(patient) {
    this.heap.push(patient);
    this.heapifyUp();
  }

  heapifyUp() {
    let index = this.heap.length - 1;
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (this.isHigherPriority(this.heap[index], this.heap[parentIndex])) {
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
      let highestIndex = index;
      const leftChild = this.getLeftChildIndex(index);
      const rightChild = this.getRightChildIndex(index);

      if (leftChild < this.heap.length && this.isHigherPriority(this.heap[leftChild], this.heap[highestIndex])) {
        highestIndex = leftChild;
      }

      if (rightChild < this.heap.length && this.isHigherPriority(this.heap[rightChild], this.heap[highestIndex])) {
        highestIndex = rightChild;
      }

      if (highestIndex !== index) {
        this.swap(index, highestIndex);
        index = highestIndex;
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

  toArray() {
    // Return sorted snapshot without mutating heap
    const tempQueue = new PriorityQueue();
    tempQueue.heap = [...this.heap];
    const sorted = [];
    while (!tempQueue.isEmpty()) {
      sorted.push(tempQueue.poll());
    }
    return sorted;
  }
}

export default PriorityQueue;
