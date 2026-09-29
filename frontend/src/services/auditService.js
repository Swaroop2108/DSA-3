import * as storage from './storage';

export const auditService = {
  getAll: async () => ({ data: { success: true, count: storage.getAuditLogs().length, logs: storage.getAuditLogs() } }),
  addLog: async (log) => ({ data: { success: true, log: storage.addAuditLog(log) } }),
  resetDemoData: async () => {
    storage.resetStorage();
    return { data: { success: true, message: 'Local demo dataset has been reset.' } };
  }
};

export default auditService;
