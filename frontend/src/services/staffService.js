import * as storage from './storage';

export const staffService = {
  getAll: async () => ({ data: { success: true, count: storage.getStaff().length, staff: storage.getStaff() } }),
  create: async (data) => ({ data: { success: true, staff: storage.addStaff(data) } }),
  update: async (id, data) => ({ data: { success: true, staff: storage.updateStaff(id, data) } })
};

export default staffService;
