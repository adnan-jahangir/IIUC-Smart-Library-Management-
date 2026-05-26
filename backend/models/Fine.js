const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  borrowLog: { type: mongoose.Schema.Types.ObjectId, ref: 'BorrowLog' },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  amount: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Pending'],
    default: 'Unpaid'
  },
  paidAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Fine', fineSchema);