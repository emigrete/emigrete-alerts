import mongoose from 'mongoose';

const creatorReferralSchema = new mongoose.Schema(
  {
    creatorUserId: { type: String, required: true, index: true },
    referredUserId: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    planTier: { type: String, enum: ['pro', 'premium'], required: true },
    priceCents: { type: Number, required: true },
    discountRate: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    estimatedEarningsCents: { type: Number, required: true },
    status: { type: String, enum: ['active', 'canceled'], default: 'active' }
  },
  { timestamps: true }
);

export default mongoose.model('CreatorReferral', creatorReferralSchema);
