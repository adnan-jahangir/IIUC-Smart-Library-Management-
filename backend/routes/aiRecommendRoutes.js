const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { aiRateLimit } = require('../middleware/rateLimit');
const { recommendForStudent, recommendForClass } = require('../controllers/aiRecommend.controller');

// Create rate limiter: max 20 requests per 15 minutes window
const limiter = aiRateLimit({ maxRequests: 20, windowMs: 15 * 60 * 1000 });

// Student recommendations endpoint
router.post('/books', protect, restrictTo('student'), limiter, recommendForStudent);

// Teacher recommendations endpoint
router.post('/class-books', protect, restrictTo('teacher'), limiter, recommendForClass);

module.exports = router;
