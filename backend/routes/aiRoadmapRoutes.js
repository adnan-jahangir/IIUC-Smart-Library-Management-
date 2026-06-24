const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { aiRateLimit } = require('../middleware/rateLimit');
const {
  generateRoadmap,
  getRoadmapHistory,
  getRoadmapById
} = require('../controllers/aiRoadmap.controller');

// Create rate limiter: max 10 requests per 15 minutes window for roadmap generation
const limiter = aiRateLimit({ maxRequests: 10, windowMs: 15 * 60 * 1000 });

// Routes
router.post('/', protect, limiter, generateRoadmap);
router.get('/', protect, getRoadmapHistory);
router.get('/:id', protect, getRoadmapById);

module.exports = router;
