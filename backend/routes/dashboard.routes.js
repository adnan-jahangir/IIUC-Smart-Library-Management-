const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');
const Reservation = require('../models/Reservation');
const { protect, restrictTo } = require('../middleware/auth');

const buildDayLabel = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });

// Admin Analytics
router.get('/admin', protect, restrictTo('Admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalBooksObj = await Book.aggregate([{ $group: { _id: null, total: { $sum: '$totalCopies' } } }]);
        const totalBooks = totalBooksObj.length > 0 ? totalBooksObj[0].total : 0;

        const activeBorrows = await BorrowRequest.countDocuments({ status: 'Approved' });
        const pendingRequests = await BorrowRequest.countDocuments({ status: 'Pending' });
        const overdueBorrows = await BorrowRequest.countDocuments({
                status: 'Approved',
                dueDate: { $lt: new Date() }
        });

        const today = new Date();
        const startOfWindow = new Date(today);
        startOfWindow.setDate(today.getDate() - 6);
        startOfWindow.setHours(0, 0, 0, 0);

        const weeklyApproved = await BorrowRequest.find({
                status: 'Approved',
                issueDate: { $gte: startOfWindow }
        }).select('issueDate');

        const weeklyReturns = await BorrowRequest.find({
                status: 'Returned',
                returnDate: { $gte: startOfWindow }
        }).select('returnDate');

        const activitySeries = Array.from({ length: 7 }, (_, index) => {
                const day = new Date(startOfWindow);
                day.setDate(startOfWindow.getDate() + index);

                const approvedCount = weeklyApproved.filter((req) => {
                        const reqDate = new Date(req.issueDate);
                        return reqDate.toDateString() === day.toDateString();
                }).length;

                const returnedCount = weeklyReturns.filter((req) => {
                        const reqDate = new Date(req.returnDate);
                        return reqDate.toDateString() === day.toDateString();
                }).length;

                return {
                        name: buildDayLabel(day),
                        active: approvedCount,
                        returns: returnedCount
                };
        });

        res.json({
                totalUsers,
                totalBooks,
                activeBorrows,
                pendingRequests,
                overdueBorrows,
                activitySeries
        });
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

// Librarian Analytics
router.get('/librarian', protect, restrictTo('Librarian', 'Admin'), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const issuedToday = await BorrowRequest.countDocuments({
            status: 'Approved',
            issueDate: { $gte: today }
        });

        const returnedTodayObj = await BorrowRequest.countDocuments({
            status: 'Returned',
            returnDate: { $gte: today }
        });

        const pendingCount = await BorrowRequest.countDocuments({ status: 'Pending' });

        const overdueCount = await BorrowRequest.countDocuments({ 
            status: 'Approved', 
            dueDate: { $lt: new Date() } 
        });

        // Pending requests for the table
        const pendingRequests = await BorrowRequest.find({ status: 'Pending' })
            .populate('book', 'title customId')
            .populate('user', 'customId name')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            issuedToday,
            returnedToday: returnedTodayObj,
            pendingCount,
            overdueCount,
            pendingRequests: pendingRequests.map(pr => ({
                id: pr._id,
                studentId: pr.user?.customId || 'Unknown',
                title: pr.book?.title || 'Unknown',
                date: pr.createdAt,
                status: pr.status
            }))
        });
    } catch (error) {
        console.error('Librarian Dashboard Error:', error);
        res.status(500).json({ message: 'Error fetching librarian stats' });
    }
});

// Student Analytics
router.get('/student', protect, restrictTo('Student', 'Teacher'), async (req, res) => {
    try {
        const myRequests = await BorrowRequest.find({ user: req.user.id }).populate('book', 'title image customId');
        
        const activeBorrows = myRequests.filter(req => req.status === 'Approved' || req.status === 'Pending');
        const countActive = activeBorrows.length;

        const today = new Date();
        const dueSoonCount = activeBorrows.filter(r => r.status === 'Approved' && r.dueDate && new Date(r.dueDate) > today && (new Date(r.dueDate) - today) / (1000 * 60 * 60 * 24) <= 3).length;

        const myReservations = await Reservation.find({ user: req.user.id, status: { $in: ['Waiting', 'Notified'] } });
        
        let totalFines = 0;
        const overdueRequests = myRequests.filter(r => r.status === 'Approved' && r.dueDate && new Date(r.dueDate) < today);
        overdueRequests.forEach(r => {
            const daysOverdue = Math.floor((today - new Date(r.dueDate)) / (1000 * 60 * 60 * 24));
            totalFines += daysOverdue * 5; // 5 taka per day
        });

        const monthLabels = Array.from({ length: 6 }, (_, index) => {
            const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
            return date.toLocaleDateString('en-US', { month: 'short' });
        });

        const borrowTrends = monthLabels.map((label, index) => {
            const monthStart = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() - (5 - index) + 1, 1);

            const count = myRequests.filter((req) => {
                const reqDate = req.requestDate || req.createdAt;
                const date = new Date(reqDate);
                return date >= monthStart && date < monthEnd;
            }).length;

            return { name: label, borrows: count };
        });

        res.json({
            activeCount: countActive,
            dueSoonCount,
            totalFines,
            reservationCount: myReservations.length,
            currentBooks: activeBorrows.slice(0, 3).map(pr => ({
                _id: pr._id,
                status: pr.status,
                book: {
                    title: pr.book?.title,
                    image: pr.book?.image,
                    customId: pr.book?.customId
                }
            })),
            borrowTrends
        });
    } catch (error) {
        console.error('Student Dashboard Error:', error);
        res.status(500).json({ message: 'Error fetching student stats' });
    }
});

module.exports = router;
