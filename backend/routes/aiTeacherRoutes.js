const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { aiRateLimit } = require('../middleware/rateLimit');
const {
  generateReadingList,
  generateQuiz,
  getClassInsights
} = require('../controllers/aiTeacher.controller');

// Middleware to ensure user is a teacher (or admin)
const isTeacher = (req, res, next) => {
  if (req.user && (req.user.role === 'Teacher' || req.user.role === 'Admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized. Teacher access only.' });
  }
};

// Rate limiting specifically for these generation endpoints
const limiter = aiRateLimit({ maxRequests: 20, windowMs: 15 * 60 * 1000 });

router.post('/reading-list', protect, isTeacher, limiter, generateReadingList);
router.post('/quiz-from-syllabus', protect, isTeacher, limiter, generateQuiz);
router.get('/class-insights', protect, isTeacher, limiter, getClassInsights);

module.exports = router;
