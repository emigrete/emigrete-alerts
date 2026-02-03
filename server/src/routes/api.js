import express from 'express';
import axios from 'axios';
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
    await Trigger.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Error al borrar alerta' });
  }
});

export default router;
