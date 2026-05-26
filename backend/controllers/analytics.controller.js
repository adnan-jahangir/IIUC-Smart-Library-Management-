const User = require('../models/User');
const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');
const Fine = require('../models/Fine');

// @desc    System overview counts for admin analytics
// @route   GET /api/analytics/system-overview
// @access  Private (Admin)
exports.systemOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    const activeBorrows = await BorrowRequest.countDocuments({ status: 'Approved' });
    const pendingRequests = await BorrowRequest.countDocuments({ status: 'Pending' });
    const totalFines = await Fine.aggregate([
      { $match: { status: { $in: ['Unpaid','Pending'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      totalUsers,
      totalBooks,
      activeBorrows,
      pendingRequests,
      totalFines: (totalFines[0] && totalFines[0].total) || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Analytics error', error: error.message });
  }
};