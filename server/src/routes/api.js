import express from 'express';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { getStorage } from 'firebase-admin/storage';
import { UserToken } from '../models/UserToken.js';
import { Trigger } from '../models/Trigger.js';
import { TTSUsage } from '../models/TTSUsage.js';
import {
  canCreateAlert,
  incrementAlertCount,
  canUseTTS,
  incrementTTSUsage,
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

    // Borrar todos los archivos en Firebase
    const bucket = getStorage().bucket();
    
    // Borrar archivo legacy si existe
    if (trigger.fileName) {
      try {
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
            await bucket.file(media.fileName).delete({ ignoreNotFound: true });
          } catch (e) {
            console.error(`⚠️ No se pudo borrar media ${media.fileName}:`, e.message);
          }
        }
      }
    }

    // Borrar el trigger en Mongo
    await Trigger.findByIdAndDelete(req.params.id);

    return res.json({ success: true });
  } catch (e) {
    console.error('❌ Error al borrar alerta:', e.message);
    return res.status(500).json({ error: 'Error al borrar alerta' });
  }
});

/**
 * OBTENER USO DE TTS DEL USUARIO
 * GET /api/tts/usage/:userId
 */
router.get('/tts/usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    let usage = await TTSUsage.findOne({ userId });
    
    if (!usage) {
      usage = await TTSUsage.create({ 
        userId,
        charsUsed: 0,
        charsLimit: 2000
      });
    }

    const now = new Date();
    if (usage.resetDate <= now) {
      usage.charsUsed = 0;
      usage.resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await usage.save();
    }

    res.json({
      charsUsed: usage.charsUsed,
      charsLimit: usage.charsLimit,
      charsRemaining: usage.charsLimit - usage.charsUsed,
      resetDate: usage.resetDate,
      percentageUsed: Math.round((usage.charsUsed / usage.charsLimit) * 100)
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

export default router;
