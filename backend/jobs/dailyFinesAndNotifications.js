require('dotenv').config();
const mongoose = require('mongoose');
const cron = require('node-cron');

const BorrowRequest = require('../models/BorrowRequest');
const Notification = require('../models/Notification');
const { DAY_ALLOWANCE, DAILY_FINE_RATE } = require('../utils/borrow-utils');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library-system';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function floorDaysBetween(a, b) {
  return Math.floor((b - a) / MS_PER_DAY);
}

async function runCycle() {
  console.log('Jobs: running daily fines & renewal cycle', new Date().toISOString());

  // 1) Renewal notifications: requests whose dueDate is today (end of period)
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  const needsRenewal = await BorrowRequest.find({
    status: 'Approved',
    dueDate: { $gte: todayStart, $lte: todayEnd }
  }).populate('user book');

  for (const br of needsRenewal) {
    if (!br.user || !br.book) {
      console.warn(`Jobs: skipping renewal notification for borrow record ${br._id} because user or book is missing/deleted`);
      continue;
    }
    const remaining = (br.maxRenewals || 2) - (br.renewalCount || 0);
    if (remaining > 0) {
      await Notification.create({
        user: br.user._id,
        message: `Renewal available for \"${br.book.title}\" — due today ${br.dueDate.toDateString()}`,
        type: 'renewal',
        ref: { kind: 'BorrowRequest', id: br._id }
      });
      console.log('Jobs: created renewal notification for', br._id.toString());
    }
  }

  // 2) Overdue fines accrual: find approved requests with dueDate < today
  const now = new Date();
  const overdue = await BorrowRequest.find({
    status: 'Approved',
    dueDate: { $lt: now }
  }).populate('user book');

  for (const br of overdue) {
    if (!br.user || !br.book) {
      console.warn(`Jobs: skipping fine accrual for borrow record ${br._id} because user or book is missing/deleted`);
      continue;
    }
    // calculate number of whole days overdue
    const daysOverdue = floorDaysBetween(br.dueDate, now);

    // already charged days
    let chargedDays = 0;
    if (br.lastFineCalcAt && br.lastFineCalcAt > br.dueDate) {
      chargedDays = floorDaysBetween(br.dueDate, br.lastFineCalcAt);
    }

    const newDays = Math.max(0, daysOverdue - chargedDays);
    if (newDays > 0) {
      const additional = newDays * DAILY_FINE_RATE;
      br.fineAccrued = (br.fineAccrued || 0) + additional;
      // advance lastFineCalcAt by newDays
      const newLast = new Date(br.dueDate.getTime() + (chargedDays + newDays) * MS_PER_DAY);
      br.lastFineCalcAt = newLast;
      await br.save();

      await Notification.create({
        user: br.user._id,
        message: `Your borrow \"${br.book.title}\" accumulated an additional fine of ৳${additional}. Total: ৳${br.fineAccrued}`,
        type: 'fine',
        ref: { kind: 'BorrowRequest', id: br._id }
      });
      console.log(`Jobs: accrued ৳${additional} for borrow ${br._id.toString()}`);
    }
  }
}

async function startJobs() {
  // If mongoose is not connected, connect using MONGO_URI
  if (!mongoose.connection || mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
    console.log('Jobs: connected to MongoDB');
  }

  // run immediately on start
  await runCycle();

  // schedule daily at 00:05
  cron.schedule('5 0 * * *', async () => {
    try {
      await runCycle();
    } catch (err) {
      console.error('Jobs: error during scheduled cycle', err);
    }
  });

  console.log('Jobs: scheduled daily job at 00:05');
}

module.exports = { startJobs };
