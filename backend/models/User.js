const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true, lowercase: true },
        password_hash: { type: String, required: true },

        full_name: { type: String, default: '', trim: true },
        student_id: { type: String, default: '', trim: true },
        class_name: { type: String, default: '', trim: true },
        email: { type: String, default: '', trim: true, lowercase: true },
        avatar_url: { type: String, default: '', trim: true },

        github_url: { type: String, default: '', trim: true },
        figma_url: { type: String, default: '', trim: true },
        postman_url: { type: String, default: '', trim: true },
        report_url: { type: String, default: '', trim: true }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'users'
    }
);

module.exports = mongoose.model('User', userSchema);
