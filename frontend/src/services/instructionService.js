import API from './api';

export const instructionService = {
  getAll: async () => {
    const res = await API.get('/instructions');
    return res;
  },
  create: async (data) => {
    const res = await API.post('/instructions', data);
    return res;
  },
  complete: async (id, completionMessage) => {
    const res = await API.put(`/instructions/${id}/complete`, { completionMessage });
    return res;
  }
};

export default instructionService;
