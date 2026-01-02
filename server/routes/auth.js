const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Get verification questions
router.get('/verification-questions', authController.getVerificationQuestions);

// Get faculties
router.get('/faculties', authController.getFaculties);

// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Admin login
router.post('/admin/login', authController.adminLogin);

module.exports = router;
