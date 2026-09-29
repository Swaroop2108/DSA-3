import * as storage from './storage';

export const orService = {
  getAll: async () => ({ data: { success: true, count: storage.getOperatingRooms().length, operatingRooms: storage.getOperatingRooms() } }),
  updateStatus: async (orId, status) => ({ data: { success: true, room: storage.updateORStatus(orId, status) } })
};

export default orService;
