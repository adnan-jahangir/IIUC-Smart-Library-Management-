const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  max_borrow_limit: { 
    type: Number, 
    required: true,
    default: 3 
  },
  current_borrowed_count: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

module.exports = mongoose.model('UserProfile', userProfileSchema);