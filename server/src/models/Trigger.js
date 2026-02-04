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

const TTSConfigSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  voiceId: { type: String, default: 'onwK4e9ZLuTAKqWW03F9' }, // Daniel Argentina (ElevenLabs) - voz en español por defecto
  text: { type: String }, // Texto personalizado o usar mensaje del viewer
  useViewerMessage: { type: Boolean, default: true }, // Si true, lee el mensaje del viewer
  readUsername: { type: Boolean, default: true }, // Si true, dice el nombre antes del mensaje
  stability: { type: Number, default: 0.5 }, // 0-1
  similarityBoost: { type: Number, default: 0.75 }, // 0-1
  _id: false
});

const TriggerSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  twitchRewardId: { type: String, required: true },
  
  // NUEVO: Array de medias en lugar de videoUrl único
  medias: [MediaSchema],
  
  // NUEVO: Config de alerta
  alertConfig: AlertConfigSchema,
  
  // NUEVO: Config de TTS
  ttsConfig: TTSConfigSchema,
  
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