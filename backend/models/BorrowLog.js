const mongoose = require('mongoose');

const borrowLogSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'BorrowRequest', required: true },
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date },
  logStatus: { 
    type: String, 
    enum: ['Issued', 'Returned', 'Overdue'], 
    default: 'Issued' 
  }
}, { timestamps: true });

module.exports = mongoose.model('BorrowLog', borrowLogSchema);
