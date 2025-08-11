const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      include: ['organization']
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found or account is inactive'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'The authentication token has expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is superadmin
 */
const requireSuperadmin = requireRole('superadmin');

/**
 * Middleware to check if user is admin
 */
const requireAdmin = requireRole(['superadmin', 'admin']);

/**
 * Middleware to check if user is allocator
 */
const requireAllocator = requireRole(['superadmin', 'admin', 'allocator']);

/**
 * Middleware to check if user is rider
 */
const requireRider = requireRole(['superadmin', 'admin', 'allocator', 'rider']);

/**
 * Middleware to check if user belongs to organization
 */
const requireOrganizationAccess = (organizationIdParam = 'organizationId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    // Superadmin can access all organizations
    if (req.user.role === 'superadmin') {
      return next();
    }

    const requestedOrgId = req.params[organizationIdParam] || req.body.organizationId;
    const userOrgId = req.user.organizationId;

    if (!userOrgId || userOrgId.toString() !== requestedOrgId.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access resources from your organization'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user can access specific resource
 */
const requireResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    // Superadmin can access all resources
    if (req.user.role === 'superadmin') {
      return next();
    }

    try {
      const resourceId = req.params.id;
      let resource;

      switch (resourceType) {
        case 'user':
          resource = await User.findByPk(resourceId);
          break;
        case 'vehicle':
          const { Vehicle } = require('../models');
          resource = await Vehicle.findByPk(resourceId);
          break;
        case 'job':
          const { Job } = require('../models');
          resource = await Job.findByPk(resourceId);
          break;
        default:
          return res.status(400).json({
            error: 'Invalid resource type',
            message: 'Unsupported resource type for access control'
          });
      }

      if (!resource) {
        return res.status(404).json({
          error: 'Resource not found',
          message: `${resourceType} not found`
        });
      }

      // Check if resource belongs to user's organization
      const resourceOrgId = resource.organizationId || resource.organizationId;
      if (resourceOrgId.toString() !== req.user.organizationId.toString()) {
        return res.status(403).json({
          error: 'Access denied',
          message: `You can only access ${resourceType}s from your organization`
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Resource access middleware error:', error);
      return res.status(500).json({
        error: 'Access control failed',
        message: 'Internal server error during access control'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireSuperadmin,
  requireAdmin,
  requireAllocator,
  requireRider,
  requireOrganizationAccess,
  requireResourceAccess
}; 