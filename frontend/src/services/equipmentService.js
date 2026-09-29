import API from './api';

export const equipmentService = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.category && params.category !== 'ALL') query.append('category', params.category);
    if (params.location && params.location !== 'ALL') query.append('location', params.location);

    const queryString = query.toString();
    const res = await API.get(`/equipment${queryString ? `?${queryString}` : ''}`);
    return res;
  },

  create: async (data) => {
    const res = await API.post('/equipment', data);
    return res;
  },

  update: async (id, data) => {
    const res = await API.put(`/equipment/${id}`, data);
    return res;
  },

  delete: async (id) => {
    const res = await API.delete(`/equipment/${id}`);
    return res;
  }
};

export default equipmentService;
