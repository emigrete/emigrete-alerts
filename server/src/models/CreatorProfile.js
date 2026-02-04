import mongoose from 'mongoose';

const creatorProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountRate: { type: Number, default: 0.1 },
    commissionRate: { type: Number, default: 0.2 },
    totalEstimatedEarningsCents: { type: Number, default: 0 },
    totalReferred: { type: Number, default: 0 },
    isAssigned: { type: Boolean, default: false }, // Solo si admin lo asignó
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('CreatorProfile', creatorProfileSchema);
