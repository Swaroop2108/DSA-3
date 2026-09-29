import * as storage from './storage';

export const bedService = {
  getAll: async () => ({ data: { success: true, count: storage.getBeds().length, beds: storage.getBeds() } }),
  allocate: async (bedId, patientId, patientName) => ({ data: { success: true, bed: storage.allocateBed(bedId, patientId, patientName) } }),
  release: async (bedId) => ({ data: { success: true, bed: storage.releaseBed(bedId) } }),
  updateStatus: async (bedId, status) => ({ data: { success: true, bed: storage.updateBedStatus(bedId, status) } })
};

export default bedService;
