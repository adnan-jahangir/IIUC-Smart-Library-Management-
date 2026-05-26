const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  requestDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Returned'], 
    default: 'Pending' 
  },
  issueDate: { type: Date },
  dueDate: { type: Date },
  returnDate: { type: Date },
  renewalCount: { type: Number, default: 0 },
  fineAmount: { type: Number, default: 0 },
  rejectionReason: { type: String },
  actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Librarian or Admin who processed it
}, { timestamps: true });

// Instance methods to encapsulate borrow lifecycle logic
borrowRequestSchema.methods.calculateFine = function(returnDate = new Date(), dailyRate = 5) {
  if (!this.dueDate) return 0;
  const due = new Date(this.dueDate);
  const end = new Date(returnDate);
  if (end <= due) return 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLate = Math.ceil((end - due) / msPerDay);
  return daysLate * dailyRate;
};

borrowRequestSchema.methods.getRemainingRenewals = function() {
  const max = (this.maxRenewals != null) ? this.maxRenewals : 2;
  return Math.max(0, max - (this.renewalCount || 0));
};

borrowRequestSchema.methods.approve = async function(actionByUser) {
  // populate relations if needed
  await this.populate('book user');
  if (this.status !== 'Pending') throw new Error('Request is not pending');
  if (!this.book) throw new Error('Book not found');
  if (this.book.availableCopies <= 0) throw new Error('No available copies');

  // decrement book copies
  this.book.availableCopies = Math.max(0, this.book.availableCopies - 1);
  await this.book.save();

  this.status = 'Approved';
  this.issueDate = new Date();
  const daysAllowed = (this.user && this.user.role && this.user.role.toLowerCase() === 'teacher') ? 30 : 15;
  this.dueDate = new Date(this.issueDate.getTime() + daysAllowed * 24 * 60 * 60 * 1000);
  this.renewalCount = 0;
  this.actionBy = actionByUser || this.actionBy;
  await this.save();
  return this;
};

borrowRequestSchema.methods.renew = async function(requestingUser) {
  await this.populate('book user');
  // check permission: owner or staff (Librarian/Admin)
  if (String(this.user._id) !== String(requestingUser.id) && !['Librarian', 'Admin'].includes(requestingUser.role)) {
    const err = new Error('Not authorized to renew this borrow');
    err.status = 403;
    throw err;
  }
  if (this.status !== 'Approved') {
    const err = new Error('Only approved borrows can be renewed');
    err.status = 400;
    throw err;
  }
  const maxRenewals = (this.maxRenewals != null) ? this.maxRenewals : 2;
  if ((this.renewalCount || 0) >= maxRenewals) {
    const err = new Error(`Maximum renewals reached (${maxRenewals}).`);
    err.status = 400;
    throw err;
  }

  const daysAllowed = (this.user && this.user.role && this.user.role.toLowerCase() === 'teacher') ? 30 : 15;
  const newDue = new Date(this.dueDate || Date.now());
  newDue.setDate(newDue.getDate() + daysAllowed);

  this.dueDate = newDue;
  this.renewalCount = (this.renewalCount || 0) + 1;
  await this.save();
  const remainingRenewals = Math.max(0, maxRenewals - (this.renewalCount || 0));
  return { request: this, remainingRenewals };
};

borrowRequestSchema.methods.returnBook = async function(returningUser) {
  await this.populate('book user');
  // permission: returning user owner or staff
  if (String(this.user._id) !== String(returningUser.id) && !['Librarian', 'Admin'].includes(returningUser.role)) {
    const err = new Error('Not authorized to return this borrow');
    err.status = 403;
    throw err;
  }
  if (this.status !== 'Approved') {
    const err = new Error('Only approved borrows can be returned');
    err.status = 400;
    throw err;
  }

  const now = new Date();
  const fine = this.calculateFine(now, 5);

  this.status = 'Returned';
  this.returnDate = now;
  this.fineAmount = (this.fineAmount || 0) + fine;

  // restore book copy
  if (this.book) {
    this.book.availableCopies = (this.book.availableCopies || 0) + 1;
    await this.book.save();
  }

  // add to user activeFines if applicable
  if (fine > 0 && this.user) {
    this.user.activeFines = (this.user.activeFines || 0) + fine;
    await this.user.save();
  }

  await this.save();
  return { request: this, fine };
};

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);
