const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getNotifications, markAsRead, getFineSummary, triggerJob } = require('../controllers/aiNotification.controller');

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markAsRead);
router.get('/fine-summary', protect, getFineSummary);
router.post('/trigger-job', protect, triggerJob); // For testing

module.exports = router;
