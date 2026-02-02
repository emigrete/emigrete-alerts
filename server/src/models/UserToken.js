import mongoose from 'mongoose';

const UserTokenSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: String,
  accessToken: String,
  refreshToken: String,
  expiresIn: Number,
  obtainmentTimestamp: Number,
  scope: [String] 
});

export const UserToken = mongoose.model('UserToken', UserTokenSchema);