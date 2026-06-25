const mongoose = require('mongoose');

const uploadedDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    isScanned: {
      type: Boolean,
      default: false,
    },
    embeddingStatus: {
      type: String,
      enum: ['pending', 'ready', 'failed', 'skipped'],
      default: 'skipped',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UploadedDocument', uploadedDocumentSchema);
