const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  stageTitle: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  estimatedDuration: {
    type: String,
    required: true
  },
  subtopics: [{
    type: String
  }],
  recommendedBooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }]
}, { _id: false });

const roadmapHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  currentLevel: {
    type: String,
    required: true
  },
  goal: {
    type: String
  },
  durationWeeks: {
    type: Number
  },
  roadmapData: {
    overview: {
      type: String,
      required: true
    },
    stages: [stageSchema]
  }
}, { timestamps: true });

module.exports = mongoose.model('RoadmapHistory', roadmapHistorySchema);
