// In-Memory Database Fallback for smooth out-of-the-box local execution
class MemoryStore {
  constructor() {
    this.users = [];
    this.patients = [];
    this.beds = [];
    this.ors = [];
    this.staff = [];
    this.surgeries = [];
    this.auditLogs = [];
    this.notifications = [];
    this.isUsingMemory = false;
  }

  generateId(prefix = 'id') {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
  }

  reset() {
    this.users = [];
    this.patients = [];
    this.beds = [];
    this.ors = [];
    this.staff = [];
    this.surgeries = [];
    this.auditLogs = [];
    this.notifications = [];
  }
}

const memoryStore = new MemoryStore();
module.exports = memoryStore;
