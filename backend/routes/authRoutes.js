const express = require('express');
const { login, logout } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/logout', requireAuth, logout);

module.exports = router;
