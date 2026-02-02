import express from 'express';
import axios from 'axios';
import { UserToken } from '../models/UserToken.js';
import { Trigger } from '../models/Trigger.js';

const router = express.Router();

// 1. Obtener lista de Recompensas de Twitch
router.get('/twitch/rewards', async (req, res) => {
    const { userId } = req.query; // El frontend nos manda el ID del usuario

    if (!userId) return res.status(400).json({ error: 'Falta userId' });

    try {
        // Buscamos el token del usuario en la DB
        const user = await UserToken.findOne({ userId });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Pedimos las recompensas a la API de Twitch
        const response = await axios.get('https://api.twitch.tv/helix/channel_points/custom_rewards', {
            params: { broadcaster_id: userId },
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${user.accessToken}`
            }
        });

        // Devolvemos solo lo que nos interesa (ID, Título, Color)
        const rewards = response.data.data.map(r => ({
            id: r.id,
            title: r.title,
            backgroundColor: r.background_color,
            image: r.image?.url_1x || r.default_image?.url_1x
        }));

        res.json(rewards);

    } catch (error) {
        console.error("Error fetching rewards:", error.response?.data || error.message);
        res.status(500).json({ error: 'Error al obtener recompensas de Twitch' });
    }
});

// 2. Obtener alertas configuradas (CON FILTRO)
router.get('/triggers', async (req, res) => {
    const { userId } = req.query; // Leemos el ID de la URL
    try {
        // Solo buscamos las que tengan ese userId
        const triggers = await Trigger.find({ userId }); 
        res.json(triggers);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener alertas' });
    }
});

// 3. Borrar una alerta
router.delete('/triggers/:id', async (req, res) => {
    try {
        await Trigger.findByIdAndDelete(req.params.id);
        // Nota: Idealmente también borraríamos el video de Firebase acá, 
        // pero para esta versión v1 lo dejamos simple.
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error al borrar alerta' });
    }
});

export default router;