// server/src/models/Trigger.js
import mongoose from 'mongoose';

const TriggerSchema = new mongoose.Schema({
  twitchRewardId: { type: String, required: true },
  videoUrl: { type: String, required: true },
  fileName: { type: String },
  createdAt: { type: Date, default: Date.now },
  userId: { type: String, required: true }
});

export const Trigger = mongoose.model('Trigger', TriggerSchema);