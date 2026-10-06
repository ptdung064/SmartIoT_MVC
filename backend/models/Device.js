const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
    {
        device_id: { type: String, required: true, unique: true, trim: true, index: true },
        device_name: { type: String, required: true, trim: true },
        mqtt_key: { type: String, required: true, trim: true },
        current_status: {
            type: String,
            enum: ['ON', 'OFF', 'LOADING', 'UNKNOWN'],
            default: 'OFF'
        },
        last_action_at: { type: Date, default: null }
    },
    {
        timestamps: true,
        collection: 'devices'
    }
);

module.exports = mongoose.model('Device', deviceSchema);
