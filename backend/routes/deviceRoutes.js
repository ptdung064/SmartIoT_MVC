const express = require('express');
const {
    getDevices,
    controlDevice,
    updateDeviceStatusInternal
} = require('../controllers/deviceController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/devices', requireAuth, getDevices);
router.post('/devices/:id/control', requireAuth, controlDevice);
router.patch('/devices/:id/status', updateDeviceStatusInternal);

module.exports = router;
