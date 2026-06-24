const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['renewal', 'fine', 'general', 'due-soon', 'overdue'], default: 'general' },
  isRead: { type: Boolean, default: false },
  ref: {
    kind: { type: String },
    id: { type: mongoose.Schema.Types.ObjectId }
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
