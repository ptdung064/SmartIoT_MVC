const express = require('express');
const {
    getProfile,
    updateProfile,
    changePassword,
    updateAvatar
} = require('../controllers/profileController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.patch('/profile/password', requireAuth, changePassword);
router.post('/profile/avatar', requireAuth, updateAvatar);

module.exports = router;
