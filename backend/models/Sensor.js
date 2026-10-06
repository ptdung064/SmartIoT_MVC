const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema(
    {
        sensor_id: { type: Number, required: true, unique: true },
        sensor_name: { type: String, required: true, trim: true },
        sensor_type: {
            type: String,
            required: true,
            enum: ['temperature', 'humidity', 'light']
        },
        unit: { type: String, required: true }
    },
    {
        timestamps: true,
        collection: 'sensors'
    }
);

module.exports = mongoose.model('Sensor', sensorSchema);
