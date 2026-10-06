const express = require('express');
const {
    getSensors,
    getDataSensorHistory,
    getDataSensorById,
    createDataSensor
} = require('../controllers/sensorController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/sensors', requireAuth, getSensors);
router.get('/datasensor', requireAuth, getDataSensorHistory);
router.get('/datasensor/:id', requireAuth, getDataSensorById);
router.post('/datasensor', createDataSensor);

module.exports = router;
