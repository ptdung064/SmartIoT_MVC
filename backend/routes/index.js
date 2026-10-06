const express = require('express');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const sensorRoutes = require('./sensorRoutes');
const deviceRoutes = require('./deviceRoutes');
const actionRoutes = require('./actionRoutes');
const profileRoutes = require('./profileRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            server: 'ok',
            mqtt: Boolean(req.app.locals.mqttClient?.connected)
        }
    });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use(sensorRoutes);
router.use(deviceRoutes);
router.use(actionRoutes);
router.use(profileRoutes);

module.exports = router;
