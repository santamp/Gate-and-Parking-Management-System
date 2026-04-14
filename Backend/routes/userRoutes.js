const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  resetPassword
} = require('../controllers/userController');

// All routes here are protected and restricted to Admin
router.use(protect);
router.use(authorize('ADMIN'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

router.put('/:id/reset-password', resetPassword);

module.exports = router;
