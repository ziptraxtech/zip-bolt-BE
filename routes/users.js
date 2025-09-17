const express = require('express');
const { User, Organization } = require('../models');
const { validateUserRegistration, validatePagination, validateId } = require('../middleware/validation');
const { requireAdmin, requireResourceAccess, requireAllocator } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [superadmin, admin, allocator, rider]
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       403:
 *         description: Access denied
 */
router.get('/', requireAllocator, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build where clause based on user role and filters
    const where = {};
    
    // Non-superadmin users can only see users from their organization
    if (req.user.role !== 'superadmin') {
      where.organizationId = req.user.organizationId;
    }

    // Apply filters
    if (req.query.role) {
      where.role = req.query.role;
    }
    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      include: ['organization'],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: users.map(user => user.toJSON()),
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: 'Internal server error'
    });
  }
});

//get all users in csv
router.get('/csv', requireAllocator, async (req, res) => {
  try {
    const where = {};
    
    if (req.user.role !== 'superadmin') {
      where.organizationId = req.user.organizationId;
    }

    if (req.query.role) {
      where.role = req.query.role;
    }
    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }

    const users = await User.findAll({
      where,
      include: ['organization'],
      order: [['createdAt', 'DESC']]
    });

    const csvHeaders = [
      'Email',
      'First Name',
      'Last Name',
      'Role',
      'Is Active',
      'Organization Name',
      'Created At',
      'Updated At'
    ];

    const csvRows = users.map(user => {
      const userData = user.toJSON();
      return [
        userData.email || '',
        userData.firstName || '',
        userData.lastName || '',
        userData.role || '',
        userData.isActive ? 'Yes' : 'No',
        userData.organization?.name || '',
        userData.createdAt ? new Date(userData.createdAt).toISOString() : '',
        userData.updatedAt ? new Date(userData.updatedAt).toISOString() : ''
      ];
    });

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => {
          if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        }).join(',')
      )
    ].join('\n');

    const filename = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');

    res.status(200).send(csvContent);

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({
      error: 'Failed to export users to CSV',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, allocator, rider]
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       409:
 *         description: User already exists
 */
router.post('/', requireAllocator, validateUserRegistration, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Non-superadmin users can only create users for their organization
    const organizationId = req.user.role === 'superadmin' 
      ? req.body.organizationId 
      : req.user.organizationId;

    // Validate organization exists
    if (organizationId) {
      const organization = await Organization.findByPk(organizationId);
      if (!organization) {
        return res.status(400).json({
          error: 'Invalid organization',
          message: 'The specified organization does not exist'
        });
      }
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: role || 'rider',
      organizationId
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Failed to create user',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get('/:id', requireResourceAccess('user'), async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.resource.toJSON()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, allocator, rider]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.put('/:id', requireAdmin, requireResourceAccess('user'), async (req, res) => {
  try {
    const { firstName, lastName, phone, role, isActive, email } = req.body;
    const user = req.resource;

    if (role && req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only superadmin and admin can change user roles'
      });
    }

    // Update user
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phone: phone !== undefined ? phone : user.phone,
      email: email || user.email,
      role: role || user.role,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.delete('/:id', requireAdmin, requireResourceAccess('user'), async (req, res) => {
  try {
    const user = req.resource;

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({
        error: 'Cannot delete self',
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete by deactivating
    await user.update({ isActive: false });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /users/organization/{organizationId}:
 *   get:
 *     summary: Get users by organization
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, allocator, rider]
 *         description: Filter by role
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Access denied
 */
router.get('/organization/:organizationId', requireAllocator, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { role } = req.query;

    // Non-superadmin users can only access their organization
    if (req.user.role !== 'superadmin' && req.user.organizationId.toString() !== organizationId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access users from your organization'
      });
    }

    const where = { organizationId };
    if (role) {
      where.role = role;
    }

    const users = await User.findAll({
      where,
      include: ['organization'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: users.map(user => user.toJSON())
    });
  } catch (error) {
    console.error('Get organization users error:', error);
    res.status(500).json({
      error: 'Failed to get organization users',
      message: 'Internal server error'
    });
  }
});

module.exports = router;