const express = require('express');
const router = express.Router();
const { recommend, summarize } = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/recommend', recommend);
router.post('/summarize', summarize);

module.exports = router;