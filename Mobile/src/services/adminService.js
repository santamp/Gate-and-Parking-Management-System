import api from './api';

const adminService = {
  // Stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Users
  getUsers: async (params) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  resetPassword: async (id, newPassword) => {
    const response = await api.put(`/admin/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  // Logs
  getVehicleLogs: async (params) => {
    const response = await api.get('/admin/logs/vehicles', { params });
    return response.data;
  },
  
  // Overrides
  overrideLogStatus: async (id, data) => {
    const response = await api.put(`/admin/logs/vehicles/${id}/override`, data);
    return response.data;
  },

  // Hierarchy / Mapping
  getHierarchy: async () => {
    const response = await api.get('/admin/warehouse/hierarchy');
    return response.data;
  },

  createStructure: async (data) => {
    const response = await api.post('/admin/warehouse/structure', data);
    return response.data;
  },

  // Billing
  getBilling: async (params) => {
    const response = await api.get('/admin/billing', { params });
    return response.data;
  },

  updateBillingStatus: async (id, status) => {
    const response = await api.put(`/admin/billing/${id}/status`, { paymentStatus: status });
    return response.data;
  },

  getParkingSettings: async () => {
    const response = await api.get('/admin/billing/settings');
    return response.data;
  },

  updateParkingSettings: async (rates) => {
    const response = await api.put('/admin/billing/settings', { rates });
    return response.data;
  }
};

export default adminService;
