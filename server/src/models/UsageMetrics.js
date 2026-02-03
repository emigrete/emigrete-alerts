import mongoose from 'mongoose';

const usageMetricsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    alertsCount: {
      type: Number,
      default: 0,
    },
    ttsCharsUsed: {
      type: Number,
      default: 0,
    },
    storageUsedBytes: {
      type: Number,
      default: 0,
    },
    monthStartDate: {
      type: Date,
      default: () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
      },
    },
  },
  { timestamps: true }
);

// Índice para reseten automático mensual
usageMetricsSchema.index({ monthStartDate: 1 });

export default mongoose.model('UsageMetrics', usageMetricsSchema);
