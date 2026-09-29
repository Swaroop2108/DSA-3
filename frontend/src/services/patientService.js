import * as storage from './storage';

export const patientService = {
  getAll: async () => ({ data: { success: true, count: storage.getPatients().length, patients: storage.getPatients() } }),
  getById: async (id) => {
    const p = storage.getPatients().find(patient => patient.patientId === id);
    return { data: { success: true, patient: p } };
  },
  create: async (data) => ({ data: { success: true, patient: storage.addPatient(data) } }),
  update: async (id, data) => ({ data: { success: true, patient: storage.updatePatient(id, data) } }),
  delete: async (id) => ({ data: { success: true, deleted: storage.deletePatient(id) } })
};

export default patientService;
