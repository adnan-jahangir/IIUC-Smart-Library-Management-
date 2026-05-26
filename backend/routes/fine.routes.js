const express = require('express');
const router = express.Router();
const { 
  getMyFines, 
  getAllFines, 
  payFine 
} = require('../controllers/fine.controller');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/my-fines', getMyFines);
router.get('/', restrictTo('Admin', 'Librarian'), getAllFines);
router.put('/:id/pay', restrictTo('Admin', 'Librarian'), payFine);

module.exports = router;
