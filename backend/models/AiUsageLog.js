const mongoose = require('mongoose');

const aiUsageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'librarian', 'admin'],
      required: true,
    },
    feature: {
      type: String,
      required: true,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Indexes for fast aggregation queries
aiUsageLogSchema.index({ userId: 1, createdAt: -1 });
aiUsageLogSchema.index({ createdAt: -1 });
aiUsageLogSchema.index({ feature: 1, createdAt: -1 });

module.exports = mongoose.model('AiUsageLog', aiUsageLogSchema);
