import api from './api';

/**
 * Service for Gate and Vehicle Management
 */
const gateService = {
  /**
   * Fetch vehicle logs with backend search, filter, and pagination
   * @param {Object} params - { status, vehicleNumber, page, limit }
   */
  getVehicleLogs: async (params = {}) => {
    try {
      // Remove empty strings so they don't pollute query
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      const response = await api.get('/gate/logs', { params: cleanParams });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Fetch all occupiers for mapping
   */
  getOccupiers: async () => {
    try {
      const response = await api.get('/gate/occupiers');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Fetch flat list of UNIT structures for filter dropdown
   */
  getUnits: async () => {
    try {
      const response = await api.get('/gate/units');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Register a new vehicle entry
   * @param {Object|FormData} entryData - Data for the vehicle entry. Use FormData if including a photo.
   */
  registerVehicleEntry: async (entryData) => {
    try {
      const config = entryData instanceof FormData 
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};
      
      const response = await api.post('/gate/entry', entryData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update vehicle status (Approve/Reject/Inside)
   * @param {string} logId - The ID of the vehicle log
   * @param {Object} statusData - { status, overrideReason }
   */
  updateVehicleStatus: async (logId, statusData) => {
    try {
      const response = await api.patch(`/gate/approval/${logId}`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Register vehicle exit
   * @param {string} logId - The ID of the vehicle log
   */
  registerVehicleExit: async (logId) => {
    try {
      const response = await api.post(`/gate/exit/${logId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get exit calculation for a vehicle
   * @param {string} logId 
   */
  getExitCalculation: async (logId) => {
    try {
      const response = await api.get(`/gate/exit-calculation/${logId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Process payment for exit
   * @param {Object} paymentData 
   */
  processPayment: async (paymentData) => {
    try {
      const response = await api.post('/gate/payment', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  /**
   * Fetch all parking vehicle settings
   */
  getVehicleSettings: async () => {
    try {
      const response = await api.get('/billing/settings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default gateService;
