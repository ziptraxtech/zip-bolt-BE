const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn(['admin', 'allocator', 'rider'])
    .withMessage('Invalid role specified'),
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Validation rules for organization creation
 */
const validateOrganizationCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Organization name must be between 2 and 255 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Address must not exceed 1000 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must not exceed 100 characters'),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must not exceed 100 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must not exceed 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('gstNumber')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Please provide a valid GST number'),
  handleValidationErrors
];

/**
 * Validation rules for vehicle creation
 */
const validateVehicleCreation = [
  body('vehicleNumber')
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Vehicle number must be between 5 and 50 characters'),
  body('vehicleType')
    .optional()
    .isIn(['Bike', 'Car', 'Truck', 'Van', 'Auto'])
    .withMessage('Invalid vehicle type'),
  body('model')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Model must not exceed 100 characters'),
  body('make')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Make must not exceed 100 characters'),
  body('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Please provide a valid year'),
  body('color')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Color must not exceed 50 characters'),
  handleValidationErrors
];

/**
 * Validation rules for job creation
 */
const validateJobCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Job title must be between 5 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('pickupLocation')
    .trim()
    .notEmpty()
    .withMessage('Pickup location is required'),
  body('deliveryLocation')
    .trim()
    .notEmpty()
    .withMessage('Delivery location is required'),
  body('pickupLatitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Pickup latitude must be between -90 and 90'),
  body('pickupLongitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Pickup longitude must be between -180 and 180'),
  body('deliveryLatitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Delivery latitude must be between -90 and 90'),
  body('deliveryLongitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Delivery longitude must be between -180 and 180'),
  body('scheduledTime')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date and time'),
  body('riderId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Please provide a valid rider ID'),
  body('vehicleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Please provide a valid vehicle ID'),
  handleValidationErrors
];

/**
 * Validation rules for job status update
 */
const validateJobStatusUpdate = [
  body('status')
    .isIn(['assigned', 'accepted', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid job status'),
  handleValidationErrors
];

/**
 * Validation rules for subscription creation
 */
const validateSubscriptionCreation = [
  body('planId')
    .isUUID()
    .withMessage('Please provide a valid plan ID'),
  handleValidationErrors
];

/**
 * Validation rules for subscription plan creation
 */
const validateSubscriptionPlanCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Plan name must be between 2 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('maxVehicles')
    .isInt({ min: 1 })
    .withMessage('Max vehicles must be a positive integer'),
  body('maxUsers')
    .isInt({ min: 1 })
    .withMessage('Max users must be a positive integer'),
  body('durationDays')
    .isInt({ min: 1 })
    .withMessage('Duration days must be a positive integer'),
  handleValidationErrors
];

/**
 * Validation rules for payment verification
 */
const validatePaymentVerification = [
  body('razorpayOrderId')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  body('razorpayPaymentId')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpaySignature')
    .optional()
    .isString()
    .withMessage('Razorpay signature must be a string'),
  handleValidationErrors
];

/**
 * Validation rules for pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

/**
 * Validation rules for ID parameters
 */
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Please provide a valid ID'),
  handleValidationErrors
];

/**
 * Validation rules for date range queries
 */
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateOrganizationCreation,
  validateVehicleCreation,
  validateJobCreation,
  validateJobStatusUpdate,
  validateSubscriptionCreation,
  validatePaymentVerification,
  validatePagination,
  validateId,
  validateDateRange,
  validateSubscriptionPlanCreation
}; 