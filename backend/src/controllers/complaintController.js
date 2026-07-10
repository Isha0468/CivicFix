const Complaint = require('../models/Complaint');
const Category = require('../models/Category');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { deleteFromCloudinary } = require('../config/cloudinary');
const aiService = require('../services/aiService');

// Utility to create notification
const triggerNotification = async (recipient, title, message, type, complaintId) => {
  try {
    await Notification.create({
      recipient,
      title,
      message,
      type,
      relatedComplaint: complaintId
    });
  } catch (error) {
    console.error('Failed to trigger notification:', error);
  }
};

// @desc    Report a new complaint
// @route   POST /api/complaints
// @access  Private/Citizen
const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, longitude, latitude, address, severity } = req.body;

    // Check for potential duplicate complaints in same category within 100 meters
    const duplicates = await aiService.detectDuplicates(
      parseFloat(longitude),
      parseFloat(latitude),
      category
    );

    // If duplicate check is run and we only want to flag (not block), we can return flags in response or block.
    // Let's attach duplicates to response metadata but allow submission, or warn.
    // The prompt says "Duplicate Complaint Detection" in AI features. We will return it, or save it and warn the user.
    // Let's create the complaint and flag if duplicate.
    
    // Process image attachments
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) {
          images.push(file.path);
        } else if (file.filename) {
          images.push(`/uploads/complaints/${file.filename}`);
        }
      });
    }

    // Determine estimated severity and suggested category using AI helper
    const estimatedSeverity = severity || aiService.estimateSeverity(title, description);

    const complaint = await Complaint.create({
      title,
      description,
      citizen: req.user._id,
      category,
      severity: estimatedSeverity,
      address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      images,
      status: 'Reported',
      timeline: [{
        status: 'Reported',
        notes: 'Complaint reported by citizen via dashboard.',
        timestamp: new Date()
      }]
    });

    // Notify all administrators of new complaint
    const admins = await User.find({ role: 'Administrator' });
    for (const admin of admins) {
      await triggerNotification(
        admin._id,
        'New Complaint Filed',
        `A new complaint "${title}" has been filed under category.`,
        'New Complaint',
        complaint._id
      );
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint,
      aiFeedback: {
        estimatedSeverity,
        duplicatesFound: duplicates.length,
        duplicates: duplicates.map(d => ({ id: d._id, title: d.title, address: d.address }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints (with filters, search, sorting and pagination)
// @route   GET /api/complaints
// @access  Public
const getComplaints = async (req, res, next) => {
  try {
    const { category, status, severity, search, dateFrom, dateTo, page, limit, sort, lat, lng, radius } = req.query;

    const query = {};

    // Filter by category slug or ID
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) query.category = cat._id;
      }
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by severity
    if (severity) {
      query.severity = severity;
    }

    // Search query keyword filter (matches title and description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Geospatial radius check
    if (lat && lng && radius) {
      const floatLng = parseFloat(lng);
      const floatLat = parseFloat(lat);

      if (isNaN(floatLng) || floatLng < -180 || floatLng > 180 || isNaN(floatLat) || floatLat < -90 || floatLat > 90) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinate parameters. Longitude must be between -180 and 180, latitude must be between -90 and 90.'
        });
      }

      query.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [floatLng, floatLat]
          },
          $maxDistance: parseInt(radius) // Distance in meters
        }
      };
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let sortBy = { createdAt: -1 };
    if (sort) {
      if (sort === 'oldest') sortBy = { createdAt: 1 };
      else if (sort === 'upvotes') sortBy = { upvotes: -1 };
      else if (sort === 'title') sortBy = { title: 1 };
    }

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('citizen', 'name email avatar')
      .populate('category', 'name slug')
      .populate('assignedOfficer', 'name email phone sector')
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: complaints.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      complaints
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint details
// @route   GET /api/complaints/:id
// @access  Public
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'name email avatar phone')
      .populate('category', 'name slug description')
      .populate('assignedOfficer', 'name email phone avatar sector')
      .populate({
        path: 'timeline.officer',
        select: 'name email role avatar sector'
      });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Role-based access constraint:
    // Only Officers assigned to that complaint should be able to access its details and perform actions.
    if (req.user && req.user.role === 'Municipal Officer') {
      const assignedOfficerId = complaint.assignedOfficer?._id?.toString() || complaint.assignedOfficer?.toString();
      if (assignedOfficerId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'You are not the assigned officer for this complaint.' });
      }
    }

    // Fetch comments
    const comments = await Comment.find({ complaint: complaint._id })
      .populate('user', 'name email avatar role')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      complaint,
      comments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's complaints
// @route   GET /api/complaints/my/reports
// @access  Private/Citizen
const getPersonalComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ citizen: req.user._id })
      .populate('category', 'name slug')
      .populate('assignedOfficer', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit complaint (Only before verification)
// @route   PUT /api/complaints/:id
// @access  Private/Citizen
const editComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Verify ownership
    if (complaint.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this complaint' });
    }

    // Check status
    if (complaint.status !== 'Reported') {
      return res.status(400).json({ success: false, message: 'Complaint cannot be edited after it is verified or progressed' });
    }

    const { title, description, category, longitude, latitude, address, severity } = req.body;

    complaint.title = title || complaint.title;
    complaint.description = description || complaint.description;
    complaint.category = category || complaint.category;
    complaint.address = address || complaint.address;
    complaint.severity = severity || complaint.severity;

    if (longitude && latitude) {
      complaint.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    // Handle photo edits/deletions if any
    if (req.files && req.files.length > 0) {
      // If uploading new photos, we append or replace. Let's append
      req.files.forEach(file => {
        if (file.path) {
          complaint.images.push(file.path);
        } else if (file.filename) {
          complaint.images.push(`/uploads/complaints/${file.filename}`);
        }
      });
    }

    const updatedComplaint = await complaint.save();

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      complaint: updatedComplaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private
const deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Verification check: Citizens can delete only if status is 'Reported'. Admin can delete anytime.
    const isAdmin = req.user.role === 'Administrator';
    const isOwner = complaint.citizen.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this complaint' });
    }

    if (!isAdmin && complaint.status !== 'Reported') {
      return res.status(400).json({ success: false, message: 'Complaint cannot be deleted after it has been verified' });
    }

    // Delete associated images
    for (const imgUrl of complaint.images) {
      await deleteFromCloudinary(imgUrl);
    }

    // Delete associated comments
    await Comment.deleteMany({ complaint: complaint._id });

    // Delete complaint document
    await complaint.deleteOne();

    res.json({ success: true, message: 'Complaint and all associated comments deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify a reported complaint
// @route   PUT /api/complaints/:id/verify
// @access  Private/Admin
const verifyComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.status !== 'Reported') {
      return res.status(400).json({ success: false, message: 'Complaint is already verified or progressed.' });
    }

    complaint.status = 'Verified';
    complaint.timeline.push({
      status: 'Verified',
      officer: req.user._id,
      notes: req.body.notes || 'Complaint verified by administrative review.',
      timestamp: new Date()
    });

    await complaint.save();

    // Notify citizen
    await triggerNotification(
      complaint.citizen,
      'Complaint Verified',
      `Your complaint "${complaint.title}" has been verified by the administrator.`,
      'Complaint Verified',
      complaint._id
    );

    res.json({ success: true, message: 'Complaint verified successfully', complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a complaint
// @route   PUT /api/complaints/:id/reject
// @access  Private/Admin
const rejectComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (!['Reported', 'Verified'].includes(complaint.status)) {
      return res.status(400).json({ success: false, message: 'Only reported or verified complaints can be rejected.' });
    }

    complaint.status = 'Rejected';
    complaint.timeline.push({
      status: 'Rejected',
      officer: req.user._id,
      notes: req.body.notes || 'Complaint rejected by administrative review.',
      timestamp: new Date()
    });

    await complaint.save();

    await triggerNotification(
      complaint.citizen,
      'Complaint Rejected',
      `Your complaint "${complaint.title}" has been rejected.`,
      'Complaint Rejected',
      complaint._id
    );

    res.json({ success: true, message: 'Complaint rejected successfully', complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Close a resolved complaint
// @route   PUT /api/complaints/:id/close
// @access  Private/Admin
const closeComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.status !== 'Resolved') {
      return res.status(400).json({ success: false, message: 'Only resolved complaints can be closed.' });
    }

    complaint.status = 'Closed';
    complaint.timeline.push({
      status: 'Closed',
      officer: req.user._id,
      notes: req.body.notes || 'Complaint closed after verification of resolution.',
      timestamp: new Date()
    });

    await complaint.save();

    await triggerNotification(
      complaint.citizen,
      'Complaint Closed',
      `Your complaint "${complaint.title}" has been verified and closed by the administrator.`,
      'Complaint Closed',
      complaint._id
    );

    res.json({ success: true, message: 'Complaint closed successfully', complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign complaint to an officer
// @route   PUT /api/complaints/:id/assign
// @access  Private/Admin
const assignOfficer = async (req, res, next) => {
  try {
    const { officerId, notes } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const officer = await User.findById(officerId);
    if (!officer || officer.role !== 'Municipal Officer') {
      return res.status(400).json({ success: false, message: 'Invalid officer selected for assignment' });
    }

    complaint.assignedOfficer = officerId;
    complaint.status = 'Assigned';
    complaint.timeline.push({
      status: 'Assigned',
      officer: req.user._id,
      notes: notes || `Assigned to Municipal Officer ${officer.name}.`,
      timestamp: new Date()
    });

    await complaint.save();

    // Notify officer
    await triggerNotification(
      officerId,
      'New Complaint Assigned',
      `You have been assigned to resolve: "${complaint.title}"`,
      'New Assignment',
      complaint._id
    );

    // Notify citizen
    await triggerNotification(
      complaint.citizen,
      'Officer Assigned',
      `Municipal Officer ${officer.name} has been assigned to your complaint.`,
      'Officer Assigned',
      complaint._id
    );

    res.json({ success: true, message: 'Officer assigned successfully', complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status (For Officers)
// @route   PUT /api/complaints/:id/status
// @access  Private/Officer
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Verify assignment
    if (complaint.assignedOfficer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this complaint' });
    }

    const validTransitions = {
      'Assigned': ['Accepted', 'Rejected'],
      'Accepted': ['In Progress'],
      'In Progress': ['Resolved'],
      'Resolved': ['Closed'],
      'Rejected': [],
      'Closed': []
    };

    const currentStatus = complaint.status;
    const allowedNext = validTransitions[currentStatus] || [];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status transition from ${currentStatus} to ${status}. Allowed transitions: ${allowedNext.join(', ')}` 
      });
    }

    // Handle uploaded progress/resolution photos
    const uploadImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) {
          uploadImages.push(file.path);
        } else if (file.filename) {
          uploadImages.push(`/uploads/complaints/${file.filename}`);
        }
      });
    }

    // Update complaint status and append timeline
    complaint.status = status;
    complaint.timeline.push({
      status,
      officer: req.user._id,
      notes: notes || `Complaint status updated to ${status}.`,
      images: uploadImages,
      timestamp: new Date()
    });

    await complaint.save();

    // Trigger Notification to Citizen
    let notifTitle = 'Complaint Update';
    let notifMsg = `Your complaint "${complaint.title}" has been updated to: ${status}`;
    
    if (status === 'Resolved') {
      notifTitle = 'Complaint Resolved';
      notifMsg = `Great news! Your complaint "${complaint.title}" has been marked as Resolved. Please check details.`;
    } else if (status === 'Rejected') {
      notifTitle = 'Complaint Rejected';
      notifMsg = `Your complaint "${complaint.title}" was marked as Rejected. Reason: ${notes}`;
    }

    await triggerNotification(
      complaint.citizen,
      notifTitle,
      notifMsg,
      'Status Updated',
      complaint._id
    );

    // Trigger Notification to Admin on Officer action
    const admins = await User.find({ role: 'Administrator' });
    for (const admin of admins) {
      await triggerNotification(
        admin._id,
        'Officer Status Update',
        `Officer ${req.user.name} changed status of "${complaint.title}" to ${status}.`,
        'Officer Action',
        complaint._id
      );
    }

    res.json({ success: true, message: `Status updated to ${status} successfully`, complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Upvote / Remove Upvote
// @route   POST /api/complaints/:id/upvote
// @access  Private/Citizen
const toggleUpvote = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const userId = req.user._id;
    const hasUpvoted = complaint.upvotes.some(id => id.toString() === userId.toString());

    if (hasUpvoted) {
      // Remove upvote
      complaint.upvotes = complaint.upvotes.filter(id => id.toString() !== userId.toString());
    } else {
      // Add upvote
      complaint.upvotes.push(userId);
    }

    await complaint.save();

    res.json({
      success: true,
      upvoted: !hasUpvoted,
      upvoteCount: complaint.upvotes.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to complaint
// @route   POST /api/complaints/:id/comments
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const complaintId = req.params.id;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const comment = await Comment.create({
      complaint: complaintId,
      user: req.user._id,
      text
    });

    const populatedComment = await Comment.findById(comment._id).populate('user', 'name email avatar role');

    // Notify citizens if comment added by Admin/Officer, or notify officer if added by citizen
    if (req.user.role === 'Citizen') {
      if (complaint.assignedOfficer) {
        await triggerNotification(
          complaint.assignedOfficer,
          'New Comment on Assignment',
          `Citizen ${req.user.name} commented on "${complaint.title}"`,
          'New Comment',
          complaint._id
        );
      }
    } else {
      // Admin/Officer commented, notify citizen
      await triggerNotification(
        complaint.citizen,
        'New Comment on Report',
        `Officer/Admin ${req.user.name} commented on your report: "${complaint.title}"`,
        'New Comment',
        complaint._id
      );
    }

    res.status(201).json({ success: true, comment: populatedComment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/complaints/comments/:id
// @access  Private
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Authorization check: Owner of comment, or Admin
    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Administrator';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
