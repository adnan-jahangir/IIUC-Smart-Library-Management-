const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  customId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  isbn: {
    type: String,
    required: true
  },
  category: {
    type: String
  },
  totalCopies: {
    type: Number,
    required: true,
    default: 1
  },
  availableCopies: {
    type: Number,
    required: true,
    default: 1
  },
  image: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
