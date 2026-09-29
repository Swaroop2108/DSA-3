import * as storage from './storage';

export const surgeryService = {
  getAll: async () => ({ data: { success: true, count: storage.getSurgeries().length, surgeries: storage.getSurgeries() } }),
  create: async (data) => ({ data: { success: true, surgery: storage.addSurgery(data) } }),
  update: async (id, data) => ({ data: { success: true, surgery: storage.updateSurgery(id, data) } }),
  delete: async (id) => ({ data: { success: true, deleted: storage.deleteSurgery(id) } })
};

export default surgeryService;
