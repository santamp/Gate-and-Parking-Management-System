import api from './api';

/**
 * Service for Gate and Vehicle Management (Mobile)
 */
const gateService = {
  /**
   * Fetch all vehicle logs with optional filters
   * @param {Object} filters - { status, vehicleNumber }
   */
  getVehicleLogs: async (filters = {}) => {
    try {
      const response = await api.get('/gate/logs', { params: filters });
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
   * Register a new vehicle entry
   * @param {Object|FormData} entryData - Data for the vehicle entry. 
   * In React Native, if using FormData for photo, ensure appending 'vehiclePhoto' with:
   * { uri: string, name: string, type: string }
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
