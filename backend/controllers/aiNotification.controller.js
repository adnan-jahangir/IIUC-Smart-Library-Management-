const Notification = require('../models/Notification');
const BorrowRequest = require('../models/BorrowRequest');
const { getChatCompletion } = require('../services/openaiService');

/**
 * @desc    Get recent notifications for a user
 * @route   GET /api/ai/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate({
        path: 'ref.id',
        populate: { path: 'book', select: 'title' }
      });

    res.json(notifications);
  } catch (error) {
    console.error('Failed to get notifications', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/ai/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    console.error('Failed to mark as read', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Get fine summary for student dashboard
 * @route   GET /api/ai/notifications/fine-summary
 * @access  Private
 */
exports.getFineSummary = async (req, res) => {
  try {
    const now = new Date();
    // Fetch active overdue borrows
    const overdueBorrows = await BorrowRequest.find({
      user: req.user.id,
      status: 'Approved',
      dueDate: { $lt: now }
    }).populate('book', 'title author');

    let totalFine = 0;
    const overdueBooks = overdueBorrows.map(br => {
      const daysOverdue = Math.floor((now - br.dueDate) / (1000 * 60 * 60 * 24));
      // Using fineAccrued from db or calculating based on standard 10
      const fine = br.fineAccrued || (daysOverdue * 10);
      totalFine += fine;
      return {
        borrowId: br._id,
        bookTitle: br.book?.title,
        daysOverdue,
        fine
      };
    });

    res.json({
      totalFine,
      overdueCount: overdueBooks.length,
      overdueBooks
    });
  } catch (error) {
    console.error('Failed to get fine summary', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Test trigger for the background job
 * @route   POST /api/ai/notifications/trigger-job
 * @access  Private
 */
exports.triggerJob = async (req, res) => {
  try {
    const { runDueDateCheckCycle } = require('../jobs/dueDateCheckerJob');
    await runDueDateCheckCycle();
    res.json({ message: 'Job triggered successfully' });
  } catch (error) {
    console.error('Job trigger failed', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
