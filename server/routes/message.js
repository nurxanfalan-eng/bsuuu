const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateUser } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateUser);

// Get faculty room messages
router.get('/faculty/:faculty', messageController.getFacultyMessages);

// Get private messages with a user
router.get('/private/:userId', messageController.getPrivateMessages);

// Get conversations list
router.get('/conversations', messageController.getConversations);

module.exports = router;
