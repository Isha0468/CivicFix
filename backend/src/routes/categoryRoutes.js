const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Administrative operations
router.post('/', protect, authorize('Administrator'), createCategory);
router.put('/:id', protect, authorize('Administrator'), updateCategory);
router.delete('/:id', protect, authorize('Administrator'), deleteCategory);

module.exports = router;
