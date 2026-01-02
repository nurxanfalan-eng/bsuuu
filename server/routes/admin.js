const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin, authenticateSuperAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticateAdmin);

// Get dashboard stats
router.get('/stats', adminController.getDashboardStats);

// Get all users
router.get('/users', adminController.getAllUsers);

// Toggle user status
router.post('/users/toggle-status', adminController.toggleUserStatus);

// Get reported users
router.get('/reported-users', adminController.getReportedUsers);

// Settings
router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.updateSettings);

// Filter words
router.get('/filter-words', adminController.getFilterWords);
router.post('/filter-words', adminController.addFilterWord);
router.delete('/filter-words/:wordId', adminController.deleteFilterWord);

// Sub-admin management (Super Admin only)
router.get('/admins', authenticateSuperAdmin, adminController.getAdmins);
router.post('/admins', authenticateSuperAdmin, adminController.createAdmin);
router.delete('/admins/:adminId', authenticateSuperAdmin, adminController.deleteAdmin);

module.exports = router;
