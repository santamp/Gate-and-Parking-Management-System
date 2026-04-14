const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getVehicleLogs,
  getAuditLogs,
  getAuditStats,
  overrideApproval
} = require('../controllers/adminLogController');
const { getDashboardStats } = require('../controllers/statsController');
const {
  getUsers,
  resetPassword,
  deleteUser
} = require('../controllers/adminUserController');
const {
  getHierarchy,
  createStructure,
  provisionProject,
  deleteStructure
} = require('../controllers/adminWarehouseController');
const {
  getBilling,
  updateBillingStatus,
  getParkingSettings,
  updateParkingSettings,
  getGlobalConfig,
  updateGlobalConfig
} = require('../controllers/adminBillingController');


// All admin routes are protected and restricted to ADMIN role
router.use(protect);
// Restricted to ADMIN by default, but hierarchy is shared with GUARD
router.get('/warehouse/hierarchy', authorize('ADMIN', 'GUARD'), getHierarchy);

// All other admin routes are strictly restricted to ADMIN role
router.use(authorize('ADMIN'));

// Log Monitoring
router.get('/logs/vehicles', getVehicleLogs);
router.get('/logs/audit/stats', getAuditStats);
router.get('/logs/audit', getAuditLogs);
router.put('/logs/vehicles/:id/override', overrideApproval);

// User Management
router.get('/users', getUsers);
router.put('/users/:id/reset-password', resetPassword);
router.delete('/users/:id', deleteUser);

// Infrastructure Mapping (excluding hierarchy which we handle above)
router.post('/warehouse/structure', createStructure);
router.post('/warehouse/provision-project', provisionProject);
router.delete('/warehouse/structure/:id', deleteStructure);

// Billing & Payments
router.get('/billing', getBilling);
router.get('/billing/settings', getParkingSettings);
router.put('/billing/settings', updateParkingSettings);
router.get('/billing/global-config', getGlobalConfig);
router.put('/billing/global-config', updateGlobalConfig);
router.put('/billing/:id/status', updateBillingStatus);

// Analytics
router.get('/stats', getDashboardStats);

module.exports = router;
