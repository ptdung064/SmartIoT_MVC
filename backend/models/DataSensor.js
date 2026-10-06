const mongoose = require('mongoose');

const dataSensorSchema = new mongoose.Schema(
    {
        sensor_id: { type: Number, required: true, index: true },
        sensor_name: { type: String, required: true },
        sensor_type: {
            type: String,
            required: true,
            enum: ['temperature', 'humidity', 'light'],
            index: true
        },
        unit: { type: String, required: true },
        value: {
            type: Number,
            required: true,
            set: value => Math.round((Number(value) + Number.EPSILON) * 100) / 100
        },
        recorded_at: { type: Date, default: Date.now, index: true }
    },
    {
        versionKey: false,
        collection: 'datasensor'
    }
);

dataSensorSchema.index({ sensor_id: 1, recorded_at: -1 });

module.exports = mongoose.model('DataSensor', dataSensorSchema);
