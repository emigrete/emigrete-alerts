import Subscription from '../models/Subscription.js';
import UsageMetrics from '../models/UsageMetrics.js';
import { TTSUsage } from '../models/TTSUsage.js';
import { migrateTTSUsage } from './migrationService.js';

const LIMITS = {
  free: {
    maxAlerts: 20,
    maxTtsChars: 2000,
    maxStorageBytes: 100 * 1024 * 1024, // 100MB total
    maxFileBytes: 5 * 1024 * 1024, // 5MB por archivo
  },
  pro: {
    maxAlerts: 100,
    maxTtsChars: 20000,
    maxStorageBytes: 1 * 1024 * 1024 * 1024, // 1GB total
    maxFileBytes: 30 * 1024 * 1024, // 30MB por archivo
  },
  premium: {
    maxAlerts: Infinity,
    maxTtsChars: Infinity,
    maxStorageBytes: 10 * 1024 * 1024 * 1024, // 10GB total
    maxFileBytes: 500 * 1024 * 1024, // 500MB por archivo
  },
};

/**
 * Obtiene o crea una suscripción para un usuario
 */
export const getOrCreateSubscription = async (userId) => {
  let subscription = await Subscription.findOne({ userId });

  if (!subscription) {
    subscription = new Subscription({
      userId,
      tier: 'free',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    });
    await subscription.save();
  }

  return subscription;
};

/**
 * Obtiene o crea las métricas de uso para un usuario
 */
export const getOrCreateUsageMetrics = async (userId) => {
  let metrics = await UsageMetrics.findOne({ userId });

  if (!metrics) {
    // Intentar migrar datos viejos de TTS
    await migrateTTSUsage(userId);
    
    metrics = await UsageMetrics.findOne({ userId });
    if (!metrics) {
      metrics = new UsageMetrics({ userId });
      await metrics.save();
    }
  }

  return metrics;
};

/**
 * Resetea métricas si pasó un mes
 */
export const checkAndResetUsageIfNeeded = async (userId) => {
  const metrics = await getOrCreateUsageMetrics(userId);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  if (metrics.monthStartDate.getTime() !== monthStart.getTime()) {
    metrics.alertsCount = 0;
    metrics.ttsCharsUsed = 0;
    metrics.monthStartDate = monthStart;
    await metrics.save();
  }

  return metrics;
};

/**
 * Chequea si el usuario puede crear una alerta
 */
export const canCreateAlert = async (userId) => {
  const subscription = await getOrCreateSubscription(userId);
  const metrics = await checkAndResetUsageIfNeeded(userId);
  const limit = LIMITS[subscription.tier].maxAlerts;

  return metrics.alertsCount < limit
    ? { allowed: true }
    : {
        allowed: false,
        message: `Límite de ${limit} alertas alcanzado en plan ${subscription.tier}`,
        current: metrics.alertsCount,
        limit,
      };
};

/**
 * Chequea si el usuario puede usar TTS con X caracteres
 */
export const canUseTTS = async (userId, charCount) => {
  const subscription = await getOrCreateSubscription(userId);
  const metrics = await checkAndResetUsageIfNeeded(userId);
  const limit = LIMITS[subscription.tier].maxTtsChars;
  const projected = metrics.ttsCharsUsed + charCount;

  return projected <= limit
    ? { allowed: true }
    : {
        allowed: false,
        message: `Excederías el límite TTS de ${limit} caracteres`,
        current: metrics.ttsCharsUsed,
        requested: charCount,
        limit,
        remaining: Math.max(0, limit - metrics.ttsCharsUsed),
      };
};

/**
 * Chequea si el usuario puede subir un archivo individual de X bytes
 */
export const canUploadFile = async (userId, fileBytes) => {
  const subscription = await getOrCreateSubscription(userId);
  const maxFileSize = LIMITS[subscription.tier].maxFileBytes;

  return fileBytes <= maxFileSize
    ? { allowed: true }
    : {
        allowed: false,
        message: `Archivo demasiado grande para tu plan`,
        fileSize: fileBytes,
        maxFileSize,
        tier: subscription.tier,
      };
};

/**
 * Chequea si el usuario puede subir X bytes de storage total
 */
export const canUploadStorage = async (userId, bytesCount) => {
  const subscription = await getOrCreateSubscription(userId);
  const metrics = await checkAndResetUsageIfNeeded(userId);
  const limit = LIMITS[subscription.tier].maxStorageBytes;
  const projected = metrics.storageUsedBytes + bytesCount;

  return projected <= limit
    ? { allowed: true }
    : {
        allowed: false,
        message: `Excederías el límite de storage`,
        current: metrics.storageUsedBytes,
        requested: bytesCount,
        limit,
        remaining: Math.max(0, limit - metrics.storageUsedBytes),
      };
};

/**
 * Incrementa contador de alerta (llamar después de crear exitosamente)
 */
export const incrementAlertCount = async (userId) => {
  const metrics = await checkAndResetUsageIfNeeded(userId);
  metrics.alertsCount += 1;
  await metrics.save();
};

/**
 * Incrementa uso de TTS (llamar después de generar)
 */
export const incrementTTSUsage = async (userId, charCount) => {
  const metrics = await checkAndResetUsageIfNeeded(userId);
  metrics.ttsCharsUsed += charCount;
  await metrics.save();
};

/**
 * Incrementa storage usado
 */
export const incrementStorageUsage = async (userId, bytesCount) => {
  const metrics = await checkAndResetUsageIfNeeded(userId);
  metrics.storageUsedBytes += bytesCount;
  await metrics.save();
};

/**
 * Decrementa storage usado (cuando se borra un archivo)
 */
export const decrementStorageUsage = async (userId, bytesCount) => {
  const metrics = await checkAndResetUsageIfNeeded(userId);
  metrics.storageUsedBytes = Math.max(0, metrics.storageUsedBytes - bytesCount);
  await metrics.save();
};

/**
 * Decrementa TTS usado (cuando se borra una alerta con TTS)
 */
export const decrementTTSUsage = async (userId, charsCount) => {
  const metrics = await checkAndResetUsageIfNeeded(userId);
  metrics.ttsCharsUsed = Math.max(0, metrics.ttsCharsUsed - charsCount);
  await metrics.save();
};

/**
 * Calcula la próxima fecha de reset (primer día del mes próximo)
 */
const getNextResetDate = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
};

/**
 * Obtiene status completo del usuario
 */
export const getUserSubscriptionStatus = async (userId) => {
  const subscription = await getOrCreateSubscription(userId);
  const metrics = await checkAndResetUsageIfNeeded(userId);
  const tier = subscription.tier;
  const limits = LIMITS[tier];
  const nextResetDate = getNextResetDate();

  return {
    subscription: {
      tier,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
    },
    usage: {
      alerts: {
        current: metrics.alertsCount,
        limit: limits.maxAlerts,
        remaining: limits.maxAlerts - metrics.alertsCount,
        percentage: Math.round((metrics.alertsCount / limits.maxAlerts) * 100),
      },
      tts: {
        current: metrics.ttsCharsUsed,
        limit: limits.maxTtsChars,
        remaining: limits.maxTtsChars - metrics.ttsCharsUsed,
        percentage:
          limits.maxTtsChars === Infinity
            ? 0
            : Math.round((metrics.ttsCharsUsed / limits.maxTtsChars) * 100),
      },
      storage: {
        current: metrics.storageUsedBytes,
        limit: limits.maxStorageBytes,
        remaining: limits.maxStorageBytes - metrics.storageUsedBytes,
        percentage:
          limits.maxStorageBytes === Infinity
            ? 0
            : Math.round(
                (metrics.storageUsedBytes / limits.maxStorageBytes) * 100
              ),
      },
    },
    nextResetDate: nextResetDate.toISOString(),
  };
};
