const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  requestDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Waiting', 'Notified', 'Fulfilled', 'Canceled'], 
    default: 'Waiting' 
  },
  priorityLevel: { type: Number, default: 0 },
  queuePosition: { type: Number, required: true, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
