const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String },
  email: { type: String },
  type: { type: String, enum: ['suggestion', 'bug', 'feature', 'other'], default: 'suggestion' },
  feedback: { type: String, required: true },
  response: { type: String },
  responded: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
