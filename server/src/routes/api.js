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

export default router;
