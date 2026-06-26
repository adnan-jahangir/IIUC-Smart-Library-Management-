const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const User = require('../models/User');

const recalcQueuePositions = async (bookId) => {
  const waitingReservations = await Reservation.find({
    book: bookId,
    status: 'Waiting'
  }).sort({ priorityLevel: -1, createdAt: 1 });

  for (let index = 0; index < waitingReservations.length; index += 1) {
    const reservation = waitingReservations[index];
    const nextPosition = index + 1;

    if (reservation.queuePosition !== nextPosition) {
      reservation.queuePosition = nextPosition;
      await reservation.save();
    }
  }
};

// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Private (Student, Teacher)
exports.createReservation = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    if (!bookId) {
      return res.status(400).json({ message: 'Book ID is required.' });
    }

    const user = await User.findById(userId);
    if (!user || user.status === 'Suspended') {
      return res.status(403).json({ message: 'Account is suspended.' });
    }
    if ((user.activeFines || 0) > 0) {
      return res.status(403).json({ message: 'You have unpaid fines. Please clear them before reserving.' });
    }

    const normalizedBookId = String(bookId);
    let book = null;
    if (normalizedBookId.match(/^[0-9a-fA-F]{24}$/)) {
      book = await Book.findById(normalizedBookId);
    } else {
      book = await Book.findOne({ customId: normalizedBookId });
    }

    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    const existingReservation = await Reservation.findOne({
      user: userId,
      book: book._id,
      status: { $in: ['Waiting', 'Notified'] }
    });

    if (existingReservation) {
      return res.status(400).json({ message: 'You already have an active reservation for this book.' });
    }

    const reservation = await Reservation.create({
      user: userId,
      book: book._id,
      priorityLevel: user.priorityLevel || 0,
      queuePosition: 999999 // Placeholder, will be recalculated immediately
    });

    await recalcQueuePositions(book._id);
    const updatedReservation = await Reservation.findById(reservation._id);

    res.status(201).json({ message: 'Reservation submitted successfully.', reservation: updatedReservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error: ' + error.message, error: error.message });
  }
};

// @desc    Get current user's reservations
// @route   GET /api/reservations/my-reservations
// @access  Private
exports.getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id })
      .populate('book', 'title author isbn customId image')
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error: ' + error.message, error: error.message });
  }
};

// @desc    Get all reservations (Admin/Librarian)
// @route   GET /api/reservations
// @access  Private (Admin, Librarian)
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('user', 'name userId role email')
      .populate('book', 'title customId image')
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error: ' + error.message, error: error.message });
  }
};

// @desc    Update reservation status (Admin/Librarian)
// @route   PUT /api/reservations/:id/status
// @access  Private (Admin, Librarian)
exports.updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Waiting', 'Notified', 'Fulfilled', 'Canceled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const previousStatus = reservation.status;
    reservation.status = status;
    await reservation.save();

    if (
      (previousStatus === 'Waiting' && status !== 'Waiting') ||
      (previousStatus !== 'Waiting' && status === 'Waiting')
    ) {
      await recalcQueuePositions(reservation.book);
    }

    res.json({ message: 'Reservation status updated', reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error: ' + error.message, error: error.message });
  }
};

// @desc    Cancel reservation (Student/Teacher)
// @route   PUT /api/reservations/my-reservations/:id/cancel
// @access  Private (Student, Teacher)
exports.cancelMyReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
    }

    if (reservation.status === 'Fulfilled' || reservation.status === 'Canceled') {
      return res.status(400).json({ message: 'Cannot cancel a fulfilled or already canceled reservation.' });
    }

    reservation.status = 'Canceled';
    await reservation.save();
    await recalcQueuePositions(reservation.book);

    res.json({ message: 'Reservation canceled', reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error: ' + error.message, error: error.message });
  }
};
