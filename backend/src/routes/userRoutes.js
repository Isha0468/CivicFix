const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUserRole,
  toggleUserSuspension,
  getOfficers
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('Administrator'), getUsers);
router.get('/officers/list', protect, authorize('Administrator'), getOfficers);
router.get('/:id', protect, authorize('Administrator'), getUserById);
router.put('/:id/role', protect, authorize('Administrator'), updateUserRole);
router.put('/:id/suspend', protect, authorize('Administrator'), toggleUserSuspension);

module.exports = router;
