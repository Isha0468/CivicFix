const { check, validationResult } = require('express-validator');

// Middleware to check for validation errors and return them
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

const registerValidation = [
  check('name', 'Name is required').notEmpty().trim(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  check('role', 'Role must be Citizen, Municipal Officer, or Administrator').optional().isIn(['Citizen', 'Municipal Officer', 'Administrator']),
  check('phone', 'Phone number must contain digits').optional().trim(),
  validateRequest
];

const loginValidation = [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').notEmpty(),
  validateRequest
];

const complaintValidation = [
  check('title', 'Title is required, max 100 characters').notEmpty().trim().isLength({ max: 100 }),
  check('description', 'Description is required').notEmpty().trim(),
  check('category', 'Category ID must be a valid Mongo ID').isMongoId(),
  check('latitude', 'Latitude must be a valid coordinate number (-90 to 90)').isFloat({ min: -90, max: 90 }),
  check('longitude', 'Longitude must be a valid coordinate number (-180 to 180)').isFloat({ min: -180, max: 180 }),
  check('address', 'Address string is required').notEmpty().trim(),
  check('severity', 'Severity must be Low, Medium, or High').optional().isIn(['Low', 'Medium', 'High']),
  validateRequest
];

const commentValidation = [
  check('text', 'Comment text is required (max 500 characters)').notEmpty().trim().isLength({ max: 500 }),
  validateRequest
];

module.exports = {
  registerValidation,
  loginValidation,
  complaintValidation,
  commentValidation
};
