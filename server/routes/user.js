const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateUser } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateUser);

// Get current user profile
router.get('/profile', userController.getProfile);

// Update profile picture
router.post('/profile-picture', userController.updateProfilePicture);

// Get users by faculty
router.get('/faculty/:faculty', userController.getUsersByFaculty);

// Get user by ID
router.get('/:userId', userController.getUserById);

// Block user
router.post('/block', userController.blockUser);

// Unblock user
router.post('/unblock', userController.unblockUser);

// Get blocked users
router.get('/blocked/list', userController.getBlockedUsers);

// Report user
router.post('/report', userController.reportUser);

module.exports = router;
