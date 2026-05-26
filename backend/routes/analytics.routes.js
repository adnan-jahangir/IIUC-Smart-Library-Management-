const express = require('express');
const router = express.Router();
const { systemOverview } = require('../controllers/analytics.controller');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);
router.get('/system-overview', restrictTo('Admin'), systemOverview);

module.exports = router;