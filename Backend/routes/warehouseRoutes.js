const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createStructure,
  getStructure,
  deleteStructure,
  mapOccupierToUnit,
  getMappings,
  searchUnits
} = require('../controllers/warehouseController');

// All routes here are protected and restricted to Admin
router.use(protect);
router.use(authorize('ADMIN'));

router.route('/structure')
  .get(getStructure)
  .post(createStructure);

router.delete('/structure/:id', deleteStructure);

router.get('/search', searchUnits);

router.route('/mapping')
  .get(getMappings)
  .post(mapOccupierToUnit);

module.exports = router;
