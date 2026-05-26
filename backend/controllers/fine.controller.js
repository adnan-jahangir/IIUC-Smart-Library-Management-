const Fine = require('../models/Fine');
const User = require('../models/User');

// @desc    Get current user's fines
// @route   GET /api/fines/my-fines
// @access  Private
exports.getMyFines = async (req, res) => {
  try {
    const fines = await Fine.find({ user: req.user.id })
      .populate('book', 'title customId')
      .sort({ createdAt: -1 });

    res.json(fines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Get all fines (Admin/Librarian)
// @route   GET /api/fines
// @access  Private (Admin, Librarian)
exports.getAllFines = async (req, res) => {
  try {
    const fines = await Fine.find()
      .populate('user', 'name userId role')
      .populate('book', 'title customId')
      .sort({ createdAt: -1 });
    res.json(fines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Mark fine as paid
// @route   PUT /api/fines/:id/pay
// @access  Private (Admin, Librarian)
exports.payFine = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) {
      return res.status(404).json({ message: 'Fine not found' });
    }

    fine.status = 'Paid';
    fine.paidAt = Date.now();
    await fine.save();

    // Update user's total fines if you have that field
    // (Optional: depending on how you handle user.activeFines)

    res.json({ message: 'Fine marked as paid', fine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};
