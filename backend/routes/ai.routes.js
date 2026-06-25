const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { aiRateLimit } = require('../middleware/rateLimit');

// Existing AI feature controllers (recommend, summarize, legacy chat)
const {
  recommend,
  summarize,
  chat,
  getUsageStats,
  getBookInsight,
} = require('../controllers/ai.controller');

// New session-based chat controller
const {
  sendMessage,
  listSessions,
  getSession,
  deleteSession,
  updateSessionTitle,
} = require('../controllers/chat.controller');

// Rate limiter: 20 requests per 15-minute window per user
const limiter = aiRateLimit({ maxRequests: 20, windowMs: 15 * 60 * 1000 });

// ── Legacy endpoints (kept for backward-compatibility) ──────────────────
router.post('/recommend', protect, limiter, recommend);
router.post('/summarize', protect, limiter, summarize);
router.post('/legacy-chat', protect, limiter, chat); // renamed to avoid conflict

// ── Session-based chat ──────────────────────────────────────────────────
router.post('/chat', protect, limiter, sendMessage);
router.get('/chat/sessions', protect, listSessions);
router.get('/chat/sessions/:id', protect, getSession);
router.delete('/chat/sessions/:id', protect, deleteSession);
router.patch('/chat/sessions/:id/title', protect, updateSessionTitle);

// ── Admin: usage stats ──────────────────────────────────────────────────
router.get('/usage', protect, getUsageStats);

// ── Book Insights ───────────────────────────────────────────────────────
router.get('/book-insight/:bookId', protect, getBookInsight);

module.exports = router;