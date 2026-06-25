const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { aiRateLimit } = require('../middleware/rateLimit');
const {
  uploadDocument,
  summarizeDocument,
  generateQuestions,
  askDocument,
  askAllDocuments,
  listDocuments,
  deleteDocument,
  getDocument
} = require('../controllers/aiDocument.controller');

// Multer memory storage configuration (capping size at 15MB, .pdf only)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'));
    }
  }
});

// Create rate limiter: max 20 requests per 15 minutes window
const limiter = aiRateLimit({ maxRequests: 20, windowMs: 15 * 60 * 1000 });

// Upload route
router.post('/upload', protect, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size limit exceeded (max 15MB).' });
      }
      return res.status(400).json({ message: err.message || 'File upload failed.' });
    }
    next();
  });
}, uploadDocument);

// Multi-document RAG endpoint (must be before /:id routes)
router.post('/ask-all', protect, limiter, askAllDocuments);

// Document manipulation routes
router.post('/:id/summarize', protect, limiter, summarizeDocument);
router.post('/:id/generate-questions', protect, limiter, generateQuestions);
router.post('/:id/ask', protect, limiter, askDocument);
router.get('/', protect, listDocuments);
router.get('/:id', protect, getDocument);
router.delete('/:id', protect, deleteDocument);

module.exports = router;
