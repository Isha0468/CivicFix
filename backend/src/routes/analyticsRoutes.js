const express = require('express');
const router = express.Router();
const {
  getSystemStats,
  getCategoryAnalytics,
  getMonthlyAnalytics,
  getOfficerPerformance,
  exportCSVReport
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('Administrator'), getSystemStats);
router.get('/category', protect, authorize('Administrator'), getCategoryAnalytics);
router.get('/monthly', protect, authorize('Administrator'), getMonthlyAnalytics);
router.get('/officers', protect, authorize('Administrator'), getOfficerPerformance);
router.get('/export-csv', protect, authorize('Administrator'), exportCSVReport);

module.exports = router;
