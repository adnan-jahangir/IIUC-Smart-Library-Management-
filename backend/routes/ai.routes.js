const express = require('express');
const router = express.Router();
const { recommend, summarize, chat } = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth');

router.post('/recommend', protect, recommend);
router.post('/summarize', protect, summarize);
router.post('/chat', chat);

module.exports = router;