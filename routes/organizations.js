const express = require('express');
const { Organization } = require('../models');
const { validateOrganizationCreation, validateId } = require('../middleware/validation');
const { requireSuperadmin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /organizations:
 *   get:
 *     summary: Get all organizations (Superadmin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organizations retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/', requireSuperadmin, async (req, res) => {
  try {
    const organizations = await Organization.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({
      error: 'Failed to get organizations',
      message: 'Internal server error'
    });
  }
});


//get all organizations in csv

router.get('/csv', requireSuperadmin, async (req, res) => {
  try {
    const organizations = await Organization.findAll({
      order: [['createdAt', 'DESC']]
    });

    const csvHeaders = [
      'Name',
      'Email',
      'Phone',
      'Address',
      'City',
      'State',
      'Country',
      'GST Number',
      'Is Active',
      'Created At',
      'Updated At'
    ];

    const csvRows = organizations.map(org => {
      const orgData = org.toJSON();
      return [
        orgData.name || '',
        orgData.email || '',
        orgData.phone || '',
        orgData.address || '',
        orgData.city || '',
        orgData.state || '',
        orgData.country || '',
        orgData.gstNumber || '',
        orgData.isActive ? 'True' : 'False',
        orgData.createdAt ? new Date(orgData.createdAt).toISOString() : '',
        orgData.updatedAt ? new Date(orgData.updatedAt).toISOString() : ''
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

    const filename = `organizations-export-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');

    res.status(200).send(csvContent);

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({
      error: 'Failed to export organizations to CSV',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /organizations:
 *   post:
 *     summary: Create a new organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               gstNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organization created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', validateOrganizationCreation, async (req, res) => {
  try {
    const organization = await Organization.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: organization
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({
      error: 'Failed to create organization',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /organizations/{id}:
 *   get:
 *     summary: Get organization by ID
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization retrieved successfully
 *       404:
 *         description: Organization not found
 */
router.get('/:id', validateId, async (req, res) => {
  try {
    const organization = await Organization.findByPk(req.params.id);
    
    if (!organization) {
      return res.status(404).json({
        error: 'Organization not found',
        message: 'The specified organization does not exist'
      });
    }

    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      error: 'Failed to get organization',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /organizations/{id}:
 *   put:
 *     summary: Update organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               gstNumber:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *       404:
 *         description: Organization not found
 */
router.put('/:id', validateId, async (req, res) => {
  try {
    const organization = await Organization.findByPk(req.params.id);
    
    if (!organization) {
      return res.status(404).json({
        error: 'Organization not found',
        message: 'The specified organization does not exist'
      });
    }

    await organization.update(req.body);

    res.json({
      success: true,
      message: 'Organization updated successfully',
      data: organization
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({
      error: 'Failed to update organization',
      message: 'Internal server error'
    });
  }
});

module.exports = router; 