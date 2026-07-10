const User = require('../models/User');

// @desc    Get all users (with search and role filter)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    if (status) {
      if (status === 'suspended') query.isSuspended = true;
      if (status === 'active') query.isSuspended = false;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user details
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const { role, sector } = req.body;
    if (!['Citizen', 'Municipal Officer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role requested. Administrators cannot be created via the UI.' });
    }

    if (sector && !['No Sector', 'North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone'].includes(sector)) {
      return res.status(400).json({ success: false, message: 'Invalid sector zone requested.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Administrators cannot be modified via the UI
    if (user.role === 'Administrator') {
      return res.status(403).json({ success: false, message: 'Administrator accounts cannot be modified via the UI.' });
    }

    user.role = role;
    user.sector = role === 'Municipal Officer' ? (sector || 'No Sector') : 'No Sector';

    // Clear area if demoted/promoted away from officer if needed, or leave it
    if (role !== 'Municipal Officer') {
      user.assignedArea = { name: '', coordinates: [0, 0] };
    }

    await user.save();

    res.json({ success: true, message: `User role updated successfully`, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend / Unsuspend User
// @route   PUT /api/users/:id/suspend
// @access  Private/Admin
const toggleUserSuspension = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Admins cannot suspend themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Administrators cannot suspend their own account' });
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.json({ 
      success: true, 
      message: `User has been ${user.isSuspended ? 'suspended' : 'activated'} successfully`, 
      user 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all municipal officers
// @route   GET /api/users/officers/list
// @access  Private/Admin
const getOfficers = async (req, res, next) => {
  try {
    const officers = await User.find({ role: 'Municipal Officer', isSuspended: false })
      .select('name email phone assignedArea sector')
      .sort({ name: 1 });

    res.json({ success: true, count: officers.length, officers });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserRole,
  toggleUserSuspension,
  getOfficers
};
