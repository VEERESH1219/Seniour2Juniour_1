const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ensure these functions exist in your controller
router.post('/register', authController.register);
router.post('/login', authController.login);

// IMPORTANT: This line must be here!
module.exports = router;
