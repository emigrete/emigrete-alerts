import express from 'express';
import axios from 'axios';
import { getStorage } from 'firebase-admin/storage';
import { UserToken } from '../models/UserToken.js';
import { Trigger } from '../models/Trigger.js';

const router = express.Router();

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
  const { userId, title, cost, prompt, backgroundColor } = req.body;

  if (!userId || !title || !cost) {
    return res.status(400).json({ 
      error: 'Faltan: userId, title, cost'
    });
  }

  try {
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
        is_user_input_required: false,
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
 * GENERAR TTS CON ELEVENLABS
 * POST /api/tts
 * Body: { text, voiceId?, stability?, similarityBoost? }
 * Límites: 300 caracteres por request, rate limit de 10/minuto por IP
 */
router.post('/tts', async (req, res) => {
  const { text, voiceId = 'pNInz6obpgDQGcFmaJgB', stability = 0.5, similarityBoost = 0.75 } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Falta el texto para generar TTS' });
  }

  // ⚠️ LÍMITE DE CARACTERES: máximo 300 chars para evitar costos excesivos
  const MAX_CHARS = 300;
  if (text.length > MAX_CHARS) {
    return res.status(400).json({ 
      error: `Texto demasiado largo. Máximo ${MAX_CHARS} caracteres (actual: ${text.length})` 
    });
  }

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVENLABS_API_KEY) {
    console.error('❌ Falta ELEVENLABS_API_KEY en variables de entorno');
    return res.status(500).json({ error: 'TTS no configurado' });
  }

  try {
    console.log('🎤 Generando TTS:', { text: text.substring(0, 50), voiceId, length: text.length });

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

    // Devolver audio como base64 para que el frontend lo reproduzca
    const audioBase64 = Buffer.from(response.data, 'binary').toString('base64');
    
    console.log(`✅ TTS generado (${text.length} chars)`);
    
    res.json({ 
      success: true, 
      audio: `data:audio/mpeg;base64,${audioBase64}`,
      charsUsed: text.length
    });

  } catch (error) {
    console.error('❌ Error generando TTS:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al generar TTS' });
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
