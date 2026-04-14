const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBills,
  createBill,
  markAsPaid,
  getParkingSettings
} = require('../controllers/billingController');

// All billing routes are protected
router.use(protect);

router.get('/settings', authorize('ADMIN', 'GUARD'), getParkingSettings);

router.route('/')
  .get(authorize('ADMIN'), getBills) // Only Admin can see all bills
  .post(authorize('ADMIN', 'GUARD'), createBill); // Guard or Admin can create bills

router.put('/:id/pay', authorize('ADMIN', 'GUARD'), markAsPaid);

module.exports = router;
