const express = require('express');
const { Organization, User, Vehicle, Job } = require('../models');
const { validateOrganizationCreation, validateId } = require('../middleware/validation');
const { requireSuperadmin, requireAdmin } = require('../middleware/auth');
const sequelize = require('../config/database');

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
 *           type: string
 *           format: uuid
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
 *     summary: Update organization (Superadmin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
router.put('/:id', requireSuperadmin, validateId, async (req, res) => {
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

/**
 * @swagger
 * /organizations/{id}:
 *   delete:
 *     summary: Delete organization and all related data (Superadmin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization and all related data deleted successfully
 *       404:
 *         description: Organization not found
 */
router.delete('/:id', requireSuperadmin, validateId, async (req, res) => {
  let transaction;
  
  try {
    console.log('=== DELETE ORGANIZATION DEBUG START ===');
    console.log('Organization ID:', req.params.id);
    console.log('Models available:', { 
      Organization: !!Organization, 
      User: !!User, 
      Vehicle: !!Vehicle, 
      Job: !!Job 
    });
    
    // Start a transaction inside try so errors are caught
    console.log('Creating transaction...');
    transaction = await sequelize.transaction();
    console.log('Transaction created successfully');
    
    console.log('Finding organization...');
    const organization = await Organization.findByPk(req.params.id, { transaction });
    console.log('Organization found:', organization ? `YES (${organization.name})` : 'NO');

    if (!organization) {
      console.log('Organization not found, rolling back transaction');
      await transaction.rollback();
      return res.status(404).json({
        error: 'Organization not found',
        message: 'The specified organization does not exist'
      });
    }

    // METHOD 1: Manual cascading delete with transaction
    // Delete in the correct order to avoid foreign key constraint issues
    
    // First, delete jobs (try different possible foreign key names)
    console.log('Attempting to delete jobs...');
    try {
      const deletedJobs = await Job.destroy({
        where: { organizationId: req.params.id },
        transaction
      });
      console.log('Jobs deleted successfully:', deletedJobs);
    } catch (jobError) {
      console.log('Error deleting jobs with organizationId, trying organization_id:', jobError.message);
      const deletedJobs = await Job.destroy({
        where: { organization_id: req.params.id },
        transaction
      });
      console.log('Jobs deleted with organization_id:', deletedJobs);
    }

    // Then delete vehicles
    console.log('Attempting to delete vehicles...');
    try {
      const deletedVehicles = await Vehicle.destroy({
        where: { organizationId: req.params.id },
        transaction
      });
      console.log('Vehicles deleted successfully:', deletedVehicles);
    } catch (vehicleError) {
      console.log('Error deleting vehicles with organizationId, trying organization_id:', vehicleError.message);
      const deletedVehicles = await Vehicle.destroy({
        where: { organization_id: req.params.id },
        transaction
      });
      console.log('Vehicles deleted with organization_id:', deletedVehicles);
    }

    // Then delete users
    console.log('Attempting to delete users...');
    try {
      const deletedUsers = await User.destroy({
        where: { organizationId: req.params.id },
        transaction
      });
      console.log('Users deleted successfully:', deletedUsers);
    } catch (userError) {
      console.log('Error deleting users with organizationId, trying organization_id:', userError.message);
      const deletedUsers = await User.destroy({
        where: { organization_id: req.params.id },
        transaction
      });
      console.log('Users deleted with organization_id:', deletedUsers);
    }

    // Finally delete the organization
    console.log('Deleting organization...');
    await organization.destroy({ transaction });
    console.log('Organization deleted successfully');

    // Commit the transaction
    console.log('Committing transaction...');
    await transaction.commit();
    console.log('Transaction committed successfully');

    res.json({
      success: true,
      message: 'Organization and all related data deleted successfully',
      deletedCounts: {
        jobs: 'See logs',
        vehicles: 'See logs', 
        users: 'See logs',
        organizations: 1
      }
    });

  } catch (error) {
    console.log('=== ERROR OCCURRED ===');
    console.error('Delete organization error:', error);
    console.error('Error stack:', error.stack);
    
    // Rollback transaction on error with safe handling
    if (transaction) {
      try {
        console.log('Rolling back transaction...');
        await transaction.rollback();
        console.log('Transaction rolled back successfully');
      } catch (rollbackError) {
        console.log('Rollback error (can be ignored):', rollbackError.message);
      }
    }
    
    res.status(500).json({
      error: 'Failed to delete organization',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /organizations/{id}/related-data:
 *   get:
 *     summary: Get count of related data for an organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Related data counts retrieved successfully
 *       404:
 *         description: Organization not found
 */
router.get('/:id/related-data', requireSuperadmin, validateId, async (req, res) => {
  try {
    const organization = await Organization.findByPk(req.params.id);
    
    if (!organization) {
      return res.status(404).json({
        error: 'Organization not found',
        message: 'The specified organization does not exist'
      });
    }

    // Get counts of related data
    const [usersCount, vehiclesCount, jobsCount] = await Promise.all([
      User.count({ where: { organizationId: req.params.id } }),
      Vehicle.count({ where: { organizationId: req.params.id } }),
      Job.count({ where: { organizationId: req.params.id } })
    ]);

    res.json({
      success: true,
      data: {
        organization: organization.name,
        relatedDataCounts: {
          users: usersCount,
          vehicles: vehiclesCount,
          jobs: jobsCount,
          total: usersCount + vehiclesCount + jobsCount
        }
      }
    });

  } catch (error) {
    console.error('Get related data error:', error);
    res.status(500).json({
      error: 'Failed to get related data counts',
      message: 'Internal server error'
    });
  }
});

module.exports = router;