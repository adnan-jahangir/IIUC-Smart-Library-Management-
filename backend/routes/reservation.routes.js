const express = require('express');
const router = express.Router();
const { 
  createReservation, 
  getMyReservations, 
  getAllReservations, 
  updateReservationStatus,
  cancelMyReservation
} = require('../controllers/reservation.controller');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.post('/', restrictTo('Student', 'Teacher'), createReservation);
router.get('/my-reservations', getMyReservations);
router.put('/my-reservations/:id/cancel', restrictTo('Student', 'Teacher'), cancelMyReservation);

router.get('/', restrictTo('Admin', 'Librarian'), getAllReservations);
router.put('/:id/status', restrictTo('Admin', 'Librarian'), updateReservationStatus);

module.exports = router;
