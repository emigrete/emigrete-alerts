import Subscription from '../models/Subscription.js';
import UsageMetrics from '../models/UsageMetrics.js';
import { TTSUsage } from '../models/TTSUsage.js';

/**
 * Migra datos de TTSUsage viejo a UsageMetrics nuevo
 * Corre una sola vez por usuario
 */
export const migrateTTSUsage = async (userId) => {
  try {
    const oldTTS = await TTSUsage.findOne({ userId });
    if (!oldTTS) return false;

    const metrics = await UsageMetrics.findOne({ userId });
    if (!metrics) {
      // Crear nuevo registro con datos viejos
      await UsageMetrics.create({
        userId,
        ttsCharsUsed: oldTTS.charsUsed || 0,
        alertsCount: 0,
        storageUsedBytes: 0
      });
      return true;
    } else if (metrics.ttsCharsUsed === 0 && oldTTS.charsUsed > 0) {
      // Actualizar si está vacío
      metrics.ttsCharsUsed = oldTTS.charsUsed;
      await metrics.save();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error en migración TTSUsage:', error);
    return false;
  }
};
