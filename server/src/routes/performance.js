const express = require('express');
const { protect } = require('../middleware/auth');
const { getPerformance } = require('../controllers/performanceController');

const router = express.Router();

router.get('/', protect, getPerformance);

module.exports = router;
