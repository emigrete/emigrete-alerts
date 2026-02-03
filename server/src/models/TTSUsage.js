import mongoose from 'mongoose';

const TTSUsageSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  twitchUsername: { type: String },
  charsUsed: { type: Number, default: 0 }, // Caracteres usados en el mes actual
  charsLimit: { type: Number, default: 2000 }, // Límite por usuario (2,000 chars/mes)
  resetDate: { type: Date, default: () => {
    // Calcular el primer día del próximo mes
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-resetear si pasó el mes
TTSUsageSchema.pre('save', function() {
  const now = new Date();
  if (this.resetDate <= now) {
    this.charsUsed = 0;
    this.resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  this.updatedAt = Date.now();
});

export const TTSUsage = mongoose.model('TTSUsage', TTSUsageSchema);
