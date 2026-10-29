const express = require('express');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { getProfile, updateProfile, updateRules } = require('../controllers/userController');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateRules, validateRequest, updateProfile);

module.exports = router;
