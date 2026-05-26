const express = require('express');
const router = express.Router();
const { 
  createRequest, 
  getAllRequests, 
  getMyRequests, 
  reviewRequest, 
  returnBook 
} = require('../controllers/request.controller');
const { renewRequest } = require('../controllers/request.controller');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.post('/', restrictTo('Student', 'Teacher'), createRequest);
router.get('/my-requests', getMyRequests);
router.put('/:id/renew', restrictTo('Student', 'Teacher', 'Librarian'), renewRequest);

router.get('/', restrictTo('Admin', 'Librarian'), getAllRequests);
router.put('/:id/review', restrictTo('Admin', 'Librarian'), reviewRequest);
router.put('/:id/return', restrictTo('Admin', 'Librarian'), returnBook);

module.exports = router;