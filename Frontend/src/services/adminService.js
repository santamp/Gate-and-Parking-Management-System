import api from './api';

const adminService = {
  // Stats & Analytics
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // User Management
  getUsers: async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
  },
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  resetPassword: async (id, newPassword) => {
    const response = await api.put(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  // Log Monitoring
  getVehicleLogs: async (params) => {
    const response = await api.get('/admin/logs/vehicles', { params });
    return response.data;
  },
  getAuditLogs: async (params) => {
    const response = await api.get('/admin/logs/audit', { params });
    return response.data;
  },
  getAuditLogStats: async (params) => {
    const response = await api.get('/admin/logs/audit/stats', { params });
    return response.data;
  },
  overrideLogStatus: async (id, data) => {
    const response = await api.put(`/admin/logs/vehicles/${id}/override`, data);
    return response.data;
  },

  // Billing and Parking Rates
  getBilling: async (params) => {
    const response = await api.get('/admin/billing', { params });
    return response.data;
  },
  updateBillingStatus: async (id, data) => {
    // data can be just a status string or an object with paymentMethod, transactionId etc.
    const payload = typeof data === 'string' ? { paymentStatus: data } : data;
    const response = await api.put(`/admin/billing/${id}/status`, payload);
    return response.data;
  },
  getParkingSettings: async () => {
    const response = await api.get('/admin/billing/settings');
    return response.data;
  },
  updateParkingSettings: async (rates) => {
    const response = await api.put('/admin/billing/settings', { rates });
    return response.data;
  },

  getParkingGlobalConfig: async () => {
    const response = await api.get('/admin/billing/global-config');
    return response.data;
  },

  updateParkingGlobalConfig: async (config) => {
    const response = await api.put('/admin/billing/global-config', config);
    return response.data;
  },

  // Warehouse Structure
  getHierarchy: async () => {
    const response = await api.get('/admin/warehouse/hierarchy');
    return response.data;
  },
  createStructure: async (data) => {
    const response = await api.post('/admin/warehouse/structure', data);
    return response.data;
  },
  getStructure: async (params) => {
    const response = await api.get('/warehouse/structure', { params });
    return response.data;
  },
  searchUnits: async (q) => {
    const response = await api.get('/warehouse/search', { params: { q } });
    return response.data;
  },
  getMappings: async (params) => {
    const response = await api.get('/warehouse/mapping', { params });
    return response.data;
  },
  mapOccupierToUnit: async (data) => {
    const response = await api.post('/warehouse/mapping', data);
    return response.data;
  },
  provisionProject: async (data) => {
    const response = await api.post('/admin/warehouse/provision-project', data);
    return response.data;
  },
  deleteStructure: async (id) => {
    const response = await api.delete(`/admin/warehouse/structure/${id}`);
    return response.data;
  }
};

export default adminService;
