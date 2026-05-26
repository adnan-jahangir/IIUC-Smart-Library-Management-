const BorrowRequest = require('../models/BorrowRequest');
const Book = require('../models/Book');
const User = require('../models/User');

// @desc    Create a book borrow request
// @route   POST /api/requests
// @access  Private (Student, Teacher)
exports.createRequest = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    if (!bookId) {
      return res.status(400).json({ message: 'Book ID is required.' });
    }

    // 1. Check user status & fines
    const user = await User.findById(userId);
    if (!user || user.status === 'Suspended') {
      return res.status(403).json({ message: 'Account is suspended.' });
    }
    if ((user.activeFines || 0) > 0) {
      return res.status(403).json({ message: 'You have unpaid fines. Please clear them before requesting.' });
    }

    // 2. Check book availability
    const normalizedBookId = String(bookId);
    let book = null;
    if (normalizedBookId.match(/^[0-9a-fA-F]{24}$/)) {
      book = await Book.findById(normalizedBookId);
    } else {
      book = await Book.findOne({ customId: normalizedBookId });
    }

    if (!book) return res.status(404).json({ message: 'Book not found.' });
    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'Book is currently out of stock.' });
    }

    // 3. Limit checks (Active = Pending + Approved)
    const activeRequests = await BorrowRequest.countDocuments({
      user: userId,
      status: { $in: ['Pending', 'Approved'] }
    });

    const borrowLimit = (user.role).toLowerCase() === 'teacher' ? 7 : 3;
    if (activeRequests >= borrowLimit) {
      return res.status(400).json({ message: `Limit reached. You can only have ${borrowLimit} active requests.` });
    }

    // 4. Duplicate check
    const existingRequest = await BorrowRequest.findOne({
      user: userId,
      book: book._id,
      status: { $in: ['Pending', 'Approved'] }
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have an active request for this book.' });
    }

    // 5. Create request
    const request = new BorrowRequest({ user: userId, book: book._id });
    await request.save();

    res.status(201).json({ message: 'Request submitted successfully.', request });
  } catch (error) {
    console.error(error); res.status(500).json({ message: 'Server error: ' + error.message, error: error.message });
  }
};

// @desc    Get all requests (for Admin/Librarian)
// @route   GET /api/requests
// @access  Private (Admin, Librarian)
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await BorrowRequest.find()
      .populate('user', 'name userId role email')
      .populate('book', 'title customId image')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error(error); res.status(500).json({ message: 'Server error: ' + error.message, error: error.message });
  }
};

// @desc    Get user's requests
// @route   GET /api/requests/my-requests
// @access  Private
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await BorrowRequest.find({ user: req.user.id })
      .populate('book', 'title customId abstract image author')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error(error); res.status(500).json({ message: 'Server error: ' + error.message, error: error.message });
  }
};

// @desc    Approve or Reject a request
// @route   PUT /api/requests/:id/review
// @access  Private (Admin, Librarian)
exports.reviewRequest = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body; // 'Approved' or 'Rejected'
    const request = await BorrowRequest.findById(req.params.id).populate('book user');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    if (status === 'Approved') {
      if (request.book.availableCopies <= 0) {
        return res.status(400).json({ message: 'Book is out of stock. Cannot approve.' });
      }
      
      // Update book copies
      request.book.availableCopies -= 1;
      await request.book.save();

      // Set Dates
      request.status = 'Approved';
      request.issueDate = new Date();
      // Calculate due date (Student = 14 days, Teacher = 30 days)
      const daysAllowed = request.user.role.toLowerCase() === 'teacher' ? 30 : 14;
      request.dueDate = new Date();
      request.dueDate.setDate(request.dueDate.getDate() + daysAllowed);
      
    } else if (status === 'Rejected') {
      request.status = 'Rejected';
      request.rejectionReason = rejectionReason;
    } else {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await request.save();
    res.json({ message: `Request ${status.toLowerCase()} successfully`, request });
  } catch (error) {
    console.error(error); res.status(500).json({ message: 'Server error: ' + error.message, error: error.message });
  }
};

// @desc    Mark a book as returned
// @route   PUT /api/requests/:id/return
// @access  Private (Admin, Librarian)
exports.returnBook = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id).populate('book user');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Approved') {
      return res.status(400).json({ message: `Only approved books can be returned. Current status: ${request.status}` });
    }

    // Check fine
    const today = new Date();
    let fineAmount = 0;
    if (today > request.dueDate) {
      const diffTime = Math.abs(today - request.dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * 10; // e.g., 10 currency units per day
    }

    request.status = 'Returned';
    request.returnDate = today;
    request.fineAmount = fineAmount;

    // Update book inventory
    request.book.availableCopies += 1;
    
    // Add fine to user if applicable
    if (fineAmount > 0) {
      request.user.activeFines += fineAmount;
      await request.user.save();
    }

    await request.book.save();
    await request.save();

    res.json({ message: 'Book returned successfully', fineAmount, request });
  } catch (error) {
    console.error(error); res.status(500).json({ message: 'Server error: ' + error.message, error: error.message });
  }
};

// @desc    Renew an active borrow
// @route   PUT /api/requests/:id/renew
// @access  Private (Student, Teacher)
exports.renewRequest = async (req, res) => {
  try {
    // Debug logging to help trace renew attempts
    console.log('renewRequest called', { userFromToken: req.user, params: req.params });
    const request = await BorrowRequest.findById(req.params.id).populate('book user');
    console.log('found request for renew:', request ? { id: request._id, user: request.user?._id, status: request.status, renewalCount: request.renewalCount } : null);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    // Allow renew by owner or librarian staff; normalize role comparisons
    const tokenRole = (req.user && req.user.role) ? String(req.user.role).toLowerCase() : '';
    if (String(request.user._id) !== String(req.user.id) && tokenRole !== 'librarian') {
      return res.status(403).json({ message: 'Not authorized to renew this borrow' });
    }

    if (request.status !== 'Approved') {
      return res.status(400).json({ message: 'Only approved/issued borrows can be renewed.' });
    }

    const maxRenewals = 2;
    if ((request.renewalCount || 0) >= maxRenewals) {
      return res.status(400).json({ message: `Maximum renewals reached (${maxRenewals}).` });
    }

    // Extend due date by same allowance as initial (based on role)
    const daysAllowed = request.user.role.toLowerCase() === 'teacher' ? 30 : 14;
    const newDue = new Date(request.dueDate);
    newDue.setDate(newDue.getDate() + daysAllowed);

    request.dueDate = newDue;
    request.renewalCount = (request.renewalCount || 0) + 1;
    await request.save();

    console.log('renew successful', { id: request._id, newDue: request.dueDate, renewalCount: request.renewalCount });

    const remainingRenewals = Math.max(0, maxRenewals - (request.renewalCount || 0));

    res.json({ message: 'Borrow renewed successfully', request, remainingRenewals });
  } catch (error) {
    console.error(error); res.status(500).json({ message: 'Server error: ' + error.message, error: error.message });
  }
};
