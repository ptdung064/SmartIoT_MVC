const mongoose = require('mongoose');

const actionHistorySchema = new mongoose.Schema(
    {
        device_id: { type: String, required: true, index: true },
        device_name: { type: String, required: true },
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        username: { type: String, default: '' },

        action: { type: String, required: true, enum: ['ON', 'OFF'], index: true },
        status: {
            type: String,
            required: true,
            enum: ['loading', 'success', 'fail', 'timeout'],
            default: 'loading',
            index: true
        },

        created_at: { type: Date, default: Date.now, index: true },
        updated_at: { type: Date, default: Date.now }
    },
    {
        versionKey: false,
        collection: 'action_history'
    }
);

actionHistorySchema.pre('save', function() {
    this.updated_at = new Date();
});

module.exports = mongoose.model('ActionHistory', actionHistorySchema);
