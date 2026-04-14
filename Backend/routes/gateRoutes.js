const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const {
  registerVehicleEntry,
  updateVehicleStatus,
  registerVehicleExit,
  getExitCalculation,
  processPayment,
  getVehicleLogs,
  getOccupiers,
  getUnits
} = require('../controllers/gateController');

// All gate routes are protected
router.use(protect);

// Guard/Admin fetch occupiers for mapping
router.get('/occupiers', authorize('GUARD', 'ADMIN'), getOccupiers);

// Guard/Admin fetch flat unit list for filters
router.get('/units', authorize('GUARD', 'ADMIN'), getUnits);

// Guard registers vehicle entry (with optional photo)
router.post('/entry', authorize('GUARD', 'ADMIN'), upload.single('vehiclePhoto'), registerVehicleEntry);

// Occupier approves, rejects, or flags (Guard can override)
router.patch('/approval/:logId', authorize('OCCUPIER', 'GUARD', 'ADMIN'), updateVehicleStatus);

// Fetch all logs (with filters)
router.get('/logs', authorize('GUARD', 'ADMIN', 'OCCUPIER'), getVehicleLogs);

// Guard processes vehicle exit
router.get('/exit-calculation/:logId', authorize('GUARD', 'ADMIN'), getExitCalculation);
router.post('/payment', authorize('GUARD', 'ADMIN'), processPayment);
router.post('/exit/:logId', authorize('GUARD', 'ADMIN'), registerVehicleExit);

module.exports = router;
