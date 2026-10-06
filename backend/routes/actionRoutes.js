const express = require('express');
const { getActions, getActionById } = require('../controllers/actionController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/actions', requireAuth, getActions);
router.get('/actions/:id', requireAuth, getActionById);

module.exports = router;
