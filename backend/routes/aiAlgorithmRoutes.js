const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { aiRateLimit } = require('../middleware/rateLimit');
const {
  explainAlgorithm,
  explainSystemLogic
} = require('../controllers/aiAlgorithm.controller');

const limiter = aiRateLimit({ maxRequests: 20, windowMs: 15 * 60 * 1000 });

router.post('/explain-algorithm', protect, limiter, explainAlgorithm);
router.post('/explain-system/:logicType', protect, limiter, explainSystemLogic);

module.exports = router;
