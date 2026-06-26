const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  customId: { type: String, unique: true },
  role: { 
    type: String, 
    enum: ['Student', 'Teacher', 'Librarian', 'Admin'], 
    required: true 
  },
  designation: { type: String },
  priorityLevel: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Active', 'Suspended'], 
    default: 'Active' 
  },
  activeFines: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);