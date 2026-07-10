const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  getPersonalComplaints,
  editComplaint,
  deleteComplaint,
  verifyComplaint,
  rejectComplaint,
  closeComplaint,
  assignOfficer,
  updateComplaintStatus,
  toggleUpvote,
  addComment,
  deleteComment
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const { complaintValidation, commentValidation } = require('../middleware/validate');
const { uploadComplaintImages } = require('../config/cloudinary');

// Public feeds and listings (listings public, single details protected to check officer authorization)
router.get('/', getComplaints);
router.get('/:id', protect, getComplaintById);

// Citizen personal reporting history
router.get('/my/reports', protect, authorize('Citizen'), getPersonalComplaints);

// Citizen actions: report and edit
router.post(
  '/', 
  protect, 
  authorize('Citizen'), 
  uploadComplaintImages.array('images', 5), 
  complaintValidation, 
  createComplaint
);

router.put(
  '/:id', 
  protect, 
  authorize('Citizen'), 
  uploadComplaintImages.array('images', 5), 
  editComplaint
);

// Delete complaints (Citizen before verification, Admin anytime)
router.delete('/:id', protect, deleteComplaint);

// Administrative workflows
router.put('/:id/verify', protect, authorize('Administrator'), verifyComplaint);
router.put('/:id/reject', protect, authorize('Administrator'), rejectComplaint);
router.put('/:id/close', protect, authorize('Administrator'), closeComplaint);
router.put('/:id/assign', protect, authorize('Administrator'), assignOfficer);

// Officer workflows: updates status & uploads resolution photo
router.put(
  '/:id/status', 
  protect, 
  authorize('Municipal Officer'), 
  uploadComplaintImages.array('images', 5), 
  updateComplaintStatus
);

// Interaction endpoints: Upvoting and Commenting
router.post('/:id/upvote', protect, authorize('Citizen'), toggleUpvote);
router.post('/:id/comments', protect, commentValidation, addComment);
router.delete('/comments/:id', protect, deleteComment);

module.exports = router;
