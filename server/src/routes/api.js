import express from 'express';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { getStorage } from 'firebase-admin/storage';
import { UserToken } from '../models/UserToken.js';
import { Trigger } from '../models/Trigger.js';
import { TTSUsage } from '../models/TTSUsage.js';
import Subscription from '../models/Subscription.js';
import UsageMetrics from '../models/UsageMetrics.js';
import CreatorProfile from '../models/CreatorProfile.js';
import CreatorReferral from '../models/CreatorReferral.js';
import {
  canCreateAlert,
  incrementAlertCount,
  canUseTTS,
  incrementTTSUsage,
  getUserSubscriptionStatus,
  decrementStorageUsage,
  decrementAlertCount,
  decrementTTSUsage,
} from '../services/subscriptionService.js';

const router = express.Router();

let cachedTransporter = null;

function getFeedbackTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) return null;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined
  });

  return cachedTransporter;
}

router.post('/feedback', async (req, res) => {
  const { feedback, email, type } = req.body;

  if (!feedback || !feedback.trim()) {
    return res.status(400).json({ error: 'El comentario es obligatorio.' });
  }

  const transporter = getFeedbackTransporter();
  if (!transporter) {
    return res.status(500).json({ error: 'SMTP no configurado.' });
  }

  const typeLabels = {
    suggestion: 'Sugerencia',
    bug: 'Reporte de falla',
    feature: 'Solicitud de mejora',
    other: 'Otro'
  };

  const label = typeLabels[type] || 'Otro';
  const recipient = process.env.FEEDBACK_TO || 'teodorowelyczko@gmail.com';
  const fromAddress = process.env.FEEDBACK_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@triggerapp.local';

  try {
    await transporter.sendMail({
      from: `Trigger App <${fromAddress}>`,
      to: recipient,
      replyTo: email || undefined,
      subject: `Feedback - ${label}`,
      text: `Tipo: ${label}\nCorreo: ${email || 'No informado'}\n\nMensaje:\n${feedback.trim()}`,
      html: `
        <p><strong>Tipo:</strong> ${label}</p>
        <p><strong>Correo:</strong> ${email || 'No informado'}</p>
        <p><strong>Mensaje:</strong></p>
        <pre style="white-space:pre-wrap;font-family:inherit;">${feedback.trim()}</pre>
      `.trim()
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error enviando feedback:', error.message);
    return res.status(500).json({ error: 'No se pudo enviar el comentario.' });
  }
});

router.get('/twitch/rewards', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Falta userId' });

  try {
    const user = await UserToken.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const response = await axios.get('https://api.twitch.tv/helix/channel_points/custom_rewards', {
      params: { broadcaster_id: userId },
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${user.accessToken}`
      }
    });

    const rewards = response.data.data.map(r => ({
      id: r.id,
      title: r.title,
      backgroundColor: r.background_color,
      image: r.image?.url_1x || r.default_image?.url_1x
    }));

    res.json(rewards);
  } catch (error) {
    console.error('Error fetching rewards:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al obtener recompensas de Twitch' });
  }
});

/**
 * CREAR RECOMPENSA EN TWITCH
 * POST /api/create-reward
 */
router.post('/create-reward', async (req, res) => {
  const { 
    userId, 
    title, 
    cost, 
    prompt, 
    backgroundColor,
    enableTTS,
    ttsText,
    ttsUseViewerMessage
  } = req.body;

  if (!userId || !title || !cost) {
    return res.status(400).json({ 
      error: 'Faltan: userId, title, cost'
    });
  }

  try {
    // ✅ CHECK: ¿Puede crear alertas?
    const alertCheck = await canCreateAlert(userId);
    if (!alertCheck.allowed) {
      return res.status(402).json({
        error: alertCheck.message,
        current: alertCheck.current,
        limit: alertCheck.limit,
        requiresUpgrade: true
      });
    }

    const user = await UserToken.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Crear recompensa en Twitch
    const response = await axios.post(
      'https://api.twitch.tv/helix/channel_points/custom_rewards',
      {
        title,
        cost: parseInt(cost),
        prompt: prompt || '',
        background_color: backgroundColor || '#9146FF',
        is_enabled: true,
        is_user_input_required: !!req.body.isUserInputRequired,
        is_max_per_stream_enabled: false,
        is_global_cooldown_enabled: false
      },
      {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        },
        params: { broadcaster_id: userId }
      }
    );

    const newReward = response.data.data[0];

    // Si TTS está habilitado, crear el trigger con configuración TTS
    if (enableTTS) {
      const ttsConfig = {
        enabled: true,
        voiceId: 'onwK4e9ZLuTAKqWW03F9',
        text: ttsUseViewerMessage ? '' : (ttsText || ''),
        useViewerMessage: ttsUseViewerMessage ?? true,
        readUsername: true,
        stability: 0.5,
        similarityBoost: 0.75
      };

      const trigger = await Trigger.create({
        userId,
        twitchRewardId: newReward.id,
        medias: [],
        ttsConfig,
        alertConfig: {
          displayName: title,
          backgroundColor: backgroundColor || '#9146FF',
          showInChat: true
        }
      });

      console.log(`✅ Trigger TTS creado: ${trigger._id} para recompensa ${newReward.id}`);
    }

    // ✅ INCREMENTAR CONTADOR
    await incrementAlertCount(userId);

    res.json({
      success: true,
      reward: {
        id: newReward.id,
        title: newReward.title,
        cost: newReward.cost,
        backgroundColor: newReward.background_color,
        image: newReward.image?.url_1x || newReward.default_image?.url_1x
      }
    });

  } catch (error) {
    console.error('Error creando recompensa:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.message || 'Error al crear recompensa en Twitch';
    res.status(500).json({ error: errorMsg });
  }
});

router.get('/triggers', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Falta userId' });

  try {
    const triggers = await Trigger.find({ userId });
    res.json(triggers);
  } catch {
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
});

router.delete('/triggers/:id', async (req, res) => {
  try {
    const trigger = await Trigger.findById(req.params.id);
    if (!trigger) return res.status(404).json({ error: 'Alerta no encontrada' });

    // Borrar recompensa en Twitch si existe
    if (trigger.twitchRewardId) {
      const user = await UserToken.findOne({ userId: trigger.userId });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      try {
        await axios.delete('https://api.twitch.tv/helix/channel_points/custom_rewards', {
          headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${user.accessToken}`
          },
          params: {
            broadcaster_id: trigger.userId,
            id: trigger.twitchRewardId
          }
        });
      } catch (error) {
        const status = error.response?.status;
        // Si ya no existe en Twitch, seguimos con el borrado local
        if (status !== 404) {
          console.error('❌ Error al borrar recompensa en Twitch:', error.response?.data || error.message);
          return res.status(502).json({ error: 'No se pudo borrar la recompensa en Twitch' });
        }
      }
    }

    // Calcular tamaño total de los archivos a borrar
    let totalSizeToDelete = 0;
    const bucket = getStorage().bucket();
    
    // Borrar archivo legacy si existe
    if (trigger.fileName) {
      try {
        const [metadata] = await bucket.file(trigger.fileName).getMetadata().catch(() => [null]);
        if (metadata?.size) {
          totalSizeToDelete += parseInt(metadata.size);
        }
        await bucket.file(trigger.fileName).delete({ ignoreNotFound: true });
      } catch (e) {
        console.error('⚠️ No se pudo borrar archivo legacy:', e.message);
      }
    }

    // Borrar todos los archivos de medias
    if (trigger.medias && trigger.medias.length > 0) {
      for (const media of trigger.medias) {
        if (media.fileName) {
          try {
            const [metadata] = await bucket.file(media.fileName).getMetadata().catch(() => [null]);
            if (metadata?.size) {
              totalSizeToDelete += parseInt(metadata.size);
            }
            await bucket.file(media.fileName).delete({ ignoreNotFound: true });
          } catch (e) {
            console.error(`⚠️ No se pudo borrar media ${media.fileName}:`, e.message);
          }
        }
      }
    }

    // ✅ Decrementar storage usado
    if (totalSizeToDelete > 0) {
      console.log(`Liberando storage: ${totalSizeToDelete} bytes para usuario ${trigger.userId}`);
      await decrementStorageUsage(trigger.userId, totalSizeToDelete);
    }

    // ✅ Decrementar TTS si el trigger tiene TTS activo
    if (trigger.ttsConfig?.enabled && trigger.ttsConfig?.text) {
      const estimatedChars = trigger.ttsConfig.text.length;
      console.log(`Liberando TTS: ${estimatedChars} caracteres para usuario ${trigger.userId}`);
      await decrementTTSUsage(trigger.userId, estimatedChars);
    }

    // ✅ Decrementar contador de alertas
    console.log(`Liberando alerta: usuario ${trigger.userId}`);
    await decrementAlertCount(trigger.userId);

    // Borrar el trigger en Mongo
    await Trigger.findByIdAndDelete(req.params.id);

    return res.json({ success: true });
  } catch (e) {
    console.error('❌ Error al borrar alerta:', e.message);
    return res.status(500).json({ error: 'Error al borrar alerta' });
  }
});

/**
 * OBTENER USO DE TTS DEL USUARIO (usando sistema de suscripción)
 * GET /api/tts/usage/:userId
 */
router.get('/tts/usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Usar el nuevo sistema de suscripción
    const status = await getUserSubscriptionStatus(userId);
    
    // Manejar Infinity correctamente
    const isUnlimited = status.usage.tts.isUnlimited === true;
    const percentageUsed = isUnlimited 
      ? 0 
      : Math.round((status.usage.tts.current / status.usage.tts.limit) * 100);
    
    res.json({
      charsUsed: status.usage.tts.current,
      charsLimit: status.usage.tts.limit,
      charsRemaining: status.usage.tts.remaining,
      percentageUsed,
      isUnlimited,
      tier: status.subscription.tier,
      nextResetDate: status.nextResetDate
    });
  } catch (error) {
    console.error('❌ Error obteniendo TTS usage:', error);
    res.status(500).json({ error: 'Error al obtener uso de TTS' });
  }
});

/**
 * GENERAR TTS CON ELEVENLABS
 * POST /api/tts
 * Body: { text, voiceId?, stability?, similarityBoost?, userId }
 */
router.post('/tts', async (req, res) => {
  const { text, voiceId = 'onwK4e9ZLuTAKqWW03F9', stability = 0.5, similarityBoost = 0.75, userId } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Falta el texto para generar TTS' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'Falta userId' });
  }

  const MAX_CHARS_PER_REQUEST = 300;
  if (text.length > MAX_CHARS_PER_REQUEST) {
    return res.status(400).json({ 
      error: `Texto demasiado largo. Máximo ${MAX_CHARS_PER_REQUEST} caracteres (actual: ${text.length})` 
    });
  }

  try {
    // ✅ CHECK: ¿Tiene límites de TTS?
    const ttsCheck = await canUseTTS(userId, text.length);
    if (!ttsCheck.allowed) {
      return res.status(402).json({
        error: ttsCheck.message,
        current: ttsCheck.current,
        requested: ttsCheck.requested,
        limit: ttsCheck.limit,
        remaining: ttsCheck.remaining,
        requiresUpgrade: true
      });
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      console.error('❌ Falta ELEVENLABS_API_KEY en variables de entorno');
      return res.status(500).json({ error: 'TTS no configurado' });
    }

    console.log('🎤 Generando TTS:', { text: text.substring(0, 50), voiceId, userId, length: text.length });

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability,
          similarity_boost: similarityBoost
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // ✅ INCREMENTAR USO
    await incrementTTSUsage(userId, text.length);

    // Devolver audio como base64
    const audioBase64 = Buffer.from(response.data, 'binary').toString('base64');
    
    console.log(`✅ TTS generado (${text.length} chars)`);
    
    res.json({ 
      success: true, 
      audio: `data:audio/mpeg;base64,${audioBase64}`,
      charsUsed: text.length
    });

  } catch (error) {
    console.error('❌ Error generando TTS:', error.response?.data || error.message);

    if (error.response) {
      const statusCode = error.response.status || 500;
      let data = error.response.data;

      try {
        if (data && data.byteLength) {
          const str = Buffer.from(data).toString('utf8');
          try {
            data = JSON.parse(str);
          } catch {
            data = str;
          }
        }
      } catch (e) {
        // ignore
      }

      const message = data?.error || data?.message || (typeof data === 'string' ? data : JSON.stringify(data));
      console.error('ElevenLabs error payload (decoded):', message);
      return res.status(statusCode).json({ error: message });
    }

    return res.status(500).json({ error: 'Error al generar TTS' });
  }
});

/**
 * ACTUALIZAR CONFIG DE TTS EN TRIGGER
 * PUT /api/triggers/:id/tts
 */
router.put('/triggers/:id/tts', async (req, res) => {
  try {
    const { ttsConfig } = req.body;
    
    const trigger = await Trigger.findByIdAndUpdate(
      req.params.id,
      { ttsConfig },
      { new: true }
    );

    if (!trigger) {
      return res.status(404).json({ error: 'Trigger no encontrado' });
    }

    res.json({ success: true, trigger });
  } catch (error) {
    console.error('❌ Error actualizando TTS config:', error);
    res.status(500).json({ error: 'Error al actualizar configuración TTS' });
  }
});

/**
 * VERIFICAR SI USUARIO ES ADMIN
 * GET /api/admin/check
 * Query: ?userId={user_id}
 */
router.get('/admin/check', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.json({ isAdmin: false });
    }

    const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];
    const isAdmin = ADMIN_USER_IDS.includes(userId);

    res.json({ isAdmin });
  } catch (error) {
    console.error('❌ Error verificando admin:', error);
    res.json({ isAdmin: false });
  }
});

/**
 * ADMIN: OBTENER TODOS LOS USUARIOS Y SUS USOS
 * GET /api/admin/users
 * Query: ?adminId={tu_user_id}
 */
router.get('/admin/users', async (req, res) => {
  try {
    const { adminId } = req.query;
    
    // Verificar que sea admin (solo tú puedes acceder)
    const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];
    if (!adminId || !ADMIN_USER_IDS.includes(adminId)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Obtener todos los usuarios con tokens (usuarios activos)
    const userTokens = await UserToken.find().select('userId username');
    
    const usersData = [];
    
    for (const userToken of userTokens) {
      try {
        const status = await getUserSubscriptionStatus(userToken.userId);
        const triggerCount = await Trigger.countDocuments({ userId: userToken.userId });
        const creatorProfile = await CreatorProfile.findOne({ userId: userToken.userId });
        
        console.log(`📊 User ${userToken.userId} (${userToken.username}): creatorProfile =`, creatorProfile ? { isAssigned: creatorProfile.isAssigned, isActive: creatorProfile.isActive } : null);
        
        usersData.push({
          userId: userToken.userId,
          username: userToken.username || 'Unknown',
          tier: status.subscription?.tier || 'free',
          isCreator: creatorProfile?.isAssigned || false,
          triggers: triggerCount || 0,
          alerts: {
            current: status.usage?.alerts?.current || 0,
            limit: status.usage?.alerts?.limit ?? null,
            percentage: status.usage?.alerts?.percentage || 0,
            isUnlimited: status.usage?.alerts?.isUnlimited || false,
          },
          tts: {
            current: status.usage?.tts?.current || 0,
            limit: status.usage?.tts?.limit ?? null,
            percentage: status.usage?.tts?.percentage || 0,
            isUnlimited: status.usage?.tts?.isUnlimited || false,
          },
          storage: {
            current: status.usage?.storage?.current || 0,
            limit: status.usage?.storage?.limit ?? null,
            percentage: status.usage?.storage?.percentage || 0,
            isUnlimited: status.usage?.storage?.isUnlimited || false,
          },
          bandwidth: {
            current: status.usage?.bandwidth?.current || 0,
            limit: status.usage?.bandwidth?.limit ?? null,
            percentage: status.usage?.bandwidth?.percentage || 0,
            isUnlimited: status.usage?.bandwidth?.isUnlimited || false,
          },
          nextResetDate: status.nextResetDate,
        });
      } catch (error) {
        console.error(`⚠️ Error obteniendo status para ${userToken.userId}:`, error.message);
      }
    }

    // Ordenar por tier y uso
    usersData.sort((a, b) => {
      const tierOrder = { premium: 0, pro: 1, free: 2 };
      return tierOrder[a.tier] - tierOrder[b.tier];
    });

    res.json({
      totalUsers: usersData.length,
      users: usersData,
    });
  } catch (error) {
    console.error('❌ Error obteniendo usuarios admin:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

/**
 * ADMIN: CAMBIAR TIER DE USUARIO
 * PUT /api/admin/users/:userId/tier
 * Body: { tier: 'free' | 'pro' | 'premium', adminId: string }
 */
router.put('/admin/users/:userId/tier', async (req, res) => {
  try {
    const { userId } = req.params;
    const { tier, adminId } = req.body;

    // Verificar que sea admin
    const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];
    if (!adminId || !ADMIN_USER_IDS.includes(adminId)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Validar tier
    const validTiers = ['free', 'pro', 'premium'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({ error: 'Tier inválido' });
    }

    // Actualizar o crear suscripción
    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      { 
        tier,
        status: 'active',
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Admin cambió tier de ${userId} a ${tier}`);

    res.json({
      success: true,
      subscription: {
        userId: subscription.userId,
        tier: subscription.tier,
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('❌ Error cambiando tier:', error);
    res.status(500).json({ error: 'Error al cambiar tier' });
  }
});

/**
 * USER: CAMBIAR PLAN (CON PROTECCIÓN DE PERÍODO DE FACTURACIÓN)
 * POST /api/subscription/change-plan
 * Body: { userId: string, newTier: 'free' | 'pro' | 'premium' }
 * Protección: No permite cambiar de plan durante el período actual si es suscripción activa
 */
router.post('/subscription/change-plan', async (req, res) => {
  try {
    const { userId, newTier } = req.body;

    if (!userId || !newTier) {
      return res.status(400).json({ error: 'userId y newTier requeridos' });
    }

    // Validar tier
    const validTiers = ['free', 'pro', 'premium'];
    if (!validTiers.includes(newTier)) {
      return res.status(400).json({ error: 'Tier inválido' });
    }

    // Obtener suscripción actual
    const currentSubscription = await Subscription.findOne({ userId });
    
    // Si es el mismo tier, no hacer nada
    if (currentSubscription?.tier === newTier) {
      return res.status(400).json({ error: 'Ya tienes este plan' });
    }

    // PROTECCIÓN: Si hay suscripción activa con período vigente, validar
    if (currentSubscription && currentSubscription.status === 'active') {
      const now = new Date();
      const periodEnd = currentSubscription.currentPeriodEnd;

      // Si el período aún no ha terminado, depende del tipo de cambio
      if (periodEnd && now < periodEnd) {
        // Si SUBEAGRADA (free->pro, free->premium, pro->premium): permitir inmediatamente
        // (Stripe lo prorratea)
        const tierHierarchy = { free: 0, pro: 1, premium: 2 };
        const isUpgrade = tierHierarchy[newTier] > tierHierarchy[currentSubscription.tier];

        if (!isUpgrade) {
          // Es DOWNGRADE (pro->free, premium->pro, premium->free): rechazar
          const daysRemaining = Math.ceil(
            (periodEnd - now) / (1000 * 60 * 60 * 24)
          );
          return res.status(403).json({
            error: 'No puedes bajar de plan durante el período actual',
            reason: `Tu período de facturación termina en ${daysRemaining} días. Podrás cambiar de plan después.`,
            currentPeriodEnd: periodEnd,
            daysRemaining
          });
        }
      }
    }

    // Actualizar o crear suscripción
    const updatedSubscription = await Subscription.findOneAndUpdate(
      { userId },
      {
        tier: newTier,
        status: 'active',
        updatedAt: new Date(),
        ...(newTier === 'free' && { 
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          currentPeriodEnd: null 
        })
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Usuario ${userId} cambió plan de ${currentSubscription?.tier || 'free'} a ${newTier}`);

    res.json({
      success: true,
      message: newTier === 'free' 
        ? 'Plan cancelado correctamente'
        : 'Plan actualizado correctamente',
      subscription: {
        userId: updatedSubscription.userId,
        tier: updatedSubscription.tier,
        status: updatedSubscription.status,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd
      }
    });
  } catch (error) {
    console.error('❌ Error cambiando plan:', error);
    res.status(500).json({ error: 'Error al cambiar plan' });
  }
});

/**
 * ADMIN: RESETEAR LÍMITES DE USUARIO
 * POST /api/admin/users/:userId/reset
 * Body: { adminId: string, type: 'alerts' | 'tts' | 'storage' | 'all' }
 */
router.post('/admin/users/:userId/reset', async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminId, type } = req.body;

    // Verificar que sea admin
    const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];
    if (!adminId || !ADMIN_USER_IDS.includes(adminId)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Obtener o crear métricas
    let metrics = await UsageMetrics.findOne({ userId });
    if (!metrics) {
      metrics = new UsageMetrics({ userId });
    }

    // Resetear según tipo
    switch(type) {
      case 'alerts':
        metrics.alertsCount = 0;
        break;
      case 'tts':
        metrics.ttsCharsUsed = 0;
        break;
      case 'storage':
        metrics.storageUsedBytes = 0;
        break;
      case 'all':
        metrics.alertsCount = 0;
        metrics.ttsCharsUsed = 0;
        metrics.storageUsedBytes = 0;
        break;
      default:
        return res.status(400).json({ error: 'Tipo inválido' });
    }

    await metrics.save();

    console.log(`✅ Admin reseteó ${type} de usuario ${userId}`);

    res.json({
      success: true,
      message: `${type} reseteado correctamente`
    });
  } catch (error) {
    console.error('❌ Error reseteando límites:', error);
    res.status(500).json({ error: 'Error al resetear límites' });
  }
});

/**
 * ADMIN: TOGGLE ROL CREADOR
 * POST /api/admin/users/:userId/creator-role
 * Body: { isCreator: boolean, adminId: string, code?: string }
 */
router.post('/admin/users/:userId/creator-role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isCreator, adminId, code: customCode } = req.body;

    // Verificar que sea admin
    const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];
    if (!adminId || !ADMIN_USER_IDS.includes(adminId)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (isCreator === undefined) {
      return res.status(400).json({ error: 'isCreator requerido' });
    }
    
    if (isCreator) {
      // Crear o actualizar perfil de creador
      const user = await UserToken.findOne({ userId });
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar si ya existe un perfil
      let profile = await CreatorProfile.findOne({ userId });
      
      if (profile) {
        // Si existe, solo actualizar flags
        profile.isAssigned = true;
        profile.isActive = true;
        await profile.save();
        console.log(`✅ [ADMIN] Asignó rol creador a ${userId}. Perfil existente:`, { code: profile.code, isAssigned: profile.isAssigned });
      } else {
        // Si no existe, crear con código personalizado o generado
        const sanitizeCode = (value) =>
          String(value || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 16);
        
        const generateCode = (username) => {
          const base = sanitizeCode(username || 'CREADOR');
          const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
          return sanitizeCode(`${base}${suffix}`);
        };
        
        let code;
        if (customCode && customCode.trim()) {
          // Usar código personalizado
          code = sanitizeCode(customCode);
          // Verificar que no exista
          const existingCode = await CreatorProfile.findOne({ code });
          if (existingCode) {
            return res.status(409).json({ error: `El código "${code}" ya está en uso` });
          }
        } else {
          // Generar código automáticamente con retry
          let attempts = 0;
          const maxAttempts = 10;
          while (attempts < maxAttempts) {
            code = generateCode(user.username);
            const existingCode = await CreatorProfile.findOne({ code });
            if (!existingCode) break;
            attempts++;
          }
          if (attempts >= maxAttempts) {
            return res.status(500).json({ error: 'No se pudo generar un código único. Intenta con un código personalizado.' });
          }
        }
        
        profile = await CreatorProfile.create({
          userId,
          code,
          isAssigned: true,
          isActive: true
        });
        console.log(`✅ [ADMIN] Asignó rol creador a ${userId}. Nuevo perfil creado:`, { code: profile.code, isAssigned: profile.isAssigned });
      }

      return res.json({
        success: true,
        message: 'Rol creador asignado',
        profile: {
          userId: profile.userId,
          code: profile.code,
          isAssigned: profile.isAssigned
        }
      });
    } else {
      // Remover rol creador
      const profile = await CreatorProfile.findOne({ userId });
      
      if (!profile) {
        return res.status(404).json({ error: 'Perfil de creador no encontrado' });
      }
      
      profile.isAssigned = false;
      profile.isActive = false;
      await profile.save();

      console.log(`❌ [ADMIN] Removió rol creador de ${userId}. Result:`, { isAssigned: profile.isAssigned, isActive: profile.isActive });
      
      return res.json({
        success: true,
        message: 'Rol creador removido'
      });
    }
  } catch (error) {
    console.error('❌ Error toggling creator role:', error);
    res.status(500).json({ error: 'Error al cambiar rol creador' });
  }
});

export default router;
