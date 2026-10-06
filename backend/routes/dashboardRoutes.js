const express = require('express');
const { getLatest, getChart } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/sensors/latest', requireAuth, getLatest);
router.get('/sensors/chart', requireAuth, getChart);

module.exports = router;
