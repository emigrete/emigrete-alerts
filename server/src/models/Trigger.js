// server/src/models/Trigger.js
import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['video', 'audio', 'gif'], required: true },
  url: { type: String, required: true },
  fileName: { type: String },
  duration: { type: Number }, // segundos
  volume: { type: Number, default: 1.0 }, // 0-1
  _id: false
});

const AlertConfigSchema = new mongoose.Schema({
  displayName: { type: String },
  backgroundColor: { type: String },
  icon: { type: String },
  showInChat: { type: Boolean, default: true },
  _id: false
});

const TriggerSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  twitchRewardId: { type: String, required: true },
  
  // NUEVO: Array de medias en lugar de videoUrl único
  medias: [MediaSchema],
  
  // NUEVO: Config de alerta
  alertConfig: AlertConfigSchema,
  
  // LEGACY: Mantener para compatibilidad
  videoUrl: { type: String },
  fileName: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-actualizar updatedAt
TriggerSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

export const Trigger = mongoose.model('Trigger', TriggerSchema);